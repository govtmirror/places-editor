/* globals alertify, App, buildDeleteQuery, buildFieldHtml, buildInsertQuery, buildUpdateQuery, devMode, hideProgress, hideTab,isEmpty, L, moment, preload, saveToCartoDb, setUpdated, setupInitialBounds, showProgress, setProgress, user */
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

      App.sites.marker = e.layer;
      latLng = App.sites.marker.getLatLng();
      App.sites.createCircle(latLng);
      App.sites.loadLatLng();
      App.sites.setupMarkerHandlers();
      $('#latitude').val(latLng.lat.toFixed(6));
      $('#longitude').val(latLng.lng.toFixed(6));
    },
    type: 'draw:created'
  }],
  hooks: {},
  scrollWheelZoom: false
};

App.sites = (function() {
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
    helpText: 'Suggested max length: 100 characters.',
    label: 'Name Descriptor',
    name: 'name_description',
    required: false,
    type: 'string'
  },{
    fieldType: 'text',
    form: '#details form',
    label: 'Type',
    name: 'type',
    required: false,
    type: 'string'
  },{
    checkboxes: [],
    fieldType: 'checkboxgroup',
    form: '#details form',
    getValue: function() {
      var value = '';

      $.each(this.checkboxes, function(i, checkbox) {
        if ($('#services-' + checkbox.value).prop('checked')) {
          value += checkbox.value + ',';
        }
      });

      if (value.length) {
        return {
          services: value.slice(0, value.length - 1)
        };
      } else {
        return null;
      }
    },
    label: 'Services',
    load: function(feature) {
      var services = feature.properties.services;

      if (services) {
        var split = services.split(',');

        if (split.length) {
          $.each(split, function(i, id) {
            $('#services-' + id).prop('checked', true);
          });
        }
      }
    },
    name: 'services',
    required: false,
    type: 'string'
  },{
    fieldType: 'textarea',
    form: '#details form',
    helpText: 'Suggested max length: 200 words.',
    label: 'Description',
    markdown: true,
    name: 'description',
    required: false,
    type: 'string'
  },{
    fieldType: 'textarea',
    form: '#details form',
    label: 'Audio Description',
    name: 'audio_description',
    required: false,
    type: 'string'
  },{
    clearError: function() {
      App.sites.clearMapError();
    },
    displayError: function() {
      var $lat = $('#latitude'),
        $lng = $('#longitude'),
        lat = $lat.val(),
        lng = $lng.val();

      $('#map').css({
        'border-color': '#a94442'
      });

      if (typeof lat !== 'string' || !lat.length) {
        $lat.parent().addClass('has-error');
      }

      if (typeof lng !== 'string' || !lng.length) {
        $lng.parent().addClass('has-error');
      }
    },
    fieldType: 'custom',
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
    label: 'Location',
    load: function(feature) {
      if (feature.geometry) {
        var coordinates = feature.geometry.coordinates,
          latLng = {
            lat: coordinates[1],
            lng: coordinates[0]
          };

        App.sites.loadLatLng();
        $('#latitude').val(latLng.lat);
        $('#longitude').val(latLng.lng);
      }
    },
    name: 'the_geom',
    required: true,
    type: 'custom'
  },{
    fieldType: 'number',
    form: '#location form',
    getValue: function() {
      return {
        'geofence_buffer_in_meters': $('#geofence_buffer_in_meters').val() / 3.28084
      };
    },
    helpText: 'The radius, in feet, of the buffer used for this site when geofencing is turned on. Displayed on the map above.',
    hidden: true,
    label: 'Geofence Buffer',
    load: function(feature) {
      $('#geofence_buffer_in_meters').val(parseFloat(feature.properties.geofence_buffer_in_meters) * 3.28084);
    },
    min: 0,
    name: 'geofence_buffer_in_meters',
    required: true,
    step: 'any',
    type: 'number'
  }],
  mediaStored = {},
  preloads = [{
    name: 'categories',
    query: 'SELECT * FROM places_mobile_categories' + (devMode ? '_dev' : '') + ' WHERE unit_code = \'' + App.park.unit_code + '\' ORDER BY name'
  },{
    name: 'services',
    query: 'SELECT * FROM places_mobile_services' + (devMode ? '_dev' : '') + ' WHERE unit_code = \'' + App.park.unit_code + '\' ORDER BY description'
  },{
    name: 'tours',
    query: 'SELECT * FROM places_mobile_tours' + (devMode ? '_dev' : '') + ' WHERE unit_code = \'' + App.park.unit_code + '\' ORDER BY name'
  }],
  site = null;

  function addCheckboxes(name, labelField) {
    if (preloads[name]) {
      $.each(preloads[name], function(i, a) {
        var b;

        $.each(fields, function(i, field) {
          if (field.name === name) {
            b = field;
          }
        });
        b.checkboxes.push({
          label: a[labelField],
          value: a.cartodb_id
        });
      });
    }
  }
  function appendMediaThumbnail(data) {
    var $row = $('#media .images .row'),
      $div = $('' +
        '<div class="col-md-4 col-sm-6 col-xs-12">' +
          '<div class="wrapper">' +
            '<img class="img-responsive img-thumbnail" id="media-' + data.cartodb_id + '" src="' + App.urls[site.unit_code].base_url_media + data.image_480 + '">' +
            '<div class="order"># ' + ($row.children('.col-md-4').length + 1) + '</div>' +
          '</div>' +
          (function() {
            if (data.caption) {
              return '<p>' + data.caption + '</p>';
            } else {
              return '<p></p>';
            }
          })() +
        '</div>' +
        '<div class="clear"></div>' +
      '');

    $row.append($div);
    $div.children('.wrapper').click(function() {
      App.sites.mediaEdit = mediaStored[$($(this).children()[0]).attr('id').replace('media-', '')];
      $('#modal-media .media-preview').html('<img class="img-responsive img-thumbnail" src="' + App.urls[site.unit_code].base_url_media + App.sites.mediaEdit.image_350 + '">');
      $('#media-alt').val(App.sites.mediaEdit.alt);
      $('#media-caption').val(App.sites.mediaEdit.caption);
      $('#media-upload').hide();
      $('#modal-media .modal-title').html('Edit Image');
      $('#modal-media').modal('show');
    });
    $('#media .empty').hide();
    $('#media .images').show();
  }
  function loadChildren(callback) {
    var completed = 0,
      count = 0,
      interval, query;

    if (typeof site.information === 'string' && site.information.length) {
      var information = site.information.split(',');

      if (information.length) {
        count++;
        query = 'SELECT * FROM places_mobile_information' + (devMode ? '_dev' : '') + ' WHERE ';

        if (information.length < 2) {
          $('#information .btn-primary').hide();
        }

        $('#information .empty').hide();
        $('#information .table').show();
        $.each(information, function(i, info) {
          query += 'cartodb_id=' + info + ' OR ';
        });
        query = query.slice(0, query.length - 4);
        $.ajax({
          data: {
            q: query
          },
          dataType: 'json',
          success: function(data) {
            if (data && data.total_rows) {
              var ordered = [];

              $.each(information, function(i, cartodbId) {
                for (var j = 0; j < data.rows.length; j++) {
                  var row = data.rows[j];

                  if (row.cartodb_id === parseInt(cartodbId, 10)) {
                    ordered.push(row);
                    break;
                  }
                }
              });
              $.each(ordered, function(i, row) {
                $('#information tbody').append('' +
                  '<tr id="information-section-' + row.cartodb_id + '">' +
                    '<td>' + row.name + '</td>' +
                    '<td>' +
                      '<div class="btn-group">' +
                        '<button class="btn btn-default edit" onclick="App.sites.handleEditSection(this);return false;" type="button">' +
                          '<span class="fa fa-pencil"></span>' +
                        '</button>' +
                        '<button class="btn btn-danger delete" onclick="App.sites.handleDeleteSection(this);return false;" type="button">' +
                          '<span class="fa fa-trash"></span>' +
                        '</button>' +
                      '</div>' +
                    '</td>' +
                  '</tr>' +
                '');
              });
              $('#information tbody .btn').on('mousedown', function(e) {
                e.stopPropagation();
              });
            }

            completed++;
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      } else {
        $('#information .btn-primary').hide();
        $('#information .table').hide();
        $('#information .empty').show();
      }
    } else {
      $('#information .btn-primary').hide();
      $('#information .table').hide();
      $('#information .empty').show();
    }

    if (typeof site.media === 'string' && site.media.length) {
      var media = site.media.split(',');

      if (media.length) {
        count++;
        query = 'SELECT * FROM places_mobile_media' + (devMode ? '_dev' : '') + ' WHERE type=\'image\' AND (';
        $.each(media, function(i, asset) {
          query += 'cartodb_id=' + asset + ' OR ';
        });
        query = query.slice(0, query.length - 4) + ')';
        $.ajax({
          data: {
            q: query
          },
          dataType: 'json',
          success: function(data) {
            if (data && data.total_rows) {
              var ordered = [];

              $.each(media, function(i, cartodbId) {
                for (var j = 0; j < data.rows.length; j++) {
                  var row = data.rows[j];

                  mediaStored[row.cartodb_id] = row;

                  if (row.cartodb_id === parseInt(cartodbId, 10)) {
                    ordered.push(row);
                    break;
                  }
                }
              });
              $.each(ordered, function(i, row) {
                appendMediaThumbnail(row);
              });
              $('#media .images').show();
            } else {
              $('#media .empty').show();
            }

            completed++;
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      } else {
        $('#media .empty').show();
      }
    } else {
      $('#media .empty').show();
    }

    interval = setInterval(function() {
      if (completed === count) {
        clearInterval(interval);
        callback();
      }
    }, 100);
  }
  function reorderMedia(callback) {
    var media = [];

    $('.clear').remove();
    $('#media .images .row .col-md-4').each(function(i, div) {
      var $div = $(div),
        $img = $($($div.children()[0]).children()[0]),
        $span = $($($div.children()[0]).children()[1]);

      media.push($img.attr('id').replace('media-', ''));
      $div.after('<div class="clear"></div>');
      $span.html('# ' + (i + 1));
    });
    site.media = media.join(',');
    saveToCartoDb(function() {
      if (callback) {
        callback();
      } else {
        alertify.success('The image order was successfully saved!');
      }
    }, buildUpdateQuery('places_mobile_sites', {
      media: site.media,
      updated_by: user.name
    }, 'WHERE cartodb_id=' + site.cartodb_id));
  }
  function save(e) {
    var data = {},
      errors = [],
      insert, query;

    $.each(fields, function(i, field) {
      if (field.form === '#details form' || field.form === '#location form') {
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
      $('#details .buttons .btn-primary, #location .buttons .btn-primary')
        .text('Saving...')
        .attr('disabled', true);

      data.updated_by = user.name;

      if (!site || isEmpty(site.cartodb_id)) {
        data.created_by = user.name;
        data.map_thumbnail_image = null;
        data.media = null;
        data.primary_audio = null;
        data.primary_image = null;
        data.unit_code = App.unitCode;
        insert = true;
        query = buildInsertQuery('places_mobile_sites', data);
      } else {
        insert = false;
        query = buildUpdateQuery('places_mobile_sites', data, 'WHERE cartodb_id=' + site.cartodb_id);
      }

      saveToCartoDb(function(data) {
        if (data && data.total_rows === 1) {
          if (insert) {
            site = {
              cartodb_id: data.rows[0].cartodb_id
            };
            data = {
              created_by: user.name,
              image_thumbnail_1x: site.cartodb_id + '_thumbnail.png',
              image_thumbnail_2x: site.cartodb_id + '_thumbnail@2x.png',
              image_thumbnail_3x: site.cartodb_id + '_thumbnail@3x.png',
              original_url: site.cartodb_id + '.png',
              relative_url: site.cartodb_id + '.png',
              relative_url_2x: site.cartodb_id + '@2x.png',
              relative_url_tablet: site.cartodb_id + '_tablet.png',
              relative_url_tablet_2x: site.cartodb_id + '_tablet@2x.png',
              type: 'map_thumbnail',
              unit_code: App.park.unit_code,
              updated_by: user.name
            };

            saveToCartoDb(function(data) {
              if (data && data.total_rows === 1) {
                data = {
                  map_thumbnail_image: data.rows[0].cartodb_id
                };

                saveToCartoDb(function(data) {
                  if (data && data.total_rows === 1) {
                    $.ajax({
                      success: function(response) {
                        if (response.taskName) {
                          alertify.success('The site was inserted successfully! The page will refresh now.');
                          setTimeout(function() {
                            App.updateHash(App.park.unit_code + '/' + App.entity.toLowerCase() + '/' + site.cartodb_id);
                          }, 2000);
                        } else {
                          alertify.error('There was an error inserting the site.');
                        }
                      },
                      url: 'http://10.147.153.192:3001/api/generate/thumbnails/' + App.park.unit_code + '/' + site.cartodb_id
                    });
                  } else {
                    alertify.error('There was an error inserting the site.');
                  }
                }, buildUpdateQuery('places_mobile_sites', data, 'WHERE cartodb_id=' + site.cartodb_id));
              } else {
                alertify.error('There was an error inserting the site.');
              }
            }, buildInsertQuery('places_mobile_media', data));
          } else {
            $.ajax({
              success: function(response) {
                if (response.taskName) {
                  alertify.success('The site was successfully updated!');
                  setUpdated(new Date());
                } else {
                  alertify.error('There was an error updating the site.');
                }

                $('#details .buttons .btn-primary, #location .buttons .btn-primary')
                  .text('Save')
                  .attr('disabled', false);
              },
              url: 'http://10.147.153.192:3001/api/generate/thumbnails/' + App.park.unit_code + '/' + site.cartodb_id
            });
          }
        } else {
          alertify.error('There was an error ' + (insert ? 'inserting' : 'updating') + ' the site.');
          $('#details .buttons .btn-primary, #location .buttons .btn-primary')
            .text('Save')
            .attr('disabled', false);
        }
      }, query);
    }

    e.preventDefault();
  }
  function saveSectionOrder() {
    var data = {
        updated_by: user.name
      },
      sites = [];

    $.each($('#information tbody tr'), function(i, row) {
      sites.push($(row).attr('id').replace('information-section-', ''));
    });
    data.information = sites.join(',');
    saveToCartoDb(function() {
      alertify.success('The section order was successfully saved!');
    }, buildUpdateQuery('places_mobile_sites', data, 'WHERE cartodb_id=' + site.cartodb_id));
  }
  function setupDom() {
    // Base
    $('.action-buttons .btn-danger')
      .popover({
        container: 'body',
        content: '' +
          '<p>Click "Delete" to confirm. Once deleted, you cannot get this site back.</p>' +
          '<div style="text-align:center;">' +
            '<button class="btn btn-default" onclick="$(\'.action-buttons .btn-danger\').popover(\'hide\');return false;" style="margin-right:5px;" type="button">Cancel</button>' +
            '<button class="btn btn-primary" onclick="$(\'.action-buttons .btn-danger\').popover(\'hide\');App.sites.handleDeleteSite(this);return false;" type="button">Delete</button></div>' +
          '</div>' +
        '',
        html: true,
        placement: 'top',
        trigger: 'manual'
      })
      .on('hidden.bs.popover', function() {
        $('body .delete-site-backdrop').remove();
      })
      .on('shown.bs.popover', function() {
        $('body').append('<div class="delete-site-backdrop in modal-backdrop" style="z-index:1059;"></div>');
      });
    $('.action-buttons .btn-danger').click(function() {
      $(this).popover('show');
    });
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
    //$('#modal-delete-site .btn-primary').click(deleteSite);
    $('#media-file').fileinput({
      allowedExtensions: [
        'jpg'
      ],
      browseIcon: '<i class="fa fa-folder-open" style="margin-right:5px;"></i>',
      previewFileIcon: '<i class="fa fa-file" style="margin-right:5px;"></i>',
      removeIcon: '<i class="fa fa-trash" style="margin-right:5px;"></i>',
      showPreview: false,
      showRemove: false,
      showUpload: false
    });
    $('#modal-media .modal-footer .btn-primary').click(function() {
      var errored = false,
        uuid = null,
        values = {};

      $.each($('#modal-media .fields input'), function(i, input) {
        var $input = $(input),
          name = $input.attr('id').replace('media-', ''),
          value = $input.val();

        if (value) {
          values[name] = value;
          $input.parent().removeClass('has-error');
        } else if (name !== 'caption') {
          $input.parent().addClass('has-error');
          errored = true;
        }
      });

      if ($('#media-upload').is(':visible')) {
        var $mediaFile = $('#media-file'),
          $parent = $mediaFile.parent().parent().parent().parent().parent();

        if ($mediaFile.val()) {
          $parent.removeClass('has-error');

          if (!errored) {
            showProgress();
            setProgress(10);
            $.ajax({
              cache: false,
              contentType: false,
              data: new FormData($('#media-upload')[0]),
              error: function() {
                setProgress(100);
                hideProgress();
                alertify.error('There was an error uploading the image.');
              },
              processData: false,
              type: 'POST',
              success: function(response) {
                if (response && response.uuid) {
                  var extension = '.jpg';

                  setProgress(50);
                  uuid = response.uuid;
                  $.extend(values, {
                    created_by: user.name,
                    image_1080: uuid + '_image_1080' + extension,
                    image_1536: uuid + '_image_1536' + extension,
                    image_350: uuid + '_image_350' + extension,
                    image_480: uuid + '_image_480' + extension,
                    image_640: uuid + '_image_640' + extension,
                    image_768: uuid + '_image_768' + extension,
                    image_960: uuid + '_image_960' + extension,
                    relative_url: uuid + extension,
                    relative_url_2x: uuid + '@2x' + extension,
                    relative_url_tablet: uuid + '_tablet' + extension,
                    relative_url_tablet_2x: uuid + '_tablet@2x' + extension,
                    type: 'image',
                    unit_code: App.park.unit_code,
                    updated_by: user.name
                  });
                  saveToCartoDb(function(data) {
                    if (data && data.rows && data.rows[0]) {
                      var cartodbIdMedia = data.rows[0].cartodb_id,
                        media = (site.media ? (site.media + ',' + cartodbIdMedia) : cartodbIdMedia.toString());

                      saveToCartoDb(function(data) {
                        if (data && data.total_rows === 1) {
                          site.media = media;
                          $('#modal-media').modal('hide');
                          alertify.success('The image was uploaded successfully!');
                          values.cartodb_id = cartodbIdMedia;
                          mediaStored[cartodbIdMedia] = values;
                          appendMediaThumbnail(mediaStored[cartodbIdMedia]);
                        } else {
                          alertify.error('There was an error uploading the image.');
                        }

                        setProgress(100);
                        hideProgress();
                      }, buildUpdateQuery('places_mobile_sites', {
                        media: media
                      }, 'WHERE cartodb_id=' + site.cartodb_id));
                    } else {
                      setProgress(100);
                      hideProgress();
                      alertify.error('There was an error uploading the image.');
                    }
                  }, buildInsertQuery('places_mobile_media', values));
                } else {
                  setProgress(100);
                  hideProgress();
                  alertify.error('There was an error uploading the image.');
                }
              },
              url: 'http://10.147.153.192:3001/api/image'
            });
          }
        } else {
          $parent.addClass('has-error');
        }
      } else if (!errored) {
        var cartodb_id = App.sites.mediaEdit.cartodb_id;

        saveToCartoDb(function(data) {
          if (data && data.total_rows === 1) {
            var update = null;

            if (values.caption) {
              update = values.caption;
            }

            $('#media-' + cartodb_id).parent().next().html(update);
            $('#modal-media').modal('hide');
            alertify.success('The image was updated successfully!');
            $.each(values, function(prop, value) {
              mediaStored[cartodb_id][prop] = value;
            });
          } else {
            alertify.error('There was an error updating the image.');
          }
        }, buildUpdateQuery('places_mobile_media', values, 'WHERE cartodb_id=' + cartodb_id));
      }
    });
    $('#modal-media').on('hidden.bs.modal', function() {
      $.each($('#modal-media .fields input'), function(i, input) {
        $(input)
          .val(null)
          .parent().removeClass('has-error');
      });
      $('#modal-media .btn-danger').show();
      $('#media-upload').show();
      $('#modal-media .media-preview').show();
    });
    $('#modal-media .btn-danger').click(function() {
      $(this).popover('show');
    });
    $('#unitCode').val(App.park.unit_code);
    // Forms
    $('#details .btn-primary, #location .btn-primary').click(save);
    // Details
    $('.markdown').markdown({
      hiddenButtons: [
        'cmdImage',
        'cmdPreview'
      ],
      iconlibrary: 'fa',
      resize: 'vertical'
    });
    // Location
    $('#geofence_buffer_in_meters').on('inputchange', function() {
      var $this = $(this),
        $parent = $this.parent(),
        buffer = parseFloat($this.val());

      if (isNaN(buffer)) {
        $parent.addClass('has-error');
      } else {
        $parent.removeClass('has-error');

        if (App.sites.circle) {
          App.sites.circle.setRadius($this.val() / 3.28084);
        }
      }
    });
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

        if (App.sites.marker) {
          App.sites.marker.setLatLng(latLng);
        } else if (typeof L !== 'undefined') {
          App.sites.createMarker(latLng);
          App.sites.createCircle(latLng);
          App.sites.loadLatLng();
          App.sites.setupMarkerHandlers();
        }

        if (typeof L !== 'undefined') {
          NPMap.config.L.setView(latLng);
        }
      }
    });
    // Information
    $($('#information .information-buttons .btn-default')[0]).click(function() {
      $('#modal-section .modal-title').html('Create Section');
      $('#modal-section').modal('show');
    });
    $('#information .table').sortable({
      containerSelector: 'table',
      itemPath: '> tbody',
      itemSelector: 'tr',
      placeholder: '<tr class="placeholder"/>',
      onDragStart: function(item, group, _super) {
        var $item = $(item);

        $item.parent().parent().removeClass('table-striped');
        $item.css('background-color', '#f9f9f9');
        $($item.children('td')[1]).hide();
        _super(item);
      },
      onDrop: function(item, container, _super) {
        var $item = $(item);

        $item.css('background-color', '');
        $item.parent().parent().addClass('table-striped');
        $($item.children('td')[1]).show();
        _super(item);
        saveSectionOrder();
      }
    });
    $('#modal-section')
      .on('hidden.bs.modal', function() {
        $('#information-description')
          .val(null)
          .parent().removeClass('has-error');
        $('#information-name')
          .val(null)
          .parent().removeClass('has-error');
        App.sites.sectionEditId = null;
      })
      .on('shown.bs.modal', function() {
        $('#information-name').focus();
      });
    $('#modal-section .btn-primary').click(function() {
      var $description = $('#information-description'),
        $name = $('#information-name'),
        description = $description.val(),
        errors = [],
        name = $('#information-name').val();

      if (isEmpty(name)) {
        errors.push($name);
      }

      if (isEmpty(description)) {
        errors.push($description);
      }

      if (errors.length) {
        $.each(errors, function(i, $field) {
          var $parent = $($field.parent());

          if (!$parent.hasClass('has-error')) {
            $parent.addClass('has-error');
          }
        });
      } else {
        var data = {
          description: description,
          name: name,
          updated_by: user.name
        }, insert, query;

        if (isEmpty(App.sites.sectionEditId)) {
          data.created_by = user.name;
          data.unit_code = site.unit_code;
          insert = true;
          query = buildInsertQuery('places_mobile_information', data);
        } else {
          insert = false;
          query = buildUpdateQuery('places_mobile_information', data, 'WHERE cartodb_id = ' + App.sites.sectionEditId);
        }

        saveToCartoDb(function(data) {
          if (data && data.total_rows === 1) {
            var rows = $('#information tbody tr');

            if (insert) {
              var cartodbId = data.rows[0].cartodb_id;

              $('#information tbody').append('' +
                '<tr id="information-section-' + cartodbId + '">' +
                  '<td>' + name + '</td>' +
                  '<td>' +
                    '<div class="btn-group">' +
                      '<button class="btn btn-default" onclick="App.sites.handleEditSection(this);return false;" type="button">' +
                        '<span class="fa fa-pencil"></span>' +
                      '</button>' +
                      '<button class="btn btn-danger delete" onclick="App.sites.handleDeleteSection(this);return false;" type="button">' +
                        '<span class="fa fa-trash"></span>' +
                      '</button>' +
                    '</div>' +
                  '</td>' +
                '</tr>' +
              '');
              saveSectionOrder();
              $('#information-section-' + cartodbId + ' .btn').on('mousedown', function(e) {
                e.stopPropagation();
              });

              if ((rows.length + 1) > 1) {
                $('#information .btn-primary').show();
              }

              $('#information .empty').hide();
              $('#information .table').show();
              alertify.success('The section was created successfully!');
              $('#modal-section').modal('hide');
            } else {
              for (var i = 0; i < rows.length; i++) {
                var $row = $(rows[i]);

                if ($row.attr('id').replace('information-section-', '') === App.sites.sectionEditId.toString()) {
                  $($row.children('td')[0]).html(name);
                  break;
                }
              }

              alertify.success('The section was successfully updated!');
              $('#modal-section').modal('hide');
            }
          } else {
            alertify.error('There was an error ' + (insert ? 'inserting' : 'updating') + ' the section.');
          }
        }, query);
      }
    });
    // Media
    $('#media .images .row').sortable({
      containerSelector: '.row',
      itemSelector: '.col-md-4',
      placeholder: '' +
        '<div class="col-md-4 col-sm-6 col-xs-12 placeholder">' +
          '<div class="img-thumbnail" style="background-color:#e0e0e0;height:308px;width:240px;"</div>' +
        '</div>' +
        '<div class="clear"></div>' +
      '',
      tolerance: -10,
      onDrop: function(item, container, _super) {
        _super(item);
        reorderMedia();
      }
    });
    $($('#media .information-buttons .btn-default')[0]).click(function() {
      $('#modal-media .modal-title').html('Upload Image');
      $('#modal-media .media-preview').hide();
      $('#media-upload').show();
      $('#modal-media').modal('show');
      $('#modal-media .btn-danger').hide();
    });
    $('#modal-media .btn-danger')
      .popover({
        container: 'body',
        content: '' +
          '<p>Click "Delete" to confirm. Once deleted, you cannot get this image back.</p>' +
          '<div style="text-align:center;">' +
            '<button class="btn btn-default" onclick="$(\'#modal-media .btn-danger\').popover(\'hide\');return false;" style="margin-right:5px;" type="button">Cancel</button>' +
            '<button class="btn btn-primary" onclick="App.sites.handleDeleteImage(this);return false;" type="button">Delete</button></div>' +
          '</div>' +
        '',
        html: true,
        placement: 'top',
        trigger: 'manual'
      })
      .on('hidden.bs.popover', function() {
        $('#modal-media .delete-backdrop').remove();
      })
      .on('shown.bs.popover', function() {
        $('#modal-media').append('<div class="delete-backdrop in modal-backdrop"></div>');
      });
    $('#modal-media .btn-danger').click(function() {
      $(this).popover('show');
    });
  }
  function setupMetadata() {
    var createdAt = moment(site.created_at);

    function generateList(entity) {
      var html = '<ul>';

      if (preloads[entity]) {
        $.each(preloads[entity], function(i, e) {
          var sites = e.sites;

          if (sites && sites.length) {
            var split = sites.split(',');

            if (split.indexOf(site.cartodb_id.toString()) !== -1) {
              html += '' +
                '<li><a href="#" onclick="App.updateHash(\'' + App.park.unit_code + '/categories/' + e.cartodb_id + '\');return false;">' + e.name  + '</a></li>' +
              '';
            }
          }
        });
      }

      if (html.length !== 4) {
        return html + '</ul>';
      } else {
        return '<p><em>Not part of any ' + entity + '.</em></p>';
      }
    }

    $('#metadata').append('' +
      '<p>Categories:</p>' +
      generateList('categories') +
      '<p>Tours:</p>' +
      generateList('tours') +
      '<p>Created by <em>' + site.created_by + '</em> on <em>' + createdAt.format('M/D/YYYY') + '</em> at <em>' + createdAt.format('h:mma') + '</em>. <span class="updated"></span></p>' +
    '');
    setUpdated(site.updated_at, site.updated_by);
  }

  return {
    $deleteSectionActiveButton: null,
    circle: null,
    deleteCartoDbId: null,
    deleteRow: null,
    marker: null,
    mediaEdit: null,
    sectionEditId: null,
    clearMapError: function() {
      $('#map').css({
        'border-color': '#ddd'
      });
    },
    createCircle: function(latLng, buffer) {
      buffer = buffer || 10;
      App.sites.circle = new L.Circle(latLng, buffer, {
        clickable: false
      }).addTo(NPMap.config.L);
    },
    createMarker: function(latLng) {
      App.sites.marker = new L.Marker(latLng, L.extend({
        draggable: true
      }, NPMap.config.L.editControl.options.marker)).addTo(NPMap.config.L);
    },
    deleteSection: function() {
      var cartodbId = parseInt(App.sites.deleteRow.attr('id').replace('information-section-', ''), 10),
        data = {
          updated_by: user.name
        },
        information = site.information;

      if (!information || (information.length === 0)) {
        data.information = null;
      } else {
        information = information.split(',');
        information.splice(information.indexOf(cartodbId.toString()), 1);
        data.information = information.join(',');
      }

      saveToCartoDb(function(data) {
        if (data && data.total_rows === 1) {
          saveToCartoDb(function(data) {
            if (data && data.total_rows === 1) {
              var rows;

              setUpdated(new Date());
              $('#modal-delete-section').modal('hide');
              $(App.sites.deleteRow).remove();
              rows = $('#information tbody tr');
              alertify.success('The section was successfully deleted!');
              site.information = data.information;

              if (rows.length < 2) {
                $('#information .btn-primary').hide();

                if (rows.length === 0) {
                  $('#information .table').hide();
                  $('#information .empty').show();
                }
              }
            } else {
              alertify.error('There was an error deleting the section.');
            }
          }, buildDeleteQuery('places_mobile_information', 'WHERE cartodb_id=' + cartodbId));
        } else {
          alertify.error('There was an error deleting the section.');
        }
      }, buildUpdateQuery('places_mobile_sites', data, 'WHERE cartodb_id=' + site.cartodb_id));
    },
    handleDeleteImage: function() {
      $('#modal-media .btn-danger').popover('hide');
      showProgress();
      setProgress(10);
      $.ajax({
        error: function() {
          setProgress(100);
          hideProgress();
          alertify.error('There was an error deleting the image.');
        },
        type: 'DELETE',
        success: function(response) {
          setProgress(50);

          if (response) {
            var index = -1,
              media = site.media.split(',');

            for (var i = 0; i < media.length; i++) {
              if (parseInt(media[i], 10) === parseInt(App.sites.mediaEdit.cartodb_id, 10)) {
                index = i;
                break;
              }
            }

            if (index > -1) {
              media.splice(index, 1);
              site.media = media.join(',');
              saveToCartoDb(function(data) {
                if (data && data.total_rows === 1) {
                  $($('#media .images .col-md-4')[index]).remove();

                  if (!$('#media .images .col-md-4').length) {
                    $('#media .empty').show();
                  }

                  reorderMedia(function() {
                    $('#modal-media').modal('hide');
                    alertify.success('The image was successfully deleted!');
                  });
                } else {
                  alertify.error('There was an error deleting the image.');
                }

                setProgress(100);
                hideProgress();
              }, buildDeleteQuery('places_mobile_media', 'WHERE cartodb_id=' + App.sites.mediaEdit.cartodb_id));
            }
          } else {
            setProgress(100);
            hideProgress();
            alertify.error('There was an error deleting the image.');
          }
        },
        // TODO: You should just start storing the uuid of the image and get rid of all of the image_350, image_480, etc. fields.
        url: 'http://10.147.153.192:3001/api/image/' + App.park.unit_code + '/' + App.sites.mediaEdit.image_350.replace('_image_350.jpg', '').replace('_image_350.png', '')
      });
    },
    handleDeleteSection: function(btn) {
      App.sites.deleteRow = $(btn).parent().parent().parent();
      $(btn)
        .popover({
          container: 'body',
          content: '' +
            '<p>Click "Delete" to confirm. Once deleted, you cannot get this section back.</p>' +
            '<div style="text-align:center;">' +
              '<button class="btn btn-default" onclick="App.sites.$deleteSectionActiveButton.popover(\'destroy\');return false;" style="margin-right:5px;" type="button">Cancel</button>' +
              '<button class="btn btn-primary" onclick="App.sites.$deleteSectionActiveButton.popover(\'destroy\');App.sites.deleteSection(this);return false;" type="button">Delete</button></div>' +
            '</div>' +
          '',
          html: true,
          placement: 'top',
          trigger: 'manual'
        })
        .on('hidden.bs.popover', function() {
          $('body .delete-section-backdrop').remove();
        })
        .on('shown.bs.popover', function() {
          App.sites.$deleteSectionActiveButton = $(btn);
          $('body').append('<div class="delete-section-backdrop in modal-backdrop" style="z-index:1059;"></div>');
        });
      $(btn).popover('show');
    },
    handleDeleteSite: function() {
      alertify.error('Sorry, but the delete functionality isn\'t ready yet.');
    },
    handleEditSection: function(btn) {
      var cartodb_id = parseInt($(btn).parent().parent().parent().attr('id').replace('information-section-', ''), 10);

      $.ajax({
        data: {
          q: 'SELECT * FROM places_mobile_information' + (devMode ? '_dev' : '') + ' WHERE cartodb_id = ' + cartodb_id
        },
        dataType: 'json',
        success: function(data) {
          var row = data.rows[0];

          $('#modal-section .modal-title').html('Edit Section');
          $('#modal-section').modal('show');
          $('#information-name')
            .val(row.name);
          $('#information-description').val(row.description);
          $('#modal-section .markdown').markdown({
            hiddenButtons: [
              'cmdImage',
              'cmdPreview'
            ],
            iconlibrary: 'fa',
            resize: 'vertical'
          });
          App.sites.sectionEditId = cartodb_id;
        },
        url: 'https://nps.cartodb.com/api/v2/sql'
      });
    },
    init: function(callback) {
      preload(preloads, function(loaded) {
        preloads = loaded;
        addCheckboxes('services', 'description');
        $.each(fields, function(i, field) {
          var html = buildFieldHtml(field, i === 0);

          if (html) {
            $(field.form + ' .buttons').before(html);
          }
        });
        setupDom();

        if (App.id === 'create') {
          $('.nav-tabs li').each(function(i, tab) {
            if (i > 1) {
              hideTab(tab);
              $(tab).tooltip();
            }
          });
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
              q: 'SELECT * FROM places_mobile_sites' + (devMode ? '_dev' : '') + ' WHERE cartodb_id = ' + App.id
            },
            dataType: 'json',
            success: function(data) {
              if (data && data.features) {
                var feature = data.features[0];

                site = feature.properties;

                $.each(fields, function(i, field) {
                  if (typeof field.load === 'function') {
                    field.load(feature);
                  } else {
                    $('#' + field.name).val(site[field.name]);
                  }
                });

                if (feature.geometry) {
                  var coordinates = feature.geometry.coordinates,
                    latLng = {
                      lat: coordinates[1],
                      lng: coordinates[0]
                    };

                  NPMap.center = latLng;
                  NPMap.hooks.init = function(ok) {
                    App.sites.createCircle(latLng, site.geofence_buffer_in_meters);
                    App.sites.createMarker(latLng);
                    App.sites.setupMarkerHandlers();
                    setupInitialBounds();
                    ok();
                  };
                  NPMap.zoom = 19;
                } else {
                  NPMap.hooks.init = function(ok) {
                    setupInitialBounds(true);
                    ok();
                  };
                }

                setupMetadata();
                loadChildren(callback);
              }
            },
            url: 'https://nps.cartodb.com/api/v2/sql'
          });
        }
      });
    },
    loadLatLng: function() {
      App.sites.clearMapError();
      $('#location .new').hide();
      $('#location .existing').show();
      $('#geofence_buffer_in_meters').val('32.8084');
      $('#location .form-group:last').show();
    },
    setupMarkerHandlers: function() {
      App.sites.marker
        .on('drag', function(e) {
          App.sites.circle.setLatLng(e.target.getLatLng());
        })
        .on('dragend', function(e) {
          var latLng = e.target.getLatLng();

          $('#latitude').val(latLng.lat.toFixed(6));
          $('#longitude').val(latLng.lng.toFixed(6));
        });
    }
  };
})();
