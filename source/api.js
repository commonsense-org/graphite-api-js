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
   *   the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
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
   * Converts a string with underscores to camel-case text.
   *
   * @param string
   *   the string to be converted.
   * @return string
   *   the camel-cased string.
   */
  that.camelCaser = function camelCase(str) {
    return str.toLowerCase().replace(/_(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
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
   * Get a list of data of a given type.
   *
   * @param string
   *   the type of data to retrieve (products, blogs, app_flows, lists, user_reviews, boards, users).
   * @param array
   *   filter options that the Common Sense API supports.
   * @param function
   *   the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.getList = function(type, options, callback) {
    that.request(type, options, function(err, response) {
      callback(err, response);
    });
  }

  /**
   * Get a single item of data of a given type and ID.
   *
   * @param string
   *   the type of data to retrieve (products, blogs, app_flows, lists, user_reviews, boards, users).
   * @param id
   *   the system ID of the item.
   * @param array
   *   filter options that the Common Sense API supports.
   * @param function
   *   the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.getItem = function(type, id, options, callback) {
    that.request(type + '/' + id, options, function(err, response) {
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
  that.types = [
    'products',
    'blogs',
    'app_flows',
    'lists',
    // 'user_reviews',
    'boards',
  ];

  /**
   * Dynamically generate a list() call for each type.
   *
   * Example: the function getProductsList() is generated for type: 'products'.
   */
  that.types.forEach(function(type) {
    var typeName = that.camelCaser(type).charAt(0).toUpperCase() + that.camelCaser(type).slice(1);

    /**
     * Get a list of a given type.
     *
     * @param object
     *   optional parameters for the API call.
     * @param function
     *   the callback function to be called after the async request.
     *   The callback is to take 2 parameters:
     *   - err: an error message if there is a fail.
     *   - response: the JSON response data from the call.
     */
    that['get' + typeName + 'List'] = function(options, callback) {
      that.getList(type, options, function(err, response) {
        callback(err, response);
      });
    }
  });

  /**
   * Dynamically generate an item() call for each type.
   *
   * Example: the function getProductsItem() is generated for type: 'products'.
   */
  that.types.forEach(function(type) {
    var typeName = that.camelCaser(type).charAt(0).toUpperCase() + that.camelCaser(type).slice(1);

    /**
     * Get a single item of a given type.
     *
     * @param object
     *   optional parameters for the API call.
     * @param function
     *   the callback function to be called after the async request.
     *   The callback is to take 2 parameters:
     *   - err: an error message if there is a fail.
     *   - response: the JSON response data from the call.
     */
    that['get' + typeName + 'Item'] = function(id, options, callback) {
      that.getItem(type, id, options, function(err, response) {
        callback(err, response);
      });
    }
  });

  /**
   * Perform a text search on a given type.
   *
   * @param string
   *   the type of data to retrieve (products, blogs, app_flows, lists, user_reviews, boards, users).
   * @param q
   *   the search string.
   * @param array
   *   filter options that the Common Sense API supports.
   * @param function
   *   the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.search = function(type, q, options, callback) {
    that.request('search/' + type + '/' + q, options, function(err, response) {
      callback(err, response);
    });
  }

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
