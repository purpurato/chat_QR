
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
			var key = {
				key: JSON.stringify(chat_id)
			}
			var v = '_design/business/_view/getWallet?' + qs.stringify(key);
			return server.methods.couchprovider.getView(v)
			.then(function(res){
				return _.pluck(res, 'value')[0];
			});
		},
		options: {}
	});

};

exports.plugin.pkg = require('./package.json');
