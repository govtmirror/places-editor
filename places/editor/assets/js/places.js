/* globals localStorage, reqwest */

var click = false;
var iframe = document.getElementById('iframe');
var initiatedByIframe = false;
var initiatedByParent = false;
var lastHash;

function supportsLocalStorage () {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
function updateDropdown (newHash) {
  var lonLat = (newHash.replace(/.+?\/([\d-.]{2,}).+?([\d-.]{2,}).{0,}/g, '$1,$2').split(','));
  var sql = 'SELECT full_name, unit_code FROM parks WHERE the_geom && St_MakePoint({{x}}, {{y}}) AND St_Intersects(the_geom, St_SetSRID(St_MakePoint({{x}}, {{y}}),4326)) ORDER BY area DESC LIMIT 1;';

  function matchOption (parkName) {
    var select = document.getElementById('to-park');

    if (parkName) {
      for (var i = 0; i < select.options.length; i++) {
        if (parkName === select.options[i].text) {
          select.selectedIndex = i;
          return;
        }
      }
    }

    select.selectedIndex = 0;
    return;
  }

  if (!click && newHash !== lastHash) {
    reqwest({
      success: function (park) {
        if (park && park.rows && park.rows[0]) {
          matchOption(park.rows[0].full_name);
        } else {
          matchOption();
        }
      },
      type: 'jsonp',
      url: 'https://nps.cartodb.com/api/v2/sql?q=' + encodeURIComponent(sql.replace(/{{x}}/g, lonLat[0]).replace(/{{y}}/g, lonLat[1]))
    });
  } else {
    click = false;
  }

  lastHash = newHash;
}
function updateHash (newHash) {
  window.history.replaceState(null, null, window.location.protocol + '//' + window.location.host + window.location.pathname + newHash);
}

window.onload = function () {
  var hash = window.location.hash;
  var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  var sql = 'SELECT ' +
    '  "full_name", ' +
    '  "unit_code", ' +
    '  ST_YMax("the_geom") as maxLat, ' +
    '  ST_XMax("the_geom") as maxLon, ' +
    '  ST_YMin("the_geom") as minLat, ' +
    '  ST_XMin("the_geom") as minLon ' +
    'FROM ' +
    '  nps.parks ' +
    'WHERE ' +
    '  the_geom IS NOT NULL ' +
    'ORDER BY ' +
    '  "full_name";';
  var interval;

  if (hash && hash.length) {
    iframe.src = '../../dist/index.html' + hash;
  } else {
    iframe.src = '../../dist/index.html#background=mapbox-satellite&map=4.00/-99.00/39.00';
  }

  window.onhashchange = function () {
    if (!initiatedByIframe) {
      initiatedByParent = true;
      iframe.src = '../../dist/index.html' + this.location.hash;
      initiatedByParent = false;
    }
  };
  interval = setInterval(function () {
    if (iframeDoc.readyState === 'complete') {
      clearInterval(interval);

      if (!hash || hash.length) {
        updateHash(iframe.contentWindow.location.hash);
      }

      iframe.contentWindow.onhashchange = function () {
        if (!initiatedByParent) {
          hash = this.location.hash;
          initiatedByIframe = true;
          updateHash(hash);
          updateDropdown(hash);
          initiatedByIframe = false;
        }
      };
    }
  }, 100);
  reqwest({
    success: function (parks) {
      var options = [];
      var select = document.getElementById('to-park');
      var stored = (function () {
        if (supportsLocalStorage() && localStorage['places-editor:selected']) {
          return localStorage['places-editor:selected'];
        } else {
          return null;
        }
      })();

      function buildOption (parkInfo) {
        var option = document.createElement('option');
        option.setAttribute('class', 'to-park-option');
        option.textContent = parkInfo.full_name;

        if (parkInfo.unit_code) {
          option.setAttribute('data-unit_code', parkInfo.unit_code);
        }

        if (parkInfo.maxlat) {
          option.setAttribute('data-bounds', [parkInfo.maxlat, parkInfo.maxlon, parkInfo.minlat, parkInfo.minlon]);
        }

        if (stored === parkInfo.full_name || parkInfo.stored) {
          option.setAttribute('selected', 'selected');
        }

        if (parkInfo.disabled) {
          option.setAttribute('disabled', 'disabled');
        }

        return option;
      }

      options.push(buildOption({
        disabled: true,
        full_name: 'Zoom to a Park...',
        stored: !stored
      }));

      for (var i = 0; i < parks.rows.length; i++) {
        options.push(buildOption(parks.rows[i]));
      }

      if (stored) {
        delete localStorage['places-editor:selected'];
      }

      for (var j = 0; j < options.length; j++) {
        select.appendChild(options[j]);
      }

      select.onchange = function () {
        var item = select.options[select.selectedIndex];
        var bounds = (item.getAttribute('data-bounds') ? item.getAttribute('data-bounds').split(',') : null);
        var contentWindow = document.getElementById('iframe').contentWindow;
        var extent = document.getElementById('iframe').contentWindow.iD.geo.Extent([parseFloat(bounds[3], 10), parseFloat(bounds[2], 10)], [parseFloat(bounds[1], 10), parseFloat(bounds[0], 10)]);
        var center = extent.center();
        var hash = window.location.hash.replace('#', '');
        var indexMap = -1;
        var map = 'map=' + contentWindow.id.map().extentZoom(extent) + '/' + center[0] + '/' + center[1];

        if (hash) {
          hash = hash.split('&');

          for (var k = 0; k < hash.length; k++) {
            var split = hash[k].split('=');
            var prop = split[0];

            if (prop === 'map') {
              indexMap = k;
              break;
            }
          }
        }

        if (Object.prototype.toString.call(hash) !== '[object Array]') {
          hash = [hash];
        }

        if (indexMap) {
          hash[indexMap] = map;
        } else {
          hash.push(map);
        }

        click = true;
        iframe.contentWindow.location.hash = hash.join('&');
        /*
        // TODO: Zoom the iD map yourself, and let iD update the hash (and then it will propagate up to window)
        initiatedByIframe = true;
        contentWindow.id.map().centerZoom(center, contentWindow.id.map().extentZoom(extent));
        initiatedByIframe = false;
        */
      };
      select.style.display = 'block';
    },
    type: 'jsonp',
    url: 'https://nps.cartodb.com/api/v2/sql?q=' + encodeURIComponent(sql)
  });
};
