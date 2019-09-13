const qs = require('querystring');
const _ = require('underscore');

module.exports.getDocuments = function(couchProvider){

	var key = {
		include_docs: true
	}

	var v = '_design/business/_view/getWallets';
	v += '?' + qs.stringify(key);

	return couchProvider.getView(v)
	.then(function(res){
		return _.pluck(res, 'doc');
	});
}

module.exports.transformDocument = function(doc){
	if(!doc.chat_ids && !doc.coordinates && !doc.business_type && !doc.url && !doc.description){
		var transformed = {...doc, 
			"chat_ids": [doc.chat_id],
			"coordinates": {
				longitude: "",
				latitude: ""
			},
			"business_type": "",
			"url": "",
			"description": ""
		}

		delete transformed.chat_id;

		return transformed;
	}else{
		console.error("transformed not made", doc);
		return null;
	}
}