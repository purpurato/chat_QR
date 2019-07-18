'use strict'

const qr = require('qr-image');
const request = require('request');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const os = require('os');
const qs = require('querystring');

module.exports = function(server, conf){
	class ChatQrHandler {
		constructor(){
		}

		getRate(){
			return new Promise(function(resolve, reject){
				request({
					uri: 'https://localbitcoins.com/bitcoinaverage/ticker-all-currencies/',
					method: 'get'
				}, function(err, res, body){
					resolve(Number.parseFloat(JSON.parse(body)['COP']['rates']['last']));
				});
			})
			.catch(function(err){
				console.error("getRate", err);
			});
		}

		sendQrPicture(message){

			const self = this;

			Promise.all([server.methods.getNewAddress(message.chat.id), self.getRate()])
			.then(function(res){
				var address = res[0];
				
				var rate = res[1];
				var invoice = Number.parseFloat(message.text.substring(1));
				
				var amount = {
					amount: Number.parseFloat((invoice/rate).toFixed(8))
				}

				var qr_string = 'bitcoin:' + address + "?" + qs.stringify(amount);
				var qr_png = qr.image(qr_string, { type: 'png' });
				qr_png.path = String(message.chat.id) + ".png";

				var transaction_doc = {
					_id: address,
					type: "invoice",
					chat_id: message.chat.id,
					qr_string: qr_string,
					date: Date.now(),
					status: "CREATED", 
					rate: rate, 
					invoice: invoice,
					value: amount.amount,
				}

				return server.methods.couchprovider.uploadDocuments([transaction_doc])
				.then(function(res){
					
					return server.methods.sendPhoto({
						chat_id: message.chat.id,
						photo: qr_png
					})
					.then(function(){
						return server.methods.sendMessage({
							chat_id: message.chat.id,
							text: qr_string
						});
					})
					.then(function(){
						return server.methods.sendMessage({
							chat_id: message.chat.id,
							text: "Change address type",
							reply_markup: JSON.stringify({
								inline_keyboard: [[{
									text: "bech32",
									callback_data: JSON.stringify({
										"id": address,
										"type": "bech32"
									})
								}, {
									text: "legacy",
									callback_data: JSON.stringify({
										"id": address,
										"type": "legacy"
									})
								}]]
							})
						});	
					});
				});
			})
			.catch(function(err){
				console.error('sendQrPicture', err);
			})
		}

		verifyTransaction(transaction_id, ok_transaction){
			var that = this;

			return server.methods.couchprovider.getDocument(transaction_id)
			.then(function(doc){
				if(ok_transaction){
					doc.status = "ALIVE";
				}else{
					doc.status = "CANCEL";
				}
				return server.methods.uploadDocuments(doc);
			})
		}
	}
	return new ChatQrHandler();
}