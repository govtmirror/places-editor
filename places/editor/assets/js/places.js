!function(t,u,p){"undefined"!=typeof module&&module.exports?module.exports=p():"function"==typeof define&&define.amd?define(p):u[t]=p()}("reqwest",this,function(){function t(a,c,b){return function(){if(a._aborted)return b(a.request);a.request&&4==a.request[q]&&(a.request.onreadystatechange=L,M.test(a.request.status)?c(a.request):b(a.request))}}function u(a,c){var b=c.headers||{},f;b.Accept=b.Accept||n.accept[c.type]||n.accept["*"];c.crossOrigin||b[C]||(b[C]=n.requestedWith);b[D]||(b[D]=c.contentType||
n.contentType);for(f in b)b.hasOwnProperty(f)&&"setRequestHeader"in a&&a.setRequestHeader(f,b[f])}function p(a){r=a}function E(a,c){return a+(/\?/.test(a)?"&":"?")+c}function N(a,c,b,f){var d=O++,e=a.jsonpCallback||"callback";a=a.jsonpCallbackName||l.getcallbackPrefix(d);var g=new RegExp("((^|\\?|&)"+e+")=([^&]+)"),k=f.match(g),h=F.createElement("script"),v=0,n=-1!==navigator.userAgent.indexOf("MSIE 10.0");return k?"?"===k[3]?f=f.replace(g,"$1="+a):a=k[3]:f=E(f,e+"="+a),m[a]=p,h.type="text/javascript",
h.src=f,h.async=!0,"undefined"!=typeof h.onreadystatechange&&!n&&(h.htmlFor=h.id="_reqwest_"+d),h.onload=h.onreadystatechange=function(){if(h[q]&&"complete"!==h[q]&&"loaded"!==h[q]||v)return!1;h.onload=h.onreadystatechange=null;h.onclick&&h.onclick();c(r);r=void 0;w.removeChild(h);v=1},w.appendChild(h),{abort:function(){h.onload=h.onreadystatechange=null;b({},"Request is aborted: timeout",{});r=void 0;w.removeChild(h);v=1}}}function P(a,c){var b=this.o,f=(b.method||"GET").toUpperCase(),d="string"==
typeof b?b:b.url,e=!1!==b.processData&&b.data&&"string"!=typeof b.data?l.toQueryString(b.data):b.data||null,g,k=!1;("jsonp"==b.type||"GET"==f)&&e&&(d=E(d,e),e=null);"jsonp"==b.type?b=N(b,a,c,d):(g=b.xhr&&b.xhr(b)||Q(b),g.open(f,d,!1===b.async?!1:!0),u(g,b),"undefined"!=typeof b.withCredentials&&"undefined"!=typeof g.withCredentials&&(g.withCredentials=!!b.withCredentials),b=(m[x]&&g instanceof m[x]?(g.onload=a,g.onerror=c,g.onprogress=function(){},k=!0):g.onreadystatechange=t(this,a,c),b.before&&
b.before(g),k?setTimeout(function(){g.send(e)},200):g.send(e),g));return b}function y(a,c){this.o=a;this.fn=c;G.apply(this,arguments)}function R(a){if(a.match("json"))return"json";if(a.match("javascript"))return"js";if(a.match("text"))return"html";if(a.match("xml"))return"xml"}function G(a,c){function b(b){a.timeout&&clearTimeout(d.timeout);for(d.timeout=null;0<d._completeHandlers.length;)d._completeHandlers.shift()(b)}function f(a,c,f){a=d.request;d._responseArgs.resp=a;d._responseArgs.msg=c;d._responseArgs.t=
f;for(d._erred=!0;0<d._errorHandlers.length;)d._errorHandlers.shift()(a,c,f);b(a)}this.url="string"==typeof a?a:a.url;this.timeout=null;this._fulfilled=!1;this._successHandler=function(){};this._fulfillmentHandlers=[];this._errorHandlers=[];this._completeHandlers=[];this._erred=!1;this._responseArgs={};var d=this;c=c||function(){};a.timeout&&(this.timeout=setTimeout(function(){d.abort()},a.timeout));a.success&&(this._successHandler=function(){a.success.apply(a,arguments)});a.error&&this._errorHandlers.push(function(){a.error.apply(a,
arguments)});a.complete&&this._completeHandlers.push(function(){a.complete.apply(a,arguments)});this.request=P.call(this,function(e){var g=a.type||R(e.getResponseHeader("Content-Type"));e="jsonp"!==g?d.request:e;var k=H.dataFilter(e.responseText,g);try{e.responseText=k}catch(h){}if(k)switch(g){case "json":try{e=m.JSON?m.JSON.parse(k):eval("("+k+")")}catch(l){return f(e,"Could not parse JSON in response",l)}break;case "js":e=eval(k);break;case "html":e=k;break;case "xml":e=e.responseXML&&e.responseXML.parseError&&
e.responseXML.parseError.errorCode&&e.responseXML.parseError.reason?null:e.responseXML}d._responseArgs.resp=e;d._fulfilled=!0;c(e);for(d._successHandler(e);0<d._fulfillmentHandlers.length;)e=d._fulfillmentHandlers.shift()(e);b(e)},f)}function l(a,c){return new y(a,c)}function z(a){return a?a.replace(/\r?\n/g,"\r\n"):""}function I(a,c){var b=a.name,f=a.tagName.toLowerCase(),d=function(a){a&&!a.disabled&&c(b,z(a.attributes.value&&a.attributes.value.specified?a.value:a.text))},e,g,k;if(!a.disabled&&
b)switch(f){case "input":/reset|button|image|file/i.test(a.type)||(e=/checkbox/i.test(a.type),g=/radio/i.test(a.type),k=a.value,(!e&&!g||a.checked)&&c(b,z(e&&""===k?"on":k)));break;case "textarea":c(b,z(a.value));break;case "select":if("select-one"===a.type.toLowerCase())d(0<=a.selectedIndex?a.options[a.selectedIndex]:null);else for(f=0;a.length&&f<a.length;f++)a.options[f].selected&&d(a.options[f])}}function J(){var a,c;for(c=0;c<arguments.length;c++){a=arguments[c];/input|select|textarea/i.test(a.tagName)&&
I(a,this);for(var b=["input","select","textarea"],f=void 0,d=void 0,e=void 0,f=0;f<b.length;f++)for(e=a[K](b[f]),d=0;d<e.length;d++)I(e[d],this)}}function S(){return l.toQueryString(l.serializeArray.apply(null,arguments))}function T(){var a={};return J.apply(function(c,b){c in a?(a[c]&&!A(a[c])&&(a[c]=[a[c]]),a[c].push(b)):a[c]=b},arguments),a}function B(a,c,b,f){var d,e,g=/\[\]$/;if(A(c))for(d=0;c&&d<c.length;d++)e=c[d],b||g.test(a)?f(a,e):B(a+"["+("object"==typeof e?d:"")+"]",e,b,f);else if(c&&
"[object Object]"===c.toString())for(d in c)B(a+"["+d+"]",c[d],b,f);else f(a,c)}var m=window,F=document,M=/^(20\d|1223)$/,K="getElementsByTagName",q="readyState",D="Content-Type",C="X-Requested-With",w=F[K]("head")[0],O=0,U="reqwest_"+ +new Date,r,x="XDomainRequest",L=function(){},A="function"==typeof Array.isArray?Array.isArray:function(a){return a instanceof Array},n={contentType:"application/x-www-form-urlencoded",requestedWith:"XMLHttpRequest",accept:{"*":"text/javascript, text/html, application/xml, text/xml, */*",
xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript",js:"application/javascript, text/javascript"}},Q=function(a){if(!0===a.crossOrigin){if((a=m.XMLHttpRequest?new XMLHttpRequest:null)&&"withCredentials"in a)return a;if(m[x])return new XDomainRequest;throw Error("Browser does not support cross-origin requests");}return m.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP")},H={dataFilter:function(a){return a}};return y.prototype=
{abort:function(){this._aborted=!0;this.request.abort()},retry:function(){G.call(this,this.o,this.fn)},then:function(a,c){return a=a||function(){},c=c||function(){},this._fulfilled?this._responseArgs.resp=a(this._responseArgs.resp):this._erred?c(this._responseArgs.resp,this._responseArgs.msg,this._responseArgs.t):(this._fulfillmentHandlers.push(a),this._errorHandlers.push(c)),this},always:function(a){return this._fulfilled||this._erred?a(this._responseArgs.resp):this._completeHandlers.push(a),this},
fail:function(a){return this._erred?a(this._responseArgs.resp,this._responseArgs.msg,this._responseArgs.t):this._errorHandlers.push(a),this}},l.serializeArray=function(){var a=[];return J.apply(function(c,b){a.push({name:c,value:b})},arguments),a},l.serialize=function(){if(0===arguments.length)return"";var a,c,b=Array.prototype.slice.call(arguments,0);return a=b.pop(),a&&a.nodeType&&b.push(a)&&(a=null),a&&(a=a.type),"map"==a?c=T:"array"==a?c=l.serializeArray:c=S,c.apply(null,b)},l.toQueryString=function(a,
c){var b,f=c||!1,d=[],e=encodeURIComponent,g=function(a,b){b="function"==typeof b?b():null==b?"":b;d[d.length]=e(a)+"="+e(b)};if(A(a))for(b=0;a&&b<a.length;b++)g(a[b].name,a[b].value);else for(b in a)a.hasOwnProperty(b)&&B(b,a[b],f,g);return d.join("&").replace(/%20/g,"+")},l.getcallbackPrefix=function(){return U},l.compat=function(a,c){return a&&(a.type&&(a.method=a.type)&&delete a.type,a.dataType&&(a.type=a.dataType),a.jsonpCallback&&(a.jsonpCallbackName=a.jsonpCallback)&&delete a.jsonpCallback,
a.jsonp&&(a.jsonpCallback=a.jsonp)),new y(a,c)},l.ajaxSetup=function(a){a=a||{};for(var c in a)H[c]=a[c]},l});

