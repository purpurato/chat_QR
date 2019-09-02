const request = require('request');
const _ = require('underscore');
const Promise = require('bluebird');
const Boom = require('@hapi/boom');
const qs = require('querystring');

module.exports = function (server, conf) {

	const getBusiness = function(chat_id){
		var key = {
			include_docs: true
		}

		if(chat_id){
			key.key = '"' + chat_id + '"';
		}

		var v = '_design/business/_view/getWallets';
		v += '?' + qs.stringify(key);
		
		return server.methods.couchprovider.getView(v)
		.then(function(res){
			return _.pluck(res, 'doc');
		})
	}

	server.method({
		name: 'getBusiness',
		method: getBusiness,
		options: {}
	})

	server.method({
		name: 'getNewAddress',
		method: function(chat_id, params){
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
					return server.methods.getnewaddress(wallet.wallet_name, params);	
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

		return getBusiness()
		.catch(function(err){
			return Boom.notFound(err);
		});
	}

	/*
	*/
	handler.getBusiness = function(req, rep){
		
		const {chat_id} = req.params;
		
		return getBusiness(chat_id)
		.then(function(res){
			return res[0];
		})
		.catch(function(err){
			return Boom.notFound(err);
		});
	}

	/*
	*/
	handler.createBusiness = function(req, rep){
		const business = req.payload;
		return server.methods.couchprovider.uploadDocuments(business);
	}

	/**/
	handler.updateBusiness = function(req, rep){
		const business = req.payload;
		return server.methods.couchprovider.uploadDocuments(business);
	}

	const updateInvoice = function(txid, vout){
		const {scriptPubKey} = vout;

		if(scriptPubKey && scriptPubKey.addresses){
			return Promise.map(scriptPubKey.addresses, function(address){
				return server.methods.couchprovider.getDocument(address)
				.catch(function(err){
					return null;
				});
			})
			.then(function(res){
				return _.compact(_.flatten(res));
			})
			.then(function(res){
				return Promise.map(res, function(invoice){
					if(invoice.status === 'CREATED' || (invoice.status !== 'CREATED' && invoice.txids && invoice.txids[invoice.txids.length - 1] !== txid)){
						if(!invoice.txids){
							invoice.txids = [];
						}
						invoice.txids.push(txid);
						invoice.status = 'ALIVE';
						return server.methods.couchprovider.uploadDocuments(invoice)
						.then(function(){

							var token = server.methods.jwtauth.sign(invoice, { expiresIn: '1h' });

							var inline_keyboard = [[{
			                    "text": "View",
			                    "url": conf.invoiceurl + "?" + qs.stringify(token)
			                }]]

			                var message = {
			                    "chat_id": invoice.chat_id, 
			                    "text": "Transacción recibida por " + invoice.value + " BTC" ,
			                    "reply_markup": JSON.stringify({ "inline_keyboard": inline_keyboard })
			                }

							return server.methods.sendMessage(message);
						})
						.then(function(){
							return server.methods.chat_qr.deleteInvoiceMessage(invoice);
						});
					}
				})
			});	
		}else{
			return Promise.reject("This transaction does not contain addresses!");
		}
	}

	const confirmInvoice = function(txout, vout){
		const {scriptPubKey} = vout;

		if(scriptPubKey && scriptPubKey.addresses){
			return Promise.map(scriptPubKey.addresses, function(address){
				return server.methods.couchprovider.getDocument(address)
				.catch(function(err){
					return null;
				});
			})
			.then(function(res){
				return _.compact(_.flatten(res));
			})
			.then(function(invoices){
				return Promise.map(invoices, function(invoice){
					if(invoice.status == 'ALIVE'){
						invoice.status = 'CONFIRMED';
						if(!invoice.txids){
							//The txids should be added in the update step
							invoice.txids = [txout.txid];
						}

						var token = server.methods.jwtauth.sign(invoice, { expiresIn: '1h' });

						var inline_keyboard = [[{
			                "text": "View",
			                "url": conf.invoiceurl + "?" + qs.stringify(token)
			            }]]

			            var message = {
			                "chat_id": invoice.chat_id, 
			                "text": "Transacción confirmada por " + invoice.value,
			                "reply_markup": JSON.stringify({ "inline_keyboard": inline_keyboard })
			            }

			            var admin_message_prom;

			            if(conf.admin && conf.admin.url && conf.admin.chat_id){
			            	var qsinvoice = {
				            	invoice: invoice._id
				            }

				            var inline_keyboard_admin = [[{
				                "text": "View",
				                "url": conf.admin.url + "?" + qs.stringify(qsinvoice)
				            }]]

				            var admin_message = {
				                "chat_id": conf.admin.chat_id, 
				                "text": "Transaction confirmed!",
				                "reply_markup": JSON.stringify({ "inline_keyboard": inline_keyboard_admin })
				            }

				            admin_message_prom = server.methods.sendMessage(admin_message);
			            }else{
			            	admin_message_prom = Promise.resolve();
			            }
			            

						return Promise.all([server.methods.sendMessage(message), server.methods.couchprovider.uploadDocuments(invoice), admin_message_prom]);
					}
				})
			});
		}
	}

	const getChatIdByEmail = function(credentials){
		
		var v = '_design/business/_view/getChatIdByEmail';

		var key = {
			key: '"' + credentials.email + '"'
		}

		v += '?' + qs.stringify(key);
		
		return server.methods.couchprovider.getView(v)
		.then(function(res){
			return _.pluck(res, 'value');
		})
	}

	handler.getInvoices = function(req, rep){

		const {credentials} = req.auth;
		const {scope} = credentials;

		var keys_prom;

		if(scope.indexOf('admin') == -1){
			return getChatIdByEmail(credentials)
			.then(function(chat_ids){

				return _.map(chat_ids, function(chat_id){
					return {
						include_docs: true,
						key: chat_id
					}
				});
			})
			.then(function(keys){
				return Promise.map(keys, function(key){
					var v = '_design/business/_view/getInvoiceByChatId';
					v += '?' + qs.stringify(key);
					return server.methods.couchprovider.getView(v);
				})
				.then(function(res){
					return _.flatten(res);
				});
			})
			.then(function(res){
				return _.groupBy(_.pluck(res, 'doc'), 'chat_id');
			})
			.catch(function(err){
				return Boom.notFound(err);
			});
		}else{
			var key = {
				include_docs: true
			}
			var v = '_design/business/_view/getInvoiceByChatId';
			v += '?' + qs.stringify(key);
			
			return server.methods.couchprovider.getView(v)
			.then(function(res){
				return _.groupBy(_.pluck(res, 'doc'), 'chat_id');
			})
			.catch(function(err){
				return Boom.notFound(err);
			});
		}
	}

	const verifyCreatedInvoices = function(){
		var key = {
			include_docs: true,
			key: '"CREATED"'
		}
		var v = '_design/business/_view/getInvoiceByStatus';
		v += '?' + qs.stringify(key);

		return server.methods.couchprovider.getView(v)
		.then(function(res){
			return _.groupBy(_.pluck(res, 'doc'), 'chat_id');
		})
		.then(function(grouped_invoices){
			
			return Promise.all(_.map(grouped_invoices, function(invoices, chat_id){

				var key_w = {
					key: '"' + chat_id + '"'
				}		
				var v_w = '_design/business/_view/getWallets?' + qs.stringify(key_w);
				
				return server.methods.couchprovider.getView(v_w)
				.then(function(res){
					return _.pluck(res, 'value')[0];
				})
				.then(function(wallet){
					return Promise.map(invoices, function(invoice){
						return server.methods.listreceivedbyaddress(wallet.wallet_name, [1, false, false, invoice._id])
						.then(function(r){
							return r.result;
						});
					})
				})
			}));
		})
		.then(_.flatten)
		.then(function(results){
			return _.filter(_.compact(results), function(res){
				return res.result && res.result.length > 0;
			});
		})
		.then(function(results){
			return Promise.map(results, function(res){
				var txids = _.uniq(_.flaten(_.pluck(result, 'txids')));
				return Promise.map(txids, function(txid){
					return server.methods.getrawtransaction([txid, 1])
					.then(function(txout){
						return newTransaction(txout, txout.txid);
					})
				}, {concurrency: 1});
			});
		});
	}

	const verifyAliveInvoices = function(){
		var key = {
			include_docs: true,
			key: '"ALIVE"'
		}
		var v = '_design/business/_view/getInvoiceByStatus';
		v += '?' + qs.stringify(key);

		return server.methods.couchprovider.getView(v)
		.then(function(res){
			return _.pluck(res, 'doc');
		})
		.then(function(invoices){
			var txids = _.pluck(invoices, "txid");
			return Promise.map(txids, function(txid){
				return server.methods.getrawtransaction([txid, 1])
				.then(function(txout){
					return newTransaction(txout, txout.txid);
				});
			})
		});
	}

	handler.verifyInvoices = function(req, rep){
		return Promise.all([verifyCreatedInvoices(), verifyAliveInvoices()])
		.catch(function(err){
			console.log(err)
			return Boom.notFound(err);
		});
	}

	handler.getInvoice = function(req, rep){
		const {id} = req.params;
		return server.methods.couchprovider.getDocument(id)
		.catch(function(err){
			return Boom.notFound(err);
		});
	}
	


	const newTransaction = function(txout){
		if(txout.confirmations){
			return Promise.map(txout.vout, function(vout){
				return confirmInvoice(txout, vout);
			});
		}else{
			return Promise.map(txout.vout, function(vout){
				return updateInvoice(txout.txid, vout);
			});
		}
	}
	/*
	*/
	handler.newTransaction = function(req, rep){
		const txout = req.payload;
		// const {txid} = req.params;
		
		return newTransaction(txout);
	}

	/*
	*/
	handler.newBlock = function(req, rep){
		const block = req.payload;
		const {hash} = req.params;
		block._id = hash;
		block.type = 'block';

		return true;

		// return Promise.any(_.map(block.tx, function(txid){
		// 	return server.methods.couchprovider.getDocument(txid);
		// }))
		// .then(function(transaction){
		// 	return server.methods.couchprovider.uploadDocuments(block);	
		// })
		// .catch(function(err){
		// 	return Boom.notFound(err);
		// })
	}

	/*
	*/

	handler.getCurrencies = function(req, rep){
		return server.methods.getCurrencies()
		.catch(function(err){
			console.error('getCurrencies', err);
			return Boom.notFound(err);
		});
	}

	return handler;
}
