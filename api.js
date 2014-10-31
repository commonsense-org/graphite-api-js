/**
 * Driver for the CSM realtime API.
 */
function CSMAPI(options) {
  var self = this;

  self.options = options;
  self.clientId = options.clientId;
  self.appId = options.appId;

  self.host = 'https://api.commonsense.org';
  if (self.options.mode == 'dev') {
    self.host = 'https://api-dev.commonsense.org';
  }
}

/**
 *
 */
CSMAPI.prototype.request = function(path, options, callback) {
  var self = this;
  var xmlhttp;
  var url;
  var query = {
    clientId: self.clientId,
    appId: self.appId,
  };

  if (window.XMLHttpRequest) {
    // For IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {
    // For IE6, IE5
    xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
  }

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4) {
      if(xmlhttp.status == 200){
        callback(null, eval('(' + xmlhttp.responseText + ')'));
      }
      else if(xmlhttp.status == 401) {
        callback(xmlhttp.statusText);
      }
      else if(xmlhttp.status == 404) {
        callback(xmlhttp.statusText);
      }
      else if(xmlhttp.status == 400) {
        callback(xmlhttp.statusText);
      }
      else {
        callback('An error has occurred (error code: ' + xmlhttp.status + ')');
      }
    }
  }

  url = self.host + '/' + path + '?' + self.serialize(query);
  xmlhttp.open('GET', url, true);
  xmlhttp.send();
}

/**
 *
 */
CSMAPI.prototype.serialize = function(obj) {
  var str = [];

  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  }

  return str.join('&');
}

/**
 *
 */
CSMAPI.prototype.educationProducts = function(options, callback) {
  var self = this;
  var path = 'v3/education/products';

  self.request(path, {}, function(err, response) {
    callback(err, response);
  });
}

/**
 *
 */
CSMAPI.prototype.educationProduct = function(productId, options) {

}
