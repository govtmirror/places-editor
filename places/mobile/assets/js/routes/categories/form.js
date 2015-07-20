/* globals alertify, App, buildDeleteQuery, buildFieldHtml, buildInsertQuery, buildUpdateQuery, devMode, hideTab, isEmpty, L, moment, saveToCartoDb, setUpdated, showTab, user */
/* jshint camelcase: false */

/*
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
  hooks: {
    init: function(callback) {
      var options = NPMap.config.L.options;

      NPMap.config.L.fitBounds(L.geoJson(App.park.geojson).getBounds());
      options.center = NPMap.config.L.getCenter();
      options.zoom = NPMap.config.L.getZoom();
      callback();
    }
  },
  div: 'map-frame',
  geocoderControl: true,
  locateControl: true,
  scrollWheelZoom: false
};
*/

App.categories = (function() {
  var $tab = $($('.nav-tabs li')[1]),
    category = null,
    fields = [{
      fieldType: 'text',
      form: '#details form',
      label: 'Name',
      name: 'name',
      required: true,
      type: 'string'
    },{
      fieldType: 'textarea',
      form: '#details form',
      label: 'Description',
      name: 'description',
      required: false,
      type: 'string'
    }];

  function appendRow(data) {
    var $btnDanger;

    $('.table tbody').append('' +
      '<tr id="site-' + data.cartodb_id + '">' +
        '<td>' + data.name + '</td>' +
        '<td>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default">' +
              '<span class="fa fa-pencil"></span>' +
            '</button>' +
            '<button class="btn btn-danger">' +
              '<span class="fa fa-trash"></span>' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>' +
    '');
    $('#site-' + data.cartodb_id + ' .btn-default').click(function() {
      App.updateHash(App.park.unit_code + '/sites/' + data.cartodb_id);
    });
    $btnDanger = $('#site-' + data.cartodb_id + ' .btn-danger');
    $btnDanger
      .popover({
        container: 'body',
        content: '' +
          '<p>Click "Remove" to confirm. This will remove the site from this category.</p>' +
          '<div style="text-align:center;">' +
            '<button class="btn btn-default" onclick="App.categories.handleRemoveSite(' + data.cartodb_id + ');" style="margin-right:5px;" type="button">Cancel</button>' +
            '<button class="btn btn-primary" onclick="App.categories.handleRemoveSite(' + data.cartodb_id + ', true);" type="button">Remove</button></div>' +
          '</div>' +
        '',
        html: true,
        trigger: 'manual'
      })
      .on('hidden.bs.popover', function() {
        $('body .delete-backdrop').remove();
      })
      .on('shown.bs.popover', function() {
        $('body').append('<div class="delete-backdrop in modal-backdrop" style="z-index:1059;"></div>');
      })
      .click(function() {
        $(this).popover('show');
      });
    $('.empty').hide();
    $('.table').show();
  }
  function save(e) {
    var data = {},
      errors = [],
      insert = false,
      query;

    function callback() {
      saveToCartoDb(function(response) {
        if (response && response.total_rows) {
          alertify.success('The category was ' + (insert ? 'inserted' : 'updated') + ' successfully!');

          if (insert) {
            data.cartodb_id = response.rows[0].cartodb_id;
            category = data;
            window.history.pushState(null, null, '#' + App.park.unit_code + '/categories/' + category.cartodb_id);
            showTab($tab);
            $tab.tooltip('destroy');
            $('.breadcrumb li.active').html(category.cartodb_id);
            $('.action-buttons').show();
            setupMetadata();
          }
        } else {
          alertify.error('The category could not be ' + (insert ? 'inserted' : 'updated') + '.');
        }
      }, query);
    }

    $.each(fields, function(i, field) {
      var name = field.name,
        value = $('#' + name).val();

      $(field.form + ' #' + field.name).parent().removeClass('has-error');

      if (field.required && !value) {
        errors.push(field);
      } else {
        data[name] = $('#' + name).val();
      }
    });

    if (errors.length) {
      $.each(errors, function(i, field) {
        $(field.form + ' #' + field.name).parent().addClass('has-error');
      });
      alertify.error('One or more fields have errors. Please validate and try again.');
    } else {
      data.updated_by = user.name;

      if (!category || isEmpty(category.cartodb_id)) {
        data.created_by = user.name;
        data.sites = null;
        data.unit_code = App.park.unit_code;
        insert = true;
        $.ajax({
          data: {
            q: 'SELECT display_order FROM places_mobile_categories' + (devMode ? '_dev' : '') + ' WHERE unit_code= \'' + App.park.unit_code + '\' ORDER BY display_order DESC LIMIT 1'
          },
          dataType: 'json',
          success: function(response) {
            if (response && response.total_rows) {
              data.display_order = response.rows[0].display_order + 1;
            } else {
              data.display_order = 1;
            }

            query = buildInsertQuery('places_mobile_categories', data);
            callback();
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      } else {
        query = buildUpdateQuery('places_mobile_categories', data, 'WHERE cartodb_id=' + category.cartodb_id);
        callback();
      }
    }

    e.preventDefault();
  }
  function saveOrder(successMsg, errorMsg) {
    var sites = [];

    $('.table tr').each(function(i, row) {
      var id = $(row).attr('id');

      if (typeof id === 'string') {
        sites.push(id.replace('site-', ''));
      }
    });
    saveToCartoDb(function(response) {
      if (response && response.total_rows) {
        successMsg = successMsg || 'The order was successfully saved!';
        alertify.success(successMsg);
      } else {
        errorMsg = errorMsg || 'The order could not be saved.';
        alertify.error(errorMsg);
      }
    }, buildUpdateQuery('places_mobile_categories', {
      sites: sites.join(',')
    }, 'WHERE cartodb_id=' + category.cartodb_id));
  }
  function setupDom() {
    $('#button-metadata').click(function() {
      $('#modal-metadata').modal('show');
    });
    $('.buttons .btn-primary').click(save);
    /*
    $($('a[data-toggle="tab"]')[1]).on('shown.bs.tab', function() {
      if (NPMap.config && NPMap.config.L) {
        NPMap.config.L.invalidateSize(false);
      } else {
        var script = document.createElement('script');
        script.src = 'http://www.nps.gov/lib/npmap.js/2.0.0/npmap-bootstrap.min.js';
        document.body.appendChild(script);
      }
    });
    */
    $('.action-buttons .btn-danger')
      .popover({
        container: 'body',
        content: '' +
          '<p>Click "Delete" to confirm. Once deleted, you cannot get this category back.</p>' +
          '<div style="text-align:center;">' +
            '<button class="btn btn-default" onclick="$(\'.action-buttons .btn-danger\').popover(\'hide\');return false;" style="margin-right:5px;" type="button">Cancel</button>' +
            '<button class="btn btn-primary" onclick="$(\'.action-buttons .btn-danger\').popover(\'hide\');App.categories.handleDelete();return false;" type="button">Delete</button></div>' +
          '</div>' +
        '',
        html: true,
        trigger: 'manual'
      })
      .on('hidden.bs.popover', function() {
        $('body .delete-backdrop').remove();
      })
      .on('shown.bs.popover', function() {
        $('body').append('<div class="delete-backdrop in modal-backdrop" style="z-index:1059;"></div>');
      });
    $('.action-buttons .btn-danger').click(function() {
      $(this).popover('show');
    });
    $('.table').sortable({
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
        saveOrder();
      }
    });
    $('#sites form').submit(function(e) {
      var cartodb_id = $('select').val(),
        name = $('#sites select option:selected').text();

      appendRow({
        cartodb_id: cartodb_id,
        name: name
      });
      $('#sites select option:selected').remove();
      $('body').animate({
        scrollTop: $('#sites .table').scrollHeight
      }, 1000);
      saveOrder('The site was successfully added!', 'The site could not be added.');
      e.preventDefault();
    });
  }
  function setupMetadata() {
    var createdAt = moment(category.created_at);

    $('#metadata').append('' +
      '<p>Created by <em>' + category.created_by + '</em> on <em>' + createdAt.format('M/D/YYYY') + '</em> at <em>' + createdAt.format('h:mma') + '</em>. <span class="updated"></span></p>' +
    '');
    setUpdated(category.updated_at, category.updated_by);
  }

  return {
    handleDelete: function() {
      saveToCartoDb(function(response) {
        if (response && response.total_rows) {
          $.ajax({
            data: {
              q: 'SELECT * FROM places_mobile_categories' + (devMode ? '_dev' : '') + ' WHERE unit_code=\'' + App.park.unit_code + '\' ORDER BY display_order'
            },
            dataType: 'json',
            error: function() {
              alertify.error('There was an error updating the category order.');
              App.updateHash(App.park.unit_code + '/categories');
            },
            success: function(response) {
              if (response && response.total_rows) {
                var query = 'UPDATE places_mobile_categories' + (devMode ? '_dev' : '') + ' o SET display_order=n.display_order FROM (VALUES ';

                $.each(response.rows, function(i, row) {
                  query += '(' + row.cartodb_id + ',' + (i + 1) + '),';
                });
                query = query.slice(0, query.length - 1);
                query += ') n (cartodb_id,display_order) WHERE o.cartodb_id=n.cartodb_id;';
                saveToCartoDb(function(response) {
                  if (response && response.total_rows) {
                    App.updateHash(App.park.unit_code + '/categories');
                  } else {
                    alertify.error('There was an error updating the category order.');
                  }
                }, query);
              } else {
                alertify.error('There was an error updating the category order.');
                App.updateHash(App.park.unit_code + '/categories');
              }
            },
            url: 'https://nps.cartodb.com/api/v2/sql'
          });
        } else {
          alertify.error('The category could not be deleted.');
        }
      }, buildDeleteQuery('places_mobile_categories', 'WHERE cartodb_id=' + category.cartodb_id));
    },
    handleRemoveSite: function(cartodb_id, remove) {
      $('#site-' + cartodb_id + ' .btn-danger').popover('hide');

      if (remove) {
        var name = $($('#site-' + cartodb_id + ' td')[0]).html(),
          options = $('select option');

        $('#site-' + cartodb_id).remove();
        saveOrder('The site was successfully removed!', 'The site could not be removed.');

        if (options.length) {
          for (var i = 0; i < options.length; i++) {
            var $option = $(options[i]);

            if (name < $option.text()) {
              $('<option value="' + cartodb_id + '">' + name + '</option>').insertBefore($option);
              break;
            }
          }
        } else {
          $('select').html('<option value="' + cartodb_id + '">' + name + '</option>');
        }
      }

      if (!$('.table tbody tr').length) {
        $('.empty').show();
        $('.table').hide();
      }

      return false;
    },
    init: function(callback) {
      $.each(fields, function(i, field) {
        $(field.form + ' .buttons').before(buildFieldHtml(field, i === 0));
      });
      setupDom();

      if (App.id === 'create') {
        var $tab = $($('.nav-tabs li')[1]);

        hideTab($tab);
        $tab.tooltip();
        $.ajax({
          data: {
            q: 'SELECT cartodb_id,name FROM places_mobile_sites' + (devMode ? '_dev' : '') + ' WHERE unit_code=\'' + App.park.unit_code + '\' ORDER BY name'
          },
          error: function() {},
          success: function(response) {
            if (response && response.total_rows) {
              $.each(response.rows, function(i, row) {
                $('select').append('<option value="' + row.cartodb_id + '">' + row.name + '</option>');
              });
            }
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
        $('.empty').show();
        callback();
      } else {
        $.ajax({
          data: {
            q: 'SELECT * FROM places_mobile_categories' + (devMode ? '_dev' : '') + ' WHERE cartodb_id = \'' + App.id + '\''
          },
          dataType: 'json',
          error: function() {
            alertify.error('There was an error loading that category.');
            callback();
          },
          success: function(data) {
            if (data && data.rows && data.rows[0]) {
              var disable = false,
                queryAllSites = 'SELECT cartodb_id,name FROM places_mobile_sites' + (devMode ? '_dev' : '') + ' WHERE unit_code=\'' + App.park.unit_code + '\'';

              category = data.rows[0];
              setupMetadata();
              $('.action-buttons').show();

              if (category.name === 'Highlights') {
                disable = true;
                $('.buttons .btn-primary').attr('disabled', true);
              }

              $.each(fields, function(i, field) {
                var $field = $('#' + field.name);

                $field.val(category[field.name]);

                if (disable) {
                  $field.attr('disabled', true);
                }
              });

              if (category.sites && category.sites.length) {
                var query = 'WHERE ';

                queryAllSites += ' AND ';

                $.each(category.sites.split(','), function(i, id) {
                  queryAllSites += 'cartodb_id!=' + id + ' AND ';
                  query += 'cartodb_id=' + id + ' OR ';
                });
                queryAllSites = queryAllSites.slice(0, queryAllSites.length - 5);
                query = query.slice(0, query.length - 4);
                $.ajax({
                  data: {
                    format: 'geojson',
                    q: 'SELECT * FROM places_mobile_sites' + (devMode ? '_dev' : '') + ' ' + query
                  },
                  dataType: 'json',
                  success: function(data) {
                    if (data && data.features && data.features.length) {
                      var ordered = [];

                      $.each(category.sites.split(','), function(i, id) {
                        var parsed = parseInt(id, 10);

                        for (var j = 0; j < data.features.length; j++) {
                          var properties = data.features[j].properties;

                          if (properties.cartodb_id === parsed) {
                            ordered.push(properties);
                            break;
                          }
                        }
                      });
                      $.each(ordered, function(i, properties) {
                        appendRow(properties);
                      });
                      $('.table').show();

                      /*
                      NPMap.overlays = [{
                        data: data,
                        events: [{
                          fn: function() {
                            var me = this,
                              interval;

                            interval = setInterval(function() {
                              if (NPMap.config && NPMap.config.L) {
                                clearInterval(interval);
                                NPMap.config.L.fitBounds(me.getBounds());
                              }
                            }, 100);
                          },
                          type: 'ready'
                        }],
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
                      }];
                      */
                    }
                  },
                  url: 'https://nps.cartodb.com/api/v2/sql'
                });
              } else {
                $('.empty').show();
              }

              queryAllSites += ' ORDER BY name';
              $.ajax({
                data: {
                  q: queryAllSites
                },
                error: function() {},
                success: function(response) {
                  if (response && response.total_rows) {
                    $.each(response.rows, function(i, row) {
                      $('select').append('<option value="' + row.cartodb_id + '">' + row.name + '</option>');
                    });
                  }
                },
                url: 'https://nps.cartodb.com/api/v2/sql'
              });
            }

            callback();
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      }
    }
  };
})();
