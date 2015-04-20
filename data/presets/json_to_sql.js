var fs = require('fs'),
  inputFilename = './presets.json',
  outputFilename = './presets.sql',
  schemaFilename = './schema/preset.json',
  tableName = 'tag_list',
  format = function(dataType, data) {
    var returnValue,
      types = {
        'string': function(data) {
          return '\'' + data.toString() + '\'';
        },
        'integer': function(data) {
          return parseInt(data, 10);
        },
        'number': function(data) {
          return parseFloat(data, 10);
        },
        'boolean': function(data) {
          return JSON.parse(data);
        },
        'array': function(data) {
          if (Object.prototype.toString.call(data) === '[object Array]') {
            var returnValue = '';
            for (var i = 0; i < data.length; i++) {
              returnValue += '\'' + data[i].toString() + '\',';
            }
            if (returnValue) {
              returnValue = returnValue.substring(0, returnValue.length - 1);
            }
            return 'ARRAY[' + returnValue + ']';
          } else {
            throw 'Array isn\'t really an array';
          }
        },
        'object': function(data) {
          if (Object.prototype.toString.call(data) === '[object Object]') {
            return '\'' + JSON.stringify(data) + '\'';
          } else {
            throw 'Object isn\'t really an object';
          }
        }
      };
    for (var type in types) {
      if (dataType.type === type) {
        returnValue = types[type](data);
        break;
      }
    }
    if (dataType.required && returnValue === '') {
      throw 'required field (' + dataType + ') missing';
    }
    return returnValue;
  },
  toSql = function() {
    var inserts = [];
    fs.readFile(schemaFilename, 'utf-8', function(err, schema) {
      schema = JSON.parse(schema).properties;
      fs.readFile(inputFilename, 'utf-8', function(err, inputData) {
        var columns = [],
          inputJson = JSON.parse(inputData),
          values = [];
        for (var key in inputJson) {
          columns = ['pathname'];
          values = [format({
            'type': 'string',
            'required': 'true'
          }, key)];
          for (var column in schema) {
            if (inputJson[key][column] || schema[column] && typeof schema[column] === 'string' && schema[column].split(' ').indexOf('key') > -1) {
              columns.push(column);
              values.push(format(schema[column], inputJson[key][column] || column));
            }
          }
          inserts.push(['INSERT INTO', tableName, '(', columns.join(','), ') VALUES (', values.join(','), ');'].join(' '));
        }
        fs.writeFile(outputFilename, inserts.join('\n'), function(err) {
          if (err) return console.log(err);
          console.log('done!');
        });
      });
    });
  };

toSql();
