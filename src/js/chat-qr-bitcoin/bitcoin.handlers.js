var request = require('request');
var _ = require('underscore');
var Promise = require('bluebird');
var Boom = require('boom');
var BitcoinLib = require("bitcoin-lib");
// var couchUpdateViews = require('couch-update-views'););

module.exports = function (server, conf) {

	var bitlib = new BitcoinLib();

	bitlib.setAuth(conf.auth)
	bitlib.setUrl(conf.url);

	// if(!server.methods.clusterprovider){
	// 	throw new Error("Have you installed the 'couch-provider' plugin with namespace 'clusterprovider'?");
	// }

	// couchUpdateViews.migrateUp(server.methods.clusterprovider.getCouchDBServer(), path.join(__dirname, 'views'), true);

	server.method({
		name: 'getnewaddress',
		method: function(wallet){
			return bitlib.getnewaddress(wallet);
		},
		options: {}
	});

	var handler = {};
	/*
	*/
	handler.getWallets = function(req, rep){

		return bitlib.listwallets()
		.then(function(res){
			return _.map(_.compact(res.result), function(w){
				return {
					"wallet": w
				}
			});
		});
		
	}

	handler.getBalance = function(req, rep){

		var {wallet} = req.params;

		return bitlib.getbalance(wallet);
		
	}

	/*
	*/
	handler.createWallet = function(req, rep){

		var wallet = req.payload;
		var credentials = req.auth.credentials;

		return bitlib.createwallet([wallet.wallet_name, wallet.disable_private_keys, wallet.blank]);
	}
	

	return handler;
}
