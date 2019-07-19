const request = require('request');
const _ = require('underscore');
const Promise = require('bluebird');
const Boom = require('boom');
const BitcoinLib = require("bitcoin-lib");
const { spawn } = require('child_process');

module.exports = function (server, conf) {

	var bitlib = new BitcoinLib();

	bitlib.setAuth(conf.auth)
	bitlib.setUrl(conf.url);

	const startTunnel = function(ssh_conf){

		if(ssh_conf && ssh_conf.tunnel){
			var params = _.flatten(_.map(ssh_conf.tunnel, function(val, key){
				return [key, val];
			}));
			if(ssh_conf.identityfile){
				params = params.concat('-i', ssh_conf.identityfile);
			}
			var params = params.concat(['-q', ssh_conf.user + "@" + ssh_conf.hostname ]);
			const tunnel = spawn('ssh', params);
			var alldata = "";
			tunnel.stdout.on('data', function(data){
				alldata += data;
			});

			var allerror = "";
			tunnel.stderr.on('data', function(data){
				allerror += data;
			});

			tunnel.on('close', function(code){
				console.log(alldata);
				console.error(allerror);
			});

			tunnel.unref();

			if(tunnel.pid){
				return Promise.resolve("Tunnel started");
			}else{
				return Promise.reject("Tunnel failed!");
			}
		}
		return Promise.resolve();
	}

	startTunnel(conf.ssh_conf)
	.then(function(res){
		console.log(res);
	});

	server.method({
		name: 'getnewaddress',
		method: function(wallet, params){
			return bitlib.getnewaddress(wallet, params);
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

		return bitlib.createwallet([wallet.wallet_name, wallet.disable_private_keys, wallet.blank])
		.then(function(){
			return bitlib.encryptwallet(wallet.wallet_name, [conf.wallet_key]);
		});
	}

	/*
	*/
	handler.loadWallets = function(req, rep){
		
		var credentials = req.auth.credentials;

		return bitlib.listwalletdir()
		.then(function(res){
			var {wallets} = res.result;
			return Promise.map(wallets, function(wallet){
				return bitlib.loadwallet([wallet.name]);
			})
		})
	}

	/*
	*/

	handler.getTransaction = function(req, rep){
		const {txid} = req.params;

		return bitlib.getrawtransaction([txid, true])
		.then(function(res){
			return res.result;
		});
	}
	

	return handler;
}
