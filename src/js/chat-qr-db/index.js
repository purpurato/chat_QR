
exports.plugin = {};
exports.plugin.register = async function (server, conf) {
  
	const couchUpdateViews = require('couch-update-views');
	const path = require('path');
	const qs = require('querystring');
	const _ = require('underscore');
  
	couchUpdateViews.migrateUp(server.methods.couchprovider.getCouchDBServer(), path.join(__dirname, 'views'), true);
	
	require('./chatqr.routes')(server, conf);

};

exports.plugin.pkg = require('./package.json');
