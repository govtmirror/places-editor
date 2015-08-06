console.log('***********************');
console.log('**       NPMAP       **');
console.log('***********************');

var fs = require('fs');
var configFile = __dirname + '/../../config.json';
var readConfig = require('../../readConfig');
var settingsFile = __dirname + '/js/id/npmap.js';
var config, idSettings, key;
// Check if our config file exists
if (fs.existsSync(configFile)) {
  config = readConfig(JSON.parse(fs.readFileSync(configFile)));
  idSettings = config.iD;
  key = config.oauth.keys.filter(function (d) {
    return d.name === 'iD';
  })[0];
  idSettings.settings.connection.oauth = {
    external: config.oauth.external,
    url: idSettings.settings.connection.api,
    consumerKey: key.consumerKey,
    secret: key.consumerSecret
  };
  fs.writeFileSync(settingsFile, 'iD.npmap = ' + JSON.stringify(idSettings, null, 4) + ';\n');
  console.log('iD.npmap = ' + JSON.stringify(idSettings, null, 4) + ';\n');
  console.log('***********************');
  console.log('NPMap settings updated');
  console.log('***********************');
}

