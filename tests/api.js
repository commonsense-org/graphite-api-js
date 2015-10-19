var expect = chai.expect;

describe('Common Sense API Tests', function() {
  var api;
  var baseURL;
  var baseQuery;

  beforeEach(function() {
    api = new CommonSenseApi({
      clientId: config.clientId,
      appId: config.appId,
      host: config.host,
      debug: true, // Set debug mode for tests.
    });

    // Test using the education API.
    api.platform = 'education';

    // Define the base request URL and query string.
    baseURL = [
      api.host,
      'v' + api.version,
      api.platform,
    ];

    baseQuery = {
      limit: api.query.limit,
      page: api.query.page,
    };
  });

  describe('CommonSenseApi()', function() {
    describe('init', function() {
      it('should load options when instantiated.', function() {
        expect(api.clientId).to.be.equal(config.clientId);
        expect(api.appId).to.be.equal(config.appId);
      });

      it('should override host if defined, defaulted to production.', function() {
        var apiHost = new CommonSenseApi({
          clientId: config.clientId,
          appId: config.appId,
        });
        expect(apiHost.host).to.be.equal('https://api.graphite.org');

        var apiHost = new CommonSenseApi({
          clientId: config.clientId,
          appId: config.appId,
          host: 'http://foobar.com',
        });
        expect(apiHost.host).to.be.equal('http://foobar.com');
      });
    });

    describe('#serialize()', function() {
      it('should convert a key/value object to a query string.', function() {
        var obj = {
          foo: 'bar',
          bar: 'bats',
          hello: 'world',
        };

        query = api.serialize(obj);
        expect(query).to.be.equal('foo=bar&bar=bats&hello=world');
      });
    });

    describe('#deserialize()', function() {
      it('should convert a query string to a key/value object.', function() {
        var obj = {
          foo: 'bar',
          bar: 'bats',
          hello: 'world',
        };

        query = api.deserialize(api.serialize(obj));
        expect(query).to.be.eql(obj);
      });
    });

    describe('#camelCaser()', function() {
      it('should convert a string to camel-cased.', function() {
        expect(api.camelCaser('FOO_BAR')).to.be.equal('fooBar');
        expect(api.camelCaser('foo_bar')).to.be.equal('fooBar');
      });
    });

    describe('#generateTermTree()', function() {
      it('should create a tree with no levels of nesting.', function() {
        var terms = [
          { id: 1, parent_id: 0, name: 'foo 1' },
          { id: 2, parent_id: 0, name: 'foo 2' },
          { id: 3, parent_id: 0, name: 'foo 3' },
          { id: 4, parent_id: 0, name: 'foo 4' },
          { id: 5, parent_id: 0, name: 'foo 5' },
        ];

        var tree = api.generateTermTree(terms);
        tree.forEach(function(term) {
          expect(term.parent_id).to.be.equal(0);
          expect(term.children.length).to.be.equal(0);
        });
      });

      it('should create a tree with n levels of nesting.', function() {
        var terms = [
          { id: 1, parent_id: 0, name: 'foo 1' },
          { id: 2, parent_id: 0, name: 'foo 2' },
          { id: 3, parent_id: 2, name: 'foo 3' },
          { id: 4, parent_id: 2, name: 'foo 4' },
          { id: 5, parent_id: 2, name: 'foo 5' },
          { id: 6, parent_id: 5, name: 'foo 6' },
          { id: 7, parent_id: 5, name: 'foo 7' },
          { id: 8, parent_id: 5, name: 'foo 8' },
          { id: 9, parent_id: 8, name: 'foo 9' },
          { id: 10, parent_id: 0, name: 'foo 10' },
        ];

        var tree = api.generateTermTree(terms);
        tree.forEach(function(term) {
          // Test each of the levels.
          switch(term.id) {
            case 1:
            case 10:
              // Check level 0.
              expect(term.children).to.be.eql([]);
              break;

            case 2:
              expect(term.children.length).to.be.equal(3);

              // Check the children IDs.
              term.children.forEach(function(child) {
                expect([3,4,5].indexOf(child.id)).to.be.above(-1);

                // Check level 1.
                if (child.id == 5) {
                  child.children.forEach(function(grandChild) {
                    expect([6,7,8].indexOf(grandChild.id)).to.be.above(-1);

                    // Check level 2.
                    if (grandChild.id == 8) {
                      expect(grandChild.children.length).to.be.equal(1);

                      // Check level 3.
                      var greatGrandChild = grandChild.children[0];
                      expect(greatGrandChild.children).to.be.eql([]);
                    }
                  });
                }
              });
              break;
          }
        });
      });
    });

    describe('#setHeader()', function() {
      it('should set header data.', function() {
        // Clear header data.
        api.headers = {};

        // Set header data.
        api.setHeader('foo-header', 'bar');
        api.setHeader('bar-header', 'foo');

        var headers = {
          'foo-header': 'bar',
          'bar-header': 'foo',
        };

        expect(api.headers).to.be.eql(headers);
      });
    });

    describe('#request()', function() {
      it('should make a request to an external service.', function(done) {
        var endpoint = 'foo/123';
        baseURL.push(endpoint);

        api.request(endpoint, {}, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);
          done();
        });
      });

      it('should return a 401 authentication error.', function(done) {
        api.debug = false;

        api.request('users/1', {}, function(err, response) {
          expect(err).to.be.equal('Unauthorized');
          done();
        });
      });

      it('should return a 404 page not found error.', function(done) {
        api.debug = false;

        api.request('foo', {}, function(err, response) {
          expect(err).to.be.equal('Not Found');
          done();
        });
      });

      it('should override default query parameters.', function(done) {
        api.request('foo', {}, function(err, response) {
          expect(api.query.limit).to.be.equal(10);
          expect(api.query.page).to.be.equal(1);

          var options = {
            limit: 15,
            page: 3,
            fields: ['hello', 'world'],
          };

          api.request('foo', options, function(err, response) {
            expect(api.query.limit).to.be.equal(15);
            expect(api.query.page).to.be.equal(3);
            expect(api.query.fields).to.be.equal('hello,world');
            done();
          });
        });
      });

      it('should send authentication tokens via the header', function() {
        expect(api.headers['client-id']).to.be.equal(config.clientId);
        expect(api.headers['app-id']).to.be.equal(config.appId);
      });

      it('should make a request with different limits.', function(done) {
        var endpoint = 'foo/123';
        baseURL.push(endpoint);
        baseQuery.limit = 3;

        api.request(endpoint, { limit: 3 }, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);

          // Test another.
          baseQuery.limit = 123;
          api.request(endpoint, { limit: 123 }, function(err, response) {
            expect(api.url).to.be.equal(baseURL.join('/') + '?' + api.serialize(baseQuery));

            done();
          });
        });
      });

      it('should make a request with different pages.', function(done) {
        var endpoint = 'foo/123';
        baseURL.push(endpoint);
        baseQuery.page = 3;

        api.request(endpoint, { page: 3 }, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);

          // Test another.
          baseQuery.page = 10;
          api.request(endpoint, { page: 10 }, function(err, response) {
            var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
            compareURLs(api.url, url);

            done();
          });
        });
      });

      it('should return result sets with specified fields.', function(done) {
        var endpoint = 'foo/123';
        baseURL.push(endpoint);

        var fields = ['foo', 'bar', 'baz'];
        baseQuery.fields = fields.join(',');

        api.request(endpoint, { fields: fields }, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);
          done();
        });
      });

      it('should return taxonomy terms in a tree when defined.');
    });

    describe('#education()', function() {
      it('should get an instance of CommonSenseApiEducation.', function() {
        var instance = api.education();
        expect(instance.platform).to.be.equal('education');
        expect(instance.version).to.be.equal(3);
      });
    });

    describe('#media()', function() {
      it('should get an instance of CommonSenseApiMedia.', function() {
        var instance = api.media();
        expect(instance.platform).to.be.equal('media');
        expect(instance.version).to.be.equal(3);
      });
    });

    describe('#getList()', function() {
      it('should get a list of a content type.', function(done) {
        var endpoint = 'foobar';
        baseURL.push(endpoint);

        api.getList(endpoint, {}, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);
          done();
        });
      });

      it('should take filter options.', function(done) {
        var endpoint = 'foobar';
        baseURL.push(endpoint);

        var options = {
          limit: 7,
          fields: ['id', 'title', 'status'],
        };

        baseQuery.limit = options.limit;
        baseQuery.fields = options.fields;

        api.getList(endpoint, options, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);
          done();
        });
      });

      it('should take term filters.', function(done) {
        var endpoint = 'foobar';
        baseURL.push(endpoint);

        var options = {
          limit: 7,
          fields: ['id', 'title', 'status'],
          foo: [1, 2, 3],
          bar: ['one', 'two', 'three'],
          baz: 'foobar',
        };

        baseQuery.limit = options.limit;
        baseQuery.fields = options.fields;
        baseQuery.foo = options.foo;
        baseQuery.bar = options.bar;
        baseQuery.baz = options.baz;

        api.getList(endpoint, options, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);
          done();
        });
      });
    });

    describe('#getItem()', function() {
      it('should get a single content item.', function(done) {
        var endpoint = 'foobar';
        baseURL.push(endpoint);

        var id = 123;
        baseURL.push(id);

        api.getItem(endpoint, id, {}, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);
          done();
        });
      });

      it('should take filter options.', function(done) {
        var endpoint = 'foobar';
        baseURL.push(endpoint);

        var id = 123;
        baseURL.push(id);

        var options = {
          limit: 7,
          fields: ['id', 'title', 'status'],
        };

        baseQuery.limit = options.limit;
        baseQuery.fields = options.fields;

        api.getItem(endpoint, id, options, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          compareURLs(api.url, url);
          done();
        });
      });
    });
  });

  describe('CommonSenseApiEducation()', function() {
    it('should have a getList() method for each content type.', function() {
      // Dynamically run tests for each type.
      api.education().types.forEach(function(type) {
        var typeName = api.camelCaser(type).charAt(0).toUpperCase() + api.camelCaser(type).slice(1);

        api.education()['get' + typeName + 'List']({}, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          // compareURLs(api.url, url);
        });
      });
    });

    it('should have a getItem() method for each content type.', function() {
      // Dynamically run tests for each type.
      api.education().types.forEach(function(type) {
        var typeName = api.camelCaser(type).charAt(0).toUpperCase() + api.camelCaser(type).slice(1);

        api.education()['get' + typeName + 'List']({}, function(err, response) {
          var url = baseURL.join('/') + '?' + api.serialize(baseQuery);
          // compareURLs(api.url, url);
        });
      });
    });
  });

  describe('CommonSenseApiMedia()', function() {

  });

  /**
   * Helper method to compare two URLs and run asserts on them.
   *
   * @param url1
   *   string - a url.
   * @param url2
   *   string - another url.
   */
  function compareURLs(url1, url2) {
    var url1Parts = url1.split('?');
    var url2Parts = url2.split('?');

    expect(url1Parts[0]).to.be.equal(url2Parts[0]);
    expect(api.deserialize(url1Parts[1])).to.be.eql(api.deserialize(url2Parts[1]));
  }

  /**
   * Helper function to get a list of a given type.
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
  function getContentTypeList(type, options, callback) {
    var typeName = api.camelCaser(type).charAt(0).toUpperCase() + api.camelCaser(type).slice(1);

    // Get a list of the given type.
    api.education()['get' + typeName + 'List'](options, function(err, response) {
      callback(err, response);
    });
  }

  /**
   * Helper function to get a random content item of a given type.
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
  function getContentTypeItem(type, options, callback) {
    var typeName = api.camelCaser(type).charAt(0).toUpperCase() + api.camelCaser(type).slice(1);
    var ids = [];

    // Get a list of IDs of the given type.
    api.education()['get' + typeName + 'List']({ fields: ['id'] }, function(err, response) {
      var items = response.response;

      items.forEach(function(item) {
        ids.push(item.id);
      });

      // Use a random ID from the list to test with.
      var id = ids[Math.floor(Math.random()*ids.length)];
      api.education()['get' + typeName + 'Item'](id, options, function(err, response) {
        callback(err, response);
      });
    });
  }
});
