var fs = require('fs');
var args = process.argv.slice(2);
var exec = require('child_process').exec;

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

var readNext = function (idx) {
    var currentData = sortObj(JSON.parse(fs.readFileSync(args[idx], 'utf8')));
    var prevData;
    exec('git show HEAD:./' + args[idx], function(e, o, err) {
      if (e || err) {
        throw (e || err);
      } else {
        prevData = sortObj(JSON.parse(o));
        if (JSON.stringify(prevData) === JSON.stringify(currentData)) {
          // console.log('no change: ' + args[idx]);
        } else {
          console.log(args[idx]);
        }
        if (idx < args.length-1) {
          readNext(idx + 1);
        }
      }
    });
};

readNext(0);

    // fs.writeFileSync(args[filename], JSON.stringify(sortObj(JSON.parse(rawData)), null, 4), 'utf8');
