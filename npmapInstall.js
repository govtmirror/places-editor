console.log('***********************');
console.log('**       NPMAP       **');
console.log('***********************');

var configFile = __dirname + '/../../config.json';
var fs = require('fs');
var settingsFile = __dirname + '/js/id/npmap.js';
var configUrl = 'https://raw.githubusercontent.com/nationalparkservice/places-website/master/config.json';
var https = require('https');
var complete = function (config) {
  var idSettings = config.iD;
  var key = config.oauth.keys.filter(function (d) {
    return d.name === 'iD';
  })[0];
  idSettings.settings.connection.oauth = {
    consumerKey: key.consumerKey && key.consumerKey.indexOf('{{') >= 0 ? key.consumerKey : 'CpIont3biEafgafInTYWkFlooQkcFLtGREu6yMG0',
    external: config.oauth.external,
    secret: key.consumerSecret && key.consumerSecret.indexOf('{{') >= 0 ? key.consumerSecret : 'MFgSWe00v8EsddR9KI42uZZX61r2XL8JwEPxHY2p',
    url: idSettings.settings.connection.api
  };

  fs.writeFileSync(settingsFile, 'iD.npmap = ' + JSON.stringify(idSettings, null, 4) + ';\n');
  console.log('iD.npmap = ' + JSON.stringify(idSettings, null, 4) + ';\n');
  console.log('***********************');
  console.log('NPMap settings updated');
  console.log('***********************');
};

// Check if our config file exists
if (fs.existsSync(configFile)) {
  var readConfig = require('../../readConfig');
  complete(readConfig(JSON.parse(fs.readFileSync(configFile))));
} else {
  var getFile = function (url, callback) {
    var file = '';
    https.get(url, function (resp) {
      resp.on('data', function (d) {
        file += d.toString();
      });
      resp.on('error', function (e) {
        console.log('error', e);
        callback(e);
      });
      resp.on('end', function (d) {
        console.log('hmm', JSON.parse(file));
        callback(null, JSON.parse(file));
      });
    });
  };

  getFile(configUrl, function (e, r) {
    if (!e) {
      complete(r);
    }
  });
}
