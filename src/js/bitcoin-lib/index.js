const Promise = require('bluebird');
const _ = require('underscore');
const request = require('request');
const stream = require('stream');
const prompt = require('prompt');
const fs = require('fs');

class BitcoinLib {
	constructor(){
		this.auth = {};
		this.configfilename = '.bitcoin-core-config.json'
	}

	version(){
		return "0.18.0";
	}

	setAuth(auth){
		this.auth = auth
	}

	setUrl(url){
		this.url = url;
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

	promptUsernamePassword(){
        return new Promise(function(resolve, reject){
            var schema = {
                properties: {
                    user: {
                        message: 'User name',
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
                    url: {
                        message: 'Please enter the bitcoin-core node jsonrpc url',
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

    start(configfilename){
        var self = this;

        if(configfilename){
            self.setConfigFileName(configfilename);
        }
        var config = self.getConfigFile();

        if(config && config.url && config.auth && config.auth.user && config.auth.password){
            self.setUrl(config.url);
            self.setAuth(config.auth);
            return Promise.resolve();
        }else{
            return self.promptServer()
            .then(function(res){
                self.setUrl(res.url);
                return self.promptUsernamePassword()
            })
            .then(function(auth){
            	self.setAuth(auth);

                var config = {
                	url: self.url,
                	auth: auth
                }
                self.setConfigFile(config);
            });
        }
    }

	executeMethod(method, params, path){
		const self = this;
		var path = path? path: '';
		var params = params? params: [];
		
		return new Promise(function(resolve, reject){
			var options = {
				url: self.url + path,
				method: 'POST',
				auth: self.auth,
				json: {
					"jsonrpc": "1.0", 
					method, 
					params
				}
			}

			request(options, function(err, res, body){
				if(err){
					reject(err);
				}else{
					resolve(body);
				}
			});
		});
	}
	//Blockchain
	getblock(params){
		return this.executeMethod("getblock", params);
	}
	getblockchaininfo(params){
		return this.executeMethod("getblockchaininfo", params);
	}
	getblockcount(params){
		return this.executeMethod("getblockcount", params);
	}
	getblockhash(params){
		return this.executeMethod("getbestblockhash", params);
	}
	getblockheader(params){
		return this.executeMethod("getblockheader", params);
	}
	getblockstats(params){
		return this.executeMethod("getblockstats", params);
	}
	getchaintips(params){
		return this.executeMethod("getchaintips", params);
	}
	getchaintxstats(params){
		return this.executeMethod("getchaintxstats", params);
	}
	getdifficulty(params){
		return this.executeMethod("getdifficulty", params);
	}
	getmempoolancestors(params){
		return this.executeMethod("getmempoolancestors", params);
	}
	getmempooldescendants(params){
		return this.executeMethod("getmempooldescendants", params);
	}
	getmempoolentry(params){
		return this.executeMethod("getmempoolentry", params);
	}
	getmempoolinfo(params){
		return this.executeMethod("getmempoolinfo", params);
	}
	getrawmempool(params){
		return this.executeMethod("getrawmempool", params);
	}
	gettxout(params){
		return this.executeMethod("gettxout", params);
	}
	gettxoutproof(params){
		return this.executeMethod("gettxoutproof", params);
	}
	gettxoutsetinfo(params){
		return this.executeMethod("gettxoutsetinfo", params);
	}
	preciousblock(params){
		return this.executeMethod("preciousblock", params);
	}
	pruneblockchain(params){
		return this.executeMethod("pruneblockchain", params);
	}
	savemempool(params){
		return this.executeMethod("savemempool", params);
	}
	scantxoutset(params){
		return this.executeMethod("scantxoutset", params);
	}
	verifychain(params){
		return this.executeMethod("verifychain", params);
	}
	verifytxoutproof(params){
		return this.executeMethod("verifytxoutproof", params);
	}
	//Control
	getmemoryinfo(params){
		return this.executeMethod("getmemoryinfo", params);
	}
	getrpcinfo(params){
		return this.executeMethod("getrpcinfo", params);
	}
	help(params){
		return this.executeMethod("help", params);
	}
	logging(params){
		return this.executeMethod("logging", params);
	}
	stop(params){
		return this.executeMethod("stop", params);
	}
	uptime(params){
		return this.executeMethod("uptime", params);
	}
	//Generating
	generate(params){
		return this.executeMethod("generate", params);
	}
	generatetoaddress(params){
		return this.executeMethod("generatetoaddress", params);
	}
	//Mining
	getblocktemplate(params){
		return this.executeMethod("getblocktemplate", params);
	}
	getmininginfo(params){
		return this.executeMethod("getmininginfo", params);
	}
	getnetworkhashps(params){
		return this.executeMethod("getnetworkhashps", params);
	}
	prioritisetransaction(params){
		return this.executeMethod("prioritisetransaction", params);
	}
	submitblock(params){
		return this.executeMethod("submitblock", params);
	}
	submitheader(params){
		return this.executeMethod("submitheader", params);
	}
	//Network
	addnode(params){
		return this.executeMethod("addnode", params);
	}
	clearbanned(params){
		return this.executeMethod("clearbanned", params);
	}
	disconnectnode(params){
		return this.executeMethod("disconnectnode", params);
	}
	getaddednodeinfo(params){
		return this.executeMethod("getaddednodeinfo", params);
	}
	getconnectioncount(params){
		return this.executeMethod("getconnectioncount", params);
	}
	getnettotals(params){
		return this.executeMethod("getnettotals", params);
	}
	getnetworkinfo(params){
		return this.executeMethod("getnetworkinfo", params);
	}
	getnodeaddresses(params){
		return this.executeMethod("getnodeaddresses", params);
	}
	getpeerinfo(params){
		return this.executeMethod("getpeerinfo", params);
	}
	listbanned(params){
		return this.executeMethod("listbanned", params);
	}
	ping(params){
		return this.executeMethod("ping", params);
	}
	setban(params){
		return this.executeMethod("setban", params);
	}
	setnetworkactive(params){
		return this.executeMethod("setnetworkactive", params);
	}
	//Rawtransactions
	analyzepsbt(params){
		return this.executeMethod("analyzepsbt", params);
	}
	combinepsbt(params){
		return this.executeMethod("combinepsbt", params);
	}
	combinerawtransaction(params){
		return this.executeMethod("combinerawtransaction", params);
	}
	converttopsbt(params){
		return this.executeMethod("converttopsbt", params);
	}
	createpsbt(params){
		return this.executeMethod("createpsbt", params);
	}
	createrawtransaction(params){
		return this.executeMethod("createrawtransaction", params);
	}
	decodepsbt(params){
		return this.executeMethod("decodepsbt", params);
	}
	decoderawtransaction(params){
		return this.executeMethod("decoderawtransaction", params);
	}
	decodescript(params){
		return this.executeMethod("decodescript", params);
	}
	finalizepsbt(params){
		return this.executeMethod("finalizepsbt", params);
	}
	fundrawtransaction(params){
		return this.executeMethod("fundrawtransaction", params);
	}
	getrawtransaction(params){
		return this.executeMethod("getrawtransaction", params);
	}
	joinpsbts(params){
		return this.executeMethod("joinpsbts", params);
	}
	sendrawtransaction(params){
		return this.executeMethod("sendrawtransaction", params);
	}
	signrawtransactionwithkey(params){
		return this.executeMethod("signrawtransactionwithkey", params);
	}
	testmempoolaccept(params){
		return this.executeMethod("testmempoolaccept", params);
	}
	utxoupdatepsbt(params){
		return this.executeMethod("utxoupdatepsbt", params);
	}
	//Util
	createmultisig(params){
		return this.executeMethod("createmultisig", params);
	}
	deriveaddresses(params){
		return this.executeMethod("deriveaddresses", params);
	}
	estimatesmartfee(params){
		return this.executeMethod("estimatesmartfee", params);
	}
	getdescriptorinfo(params){
		return this.executeMethod("getdescriptorinfo", params);
	}
	signmessagewithprivkey(params){
		return this.executeMethod("signmessagewithprivkey", params);
	}
	validateaddress(params){
		return this.executeMethod("validateaddress", params);
	}
	verifymessage(params){
		return this.executeMethod("verifymessage", params);
	}
	//Wallet
	abandontransaction(wallet, params){
		return this.executeMethod("abandontransaction", params, "/wallet/" + wallet);
	}
	abortrescan(wallet, params){
		return this.executeMethod("abortrescan", params, "/wallet/" + wallet);
	}
	addmultisigaddress(wallet, params){
		return this.executeMethod("addmultisigaddress", params, "/wallet/" + wallet);
	}
	backupwallet(wallet, params){
		return this.executeMethod("backupwallet", params, "/wallet/" + wallet);
	}
	bumpfee(wallet, params){
		return this.executeMethod("bumpfee", params, "/wallet/" + wallet);
	}
	createwallet(params){
		return this.executeMethod("createwallet", params);
	}
	dumpprivkey(wallet, params){
		return this.executeMethod("dumpprivkey", params, "/wallet/" + wallet);
	}
	dumpwallet(wallet, params){
		return this.executeMethod("dumpwallet", params, "/wallet/" + wallet);
	}
	encryptwallet(wallet, params){
		return this.executeMethod("encryptwallet", params, "/wallet/" + wallet);
	}
	getaddressesbylabel(wallet, params){
		return this.executeMethod("getaddressesbylabel", params, "/wallet/" + wallet);
	}
	getaddressinfo(wallet, params){
		return this.executeMethod("getaddressinfo", params, "/wallet/" + wallet);
	}
	getbalance(wallet, params){
		return this.executeMethod("getbalance", params, "/wallet/" + wallet);
	}
	getnewaddress(wallet, params){
		return this.executeMethod("getnewaddress", params, "/wallet/" + wallet);
	}
	getrawchangeaddress(wallet, params){
		return this.executeMethod("getrawchangeaddress", params, "/wallet/" + wallet);
	}
	getreceivedbyaddress(wallet, params){
		return this.executeMethod("getreceivedbyaddress", params, "/wallet/" + wallet);
	}
	getreceivedbylabel(wallet, params){
		return this.executeMethod("getreceivedbylabel", params, "/wallet/" + wallet);
	}
	gettransaction(wallet, params){
		return this.executeMethod("gettransaction", params, "/wallet/" + wallet);
	}
	getunconfirmedbalance(wallet, params){
		return this.executeMethod("getunconfirmedbalance", params, "/wallet/" + wallet);
	}
	getwalletinfo(wallet, params){
		return this.executeMethod("getwalletinfo", params, "/wallet/" + wallet);
	}
	importaddress(wallet, params){
		return this.executeMethod("importaddress", params, "/wallet/" + wallet);
	}
	importmulti(wallet, params){
		return this.executeMethod("importmulti", params, "/wallet/" + wallet);
	}
	importprivkey(wallet, params){
		return this.executeMethod("importprivkey", params, "/wallet/" + wallet);
	}
	importprunedfunds(wallet, params){
		return this.executeMethod("importprunedfunds", params, "/wallet/" + wallet);
	}
	importpubkey(wallet, params){
		return this.executeMethod("importpubkey", params, "/wallet/" + wallet);
	}
	importwallet(wallet, params){
		return this.executeMethod("importwallet", params, "/wallet/" + wallet);
	}
	keypoolrefill(wallet, params){
		return this.executeMethod("keypoolrefill", params, "/wallet/" + wallet);
	}
	listaddressgroupings(wallet, params){
		return this.executeMethod("listaddressgroupings", params, "/wallet/" + wallet);
	}
	listlabels(wallet, params){
		return this.executeMethod("listlabels", params, "/wallet/" + wallet);
	}
	listlockunspent(wallet, params){
		return this.executeMethod("listlockunspent", params, "/wallet/" + wallet);
	}
	listreceivedbyaddress(wallet, params){
		return this.executeMethod("listreceivedbyaddress", params, "/wallet/" + wallet);
	}
	listreceivedbylabel(wallet, params){
		return this.executeMethod("listreceivedbylabel", params, "/wallet/" + wallet);
	}
	listsinceblock(wallet, params){
		return this.executeMethod("listsinceblock", params, "/wallet/" + wallet);
	}
	listtransactions(wallet, params){
		return this.executeMethod("listtransactions", params, "/wallet/" + wallet);
	}
	listunspent(wallet, params){
		return this.executeMethod("listunspent", params, "/wallet/" + wallet);
	}
	listwalletdir(wallet, params){
		return this.executeMethod("listwalletdir", params, "/wallet/" + wallet);
	}
	listwallets(wallet, params){
		return this.executeMethod("listwallets", params, "/wallet/" + wallet);
	}
	loadwallet(params){
		return this.executeMethod("loadwallet", params);
	}
	lockunspent(wallet, params){
		return this.executeMethod("lockunspent", params, "/wallet/" + wallet);
	}
	removeprunedfunds(wallet, params){
		return this.executeMethod("removeprunedfunds", params, "/wallet/" + wallet);
	}
	rescanblockchain(wallet, params){
		return this.executeMethod("rescanblockchain", params, "/wallet/" + wallet);
	}
	sendmany(wallet, params){
		return this.executeMethod("sendmany", params, "/wallet/" + wallet);
	}
	sendtoaddress(wallet, params){
		return this.executeMethod("sendtoaddress", params, "/wallet/" + wallet);
	}
	sethdseed(wallet, params){
		return this.executeMethod("sethdseed", params, "/wallet/" + wallet);
	}
	setlabel(wallet, params){
		return this.executeMethod("setlabel", params, "/wallet/" + wallet);
	}
	settxfee(wallet, params){
		return this.executeMethod("settxfee", params, "/wallet/" + wallet);
	}
	signmessage(wallet, params){
		return this.executeMethod("signmessage", params, "/wallet/" + wallet);
	}
	signrawtransactionwithwallet(wallet, params){
		return this.executeMethod("signrawtransactionwithwallet", params, "/wallet/" + wallet);
	}
	unloadwallet(wallet, params){
		return this.executeMethod("unloadwallet", params, "/wallet/" + wallet);
	}
	walletcreatefundedpsbt(wallet, params){
		return this.executeMethod("walletcreatefundedpsbt", params, "/wallet/" + wallet);
	}
	walletlock(wallet, params){
		return this.executeMethod("walletlock", params, "/wallet/" + wallet);
	}
	walletpassphrase(wallet, params){
		return this.executeMethod("walletpassphrase", params, "/wallet/" + wallet);
	}
	walletpassphrasechange(wallet, params){
		return this.executeMethod("walletpassphrasechange", params, "/wallet/" + wallet);
	}
	walletprocesspsbt(wallet, params){
		return this.executeMethod("walletprocesspsbt", params, "/wallet/" + wallet);
	}

	getzmqnotifications(params){
		return this.executeMethod("getzmqnotifications", params);
	}
}

module.exports = BitcoinLib;