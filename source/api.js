/**
 * Driver for the Common Sense realtime API.
 */
function CommonSenseApi(options) {
  var that = {};

  that.options = options;
  that.clientId = options.clientId;
  that.appId = options.appId;
  that.version = 3;
  that.platform = 'global';

  // Set default header data.
  that.headers = {
    'client-id': that.clientId,
    'app-id': that.appId,
  };

  // Set request query defaults.
  that.query = {
    fields: [],
    limit: 10,
    page: 1,
  };

  // Debug mode used for tests.
  that.debug = options.debug ? options.debug : false;

  // Set API host to call.
  that.host = options.host;
  if (!options.host) {
    that.host = 'https://api.graphite.org';
  }

  /**
   * Make an asynchronous request to the Common Sense API.
   *
   * @param path
   *   string - the endpoint path of the API call.
   * @param options
   *   object - optional parameters for the API call.
   * @param callback
   *   function - the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.request = function(path, options, callback) {
    var xmlhttp;
    var urlParts;

    // Override default query params.
    if (options.limit) {
      that.query.limit = options.limit;
    }

    if (options.page) {
      that.query.page = options.page;
    }

    if (options.fields) {
      that.query.fields = options.fields.join(',');
    } else {
      // Remove fields if it doesn't exists so it doesn't show up in the request URL.
      delete that.query.fields;
    }

    // Add remaining options to the query string.
    for (var key in options) {
      if (['limit', 'page', 'fields'].indexOf(key) == -1) {
        var value = options[key];
        if (options[key] instanceof Array) {
          // Convert array parameters to comma a separated list.
          value = options[key].join(',');
        }
        that.query[key] = value;
      }
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
          var json = eval('(' + xmlhttp.responseText + ')');

          // Create taxonomy trees if defined.
          if (options.tree) {
            var isArray = false;
            if (Object.prototype.toString.call(json.response) === '[object Array]') {
              isArray = true;
            }

            options.tree.forEach(function(term) {
              if (isArray) {
                // Create tree for list results.
                json.response.forEach(function(item) {
                  item[term] = that.generateTermTree(item[term]);
                });
              } else {
                // Create tree for a single object.
                json.response[term] = that.generateTermTree(json.response[term]);
              }
            });
          }

          callback(null, json);
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
    };

    // Build the API REST URL to call.
    urlParts = [
      that.host,
      'v' + that.version,
      that.platform,
      path,
    ];

    that.url =  urlParts.join('/')  + '?' + that.serialize(that.query);

    if (!that.debug) {
      xmlhttp.open('GET', that.url, true);

      // Set the headers.
      for (var key in that.headers) {
        xmlhttp.setRequestHeader(key, that.headers[key]);
      }

      console.log(xmlhttp.getRequ);

      xmlhttp.send();
    } else {
      // Dummy response for tests.
      callback(null, { success: 1 });
    }
  };

  /**
   * Converts a JavaScript object into a URL query string.
   *
   * Example:
   *    obj = { hello: 'world', foo: 'bar' };
   *    returns: hello=world&foo=bar
   *
   * @param obj
   *   object - an object with key/value pairs.
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
  };

  /**
   * Converts a URL query string into a JavaScript object.
   *
   * Example:
   *    query = hello=world&foo=bar
   *    returns: { hello: 'world', foo: 'bar' };
   *
   * @param query
   *   string - a URL query string.
   * @return string
   *   an object with key/value pairs.
   */
  that.deserialize = function(query) {
    var obj = {};

    query.split('&').forEach(function(param) {
      var parts = param.split('=');
      obj[parts[0]] = parts[1];
    });

    return obj;
  };

  /**
   * Converts a string with underscores to camel-case text.
   *
   * @param str
   *   string - the string to be converted.
   * @return string
   *   the camel-cased string.
   */
  that.camelCaser = function (str) {
    return str.toLowerCase().replace(/_(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  };

  /**
   * Converts a flat array of taxonomy terms to a hierarchical tree structure.
   *
   * @param terms
   *   array - an array of term objects.
   * @param parentId
   *   int - a taxonomy parent ID.
   * @return
   *   array - an array of term objects with nested children.
   */
  that.generateTermTree = function(terms, parentId) {
    var tree = [];
    parentId = parentId ? parentId : 0;

    terms.forEach(function(term) {
      if (term.parent_id == parentId) {
        children = [];
        term.children = that.generateTermTree(terms, term.id);
        tree.push(term);
      }
    });

    return tree;
  };

  /**
   * Sets a header variable to be sent over on a request.
   *
   * @param key
   *   string - the header variable key.
   * @param value
   *   string - the header variable value.
   */
  that.setHeader = function(key, value) {
    that.headers[key] = value;
  };

  /**
   * Get an instance of CommonSenseApiEducation.
   *
   * @return CommonSenseApiEducation
   *   an instance of the education API object.
   */
  that.education = function() {
    return CommonSenseApiEducation(options);
  };

  /**
   * Get an instance of CommonSenseApiMedia.
   *
   * @return CommonSenseApiMedia
   *   an instance of the media API object.
   */
  that.media = function() {
    return CommonSenseApiMedia(options);
  };

  /**
   * Get a list of data of a given type.
   *
   * @param type
   *   string - the type of data to retrieve (products, blogs, app_flows, lists, user_reviews, boards, users).
   * @param options
   *   array - filter options that the Common Sense API supports.
   * @param callback
   *   function - the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.getList = function(type, options, callback) {
    that.request(type, options, function(err, response) {
      callback(err, response);
    });
  };

  /**
   * Get a single item of data of a given type and ID.
   *
   * @param type
   *   string - the type of data to retrieve (products, blogs, app_flows, lists, user_reviews, boards, users).
   * @param id
   *   the system ID of the item.
   * @param id
   *   array - filter options that the Common Sense API supports.
   * @param options
   *   array - filter options that the Common Sense API supports.
   * @param callback
   *   function - the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.getItem = function(type, id, options, callback) {
    that.request(type + '/' + id, options, function(err, response) {
      callback(err, response);
    });
  };

  return that;
}

/**
 * Handles calls to the Common Sense Education API.
 */
function CommonSenseApiEducation(options) {
  var that = new CommonSenseApi(options);

  that.platform = 'education';
  that.version = 3;
  that.types = [
    'products',
    'blogs',
    'app_flows',
    'lists',
    'user_reviews',
    'boards',
    'schools',
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
     * @param options
     *   object - optional parameters for the API call.
     * @param callback
     *   function - the callback function to be called after the async request.
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
     * @param id
     *   object - optional parameters for the API call.
     * @param options
     *   object - optional parameters for the API call.
     * @param callback
     *   function - the callback function to be called after the async request.
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
   * Get a list of taxonomy terms of a specified vocabulary.
   *
   * @param vocabulary
   *   string - a vocabulary ID.
   * @param options
   *   object - optional parameters for the API call.
   * @param callback
   *   function - the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.getTermsList = function(vocabulary, options, callback) {
    that.request('terms/' + vocabulary, options, function(err, response) {
      callback(err, response);
    });
  };

  /**
   * Perform a text search on a given type.
   *
   * @param type
   *   string - the type of data to retrieve (products, blogs, app_flows, lists, user_reviews, boards, users).
   * @param q
   *   string - the search string.
   * @param options
   *   array - filter options that the Common Sense API supports.
   * @param callback
   *   function - the callback function to be called after the async request.
   *   The callback is to take 2 parameters:
   *   - err: an error message if there is a fail.
   *   - response: the JSON response data from the call.
   */
  that.search = function(type, q, options, callback) {
    that.request('search/' + type + '/' + q, options, function(err, response) {
      callback(err, response);
    });
  };

  return that;
}

/**
 * Handles calls to the Common Sense Media API.
 */
function CommonSenseApiMedia(options) {
  var that = new CommonSenseApi(options);

  that.platform = 'media';
  that.version = 3;

  return that;
}
