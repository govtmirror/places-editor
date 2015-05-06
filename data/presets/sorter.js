var fs = require('fs');
var args = process.argv.slice(2);

var sortObj = function(orig) {
  var newArray = [];
  var newObj = {};

  // Add values to an array
  for (var item in orig) {
    newArray.push(item);
  }

  // Add the sorted array back
  newArray.sort().map(function(key) {
    if (typeof orig[key] === 'object' && !Array.isArray(orig[key])) {
      newObj[key] = sortObj(orig[key]);
    } else {
      newObj[key] = orig[key];
    }
  });
  return newObj;
};


for (var filename in args) {
  var rawData = fs.readFileSync(args[filename], 'utf8');
  fs.writeFileSync(args[filename], JSON.stringify(sortObj(JSON.parse(rawData)), null, 4), 'utf8');
}
