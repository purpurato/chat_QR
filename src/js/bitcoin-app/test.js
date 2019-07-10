var BitcoinLib = require("bitcoin-lib");
var path = require('path');
var Promise = require('bluebird');
var argv = require('minimist')(process.argv.slice(2));
const os = require('os');
const fs = require('fs');

if(argv["h"] || argv["help"]){
    help();
    process.exit(1);
}

var bitlib = new BitcoinLib();
bitlib.start('.test-bitcoin.json')
.then(function(){
    bitlib.getnewaddress('ThisNewWallet')
    .then(function(res){
        var address = res.result;
        bitlib.sendtoaddress('testwallet', [address, 0.0001, "third tx", "crypto nyia"])
        .then(function(res){
            console.log(res);
        })    
    })
})
