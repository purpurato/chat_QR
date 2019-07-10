
exports.plugin = {};
exports.plugin.register = async function (server, conf) {
  
	const couchUpdateViews = require('couch-update-views');
	const path = require('path');
	const qs = require('querystring');
	const _ = require('underscore');
  
	couchUpdateViews.migrateUp(server.methods.couchprovider.getCouchDBServer(), path.join(__dirname, 'views'), true);


	require('./chatqr.routes')(server, conf);

	// server.method({
	// 	name: 'getTransactions',
	// 	method: function(chat_id){
	// 		var v = '_design/business/_view/getTransactions';
	// 		if(chat_id){
	// 			var key = {
	// 				key: JSON.stringify(chat_id)
	// 			}
	// 			v += '?' + qs.stringify(key);	
	// 		}
	// 		return server.methods.couchprovider.getView(v)
	// 		.then(function(res){
	// 			return _.pluck(res, 'value');
	// 		});
	// 	},
	// 	options: {}
	// });

};

exports.plugin.pkg = require('./package.json');
