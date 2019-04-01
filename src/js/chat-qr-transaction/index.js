
exports.plugin = {};
exports.plugin.register = async function (server, conf) {
	const WebSocket = require('ws');
	const _ = require('underscore');
	const handler = require("./chat-qr-transaction.handler.js")(server, conf);

	const ws_trans = new WebSocket('wss://ws.blockchain.info/inv');

	var live_transactions = {};
	 
	ws_trans.on('open', function open() {
		ws_trans.send(JSON.stringify({"op":"blocks_sub"}));
	});
	 
	ws_trans.on('message', function incoming(data) {
	  	console.log("TRANSACTION", data);
	  	var block = JSON.parse(data);
	  	if(live_transactions[block.x.hash]){
	  		server.methods.sendMessage({
				chat_id: live_transactions[block.x.hash].chat_id,
				text: "Block added" + block.x.hash
			});
			delete live_transactions[block.x.hash];
	  	}
	});

	// const ws_all_trans = new WebSocket('wss://ws.blockchain.info/inv');
	 
	// ws_all_trans.on('open', function open() {
	// 	ws_all_trans.send(JSON.stringify({"op":"unconfirmed_sub"}));
	// });
	 
	// ws_all_trans.on('message', function incoming(data) {
	// 	data = JSON.parse(data);
	//   console.log("ALL", data.x.hash);
	// });
	
	var createClientSockets = function(){
		server.methods.getWallets()
		.then(function(res){
			_.map(res, function(wallet){

				var ws_client = new WebSocket('wss://ws.blockchain.info/inv');
	 
				ws_client.on('open', function open() {
					ws_client.send(JSON.stringify({"op":"addr_sub", "addr": wallet.address}));
				});
				 
				ws_client.on('message', function incoming(data) {
					var client_trans = JSON.parse(data);
					server.methods.sendMessage({
						chat_id: wallet.chat_id,
						text: client_trans.x.hash
					});
					live_transactions[client_trans.x.hash] = wallet;
				});
			});
		})
		.catch(function(e){
			console.error("createClientSockets", e);
		});
	}

	createClientSockets();
	
	
}
exports.plugin.pkg = require('./package.json');

