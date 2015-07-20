/* globals $, App, devMode, L */
/* jshint camelcase: false */

var NPMap = {
  baseLayers: [
    (function() {
      if (App.park && App.park.mapbox_id) {
        return {
          icon: 'street',
          id: App.park.mapbox_id,
          name: 'Park Tiles Mobile',
          type: 'mapbox'
        };
      } else {
        return 'nps-parkTiles';
      }
    })(),
    'nps-parkTilesImagery'
  ],
  div: 'map-frame',
  hooks: {
    init: function(callback) {
      var bounds = new L.LatLngBounds(),
        data = NPMap.config.overlays[0].data;

      for (var i = 0; i < data.features.length; i++) {
        var geometry = data.features[i].geometry;

        if (geometry) {
          var coordinates = geometry.coordinates;

          bounds.extend(new L.LatLng(coordinates[1], coordinates[0]));
        }
      }

      NPMap.config.L.fitBounds(bounds);
      callback();
    }
  },
  overlays: [{
    popup: {
      actions: [{
        handler: function(data) {
          App.updateHash(App.park.unit_code + '/sites/' + data.cartodb_id);
        },
        text: 'Edit Site'
      }],
      description: '{{description}}',
      title: '{{name}}'
    },
    type: 'geojson'
  }],
  scrollWheelZoom: false
};

App.sites = (function() {
  function formatValue(value) {
    if (value === null) {
      return '<span class="text-danger">' + value + '</span>';
    } else {
      return value;
    }
  }

  return {
    init: function(callback) {
      if (App.id === null) {
        $('#button-create').click(function() {
          App.updateHash(App.park.unit_code + '/sites/create');
          return false;
        });
        $.ajax({
          data: {
            format: 'geojson',
            q: 'SELECT * FROM places_mobile_sites' + (devMode ? '_dev' : '') + '  WHERE unit_code = \'' + App.park.unit_code + '\' ORDER BY name'
          },
          dataType: 'json',
          success: function(data) {
            if (data && data.features && data.features.length) {
              var rows = '';

              $('#sites').show();
              NPMap.overlays[0].data = data;
              $.each(data.features, function(i, feature) {
                var properties = feature.properties;

                rows += '' +
                  '<tr id="' + properties.cartodb_id + '">' +
                    '<td>' + formatValue(properties.name) + '</td>' +
                    '<td>' +
                      '<div class="btn-group">' +
                        '<button class="btn btn-default" onclick="App.updateHash(\'' + App.park.unit_code + '/sites/' + properties.cartodb_id + '\');" title="Edit Site" type="button">' +
                          '<span class="fa fa-pencil"></span>' +
                        '</button>' +
                      '</div>' +
                    '</td>' +
                  '</tr>' +
                '';
              });
              $('tbody').html(rows);
              $($('a[data-toggle="tab"]')[1]).on('shown.bs.tab', function() {
                if (NPMap.config) {
                  NPMap.config.L.invalidateSize(false);
                } else {
                  var script = document.createElement('script');
                  script.src = 'http://www.nps.gov/lib/npmap.js/2.0.0/npmap-bootstrap.min.js';
                  document.body.appendChild(script);
                }
              });
              callback();
            } else {
              $('#empty').show();
              callback();
            }
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      }
    }
  };
})();
