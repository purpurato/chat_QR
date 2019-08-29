'use strict'

const qr = require('qr-image');
const request = require('request');
const Promise = require('bluebird');
const qs = require('querystring');
const _ = require('underscore');

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
				text: "Change address type",
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
					keyboard: [["Help", "Contact", "Issues"]],
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
					
					return server.methods.sendPhoto({
						chat_id: message.chat.id,
						photo: qr_png
					})
					.then(function(){
						return server.methods.sendMessage({
							chat_id: message.chat.id,
							text: qr_string
						});
					})
					.then(function(){
						return self.sendChangeAddressType(message.chat.id, address);
					});
				});
			})
			.catch(function(err){
				return server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "You don't have a business account in bit-2cash.com yet, please contact @purpurato to create one. Your chat id is: " + message.chat.id
				})
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
					return Promise.all([server.methods.couchprovider.uploadDocuments(doc), server.methods.couchprovider.deleteDocument(doc_old)])
					.then(function(){
						return [qr_png, addtype, address, qr_string];
					});
				});
			})
			.spread(function(qr_png, addtype, address, qr_string){
				return server.methods.sendMessage({
					chat_id: chat_id,
					text: addtype + ":"
				})
				.then(function(){
					return server.methods.sendPhoto({
						chat_id: chat_id,
						photo: qr_png
					});
				})
				.then(function(){
					return server.methods.sendMessage({
						chat_id: chat_id,
						text: qr_string
					});
				})
				.then(function(){
					return self.sendChangeAddressType(chat_id, address);
				})
			})
			.then(function(){

			})
			
		}
	}

	const chat_qr_handler = new ChatQrHandler();

	server.method({
		name: 'getCurrencies',
		method: chat_qr_handler.getCurrencies,
		options: {}
	});

	return chat_qr_handler;
}