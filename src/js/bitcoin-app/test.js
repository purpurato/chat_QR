var BitcoinLib = require("bitcoin-lib");
var path = require('path');
var Promise = require('bluebird');
var argv = require('minimist')(process.argv.slice(2));
const os = require('os');
const fs = require('fs');
const _ = require('underscore');

if(argv["h"] || argv["help"]){
    help();
    process.exit(1);
}

var bitlib = new BitcoinLib();
bitlib.start('.test-bitcoin.json')
.then(function(){

    var transactionid = argv["txid"];
    if(transactionid){
        return bitlib.getrawtransaction([transactionid, true])
        .then(function(res){
            var txout = res.result;
            console.log(txout)
            return Promise.all([
                Promise.map(txout.vin, function(tvin){
                    return bitlib.getrawtransaction([tvin.txid, true])
                    .then(function(res){
                        var txin = res.result;
                        return txin.vout[tvin.vout].value;
                    });
                })
                .then(function(res){
                    var sum = _.reduce(res, function(memo, num){ return memo + num; }, 0);
                    console.log(sum)
                    return sum;
                }),
                Promise.map(txout.vout, function(vout){
                    return vout.value;
                })
                .then(function(res){
                    var sum = _.reduce(res, function(memo, num){ return memo + num; }, 0);
                    console.log(sum)
                    return sum;
                })
            ])
            .spread(function(totalin, totalout){
                var fees = totalin - totalout;
                console.log(fees);
                var feeperbyte = (fees/0.00000001)/txout.size;
                console.log(feeperbyte);
                var feeperweightunit = (fees/0.00000001)/txout.weight;
                console.log(feeperweightunit);
            });
        });
    }

    var address = argv["address"];
    var wallet = argv["wallet"];
    if(address && wallet){

        return bitlib.listreceivedbyaddress(wallet, [1, true, , "2NAaHZRVX9optEtHQGzJNAk3updbZZdgAcG"])
        .then(function(res){
            console.log(res.result[0]);
        })

    }

    if(address && wallet && amount){
        bitlib.getnewaddress('ThisNewWallet')
        .then(function(res){
            var address = res.result;
            bitlib.sendtoaddress(wallet, [address, amount])
            .then(function(res){
                console.log(res);
            })    
        })
    }
})
