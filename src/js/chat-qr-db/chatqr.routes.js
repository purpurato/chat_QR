
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
		}),
		"currency": Joi.string()
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
		}),
		"currency": Joi.string()
	});

	const joiinvoiceget = Joi.object().keys({
		"_id": Joi.string(),
		"_rev": Joi.string(),
		"type": Joi.string().valid("invoice"),
		"chat_id": Joi.number(),
		"qr_string": Joi.string(),
		"date": Joi.number(),
		"status": Joi.string(),
		"rate": Joi.number(),
		"invoice": Joi.number(),
		"value": Joi.number(),
		"txid": Joi.string().optional()
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

	server.route({
		path: '/business/{chat_id}',
		method: 'GET',
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin', 'business']
            },
			handler: handlers.getBusiness,
			validate: {
				query: false,
		        payload: false,
		        params: {
		        	chat_id: Joi.string()
		        }
			},
			response: {
				schema: joibusinessget
			},
			description: 'This route will be used to fetch an existing business from the DB'
		}
	});

	server.route({
		method: 'GET',
		path: "/invoices",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin', 'business']
            },
			handler: handlers.getInvoices,
			validate: {
			  	query: false,
			    params: null,
			    payload: false
			},
			response: {
				schema: Joi.object().pattern(Joi.number(), Joi.array().items(joiinvoiceget))
			},
			description: 'Get all invoices for the current user. Returns all if admin'
	    }
	});

	server.route({
		method: 'GET',
		path: "/invoice/{id}",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin', 'business']
            },
			handler: handlers.getInvoice,
			validate: {
			  	query: false,
			    params: {
			  		id: Joi.string()
			  	},
			    payload: false
			},
			response: {
				schema: joiinvoiceget
			},
			description: 'Get an invoice.'
	    }
	});

	server.route({
		method: 'GET',
		path: "/currencies",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin', 'business']
            },
			handler: handlers.getCurrencies,
			validate: {
			  	query: false,
			    params: null,
			    payload: false
			},
			description: 'Get all available currencies from local bitcoins'
	    }
	});

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
		method: 'PUT',
		path: "/business",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.updateBusiness,
			validate: {
			  	query: false,
			    params: null,
			    payload: joibusinessget
			},
			description: 'Update business info'
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
