const WebSocket = require('ws');
 
const ws = new WebSocket('wss://ws.blockchain.info/inv');
 
ws.on('open', function open() {
	ws.send(JSON.stringify({"op":"addr_sub", "addr": "1DxT1eJbp7xxCuo1ugtzVik5wBy7bSV1hf"}));
});
 
ws.on('message', function incoming(data) {
  console.log(data);
});