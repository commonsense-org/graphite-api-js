/**
 * Driver for the CSM realtime API.
 */
function CSAPI(options) {
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
 * Make an asynchronous request to the Common Sense API.
 *
 * @param string
 *   the endpoint path of the API call.
 * @param object
 *   optional parameters for the API call.
 * @param function
 *   the callback function to be called after the async request
 *   returns a response.  The callback is to take 2 parameters:
 *   - err: an error message if there is a fail.
 *   - response: the JSON response data from the call.
 */
CSAPI.prototype.request = function(path, options, callback) {
  var self = this;
  var xmlhttp;
  var url;

  self.query = {
    clientId: self.clientId,
    appId: self.appId,
    limit: 10,
    page: 1,
  };

  // Override default query params.
  if (options.limit) {
    self.query.limit = options.limit;
  }

  if (options.page) {
    self.query.page = options.page;
  }

  // Make the asynchronous call.
  if (window.XMLHttpRequest) {
    // For IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {
    // For IE6, IE5
    xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
  }

  // Get the response.
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

  url = self.host + '/' + path + '?' + self.serialize(self.query);
  xmlhttp.open('GET', url, true);
  xmlhttp.send();
}

/**
 * Converts a JavaScript object into a URL query string.
 *
 * Example:
 *    obj = { hello: 'world', foo: 'bar' };
 *    returns: hello=world&foo=bar
 *
 * @param object
 *   an object with key/value pairs.
 * @return string
 *   a URL query string.
 */
CSAPI.prototype.serialize = function(obj) {
  var str = [];

  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  }

  return str.join('&');
}

/**
 * Get Education products.
 * @param object
 *   optional parameters for the API call.
 * @param function
 *   the callback function to be called after the async request
 *   returns a response.  The callback is to take 2 parameters:
 *   - err: an error message if there is a fail.
 *   - response: the JSON response data from the call.
 */
CSAPI.prototype.educationProducts = function(options, callback) {
  var self = this;
  var path = 'v3/education/products';

  self.request(path, {}, function(err, response) {
    callback(err, response);
  });
}

/**
 * Get an Education product details.
 *
 * @param int
 *   a product ID.
 * @param object
 *   optional parameters for the API call.
 * @param function
 *   the callback function to be called after the async request
 *   returns a response.  The callback is to take 2 parameters:
 *   - err: an error message if there is a fail.
 *   - response: the JSON response data from the call.
 */
CSAPI.prototype.educationProduct = function(productId, options, callback) {
  var self = this;
  var path = 'v3/education/products/' + productId;

  self.request(path, {}, function(err, response) {
    callback(err, response);
  });
}
