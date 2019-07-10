
module.exports = function (server, conf) {
	
	var handlers = require('./chatqr.handlers')(server, conf);
	var Joi = require('@hapi/joi');

	const joibusinesspost = Joi.object().keys({
		"name": Joi.string(),
		"users": Joi.array().items(Joi.string().email()),
		"chat_id": Joi.string(),
		"type": Joi.string().valid("business"),
		"wallet": Joi.object().keys({
			"wallet_name": Joi.string()
		})
	});

	const joibusinessget = Joi.object().keys({
		"_id": Joi.string(),
		"_rev": Joi.string(),
		"name": Joi.string(),
		"users": Joi.array().items(Joi.string().email()),
		"chat_id": Joi.string(),
		"type": Joi.string().valid("business"),
		"wallet": Joi.object().keys({
			"wallet_name": Joi.string()
		})
	});

	server.route({
		path: '/businesses',
		method: 'GET',
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.getBusinesses,
			validate: {
				query: false,
		        payload: false,
		        params: null
			},
			response: {
				schema: Joi.array().items(joibusinessget)
			},
			description: 'This route will be used to fetch the existing businesses from the DB.'
		}
	});

	// server.route({
	// 	method: 'GET',
	// 	path: "/node/wallet/{wallet}/balance",
	// 	config: {
	// 		auth: {
 //                strategy: 'token',
 //                scope: ['admin']
 //            },
	// 		handler: handlers.getBalance,
	// 		validate: {
	// 		  	query: false,
	// 		    params: {
	// 		    	wallet: Joi.string()
	// 		    },
	// 		    payload: false
	// 		},
	// 		description: 'Get wallet balance'
	//     }
	// });

	server.route({
		method: 'POST',
		path: "/business",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.createBusiness,
			validate: {
			  	query: false,
			    params: null,
			    payload: joibusinesspost
			},
			description: 'Create a new business'
	    }
	});

	server.route({
		method: 'POST',
		path: "/txout/{txid}",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin', 'bitcoin-node']
            },
			handler: handlers.newTransaction,
			validate: {
			  	query: false,
			    params: {
			    	txid: Joi.string()
			    },
			    payload: Joi.object()
			},
			description: 'Save a new transaction for one of the existing wallets in the node'
	    }
	});

	server.route({
		method: 'POST',
		path: "/block/{hash}",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin', 'bitcoin-node']
            },
			handler: handlers.newBlock,
			validate: {
			  	query: false,
			    params: {
			    	hash: Joi.string()
			    },
			    payload: Joi.object()
			},
			description: 'Saves the block if the block is related to a transaction in the system. The transaction is confirmed with the business.'
	    }
	});

}
