
exports.plugin = {};
exports.plugin.register = async function (server, conf) {
  
	const couchUpdateViews = require('couch-update-views');
	const path = require('path');
	const qs = require('querystring');
	const _ = require('underscore');
  
	couchUpdateViews.migrateUp(server.methods.couchprovider.getCouchDBServer(), path.join(__dirname, 'views'), true);

	server.method({
		name: 'getWallet',
		method: function(chat_id){
			var v = '_design/business/_view/getWallets';
			if(chat_id){
				var key = {
					key: JSON.stringify(chat_id)
				}
				v += '?' + qs.stringify(key);	
			}
			return server.methods.couchprovider.getView(v)
			.then(function(res){
				return _.pluck(res, 'value');
			});
		},
		options: {}
	});

	server.method({
		name: 'getWallets',
		method: function(){
			var v = '_design/business/_view/getWallets?include_docs=true';
			return server.methods.couchprovider.getView(v)
			.then(function(res){
				return _.pluck(res, 'doc');
			});
		},
		options: {}
	});

	server.method({
		name: 'getTransactions',
		method: function(chat_id){
			var v = '_design/business/_view/getTransactions';
			if(chat_id){
				var key = {
					key: JSON.stringify(chat_id)
				}
				v += '?' + qs.stringify(key);	
			}
			return server.methods.couchprovider.getView(v)
			.then(function(res){
				return _.pluck(res, 'value');
			});
		},
		options: {}
	});

};

exports.plugin.pkg = require('./package.json');
