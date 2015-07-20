/* globals App, devMode */
/* jshint camelcase: false */

App.events = (function() {
  var $tbody = $('tbody');

  function alphabetize(arr, property) {
    arr.sort(function(a, b) {
      if (a[property] < b[property]) {
        return -1;
      }

      if (a[property] > b[property]) {
        return 1;
      }

      return 0;
    });

    return arr;
  }
  function appendRow(properties) {
    $tbody.append('' +
      '<tr id="' + properties.cartodb_id + '">' +
        '<td>' + properties.title + '</td>' +
        '<td>' + (properties.dates ? properties.dates : properties.frequency) + '</td>' +
        '<td>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="App.updateHash(\'' + App.park.unit_code + '/events/' + properties.cartodb_id + '\');" title="Edit Event" type="button">' +
              '<span class="fa fa-pencil"></span>' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>' +
    '');
  }

  return {
    init: function(callback) {
      $('.action-buttons .btn-default').click(function() {
        App.updateHash(App.park.unit_code + '/events/create');
        return false;
      });
      $.ajax({
        data: {
          format: 'geojson',
          q: 'SELECT * FROM places_mobile_events' + (devMode ? '_dev' : '') + ' WHERE unit_code = \'' + App.park.unit_code + '\''
        },
        dataType: 'json',
        success: function(data) {
          if (data && data.features && data.features.length) {
            var dates = [],
              frequency = [];

            $.each(data.features, function(i, feature) {
              var properties = feature.properties;

              if (properties.dates) {
                dates.push(properties);
              } else {
                frequency.push(properties);
              }
            });
            frequency = alphabetize(frequency, 'frequency');
            $.each(frequency, function(i, event) {
              appendRow(event);
            });
            dates = alphabetize(dates, 'frequency');
            $.each(dates, function(i, event) {
              appendRow(event);
            });
            $('#events').show();
          } else {
            $('#empty').show();
          }

          callback();
        },
        url: 'https://nps.cartodb.com/api/v2/sql'
      });
    }
  };
})();
