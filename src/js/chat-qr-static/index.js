const fs = require('fs');
const path = require('path');

exports.plugin = {};
exports.plugin.register = async function (server, options) {
	server.path(__dirname);
	
	server.route({
		path: '/{path*}',
		method: 'GET',
		config: {
			handler: {
				directory: { path: './node_modules/chat-qr-public/build', listing: false, index: true }
			},
			description: 'This route serves the static website of chat-qr'
		}
	});
	
};

exports.plugin.pkg = require('./package.json');