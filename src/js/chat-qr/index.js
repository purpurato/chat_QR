exports.plugin = {
	pkg: require('./package.json'), 
	register: async function (server, conf) {
		
		const handler = require("./chat-qr.handler.js")(server, conf);

		const telegram = require('telegram-bot-api');
		var api = new telegram({
	        token: conf.token,
	        updates: {
	        	enabled: true
	    	}
		});

		api.on('message', function(message)
		{
			if(message.text && message.text[0] == "$"){
				handler.sendQrPicture(message);
			}else if(message.text == "Help" || message.text == "help" || message.text == "ayuda"){
				server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "To create a new QR type '$' + the amount of the transaction in COP. Ex: $10000"
				});
			}else if(message.text == "Contact" || message.text == "contact" || message.text == "contacto"){
				server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "If you need any questions please contact help@bit-2cash.com"
				});
			}else if(message.text == "Issues" || message.text == "issues" || message.text == "problema"){
				server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "If you need technical support please contact support@bit-2cash.com"
				});
			}else if(message.text === '/start'){
				handler.sendCustomKeyboard(message);
			}
		});

		api.on('inline.query', function(message)
		{
			// Received inline query
			// console.log('inline.query', message);
		});

		api.on('inline.result', function(message)
		{
			// Received chosen inline result
			// console.log('inline.result', message);
		});

		api.on('inline.callback.query', function(message)
		{
			// New incoming callback query when the user clicks a button
			if(message.data){
				var data = JSON.parse(message.data);
				if(data.t){
					handler.changeAddressType(message.message.chat.id, data);	
				}
			}
		});

		api.on('edited.message', function(message)
		{
			// Message that was edited
			// console.log(message);
		});

		api.on('update', function(message)
		{
			// Generic update object
			// Subscribe on it in case if you want to handle all possible
			// event types in one callback
			// console.log(message);
		});

		server.method({
			name: 'sendMessage',
			method: function(message){
				return this.telegram.sendMessage(message)
				.catch(function(e){
					console.error("sendMessage", e);
				});
			},
			options: {
				bind: {
					telegram: api
				}
			}
		});


		server.method({
			name: 'sendPhoto',
			method: function(message){
				return this.telegram.sendPhoto(message)
				.catch(function(e){
					console.error("sendMessage", e);
				});;
			},
			options: {
				bind: {
					telegram: api
				}
			}
		});

	}
};
