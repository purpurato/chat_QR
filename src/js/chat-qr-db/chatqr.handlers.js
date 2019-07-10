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
	

	/*
	*/
	handler.newTransaction = function(req, rep){
		const txout = req.payload;
		const {txid} = req.params;
		txout.type = 'transaction'
		txout._id = txid;
		return server.methods.couchprovider.uploadDocuments(txout);
	}

	/*
	*/
	handler.newBlock = function(req, rep){
		const block = req.payload;
		const {hash} = req.params;
		block._id = hash;
		
		return server.methods.couchprovider.uploadDocuments(block);
	}

	return handler;
}
