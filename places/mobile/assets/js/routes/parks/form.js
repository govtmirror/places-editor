/* globals alertify, App, buildFieldHtml, buildInsertQuery, buildUpdateQuery, devMode, hideTab, isEmpty, L, moment, saveToCartoDb, setUpdated, user */
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
  div: 'map',
  editControl: {
    toolbar: false
  },
  events: [{
    fn: function(e) {
      App.parks.rectangle = e.layer;
      App.parks.clearMapError();
      $('.bounding-box-new').hide();
      $('.bounding-box-existing').show();
    },
    type: 'draw:created'
  }],
  geocoderControl: true,
  locateControl: true,
  scrollWheelZoom: false
};

App.parks = (function() {
  var fields = [{
    fieldType: 'text',
    form: '#details form',
    label: 'Name',
    name: 'name',
    required: true,
    type: 'string'
  },{
    fieldType: 'text',
    form: '#details form',
    label: 'Designation',
    name: 'designation',
    required: true,
    type: 'string'
  },{
    fieldType: 'text',
    form: '#details form',
    label: 'Unit Code',
    name: 'unit_code',
    required: true,
    type: 'string'
  },{
    fieldType: 'text',
    form: '#details form',
    label: 'States',
    name: 'states',
    required: true,
    type: 'string'
  },{
    fieldType: 'text',
    form: '#details form',
    label: 'Mapbox ID',
    name: 'mapbox_id',
    required: false,
    type: 'string'
  },{
    fieldType: 'textarea',
    form: '#details form',
    label: 'Description',
    name: 'description',
    required: false,
    type: 'string'
  },{
    clearError: function() {
      App.parks.clearMapError();
    },
    displayError: function() {
      $('#map').css({
        'border-color': '#a94442'
      });
    },
    fieldType: 'custom',
    form: '#bounding-box form',
    generate: function() {
      return '' +
        '<p class="bounding-box-existing">Click on the rectangle and use the handles to resize it.</p>' +
        '<p class="bounding-box-new">Pan and zoom the map to the park, then <a href="#" onclick="NPMap.config.L.editControl.activateMode(\'rectangle\');return false;">click here</a> and draw a rectangle that represents the park\'s extent.</p>' +
        '<div class="img-thumbnail" id="map"></div>' +
      '';
    },
    getValue: function() {
      if (App.parks.rectangle) {
        var latLngs = App.parks.rectangle.getLatLngs();

        return {
          'the_geom': 'ST_Polygon(ST_GeomFromText(\'LINESTRING(' + latLngs[0].lng + ' ' + latLngs[0].lat + ',' + latLngs[1].lng + ' ' + latLngs[1].lat + ',' + latLngs[2].lng + ' ' + latLngs[2].lat + ',' + latLngs[3].lng + ' ' + latLngs[3].lat + ',' + latLngs[0].lng + ' ' + latLngs[0].lat + ')\'),4326)'
        };
      } else if (App.park && App.park.geojson && App.park.geojson.geometry) {
        var coordinates = App.park.geojson.geometry.coordinates[0];

        return {
          'the_geom': 'ST_Polygon(ST_GeomFromText(\'LINESTRING(' + coordinates[0][0] + ' ' + coordinates[0][1] + ',' + coordinates[1][0] + ' ' + coordinates[1][1] + ',' + coordinates[2][0] + ' ' + coordinates[2][1] + ',' + coordinates[3][0] + ' ' + coordinates[3][1] + ',' + coordinates[4][0] + ' ' + coordinates[4][1] + ')\'),4326)'
        };
      } else {
        return null;
      }
    },
    label: 'Location',
    required: true,
    type: 'custom'
  }],
  park = null;

  function deletePark() {
    $('#delete').modal('hide');
    alertify.error('Sorry, but the delete functionality isn\'t ready yet.');
  }
  function save(e) {
    var data = {},
      errors = [],
      insert = false,
      query;

    function callback(response) {
      if (response && response.total_rows === 1) {
        // TODO: If mapbox_id is null, insert default.
        // TODO: Figure out what base services we want to make available to all parks
        if (insert) {
          var query = 'INSERT INTO places_mobile_categories' + (devMode ? '_dev' : '') + ' (created_by,display_order,name,unit_code,updated_by) VALUES ' +
            '(\'' + user.name + '\',0,\'Highlights\',\'' + data.unit_code + '\',\'' + user.name + '\'),' +
            '(\'' + user.name + '\',1,\'Favorites\',\'' + data.unit_code + '\',\'' + user.name + '\'),' +
            '(\'' + user.name + '\',2,\'Nearby\',\'' + data.unit_code + '\',\'' + user.name + '\')' +
          ';';

          saveToCartoDb(function(response) {
            if (response && response.total_rows) {
              saveToCartoDb(function(response) {
                if (response && response.total_rows === 1) {
                  alertify.success('The park was inserted successfully! The page will refresh now.');
                  setTimeout(function() {
                    App.updateHash(data.unit_code);
                  }, 2000);
                } else {
                  alertify.error('There was an error inserting the park.');
                }
              }, buildInsertQuery('places_mobile_urls', {
                base_url_icon: 'http://www.nps.gov/npmap/projects/places-mobile/icons/',
                base_url_media: 'http://www.nps.gov/npmap/projects/places-mobile/' + data.unit_code + '/media/',
                created_by: user.name,
                unit_code: data.unit_code,
                updated_by: user.name
              }));
            } else {
              alertify.error('There was an error inserting the park.');
            }
          }, query);
        } else {
          setUpdated(new Date());
          alertify.success('The park was updated successfully!');
          // TODO: If mapbox_id was changed, update the map.
        }
      } else {
        alertify.error('There was an error ' + (insert ? 'inserting' : 'updating') + ' the park.');
      }
    }

    $.each(fields, function(i, field) {
      if (field.form === '#bounding-box form' || field.form === '#details form') {
        var value;

        if (typeof field.clearError === 'function') {
          field.clearError();
        } else {
          $(field.form + ' #' + field.name).parent().removeClass('has-error');
        }

        if (typeof field.getValue === 'function') {
          value = field.getValue();

          if (field.required && !value) {
            errors.push(field);
          } else {
            $.extend(data, field.getValue());
          }
        } else {
          var name = field.name;

          value = $('#' + name).val();

          if (field.required && !value) {
            errors.push(field);
          } else {
            data[name] = $('#' + name).val();
          }
        }
      }
    });

    if (errors.length) {
      $.each(errors, function(i, field) {
        if (typeof field.displayError === 'function') {
          field.displayError();
        } else {
          $(field.form + ' #' + field.name).parent().addClass('has-error');
        }
      });
      alertify.error('One or more fields have errors. Please validate and try again.');
    } else {
      data.updated_by = user.name;

      if (!park || isEmpty(park.cartodb_id)) {
        data.created_by = user.name;
        data.map_thumbnail_zoom = 16;
        data.max_distance_in_meters = 1609.3;
      }

      if (!park || isEmpty(park.cartodb_id)) {
        insert = true;
        query = buildInsertQuery('places_mobile_parks', data);
      } else {
        query = buildUpdateQuery('places_mobile_parks', data, 'WHERE cartodb_id=' + park.cartodb_id);
      }

      saveToCartoDb(callback, query);
    }

    e.preventDefault();
  }
  function setupDom() {
    // Modals
    $('#button-metadata').click(function() {
      $('#modal-metadata').modal('show');
    });
    $('#modal-delete-park .btn-primary').click(function() {
      deletePark();
      $('#modal-delete-park').modal('hide');
    });
    // Top Buttons
    $('#button-delete').click(function(e) {
      e.preventDefault();
      $('#modal-delete-park').modal('show');
    });
    // Forms
    $('.buttons .btn-primary').click(save);
    // Details
    $('#states, #unit_code').on('inputchange', function() {
      var $this = $(this),
        value = $this.val();

      if (typeof value === 'string' && value.length) {
        $this.val(value.toLowerCase());
      }
    });
    // Location
    $($('a[data-toggle="tab"]')[1]).on('shown.bs.tab', function() {
      if (NPMap.config && NPMap.config.L) {
        NPMap.config.L.invalidateSize(false);
      } else {
        var script = document.createElement('script');
        script.src = 'http://www.nps.gov/lib/npmap.js/2.0.0/npmap-bootstrap.min.js';
        document.body.appendChild(script);
      }
    });
  }
  function setupMetadata() {
    var createdAt = moment(park.created_at);

    $('#metadata').append('' +
      '<p>Created by <em>' + park.created_by + '</em> on <em>' + createdAt.format('M/D/YYYY') + '</em> at <em>' + createdAt.format('h:mma') + '</em>. <span class="updated"></span></p>' +
    '');
    setUpdated(park.updated_at, park.updated_by);
  }

  return {
    rectangle: null,
    clearMapError: function() {
      $('#map').css({
        'border-color': '#ddd'
      });
    },
    init: function(callback) {
      $.each(fields, function(i, field) {
        $(field.form + ' .buttons').before(buildFieldHtml(field, i === 0));
      });
      setupDom();

      if (App.id) {
        $('#unit_code').attr('disabled', true);
        $.ajax({
          data: {
            format: 'geojson',
            q: 'SELECT * FROM places_mobile_parks' + (devMode ? '_dev' : '') + ' WHERE unit_code = \'' + App.id + '\''
          },
          dataType: 'json',
          success: function(data) {
            if (data && data.features) {
              var feature = data.features[0];

              NPMap.hooks = {
                init: function(callback) {
                  setTimeout(function() {
                    if (feature.geometry) {
                      var bounds = new L.LatLngBounds(),
                        map = NPMap.config.L;

                      $('.bounding-box-existing').show();
                      $.each(feature.geometry.coordinates[0], function(i, coordinate) {
                        bounds.extend(new L.LatLng(coordinate[1], coordinate[0]));
                      });

                      App.parks.rectangle = new L.Rectangle(bounds, NPMap.config.L.editControl.options.rectangle.shapeOptions).addTo(map.editControl._featureGroup);
                      map.fitBounds(bounds);
                    } else {
                      $('.bounding-box-new').show();
                    }

                    callback();
                  }, 300);
                }
              };
              park = feature.properties;
              $.each(fields, function(i, field) {
                if (typeof field.load === 'function') {
                  field.load(feature);
                } else {
                  $('#' + field.name).val(park[field.name]);
                }
              });
              setupMetadata();
            }

            callback();
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      } else {
        $('.bounding-box-new').show();
        callback();
      }
    }
  };
})();
