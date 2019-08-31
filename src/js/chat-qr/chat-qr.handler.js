'use strict'

const qr = require('qr-image');
const request = require('request');
const Promise = require('bluebird');
const qs = require('querystring');
const _ = require('underscore');
const crontab = require('node-crontab');

module.exports = function(server, conf){
	class ChatQrHandler {
		constructor(){
		}

		getRate(currency){
			return this.getCurrencies()
			.then(function(currencies){
				return Number.parseFloat(currencies[currency]['rates']['last'])
			})
			.catch(function(err){
				console.error("getRate", err);
				return err;
			});	
		}

		getCurrencies(){
			return new Promise(function(resolve, reject){
				request({
					uri: 'https://localbitcoins.com/bitcoinaverage/ticker-all-currencies/',
					method: 'get'
				}, function(err, res, body){
					resolve(JSON.parse(body));
				});
			});
		}

		getBusinessRate(chat_id){
			const self = this;
			return server.methods.getBusiness(chat_id)
			.then(function(res){
				return res[0];
			})
			.then(function(business){
				if(business && business.currency){
					return self.getRate(business.currency);	
				}else{
					return Promise.reject("Business not found");
				}
				
			});
		}

		getQrPicture(qr_string){
			var qr_png = qr.image(qr_string, { type: 'png' });
			qr_png.path = "qr.png";
			return qr_png;
		}

		sendChangeAddressType(chat_id, address){
			return server.methods.sendMessage({
				chat_id: chat_id,
				text: "Cambiar tipo de dirección para recibir bitcoins.",
				reply_markup: JSON.stringify({
					inline_keyboard: [[{
						text: "bech32",
						callback_data: JSON.stringify({
							"i": address,
							"t": "b"
						})
					}, {
						text: "legacy",
						callback_data: JSON.stringify({
							"i": address,
							"t": "l"
						})
					}, {
						text: "p2sh-segwit",
						callback_data: JSON.stringify({
							"i": address,
							"t": "s"
						})
					}]]
				})
			});	
		}

		sendCustomKeyboard(message){
			var chat_id = message.chat.id;

			return server.methods.sendMessage({
				chat_id: chat_id,
				text: "Options",
				reply_markup: JSON.stringify({
					keyboard: [["Ayuda", "Contacto", "Problema"]],
					resize_keyboard: true,
					one_time_keyboard: false
				})
			});	
		}

		sendQrPicture(message){

			const self = this;

			Promise.all([server.methods.getNewAddress(message.chat.id), self.getBusinessRate(message.chat.id)])
			.then(function(res){

				var address = res[0];
				
				var rate = res[1];
				var invoice = Number.parseFloat(message.text.substring(1));
				
				var amount = {
					amount: Number.parseFloat((invoice/rate).toFixed(8))
				}

				var qr_string = 'bitcoin:' + address + "?" + qs.stringify(amount);
				var qr_png = self.getQrPicture(qr_string);

				var transaction_doc = {
					_id: address,
					type: "invoice",
					chat_id: message.chat.id,
					qr_string: qr_string,
					date: Date.now(),
					status: "CREATED", 
					rate: rate, 
					invoice: invoice,
					value: amount.amount
				}

				return server.methods.couchprovider.uploadDocuments([transaction_doc])
				.then(function(res){
					return server.methods.sendMessage({
						chat_id: message.chat.id,
						text: "Nueva factura por valor: $" + invoice + " COP = " + amount.amount + " BTC. " + rate + " COP/BTC" 
					})
					.bind({})
					.then(function(){
						return server.methods.sendPhoto({
							chat_id: message.chat.id,
							photo: qr_png
						})
					})
					.then(function(res){
						this.qr_msg = res;
						return server.methods.sendMessage({
							chat_id: message.chat.id,
							text: qr_string
						});
					})
					.then(function(res){
						this.bit_msg = res;
						return self.sendChangeAddressType(message.chat.id, address);
					})
					.then(function(res){
						this.add_msg = res;
						this.timestamp = Date.now();
						this.type = 'invoice_msg';
						this._id = address + "msg";
						return server.methods.couchprovider.uploadDocuments(this);
					});
				});
			})
			.catch(function(err){
				console.error(err);
				return server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "Tu chat id es: " + message.chat.id + ". Aún no tienes una cuenta en bit2cash.site, por favor contacta @purpurato para crear una nueva."
				})
			})
		}

		deleteInvoiceMessage(invoice_msg){
			return Promise.all([
				server.methods.deleteMessage({message_id: invoice_msg.qr_msg_id, chat_id: invoice_msg.chat_id}),
				server.methods.deleteMessage({message_id: invoice_msg.bit_msg_id, chat_id: invoice_msg.chat_id}),
				server.methods.deleteMessage({message_id: invoice_msg.add_msg_id, chat_id: invoice_msg.chat_id})
			])
			.then(function(){
				return server.methods.couchprovider.deleteDocument(invoice_msg);	
			});
		}

		deleteInvoiceMessages(delta_milliseconds){
			const self = this;
			var key = {
				startkey: 0,
				endkey: Date.now() - delta_milliseconds
			}

			var v = '_design/business/_view/getInvoiceMsg';
			v += '?' + qs.stringify(key);

			return server.methods.couchprovider.getView(v)
			.then(function(res){
				return _.pluck(res, 'value');
			})
			.then(function(res){
				return Promise.map(res, function(invoice_msg){
					return self.deleteInvoiceMessage(invoice_msg);
				});
			})
		}

		changeAddressType(chat_id, data){
			const self = this;

			return server.methods.couchprovider.getDocument(data.i)
			.then(function(doc){
				var addtype;

				if(data.t == "b"){
					addtype = "bech32";
				}else if(data.t = "l"){
					addtype = "legacy";
				}else{
					addtype = "p2sh-segwit";
				}
				return server.methods.getNewAddress(chat_id, ["", addtype])
				.then(function(address){
					var doc_old = _.clone(doc);
					doc._id = address;
					delete doc._rev;

					var qr_string = 'bitcoin:' + address + "?" + qs.stringify({amount: doc.value});
					doc.qr_string = qr_string;

					var qr_png = self.getQrPicture(qr_string);
					return Promise.all([server.methods.couchprovider.uploadDocuments(doc), server.methods.couchprovider.deleteDocument(doc_old), server.methods.chat_qr.deleteInvoiceMessage(doc_old)])
					.then(function(){
						return [qr_png, addtype, address, qr_string];
					});
				});
			})
			.spread(function(qr_png, addtype, address, qr_string){
				return server.methods.sendPhoto({
					chat_id: chat_id,
					photo: qr_png
				})
				.bind({})
				.then(function(res){
					this.qr_msg = res;
					return server.methods.sendMessage({
						chat_id: chat_id,
						text: addtype + ": " + qr_string
					});
				})
				.then(function(res){
					this.bit_msg = res;
					return self.sendChangeAddressType(chat_id, address);
				})
				.then(function(res){
					this.add_msg = res;
					this.timestamp = Date.now();
					this.type = 'invoice_msg';
					this._id = address + "msg";
					return server.methods.couchprovider.uploadDocuments(this);
				});
			})			
		}
	}

	const chat_qr_handler = new ChatQrHandler();

	server.method({
		name: 'getCurrencies',
		method: chat_qr_handler.getCurrencies,
		options: {}
	});

	server.method({
		name: 'chat_qr.deleteInvoiceMessage',
		method: (invoice)=>{
			return server.methods.couchprovider.getDocument(invoice._id + "msg")
			.then(function(invoice_msg){
				return chat_qr_handler.deleteInvoiceMessage({
			      _id: invoice_msg._id,
			      _rev: invoice_msg._rev,
			      qr_msg_id: invoice_msg.qr_msg.message_id,
			      bit_msg_id: invoice_msg.bit_msg.message_id,
			      add_msg_id: invoice_msg.add_msg.message_id,
			      chat_id: invoice_msg.qr_msg.chat.id
			    });	
			});
		},
		options: {}
	});
	
	var jobId = crontab.scheduleJob("*/1 * * * *", function(){
	    chat_qr_handler.deleteInvoiceMessages(20*60000);
	});

	return chat_qr_handler;
}