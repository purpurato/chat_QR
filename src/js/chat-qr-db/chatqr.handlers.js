const request = require('request');
const _ = require('underscore');
const Promise = require('bluebird');
const Boom = require('@hapi/boom');
const qs = require('querystring');

// var couchUpdateViews = require('couch-update-views'););

module.exports = function (server, conf) {

	// if(!server.methods.clusterprovider){
	// 	throw new Error("Have you installed the 'couch-provider' plugin with namespace 'clusterprovider'?");
	// }

	// couchUpdateViews.migrateUp(server.methods.clusterprovider.getCouchDBServer(), path.join(__dirname, 'views'), true);

	server.method({
		name: 'getNewAddress',
		method: function(chat_id){
			var v = '_design/business/_view/getWallets';
			var key = {
				key: '"' + JSON.stringify(chat_id) + '"'
			}
			v += '?' + qs.stringify(key);
			
			return server.methods.couchprovider.getView(v)
			.then(function(res){
				return _.pluck(res, 'value');
			})
			.then(function(res){
				var wallet = res[0];

				if(wallet){
					return server.methods.getnewaddress(wallet.wallet_name);	
				}else{
					return Promise.reject("No wallet found");
				}
			})
			.then(function(res){
				return res.result;
			});
		},
		options: {}
	});

	var handler = {};
	/*
	*/
	handler.getBusinesses = function(req, rep){

		var v = '_design/business/_view/getWallets';
		
		var key = {
			include_docs: true
		}
		v += '?' + qs.stringify(key);

		return server.methods.couchprovider.getView(v)
		.then(function(res){
			return _.pluck(res, 'doc');
		});
	}

	/*
	*/
	handler.createBusiness = function(req, rep){
		const business = req.payload;
		return server.methods.couchprovider.uploadDocuments(business);
	}

	const updateInvoice = function(txid, vout){
		const {scriptPubKey} = vout;

		if(scriptPubKey && scriptPubKey.addresses){
			return Promise.map(scriptPubKey.addresses, function(address){
				var v = '_design/business/_view/getCreatedInvoice';

				var key = {
					key: '"' + address + '"',
					include_docs: true
				}
				v += '?' + qs.stringify(key);

				return server.methods.couchprovider.getView(v)
				.then(function(res){
					return _.pluck(res, 'doc');
				});
			})
			.then(function(res){
				return _.compact(_.flatten(res));
			})
			.then(function(res){
				return Promise.map(res, function(invoice){
					invoice.txid = txid;
					invoice.status = 'ALIVE';
					return server.methods.couchprovider.uploadDocuments(invoice)
					.then(function(){

						var inline_keyboard = [[{
		                    "text": "View",
		                    "url": "https://www.blockchain.com/btc/tx/" + txid
		                }]]

		                var message = {
		                    "chat_id": invoice.chat_id, 
		                    "text": "New transaction",
		                    "reply_markup": JSON.stringify({ "inline_keyboard": inline_keyboard })
		                }

						return server.methods.sendMessage(message);
					});
				})
			});	
		}else{
			return Promise.reject("This transaction does not contain addresses!");
		}
	}

	const confirmInvoice = function(txout){
		var v = '_design/business/_view/getInvoiceByTxid';

		var key = {
			include_docs: true,
			key: '"' + txout._id + '"'
		}
		v += '?' + qs.stringify(key);
		
		return server.methods.couchprovider.getView(v)
		.then(function(res){
			return _.pluck(res, 'doc');
		})
		.then(function(invoices){
			return Promise.map(invoices, function(invoice){
				if(invoice.status == 'ALIVE'){
					invoice.status = 'CONFIRMED';

					var inline_keyboard = [[{
		                "text": "View",
		                "url": "https://www.blockchain.com/btc/tx/" + txout._id
		            }]]

		            var message = {
		                "chat_id": invoice.chat_id, 
		                "text": "Transaction confirmed!",
		                "reply_markup": JSON.stringify({ "inline_keyboard": inline_keyboard })
		            }

					return Promise.all([server.methods.sendMessage(message), server.methods.couchprovider.uploadDocuments(invoice)]);
				}
			})
			
		});
	}
	

	/*
	*/
	handler.newTransaction = function(req, rep){
		const txout = req.payload;
		const {txid} = req.params;
		txout.type = 'transaction'
		txout._id = txid;

		return server.methods.couchprovider.getDocument(txid)
		.then(function(txdoc){
			txout._rev = txdoc._rev;

			if(txout.confirmations > 0){
				return confirmInvoice(txout)
				.then(function(){
					return txout;
				});
			}

			return txout;
			
		})
		.catch(function(res){
			return Promise.map(txout.vout, function(vout){
				return updateInvoice(txout._id, vout)
				.then(function(){
					return txout;
				});
			});
		})
		.then(function(txout){
			return server.methods.couchprovider.uploadDocuments(txout);
		});
	
	}

	/*
	*/
	handler.newBlock = function(req, rep){
		const block = req.payload;
		const {hash} = req.params;
		block._id = hash;
		block.type = 'block';

		return Promise.any(_.map(block.tx, function(txid){
			return server.methods.couchprovider.getDocument(txid);
		}))
		.then(function(transaction){
			console.log("found!", transaction);
			return server.methods.couchprovider.uploadDocuments(block);	
		})
		.catch(function(err){
			return Boom.notFound(err);
		})
	}

	return handler;
}
