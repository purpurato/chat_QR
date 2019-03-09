'use strict';

var Hapi = require('hapi');
var fs = require('fs');
var good = require('good');
var path = require('path');
var _ = require('underscore');

var env = process.env.NODE_ENV;

if(!env) throw "Please set NODE_ENV variable.";


const getConfigFile = function () {
  try {
    // Try to load the user's personal configuration file
    return require(process.cwd() + '/conf.my.' + env + '.json');
  } catch (e) {
    // Else, read the default configuration file
    return require(process.cwd() + '/conf.' + env + '.json');
  }
}

const startServer = function(cluster){

    var conf = getConfigFile();

    var tls;
    if(conf.tls && conf.tls.key && conf.tls.cert){
        tls = {
          key: fs.readFileSync(conf.tls.key),
          cert: fs.readFileSync(conf.tls.cert)
        };
    }

    var server = new Hapi.Server({ 
        host: conf.host,
        port: conf.port,
        tls: tls
    });    

    
    const init = async () => {

        var plugins = _.map(conf.plugins, function(options, pluginName){
            return {
                plugin: require(pluginName), 
                options: options
            }
        });
        

        plugins.push({
            plugin: good,
            options: {
                reporters: {
                    myConsoleReporter: [{
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{ log: '*', response: '*' }]
                    },
                    {
                        module: 'good-console'
                    }, 'stdout'],
                    myFileReporter: [{
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{ ops: '*' }]
                    }, {
                        module: 'good-squeeze',
                        name: 'SafeJson'
                    }, {
                        module: 'good-file',
                        args: ['all.log']
                    }]
                }
            }
        });
        

        await server.register(plugins);
        await server.start();
        console.log(`Server running at: ${server.info.uri}`);
    };

    init();

}

startServer();

