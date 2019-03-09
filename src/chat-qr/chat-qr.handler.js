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

		setTelegram(telegram){
			this.telegram = telegram;
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

			var that = this;

			Promise.all([server.methods.getWallet(message.chat.id), that.getRate()])
			.then(function(res){
				var wallet = res[0];
				var rate = res[1];
				var currency = Number.parseFloat(message.text.substring(1));

				console.log(wallet, rate, currency);
				var amount = {
					amount: currency/rate
				}

				var qr_string = 'bitcoin:' + wallet.address + "?" + qs.stringify(amount);
				var qr_png = qr.image(qr_string, { type: 'png' });
				qr_png.path = String(message.chat.id) + ".png";


				var transaction_doc = {
					type: "transaction",
					qr_string: qr_string,
					chat_id: message.chat.id,
					date: Date.now(),
					status: "CREATED"
				}

				return server.methods.couchprovider.uploadDocuments([transaction_doc])
				.then(function(res){
					var transaction_id = res[0].id;
					return that.telegram.sendPhoto({
						chat_id: message.chat.id,
						photo: qr_png
					})
					.then(function(){

						return that.telegram.sendMessage({
							chat_id: message.chat.id,
							text: "Action items",
							reply_markup: JSON.stringify({
								inline_keyboard: [[{
									text: "Verify",
									callback_data: JSON.stringify({
										verify: transaction_id
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

		verifyTransaction(transaction_id){
			var that = this;

			return server.methods.couchprovider.getDocument(transaction_id)
			.then(function(doc){
				console.log(doc);
			})
		}
	}
	return new ChatQrHandler();
}