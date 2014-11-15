/**
 * Driver for the Common Sense realtime API.
 */
function CommonSenseApi(spec) {
  var that = {};

  that.options = spec;
  that.clientId = spec.clientId;
  that.appId = spec.appId;
  that.version = 3;
  that.platform = 'global';

  // Set API host to call.
  that.host = spec.host;
  if (!spec.host) {
    that.host = 'https://api.commonsense.org';
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
  that.request = function(path, options, callback) {
    var xmlhttp;
    var url;
    var urlParts;

    that.query = {
      clientId: that.clientId,
      appId: that.appId,
      fields: '',
      limit: 10,
      page: 1,
    };

    // Override default query params.
    if (options.limit) {
      that.query.limit = options.limit;
    }

    if (options.page) {
      that.query.page = options.page;
    }

    if (options.fields) {
      that.query.fields = options.fields;
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

    // Build the API REST URL to call.
    urlParts = [
      that.host,
      'v' + that.version,
      that.platform,
      path,
    ];

    url =  urlParts.join('/')  + '?' + that.serialize(that.query);

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
  that.serialize = function(obj) {
    var str = [];

    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
      }
    }

    return str.join('&');
  }

  /**
   * Get an instance of CommonSenseApiEducation.
   *
   * @return CommonSenseApiEducation
   *   an instance of the education API object.
   */
  that.education = function() {
    return CommonSenseApiEducation(spec);
  }

  /**
   * Get an instance of CommonSenseApiMedia.
   *
   * @return CommonSenseApiMedia
   *   an instance of the media API object.
   */
  that.media = function() {
    return CommonSenseApiMedia(spec);
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
  that.educationProducts = function(options, callback) {
    var path = 'v3/education/products';

    that.request(path, {}, function(err, response) {
      callback(err, response);
    });
  }

  return that;
}

/**
 * Handles calls to the Common Sense Education API.
 */
function CommonSenseApiEducation(spec) {
  var that = new CommonSenseApi(spec);

  that.platform = 'education';
  that.version = 3;

  return that;
}

/**
 * Handles calls to the Common Sense Media API.
 */
function CommonSenseApiMedia(spec) {
  var that = new CommonSenseApi(spec);

  that.platform = 'media';
  that.version = 3;

  return that;
}
