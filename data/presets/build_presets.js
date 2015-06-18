// Reads a CSV file of preset configuration data and builds a collection of preset JSON files
// This code is tightly coupled to the exact text in first line of CSV file.
// Input and output are relative to the script directory

// Dependencies:
//   npm install csv-parse
//   npm install mkdirp  # recursive mkdir that does not fail if directory exists

//Configuration variables
var csvFilename = 'presets.csv',
  presetFoldername = 'presets',

  csvParse = require('csv-parse'),
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  path = require('path'),

  csvPath = path.join(__dirname, csvFilename),
  presetPathRoot = path.join(__dirname, presetFoldername),
  makis = ['maki', 'npmaki'],

  parserOptions = {
    //see http://csv.adaltas.com/parse/ for additional parser options,
    columns: true // create objects with property names based on values in first row
  },
  parser = csvParse(parserOptions, function(err, presetList) {
    if (err) {
      console.log(err);
    } else {
      presetList.forEach(processPreset);
    }
  }),
  processPreset = function(preset) {
    try {
      var newPreset = {
        fields: makeFields(preset),
        geometry: makeGeometryList(preset),
        icon: makeIcon(preset),
        maki: makeMaki(preset),
        matchScore: parseFloat(preset.JSON_Matchscore),
        name: preset.Type,
        searchable: true,
        tags: JSON.parse(preset.OSM_Tag),
        terms: preset.JSON_Terms.slice(1, -1).replace(/"/g, '').split(',')
      };
      //remove empty properties
      Object.getOwnPropertyNames(newPreset).forEach(function(prop) {
        if (!newPreset[prop]) delete newPreset[prop];
      });

      // write new preset to file
      var presetFile = preset.Preset_Path + '.json',
        presetPath = path.join(presetPathRoot, presetFile),
        presetDir = path.dirname(presetPath),
        fileContent = JSON.stringify(newPreset, null, 4);
      mkdirp.sync(presetDir);
      fs.writeFile(presetPath, fileContent, function(err) {
        if (err) {
          return console.log(err);
        }
        console.log('Saved ' + presetFile);
      });
    } catch (e) {
      console.log('Unexpected exception');
      console.log(e);
      console.log('Processing preset');
      console.log(preset);
    }
  },
  makeFields = function(preset) {
    // Only adds presets that exist
    var requestedFields = preset.JSON_Fields.slice(1, -1).split(','),
      fieldsPath = './fields/';

    return requestedFields.filter(function(fieldName) {
      var returnValue = false,
        stats;
      try {
        stats = fs.statSync(fieldsPath + fieldName + '.json');
        if (stats && stats.isFile()) {
          returnValue = true;
        }
      } catch (e) {
        returnValue = false;
      }
      return returnValue;
    });
  },
  makeGeometryList = function(preset) {
    var list = [];
    if (preset.Point) list.push('point');
    if (preset.Line) list.push('line');
    if (preset.Poly) list.push('area');
    if (preset.Vertex) list.push('vertex');
    return list;
  },
  makeIcon = function(preset) {
    if (makis.indexOf(preset.JSON_Maki) >= 0) {
      if (preset.Point || preset.Vertex) return preset.JSON_Icon;
    }
      if (preset.Line) return preset.JSON_Icon_Line;
      if (preset.Poly) return preset.JSON_Icon_Poly || preset.JSON_Icon_Line;
    return null;
  },
  makeMaki = function(preset) {
    if (preset.Point || preset.Vertex) return makis.indexOf(preset.JSON_Maki) >= 0 ? preset.JSON_Maki : null;
    if (preset.Line) return preset.JSON_Maki_Line;
    if (preset.Poly) return preset.JSON_Maki_Poly || preset.JSON_Maki_Line;
    return null;
  };

fs.createReadStream(csvPath).pipe(parser);