var click = false,
  iframe = document.getElementById('iframe'),
  initiatedByIframe = false,
  initiatedByParent = false,
  lastHash,
  selected = null;

function supportsLocalStorage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
function updateDropdown(newHash) {
  var lonLat = (newHash.replace(/.+?\/([\d-.]{2,}).+?([\d-.]{2,}).{0,}/g, '$1,$2').split(','));
  var sql = 'SELECT full_name, unit_code FROM parks WHERE the_geom && St_MakePoint({{x}}, {{y}}) AND St_Intersects(the_geom, St_SetSRID(St_MakePoint({{x}}, {{y}}),4326)) ORDER BY area DESC LIMIT 1;',
    matchOption = function(parkName) {
      var select = document.getElementById('to-park');
      selected = parkName;
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
    };
  // Add a moveend function
  var newSql;
  newSql = encodeURIComponent(sql.replace(/{{x}}/g, lonLat[0]).replace(/{{y}}/g, lonLat[1]));
  if (!click && newHash !== lastHash) {
    reqwest({
      success: function(park) {
        if (park && park.rows && park.rows[0]) {
          matchOption(park.rows[0].full_name);
        } else {
          matchOption();
        }
      },
      type: 'jsonp',
      url: 'https://nps.cartodb.com/api/v2/sql?q=' + newSql
    });
  } else {
    click = false;
  }
  lastHash = newHash;
}

