
module.exports = function (server, conf) {
	
	var handlers = require('./bitcoin.handlers')(server, conf);
	var Joi = require('@hapi/joi');

	server.route({
		path: '/node/wallets',
		method: 'GET',
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.getWallets,
			validate: {
				query: false,
		        payload: false,
		        params: null
			},
			response: {
				schema: Joi.array().items(Joi.object().keys({
					wallet: Joi.string()
				}))
			},
			description: 'This route will be used to fetch the existing wallets from the DB.'
		}
	});

	server.route({
		method: 'GET',
		path: "/node/wallet/{wallet}/balance",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.getBalance,
			validate: {
			  	query: false,
			    params: {
			    	wallet: Joi.string()
			    },
			    payload: false
			},
			description: 'Get wallet balance'
	    }
	});

	server.route({
		method: 'POST',
		path: "/node/wallet",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.createWallet,
			validate: {
			  	query: false,
			    params: null,
			    payload: Joi.object().keys({
			        wallet_name: Joi.string(),
			        disable_private_keys: Joi.boolean(),
			        blank: Joi.boolean()
			    })
			},
			description: 'Create a new wallet in the node'
	    }
	});


	server.route({
		method: 'PUT',
		path: "/node/wallets/load",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.loadWallets,
			validate: {
			  	query: false,
			    params: null,
			    payload: false
			},
			description: 'Load all wallets in the node'
	    }
	});
}
