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
			}else if(message.text == "Help" || message.text == "help" || message.text == "ayuda" || message.text == "Ayuda"){
				server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "Para crear un nuevo QR escriba '$' + el monto de la transacción en COP. Ej: $10000."
				})
				.then(function(){
					server.methods.sendMessage({
						chat_id: message.chat.id,
						text: "El QR será válido por 20 minutos. Una vez utilizado o pasado el tiempo de validez, este desaparecerá de la conversación."
					})
				});
			}else if(message.text == "Contact" || message.text == "contact" || message.text == "contacto" || message.text == "Contacto"){
				server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "Si tiene alguna pregunta contactenos en @Purpurato o help@bit2cash.site"
				});
			}else if(message.text == "Issues" || message.text == "issues" || message.text == "problema" || message.text == "Problema"){
				server.methods.sendMessage({
					chat_id: message.chat.id,
					text: "Si necesita ayuda técnica contactenos en @Juanprietob o support@bit2cash.site"
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
					console.error("sendPhoto", e);
				});;
			},
			options: {
				bind: {
					telegram: api
				}
			}
		});

		server.method({
			name: 'deleteMessage',
			method: function(params){
				return this.telegram.deleteMessage(params)
				.catch(function(e){
					console.error("deleteMessage", e);
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
