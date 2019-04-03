const WebSocket = require('ws');
const _ = require('underscore');

const wss = new WebSocket.Server({ port: 8181 });

const blockchain_data = require("./test_data.json");

 
// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

var blocks_sub = [];
var addr_sub = {};
 
wss.on('connection', function connection(ws) {
  
  ws.on('message', function incoming(data) {
    // // Broadcast to everyone else.
    // wss.clients.forEach(function each(client) {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     client.send(data);
    //   }
    // });

    var jsdata = JSON.parse(data);
    if(jsdata.op){
      if(jsdata.op == "blocks_sub"){
        blocks_sub.push(ws);
      }else if(jsdata.op == "addr_sub"){
        if(addr_sub[jsdata.addr]){
          addr_sub[jsdata.addr].push(ws);  
        }else{
          addr_sub[jsdata.addr] = [ws];
        }
      }
    }

    console.log(jsdata);

  });
});


var broadcastBlocks = function(block){
  blocks_sub = _.filter(blocks_sub, function(ws){
    if(ws.readyState  === WebSocket.OPEN){
      ws.send(JSON.stringify(block));
      return true;
    }
    return false;
  })
}

var broadcastAddr = function(transaction, addr){
  if(addr_sub[addr]){
    if(addr_sub[addr].length > 0){
      addr_sub[addr] = _.filter(addr_sub[addr], function(ws){
        if(ws.readyState  === WebSocket.OPEN){
          ws.send(JSON.stringify(transaction));
          return true;
        }
        return false;
      })
    }else{
      delete addr_sub[addr];
    }
  }
}

var run_test = function(){
  _.each(blockchain_data["block"], function(block, i){
      setTimeout(function(){
        broadcastBlocks(block);
      }, 20000*(i+1))  
  });

  var addr_i = 0;
  _.each(blockchain_data["addr"], function(transaction, addr){
    addr_i += 1;
    setTimeout(function(){
      broadcastAddr(transaction, addr);
    }, 10000*(addr_i))
  });
  setTimeout(function(){
    run_test()
  }, 60000)
}

run_test();

// const url = require('url');
// const http = require('http');
// const WebSocket = require('ws');
 
// const server = http.createServer();
// const wss1 = new WebSocket.Server({ noServer: true });
// const wss2 = new WebSocket.Server({ noServer: true });
 
// wss1.on('connection', function connection(ws) {
//   // ...
// });
 
// wss2.on('connection', function connection(ws) {
//   // ...
// });
 
// server.on('upgrade', function upgrade(request, socket, head) {
//   const pathname = url.parse(request.url).pathname;

//   if (pathname === '/inv') {
//     wss1.handleUpgrade(request, socket, head, function done(ws) {
//       wss1.emit('connection', ws, request);
//     });
//   } else if (pathname === '/bar') {
//     wss2.handleUpgrade(request, socket, head, function done(ws) {
//       wss2.emit('connection', ws, request);
//     });
//   } else {
//     socket.destroy();
//   }
// });
 
// server.listen(8181);