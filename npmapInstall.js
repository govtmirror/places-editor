console.log('***********************');
console.log('**       NPMAP       **');
console.log('***********************');

var configFile = __dirname + '/../../config.json';
var fs = require('fs');
var settingsFile = __dirname + '/js/id/npmap.js';
var config, idSettings, key;

// Check if our config file exists
if (fs.existsSync(configFile)) {
  var readConfig = require('../../readConfig');

  config = readConfig(JSON.parse(fs.readFileSync(configFile)));
  idSettings = config.iD;
  key = config.oauth.keys.filter(function (d) {
    return d.name === 'iD';
  })[0];
  idSettings.settings.connection.oauth = {
    consumerKey: key.consumerKey,
    external: config.oauth.external,
    secret: key.consumerSecret,
    url: idSettings.settings.connection.api
  };

  fs.writeFileSync(settingsFile, 'iD.npmap = ' + JSON.stringify(idSettings, null, 4) + ';\n');
  console.log('iD.npmap = ' + JSON.stringify(idSettings, null, 4) + ';\n');
  console.log('***********************');
  console.log('NPMap settings updated');
  console.log('***********************');
}
