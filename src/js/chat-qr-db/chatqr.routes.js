
module.exports = function (server, conf) {
	
	var handlers = require('./chatqr.handlers')(server, conf);
	var Joi = require('@hapi/joi');

	const joibusinesspost = Joi.object().keys({
		"name": Joi.string(),
		"users": Joi.array().items(Joi.string().email()),
		"chat_ids": Joi.array().items(Joi.string()),
		"type": Joi.string().valid("business"),
		"wallet": Joi.object().keys({
			"wallet_name": Joi.string()
		}),
		"currency": Joi.string(),
		"coordinates": Joi.object().keys({
			longitude: Joi.number(),
			latitude: Joi.number()
		}),
		"business_type": Joi.string(),
		"url": Joi.string().uri().optional(),
		"facebook": Joi.string().uri().optional(),
		"instagram": Joi.string().uri().optional(),
		"twitter": Joi.string().uri().optional(),
		"whatsapp": Joi.string().optional(),
		"maps": Joi.string().uri().optional(),
		"description": Joi.string()
	});

	const joibusinessget = Joi.object().keys({
		"_id": Joi.string(),
		"_rev": Joi.string(),
		"name": Joi.string(),
		"users": Joi.array().items(Joi.string().email()),
		"type": Joi.string().valid("business"),
		"wallet": Joi.object().keys({
			"wallet_name": Joi.string()
		}),
		"currency": Joi.string(),
		"chat_ids": Joi.array().items(Joi.string()),
		"coordinates": Joi.object().keys({
			longitude: Joi.number().allow(''),
			latitude: Joi.number().allow('')
		}),
		"business_type": Joi.string().allow(''),
		"url": Joi.string().uri().allow('').optional(),
		"facebook": Joi.string().uri().allow('').optional(),
		"instagram": Joi.string().uri().allow('').optional(),
		"twitter": Joi.string().uri().allow('').optional(),
		"whatsapp": Joi.string().allow('').optional(),
		"maps": Joi.string().uri().allow('').optional(),
		"description": Joi.string().allow('')
	});

	const joibusinessgetpublic = Joi.object().keys({
		"name": Joi.string(),
		"coordinates": Joi.object().keys({
			longitude: Joi.number().allow(''),
			latitude: Joi.number().allow('')
		}),
		"business_type": Joi.string().allow(''),
		"url": Joi.string().uri().allow('').optional(),
		"facebook": Joi.string().uri().allow('').optional(),
		"instagram": Joi.string().uri().allow('').optional(),
		"twitter": Joi.string().uri().allow('').optional(),
		"whatsapp": Joi.string().allow('').optional(),
		"maps": Joi.string().uri().allow('').optional(),
		"description": Joi.string().allow('')
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
		"txid": Joi.string().optional(),
		"txids": Joi.array().optional()
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
		path: '/businesses/public',
		method: 'GET',
		config: {
			handler: handlers.getBusinessesPublicInfo,
			validate: {
				query: false,
		        payload: false,
		        params: null
			},
			response: {
				schema: Joi.array().items(joibusinessgetpublic)
			},
			description: 'This route will be used to fetch the existing businesses public info from the DB.'
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
		method: 'PUT',
		path: "/invoices",
		config: {
			auth: {
                strategy: 'token',
                scope: ['admin']
            },
			handler: handlers.verifyInvoices,
			validate: {
			  	query: false,
			    params: null,
			    payload: false
			},
			description: 'Verify all created invoices to see if there are new transactions using the invoice address'
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

	server.route({
		method: 'GET',
		path: "/maps/key",
		config: {
			handler: handlers.getMapsKey,
			validate: {
			  	query: false,
			    params: null,
			    payload: false
			},
			description: 'Get the Google maps key'
	    }
	});

}