window.onload = function() {
  var hash = window.location.hash,
    path,
    sql = 'SELECT ' +
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

  window.onhashchange = function() {
    if (!initiatedByIframe) {
      path = '../dist/index.html' + this.location.hash;
      initiatedByParent = true;
      if (location.host.indexOf('nationalparkservice.github.io') === -1) {
        path = '../' + path;
      }

      iframe.src = path;
      initiatedByParent = false;
    }
  };
  iframe.onload = function() {
    this.contentWindow.onhashchange = function() {
      if (!initiatedByParent) {
        initiatedByIframe = true;
        window.location.hash = this.location.hash;
        updateDropdown(this.location.hash);
        initiatedByIframe = false;
      }
    };
  };

  if (hash.length) {
    path = '../dist/index.html' + hash;

    if (location.host.indexOf('nationalparkservice.github.io') === -1) {
      path = '../' + path;
    }

    iframe.src = path;
  } else {
    var initial = 'background=mapbox-satellite&map=4.00/-99.00/39.00&overlays=park-tiles-overlay';

    path = '../dist/index.html#' + initial;

    if (location.host.indexOf('nationalparkservice.github.io') === -1) {
      path = '../' + path;
    }

    iframe.src = path;
    window.location.hash = initial;
  }

  reqwest({
    success: function(parks) {
      var options = [],
        select = document.getElementById('to-park'),
        stored = (function() {
          if (supportsLocalStorage() && localStorage['places-editor:selected']) {
            return localStorage['places-editor:selected'];
          } else {
            return null;
          }
        })(),
        buildOption = function(parkInfo) {
          var option = document.createElement('option');
          option.setAttribute('class', 'to-park-option');
          option.textContent = parkInfo.full_name;
          if (parkInfo.unit_code) {
            option.setAttribute('data-unit_code', parkInfo.unit_code);
          }
          if (parkInfo.maxlat) {
            option.setAttribute('data-bounds', [parkInfo.maxlat, parkInfo.maxlon, parkInfo.minlat, parkInfo.minlon])
          }
          if (stored === parkInfo.full_name || parkInfo.stored) {
            option.setAttribute('selected', 'selected');
          }
          if (parkInfo.disabled) {
            option.setAttribute('disabled', 'disabled');
          }
          return option;
        };

      options.push(buildOption({
        'full_name': 'Zoom to a Park...',
        'disabled': true,
        'stored': !stored
      }));

      for (var j = 0; j < parks.rows.length; j++) {
        options.push(buildOption(parks.rows[j]));
      }

      if (stored) {
        delete localStorage['places-editor:selected'];
        selected = stored;
      }

      for (var i = 0; i < options.length; i++) {
        select.appendChild(options[i]);
      }

      select.onchange = function() {
        var item = select.options[select.selectedIndex];
        bounds = item.getAttribute('data-bounds') ? item.getAttribute('data-bounds').split(',') : null,
          contentWindow = document.getElementById('iframe').contentWindow,
          extent = document.getElementById('iframe').contentWindow.iD.geo.Extent([parseFloat(bounds[3], 10), parseFloat(bounds[2], 10)], [parseFloat(bounds[1], 10), parseFloat(bounds[0], 10)]),
          center = extent.center(),
          hash = window.location.hash.replace('#', ''),
          indexMap = -1,
          map = 'map=' + contentWindow.id.map().extentZoom(extent) + '/' + center[0] + '/' + center[1];

        if (hash) {
          hash = hash.split('&');

          for (var i = 0; i < hash.length; i++) {
            var split = hash[i].split('='),
              prop = split[0];

            if (prop === 'map') {
              indexMap = i;
              break;
            }
          }
        }

        if (indexMap) {
          hash[indexMap] = map;
        } else {
          hash.push(map);
        }

        path = '../dist/index.html#' + hash.join('&');

        if (location.host.indexOf('nationalparkservice.github.io') === -1) {
          path = '../' + path;
        }

        click = true;
        iframe.src = path;
      };
      select.style.display = 'block';
    },
    type: 'jsonp',
    url: 'https://nps.cartodb.com/api/v2/sql?q=' + encodeURIComponent(sql)
  });
};
