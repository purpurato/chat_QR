'use strict'
var request = require('request');
var fs = require('fs');
var Promise = require('bluebird');
var path = require('path');
var _ = require('underscore');
var Joi = require('@hapi/joi');

var qs = require('querystring');
var prompt = require('prompt');
var os = require('os');
var jws = require('jsonwebtoken');
var HapiJWTCouch = require('hapi-jwt-couch-lib');

class ChatQrLib extends HapiJWTCouch{
    constructor(){
        super()
        this.configfilename = path.join(process.cwd(), '.chatqr-config.json');
        this.joiconf = Joi.object().keys({
            uri: Joi.string().uri(),
            token: Joi.string()
        });
    }

    setConfigFileName(configfilename){
        this.configfilename = configfilename;
    }

    getConfigFileName(){
        return this.configfilename;
    }

    getConfigFile() {
      try {
        // Try to load the user's personal configuration file in the current directory
        var conf = JSON.parse(fs.readFileSync(this.getConfigFileName()));
        Joi.assert(conf, this.joiconf);
        return conf;
      } catch (e) {
        return null;
      }
    };

    setConfigFile (config) {
      try {
        // Try to save the user's personal configuration file in the current working directory
        var confname = this.configfilename;
        console.log("Writing configuration file", confname);
        fs.writeFileSync(confname, JSON.stringify(config));
      } catch (e) {
        console.error(e);
      }
    };

    newTransaction(transactionid, txout){
        const self = this;
        return new Promise(function(resolve, reject){
            var options = {
                'url': self.getServer() + '/txout/' + encodeURIComponent(transactionid),
                'method': 'POST',
                'agentOptions': self.agentOptions,
                'auth': self.auth,
                'json': txout
            }

            request(options, function(err, res, body){
                if(err){
                    reject(err)
                }else{
                    resolve(body);
                }
            })
        });
    }

    newBlock(blockhash, block){
        const self = this;
        return new Promise(function(resolve, reject){
            var options = {
                'url': self.getServer() + '/block/' + encodeURIComponent(blockhash),
                'method': 'POST',
                'agentOptions': self.agentOptions,
                'auth': self.auth,
                'json': block
            }

            request(options, function(err, res, body){
                if(err){
                    reject(err)
                }else{
                    resolve(body);
                }
            })
        });
    }

    promptUsernamePassword(){
        return new Promise(function(resolve, reject){
            var schema = {
                properties: {
                    email: {
                        pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                        message: 'Email address',
                        required: true
                    },
                    password: {                    
                        hidden: true,
                        required: true
                    }
                }
            };
            prompt.start();
            prompt.get(schema, function (err, result) {
                if(err){
                    reject(err)
                }else{
                    resolve(result);
                }
            });
        });
    }

    promptServer(){
        return new Promise(function(resolve, reject){
            var schema = {
                properties: {
                    uri: {
                        message: 'Please enter the chatqr server url',
                        required: true
                    }
                }
            };
            prompt.start();
            prompt.get(schema, function (err, result) {
                if(err){
                    reject(err)
                }else{
                    resolve(result);
                }
            });
        });
    }

    testUserToken(token){
        var jwt = jws.decode(token.token);

        if(jwt.exp && jwt.exp < Date.now() / 1000){
            return false;
        }else if(jwt.exp === undefined){
            console.log("WARNING! The token does not have an expiry date. Tokens without expiry date were deprecated. The clusterpost-server could be running an old version. Please contact the clusterpost-server administrator.");
        }
        return true;
    }

    start(configfilename){
        var self = this;

        if(configfilename){
            self.setConfigFileName(configfilename);
        }
        var config = self.getConfigFile();

        if(config){
            self.setServer(config.uri);
            if(self.testUserToken(config)){
                self.setUserToken(config);
                return Promise.resolve();
            }else{
                return self.promptUsernamePassword()
                .then(function(user){
                    return self.userLogin(user);
                })
                .then(function(token){
                    _.extend(token, {
                        uri: self.getServer()
                    });
                    self.setConfigFile(token);
                });
            }
        }else{
            return self.promptServer()
            .then(function(server){
                self.setServer(server);
                return self.promptUsernamePassword()
            })
            .then(function(user){
                return self.userLogin(user);
            })
            .then(function(token){
                _.extend(token, {
                    uri: self.getServer()
                });
                self.setConfigFile(token);
            });
        }
    }

}

module.exports = ChatQrLib;