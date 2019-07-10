exports.plugin = {};
exports.plugin.register = async function (server, conf) {
  
  require('./bitcoin.routes')(server, conf);

};

exports.plugin.pkg = require('./package.json');
