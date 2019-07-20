
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const BitcoinLib = require("./index");
var bitlib = new BitcoinLib();


lab.experiment("Test the bitcoin-lib", function(){
    

    lab.test('returns true when the bitcoin-lib starts', function(){

        return bitlib.start()
        .then(function(){
            console.log("It has started")
        });
    });

    lab.test('returns true when a transaction is retrieved from the node', function(){

        return bitlib.getrawtransaction(['1a1ba668c323cd39374dc121866e381bc41c5e83e3ada9323a822343d743ca90', true])
        .then(function(res){
            console.log(res.result);
        });
    });


    lab.test('returns true when the wallet balance is retrieved', function(){
        return bitlib.getbalance('wallet name', ["*", 1])
        .then(function(res){
            console.log(res.result);
        })
    });

})