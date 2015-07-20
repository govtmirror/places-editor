/* globals alertify, devMode, L, logOnCallbacks, moment, NPMap, user */
/* jshint camelcase: false */

window.addEventListener('hashchange', function() {
  window.location.reload();
});

if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun/*, thisArg*/) {
    'use strict';

    if (this === void 0 || this === null) {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t) {
        var val = t[i];

        if (fun.call(thisArg, val, i, t)) {
          res.push(val);
        }
      }
    }

    return res;
  };
}

$.event.special.inputchange = {
  setup: function() {
    var self = this, val;

    $.data(this, 'timer', window.setInterval(function() {
      val = self.value;

      if ($.data(self, 'cache') !== val) {
        $.data(self, 'cache', val);
        $(self).trigger( 'inputchange');
      }
    }, 20));
  },
  teardown: function() {
    window.clearInterval($.data(this, 'timer'));
  },
  add: function() {
    $.data(this, 'cache', this.value);
  }
};

var App = {
  availableParks: [],
  entity: null,
  id: null,
  park: null,
  secrets: null,
  updateHash: function(string) {
    location.hash = string;
  }
};

function buildDeleteQuery(table, where) {
  return 'DELETE FROM ' + table + (devMode ? '_dev' : '') + ' ' + where;
}
function buildFieldHtml(field, autoFocus) {
  var html;

  if (field.type === 'custom') {
    html = field.generate(autoFocus);
  } else {
    html = '' +
      '<div class="form-group"' + (field.hidden ? ' style="display:none;"' : '') + '>' +
        '<label for="' + field.name + '">' + field.label + (field.required ? ' <span class="text-danger">*</span>': '') + '</label>' +
      '' +
    '';

    switch (field.fieldType) {
    case 'checkboxgroup':
      if (field.checkboxes && field.checkboxes.length) {
        html = '' +
          '<div class="control-group">' +
            '<label>' + field.label + '</label>' +
          '' +
        '';

        $.each(field.checkboxes, function(i, checkbox) {
          html += '' +
            '<div class="checkbox"' + (!i ? ' style="margin-top:0;"' : '') + '>' +
              '<label>' +
                '<input id="' + field.name + '-' + checkbox.value + '" name="' + field.name + '" type="checkbox" value="' + checkbox.value + '">' +
                checkbox.label +
              '</label>' +
            '</div>' +
          '';
        });

        html += '</div>';
      } else {
        html = null;
      }

      break;
    case 'date':
      html += '<input' + (autoFocus ? ' autofocus="true"' : '') + (field.required ? ' required' : '') + ' class="form-control" id="' + field.name + '" name="' + field.name + '" type="text">';
      break;
    case 'number':
      html += '<input' + (autoFocus ? ' autofocus="true"' : '') + (field.required ? ' required' : '') + ' class="form-control" id="' + field.name + '"' + (typeof field.max !== 'undefined' ? 'max="' + field.max + '"' : '') + (typeof field.min !== 'undefined' ? 'min="' + field.min + '"' : '') + ' name="' + field.name + '"' + (field.step ? 'step="' + field.step + '"' : '') + ' type="number">';
      break;
    case 'text':
      html += '<input' + (autoFocus ? ' autofocus="true"' : '') + (field.required ? ' required' : '') + ' class="form-control" id="' + field.name + '" name="' + field.name + '" type="text">';
      break;
    case 'textarea':
      html += '<textarea' + (autoFocus ? ' autofocus="true"' : '') + (field.required ? ' required' : '') + ' class="form-control' + (field.markdown ? ' markdown' : '') + '" id="' + field.name + '" name="' + field.name + '" rows="5"></textarea>';
      break;
    }
  }

  if (field.helpText) {
    html += '<p class="help-block">' + field.helpText + '</p>';
  }

  if (html) {
    return html + '</div>';
  } else {
    return null;
  }
}
function buildInsertQuery(table, data) {
  var query = 'INSERT INTO ' + table + (devMode ? '_dev' : '') + ' ',
    props = '',
    values = '';

  $.each(data, function(prop, value) {
    var isString = false;

    if (typeof value === 'string' && prop !== 'the_geom' && value.toLowerCase().indexOf('st_polygon' === -1) && value.toLowerCase().indexOf('st_setsrid') === -1) {
      isString = true;
    }

    if (isString && !value.length) {
      isString = false;
      value = null;
    }

    props += prop + ',';
    values += ((isString ? '\'' : '') + (isString ? value.replace(/'/g, '\'\'') : value) + (isString ? '\'' : '') + ',');
  });

  query += '(' + props.slice(0, props.length - 1) + ') VALUES (' + values.slice(0, values.length - 1) + ') RETURNING cartodb_id';
  return query;
}
function buildUpdateQuery(table, data, where) {
  var query = 'UPDATE ' + table + (devMode ? '_dev' : '') + ' SET ';

  $.each(data, function(prop, value) {
    var isString = false;

    if (typeof value === 'string' && prop !== 'the_geom' && value.toLowerCase().indexOf('st_polygon' === -1) && value.toLowerCase().indexOf('st_setsrid') === -1) {
      isString = true;
    }

    if (isString && !value.length) {
      isString = false;
      value = null;
    }

    query += prop + '=' + (isString ? '\'' : '') + (isString ? value.replace(/'/g, '\'\'') : value) + (isString ? '\'' : '') + ',';
  });

  query = query.slice(0, query.length - 1);
  query += ' ' + where;

  return query;
}
// TODO: Switch all get requests over to this function.
function getFromCartoDb(callback, params) {
  if (params) {
    params.cb = new Date().getTime();
  }

  $.ajax({
    data: params,
    dataType: 'json',
    success: callback,
    url: 'https://nps.cartodb.com/api/v2/sql'
  });
}
function hideProgress() {
  setTimeout(function() {
    $('#progress').hide();
  }, 200);
}
function hideTab(tab) {
  $(tab)
    .addClass('disabled')
    .on('click', stopEvent);
}
function isEmpty(value) {
  if (value !== 0 && !value) {
    return true;
  } else {
    return false;
  }
}
function loggedIn(user) {
  function done() {
    $('#loading').remove();
    $('#main').show();
  }
  function sorry() {
    var html;

    if (user.name) {
      html = '<p>Sorry, but you don\'t have permission to edit any Places Mobile parks.</p>';
    } else {
      html = '<p>You must <a href="/account/logon?ReturnUrl=/places/mobile/">sign in</a> to edit Places Mobile parks.</p>';
    }

    html += '<p>If you\'re looking for more information on what Places Mobile is or would like to build a mobile application for your park, take a look at the <a href="http://go.nps.gov/places-mobile">project website</a>.</p>';

    $('.main-content .col-md-3').remove();
    $('#html')
      .removeClass('col-md-9')
      .addClass('col-md-12')
      .html(html);
    done();
  }

  if (user.placesmobileSuperUser || (user.permissions && user.permissions.placesmobile)) {
    var create = false,
      preloads = {
        parks: null,
        secrets: null,
        urls: null
      },
      sections = [
        'Park',
        'Events',
        'Categories',
        'Sites'
        //'Tours'
      ],
      interval;

    function setupBreadcrumbs() {
      var $breadcrumb = $('.breadcrumb');

      $('.breadcrumb li:last-child')
        .html('<a href="#" onclick="location.href=\'/places/mobile/\';return false;">Mobile</a>')
        .removeClass('active');

      if (App.entity && App.entity !== 'parks') {
        $breadcrumb.append('' +
          '<li>' +
            '<a href="#" onclick="App.updateHash(\'' + App.park.unit_code.toLowerCase() + '\');return false;">' + App.park.name + ' ' + App.park.designation + '</a>' +
          '</li>' +
        '');

        if (App.id) {
          $breadcrumb.append('<li><a href="#" onclick="App.updateHash(\'' + App.park.unit_code.toLowerCase() + '/' + App.entity.toLowerCase() + '\');return false;">' + (App.entity.charAt(0).toUpperCase() + App.entity.slice(1)) + '</a></li>');

          if (App.id === 'create') {
            $breadcrumb.append('<li class="active">Create ' + (function() {
              switch (App.entity) {
              case 'categories':
                return 'a Category';
              case 'events':
                return 'an Event';
              case 'sites':
                return 'a Site';
              case 'tours':
                return 'a Tour';
              }
            })() + '</li>');
          } else {
            $breadcrumb.append('<li class="active">' + App.id + '</li>');
          }
        } else {
          $breadcrumb.append('<li class="active">' + (App.entity.charAt(0).toUpperCase() + App.entity.slice(1)) + '</li>');
        }
      } else {
        if (create) {
          $breadcrumb.append('<li class="active">Create a Park</li>');
        } else if (App.park) {
          $breadcrumb.append('<li class="active">' + (App.park.name + ' ' + App.park.designation) + '</li>');
        } else {
          $('.breadcrumb li:last-child').html('Mobile');
        }
      }
    }
    function setupDom() {
      $('#modal-publish .btn-primary').click(function() {
        $.ajax({
          error: function() {
            alertify.error('The changes could not be published.');
          },
          success: function(response) {
            var done = false,
              id = response.taskName,
              interval;

            $('#modal-publish').modal('hide');
            setProgress(0);
            showProgress();
            interval = setInterval(function() {
              $.ajax({
                success: function(response) {
                  if (response.status.indexOf('1/6') > -1) {
                    setProgress(20);
                  } else if (response.status.indexOf('2/6') > -1) {
                    setProgress(40);
                  } else if (response.status.indexOf('3/6') > -1) {
                    setProgress(60);
                  } else if (response.status.indexOf('4/6') > -1) {
                    setProgress(80);
                  } else if (response.status.indexOf('Complete') > -1) {
                    clearInterval(interval);
                    setProgress(100);
                    setTimeout(function() {
                      hideProgress();

                      if (!done) {
                        alertify.success('The publish task completed successfully!');
                        done = true;
                      }
                    }, 500);
                  }
                },
                url: 'http://10.147.153.192:3001/api/generate/status/' + id
              });
            }, 5000);
          },
          url: 'http://10.147.153.192:3001/api/generate/json/' + App.park.unit_code
        });
      });
    }
    function setupLinks() {
      var $nav = $($('.sidenav')[0]),
        $sidebar = $($('.sidebar')[0]);

      $.each(sections, function(i, section) {
        var entity = App.entity;

        if (App.entity === 'parks') {
          entity = 'park';
        }

        $nav.append('' +
          '<li' + (entity === section.toLowerCase() ? ' class="active"' : '') + '>' +
            '<a href="#" onclick="App.updateHash(\'' + App.park.unit_code + '/' + (section.toLowerCase() === 'park' ? '' : section.toLowerCase()) + '\');return false;">' +
              section +
            '</a>' +
          '</li>' +
        '');
      });

      if (App.entity) {
        $sidebar.append('' +
          '<a class="tools" href="#" onclick="$(\'#modal-publish\').modal(\'show\');return false;">Publish changes</a>' +
        '');
      }

      $sidebar.append('' +
        '<a class="tools" href="#" onclick="$(\'html,body\').animate({scrollTop:0});return false;">Back to top</a>' +
      '');
      $sidebar.affix({
        offset: {
          bottom: function() {
            return (this.bottom = $('footer').outerHeight(true));
          },
          top: function() {
            return (this.top = $sidebar.offset().top - $('nav').height());
          }
        }
      });
    }

    getFromCartoDb(function(response) {
      if (response && response.features && response.features.length) {
        var parks = [];

        $.each(response.features, function(i, feature) {
          var obj = feature.properties;

          obj.geojson = feature;
          parks.push(obj);
        });

        preloads.parks = parks;
      }
    }, {
      format: 'geojson',
      q: 'SELECT * FROM places_mobile_parks' + (devMode ? '_dev' : '') + ' ORDER BY name'
    });
    getFromCartoDb(function(response) {
      if (response && response.total_rows) {
        preloads.urls = response.rows;
        App.urls = {};

        $.each(response.rows, function(i, row) {
          App.urls[row.unit_code] = row;
        });
      }
    }, {
      q: 'SELECT * FROM places_mobile_urls' + (devMode ? '_dev' : '')
    });
    $.ajax({
      dataType: 'json',
      success: function(data) {
        preloads.secrets = App.secrets = data;
      },
      url: 'assets/data/secrets.json'
    });

    interval = setInterval(function() {
      var completed = true;

      for (var prop in preloads) {
        if (!preloads[prop]) {
          completed = false;
          break;
        }
      }

      if (completed) {
        var access = [],
          hash = window.location.hash.replace('#', '').split('/'),
          unitCode = hash[0],
          park;

        clearInterval(interval);

        if (user.placesmobileSuperUser) {
          access = preloads.parks;
        } else {
          for (var i = 0; i < user.permissions.placesmobile.length; i++) {
            var permission = user.permissions.placesmobile[i];

            for (var j = 0; j < preloads.parks.length; j++) {
              park = preloads.parks[j];

              if (park.unit_code === permission.unitCode) {
                access.push(park);
                break;
              }
            }
          }
        }

        if (access.length) {
          if (unitCode && unitCode.length && unitCode !== 'create') {
            var hasAccess = false;

            for (var k = 0; k < access.length; k++) {
              park = access[k];

              if (park.unit_code === hash[0]) {
                App.park = park;
                hasAccess = true;
                break;
              }
            }

            if (hasAccess) {
              var path;

              App.availableParks = access;
              App.entity = hash[1];
              App.id = hash[2] || null;
              App.unitCode = unitCode;

              if (!App.entity) {
                App.entity = 'parks';
                App.id = hash[0];
              }

              path = App.entity + '/' + (App.id ? 'form' : 'list');
              setupBreadcrumbs();
              setupDom();
              setupLinks();
              $('#html').load('assets/html/routes/' + path + '.html', function() {
                $.getScript('assets/js/routes/' + path + '.js', function() {
                  App[App.entity].init(done);
                });
              });
              $('head').append('<link href="assets/css/routes/' + path + '.css" rel="stylesheet">');
            } else {
              $('#html').html('<p>Sorry, but you have don\'t have permission to edit Places Mobile data for that park.</p>');
              done();
            }
          } else {
            $('.col-md-3').remove();
            $('#html')
              .removeClass('col-md-10')
              .addClass('col-md-12');

            if (unitCode && unitCode.length && unitCode === 'create') {
              create = true;
              setupBreadcrumbs();
              $('head').append('<link href="assets/css/routes/parks/form.css" rel="stylesheet">');
              $('#html').load('assets/html/routes/parks/form.html', function() {
                $.getScript('assets/js/routes/parks/form.js', function() {
                  App.parks.init(done);
                });
              });
            } else {
              create = false;
              setupBreadcrumbs();
              $('head').append('<link href="assets/css/routes/parks/list.css" rel="stylesheet">');
              $('#html').load('assets/html/routes/parks/list.html', function() {
                $.each(access, function(i, park) {
                  $('tbody').append('' +
                    '<tr id="' + park.unit_code + '">' +
                      '<td>' + park.name + ' ' + park.designation + '</td>' +
                      '<td>' +
                        '<div class="btn-group">' +
                          '<button class="btn btn-default" onclick="App.updateHash(\'' + park.unit_code + '\');" title="Edit Park" type="button">' +
                            '<span class="fa fa-pencil"></span>' +
                          '</button>' +
                        '</div>' +
                      '</td>' +
                    '</tr>' +
                  '');
                });
                $.getScript('assets/js/routes/parks/list.js', function() {
                  App.parks.init(done);
                });
              });
            }
          }
        } else {
          sorry();
        }
      }
    }, 100);
  } else {
    sorry();
  }
}
function preload(preloads, callback) {
  var completed = {},
    count = 0,
    interval;

  $.each(preloads, function(i, preload) {
    $.ajax({
      data: {
        q: preload.query
      },
      dataType: 'json',
      success: function(data) {
        if (data && data.total_rows) {
          completed[preload.name] = data.rows;
        }

        count++;
      },
      url: 'https://nps.cartodb.com/api/v2/sql'
    });
  });
  interval = setInterval(function() {
    if (count === preloads.length) {
      clearInterval(interval);
      preloads = completed;
      callback(preloads);
    }
  }, 100);
}
function saveToCartoDb(callback, query) {
  $.ajax({
    data: {
      api_key: App.secrets.API_KEY,
      q: query
    },
    dataType: 'json',
    error: function() {
      alertify.error('There was an error, possibly due to a bad network connection.');
    },
    success: callback,
    type: 'POST',
    url: 'https://nps.cartodb.com/api/v2/sql'
  });
}
function setProgress(amount) {
  $('#progress .progress-bar')
    .attr('aria-valuenow', amount)
    .css({
      width: amount + '%'
    })
    .html(amount + '%');
}
function setUpdated(at, by) {
  at = moment(at);
  $($('.updated')[0]).html('Updated by <em>' + (by ? by : user.name) + '</em> on <em>' + at.format('M/D/YYYY') + '</em> at <em>' + at.format('h:mma') + '</em>.');
}
function setupInitialBounds(fit) {
  if (App.park && App.park.geojson && App.park.geojson.geometry) {
    var bounds = new L.GeoJSON(App.park.geojson).getBounds(),
      options = NPMap.config.L.options;

    if (bounds.isValid()) {
      options.center = bounds.getCenter();
      options.zoom = NPMap.config.L.getBoundsZoom(bounds, false, [30, 30]);

      if (fit) {
        NPMap.config.L.fitBounds(bounds);
      }
    }
  }
}
function showProgress() {
  $('#progress').show();
}
function showTab(tab) {
  $(tab)
    .removeClass('disabled')
    .off('click', stopEvent);
}
function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

if (user) {
  loggedIn(user);
} else {
  logOnCallbacks.push(loggedIn);
}
