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

		handler.setTelegram(api);

		api.on('message', function(message)
		{
			console.log('message', message);
			if(message.text && message.text[0] == "$"){
				handler.sendQrPicture(message);
			}
		});

		api.on('inline.query', function(message)
		{
			// Received inline query
			console.log('inline.query', message);
		});

		api.on('inline.result', function(message)
		{
			// Received chosen inline result
			console.log('inline.result', message);
		});

		api.on('inline.callback.query', function(message)
		{
			// New incoming callback query
			console.log('inline.callback.query', message);
			if(message.data){
				var data = JSON.parse(message.data);
				if(data.verify){
					handler.verifyTransaction(data.verify);
				}
			}
		});

		api.on('edited.message', function(message)
		{
			// Message that was edited
			console.log(message);
		});

		api.on('update', function(message)
		{
			// Generic update object
			// Subscribe on it in case if you want to handle all possible
			// event types in one callback
			console.log(message);
		});

	}
};
