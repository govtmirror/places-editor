/* globals alertify, App, buildDeleteQuery, buildFieldHtml, buildInsertQuery, buildUpdateQuery, cartodb_id, devMode, isEmpty, L, moment, saveToCartoDb, setUpdated, setupInitialBounds, user */
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
      var latLng;

      App.events.marker = e.layer;
      latLng = App.events.marker.getLatLng();
      App.events.loadLatLng();
      App.events.setupMarkerHandlers();
      $('#latitude').val(latLng.lat.toFixed(6));
      $('#longitude').val(latLng.lng.toFixed(6));
    },
    type: 'draw:created'
  }],
  hooks: {},
  scrollWheelZoom: false
};

App.events = (function() {
  // TODO: Need to add dates and frequency (one of the two is valid for an event).
  var fields = [{
    fieldType: 'text',
    form: '#details form',
    label: 'Title',
    name: 'title',
    required: true,
    type: 'string'
  },{
    fieldType: 'text',
    form: '#details form',
    label: 'Home Description',
    name: 'home_description',
    required: true,
    type: 'string'
  },{
    fieldType: 'textarea',
    form: '#details form',
    label: 'Description',
    markdown: true,
    name: 'description',
    required: true,
    type: 'string'
  },{
    clearError: function() {
      if ($('.radio-dates').is(':checked')) {
        $('.dates').removeClass('has-error');
      } else {
        $('.frequency').removeClass('has-error');
      }
    },
    displayError: function() {
      if ($('.radio-dates').is(':checked')) {
        $('.dates').addClass('has-error');
      } else {
        $('.frequency').addClass('has-error');
      }
    },
    form: '#details form',
    generate: function() {
      return '' +
        '<div class="row">' +
          '<div class="col-lg-12 form-group">' +
            '<label>Type&nbsp;<span class="text-danger">*</span></label>' +
            '<div>' +
              '<label class="radio-inline"><input class="radio-dates" checked name="radioDatesFrequency" type="radio">Date(s)</label>' +
              '<label class="radio-inline"><input class="radio-frequency" name="radioDatesFrequency" type="radio">Frequency</label>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="col-lg-12 dates form-group">' +
            '<label for="dates">Date(s)&nbsp;<span class="text-danger">*</span></label>' +
            '<input class="form-control" id="dates" name="dates" required type="text">' +
          '</div>' +
          '<div class="col-lg-12 form-group frequency" style="display:none;">' +
            '<label>Frequency&nbsp;<span class="text-danger">*</span></label>' +
            '<div>' +
              '<label class="checkbox-inline"><input type="checkbox" value="Mon">Monday</label>' +
              '<label class="checkbox-inline"><input type="checkbox" value="Tue">Tuesday</label>' +
              '<label class="checkbox-inline"><input type="checkbox" value="Wed">Wednesday</label>' +
              '<label class="checkbox-inline"><input type="checkbox" value="Thur">Thursday</label>' +
              '<label class="checkbox-inline"><input type="checkbox" value="Fri">Friday</label>' +
              '<label class="checkbox-inline"><input type="checkbox" value="Sat">Saturday</label>' +
              '<label class="checkbox-inline"><input type="checkbox" value="Sun">Sunday</label>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '';
    },
    getValue: function() {
      var $dates = $('#dates'),
        value;

      if ($('.radio-dates').is(':checked')) {
        value = $dates.val();

        if (typeof value === 'string' && value.length) {
          return {
            dates: value,
            frequency: null
          };
        } else {
          return null;
        }
      } else {
        var values = [];

        $.each($('.frequency input'), function(i, input) {
          var $input = $(input);

          if ($input.is(':checked')) {
            values.push($input.val());
          }
        });

        if (values.length) {
          return {
            dates: null,
            frequency: values.join(',')
          };
        } else {
          return null;
        }
      }
    },
    load: function(feature) {
      var properties = feature.properties,
        dates = properties.dates,
        frequency = properties.frequency,
        $field;

      if (dates && typeof dates === 'string') {
        $field = $('#dates');
        dates = properties.dates.split(',');

        if ($.isArray(dates)) {
          var values = [];

          $.each(dates, function(i, date) {
            values.push(moment(date).format('YYYY-MM-DD'));
          });
          $field.datepicker('setDates', values);
        } else {
          $field.datepicker('setDate', moment(feature.properties.dates).format('YYYY-MM-DD'));
        }
      } else if (frequency && typeof frequency === 'string') {
        frequency = frequency.split(',');

        $.each($('.frequency input'), function(i, input) {
          var $input = $(input);

          if (frequency.indexOf($(input).val()) > -1) {
            $input.prop('checked', true);
          }
        });
        $('.dates').hide();
        $('.frequency').show();
        $($(':radio')[1]).prop('checked', true);
      }
    },
    required: true,
    type: 'custom'
  },{
    form: '#location form',
    generate: function() {
      return '' +
        '<div class="row">' +
          '<div class="col-lg-12 form-group" style="height:275px;">' +
            '<p class="existing">Drag the marker or use the form below the map to update the latitude and longitude.</p>' +
            '<p class="new">Pan and zoom the map, then <a href="#" onclick="NPMap.config.L.editControl.activateMode(\'marker\');return false;">click here</a> and click on the map to place the marker.</p>' +
            '<div class="img-thumbnail" id="map">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="col-lg-6 form-group">' +
            '<label for="location">Latitude&nbsp;<span class="text-danger">*</span></label>' +
            '<input class="form-control" id="latitude" max="90" min="-90" step="any" type="number">' +
          '</div>' +
          '<div class="col-lg-6 form-group">' +
            '<label for="longitude">Longitude&nbsp;<span class="text-danger">*</span></label>' +
            '<input class="form-control" id="longitude" max="180" min="-180" step="any" type="number">' +
          '</div>' +
        '</div>' +
      '';
    },
    getValue: function() {
      var lat = $('#latitude').val(),
        lng = $('#longitude').val();

      if (typeof lat === 'string' && lat.length && typeof lng === 'string' && lng.length) {
        return {
          'the_geom': 'ST_SetSRID(ST_Point(' + $('#longitude').val() + ',' + $('#latitude').val() + '),4326)'
        };
      } else {
        return null;
      }
    },
    load: function(feature) {
      if (feature.geometry && feature.geometry.coordinates) {
        var coordinates = feature.geometry.coordinates;

        App.events.loadLatLng();
        $('#latitude').val(coordinates[1]);
        $('#longitude').val(coordinates[0]);
      }
    },
    type: 'custom'
  }],
  objEvent = null;

  function deleteEvent() {
    $('#modal-delete').modal('hide');
    saveToCartoDb(function(data) {
      if (data && data.total_rows === 1) {
        alertify.success('The event was successfully deleted! Loading the events list now.');
        setTimeout(function() {
          App.updateHash(App.park.unit_code + '/events');
        }, 2000);
      } else {
        alertify.error('There was an error deleting the event.');
      }
    }, buildDeleteQuery('places_mobile_events', 'WHERE cartodb_id=' + objEvent.cartodb_id));
  }
  function saveEvent(e) {
    var data = {},
      errors = [];

    $.each(fields, function(i, field) {
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
      var insert = false,
        query;

      data.name = null;
      data.updated_by = user.name;

      if (!objEvent || isEmpty(objEvent.cartodb_id)) {
        data.created_by = user.name;
        data.unit_code = App.unitCode;
        insert = true;
        query = buildInsertQuery('places_mobile_events', data);
      } else {
        query = buildUpdateQuery('places_mobile_events', data, 'WHERE cartodb_id=' + objEvent.cartodb_id);
      }

      saveToCartoDb(function(data) {
        if (data && data.total_rows === 1) {
          if (insert) {
            alertify.success('The event was inserted successfully! The page will refresh now.');
            setTimeout(function() {
              App.updateHash(App.park.unit_code + '/events/' + data.rows[0].cartodb_id);
            }, 2000);
          } else {
            alertify.success('The event was successfully updated!');
            setUpdated(new Date());
          }
        } else {
          alertify.error('There was an error ' + (insert ? 'inserting' : 'updating') + ' the event.');
        }
      }, query);
    }

    e.preventDefault();
  }
  function setupDom() {
    // Tabs
    $($('a[data-toggle="tab"]')[1]).on('shown.bs.tab', function() {
      if (NPMap.config && NPMap.config.L) {
        NPMap.config.L.invalidateSize(false);
      } else {
        var script = document.createElement('script');
        script.src = 'http://www.nps.gov/lib/npmap.js/2.0.0/npmap-bootstrap.min.js';
        document.body.appendChild(script);
      }
    });
    // Modals
    $('#modal-delete .btn-primary').click(deleteEvent);
    // Forms
    $('#details .btn-primary, #location .btn-primary').click(saveEvent);
    // Details
    $('.radio-dates').change(function() {
      if ($(this).is(':checked')) {
        $('.frequency')
          .hide()
          .removeClass('has-error');
        $('.dates').show();
        $.each($('.frequency input'), function(i, input) {
          $(input).prop('checked', false);
        });
      }
    });
    $('.radio-frequency').change(function() {
      if ($(this).is(':checked')) {
        $('.dates')
          .hide()
          .removeClass('has-error');
        $('.frequency').show();
        $('#dates').datepicker('setDate', null);
      }
    });
    $('#dates').datepicker({
      format: 'yyyy-mm-dd',
      multidate: true,
      todayBtn: true,
      todayHighlight: true
    });
    $('.markdown').markdown({
      hiddenButtons: [
        'cmdImage',
        'cmdPreview'
      ],
      iconlibrary: 'fa',
      resize: 'vertical'
    });
    // Location
    $('#latitude, #longitude').on('inputchange', function() {
      var $lat = $('#latitude'),
        $lng = $('#longitude'),
        lat = $lat.val(),
        lng = $lng.val();

      if (lat) {
        //lat = parseFloat(lat).toFixed(6);
        //$lat.val(lat);
        $lat.parent().removeClass('has-error');
      }

      if (lng) {
        //lng = parseFloat(lng).toFixed(6);
        //$lng.val(lng);
        $lng.parent().removeClass('has-error');
      }

      if (lat && lng) {
        var latLng = {
          lat: lat,
          lng: lng
        };

        if (App.events.marker) {
          App.events.marker.setLatLng(latLng);
        } else if (typeof L !== 'undefined') {
          App.events.createMarker(latLng);
          App.events.loadLatLng();
          App.events.setupMarkerHandlers();
        }

        if (typeof L !== 'undefined') {
          NPMap.config.L.setView(latLng);
        }
      }
    });
  }
  function setupMetadata() {
    var createdAt = moment(objEvent.created_at);

    $('#metadata').append('' +
      '<p>Created by <em>' + objEvent.created_by + '</em> on <em>' + createdAt.format('M/D/YYYY') + '</em> at <em>' + createdAt.format('h:mma') + '</em>. <span class="updated"></span></p>' +
    '');
    setUpdated(objEvent.updated_at, objEvent.updated_by);
  }

  return {
    deleteCartoDbId: null,
    marker: null,
    createMarker: function(latLng) {
      App.events.marker = new L.Marker(latLng, L.extend({
        draggable: true
      }, NPMap.config.L.editControl.options.marker)).addTo(NPMap.config.L);
    },
    init: function(callback) {
      $.each(fields, function(i, field) {
        $(field.form + ' .buttons').before(buildFieldHtml(field, i === 0));
      });
      setupDom();

      if (App.id === 'create') {
        $('.action-buttons').hide();
        NPMap.hooks.init = function(callback) {
          setupInitialBounds(true);
          callback();
        };
        callback();
      } else {
        $.ajax({
          data: {
            format: 'geojson',
            q: 'SELECT * FROM places_mobile_events' + (devMode ? '_dev' : '') + ' WHERE cartodb_id = ' + App.id
          },
          dataType: 'json',
          success: function(data) {
            if (data && data.features) {
              var feature = data.features[0],
                coordinates;

              objEvent = feature.properties;
              $.each(fields, function(i, field) {
                if (typeof field.load === 'function') {
                  field.load(feature);
                } else {
                  $('#' + field.name).val(objEvent[field.name]);
                }
              });
              setupMetadata();

              if (feature.geometry && feature.geometry.coordinates) {
                var latLng = {};

                coordinates = feature.geometry.coordinates;
                latLng.lat = coordinates[1];
                latLng.lng = coordinates[0];
                NPMap.center = latLng;
                NPMap.hooks.init = function(ok) {
                  App.events.createMarker(latLng);
                  App.events.setupMarkerHandlers();
                  setupInitialBounds();
                  ok();
                };
                NPMap.zoom = 19;
              } else {
                NPMap.hooks.init = function(callback) {
                  setupInitialBounds(true);
                  callback();
                };
              }
            }
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      }

      callback();
    },
    loadLatLng: function() {
      $('#location .new').hide();
      $('#location .existing').show();
    },
    setupMarkerHandlers: function() {
      App.events.marker.on('dragend', function(e) {
        var latLng = e.target.getLatLng();

        $('#latitude').val(latLng.lat.toFixed(6));
        $('#longitude').val(latLng.lng.toFixed(6));
      });
    }
  };
})();
