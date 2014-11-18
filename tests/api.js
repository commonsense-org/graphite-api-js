var expect = chai.expect;

describe('Common Sense API Tests', function() {
  var api = new CommonSenseApi({
    clientId: config.clientId,
    appId: config.appId,
    host: config.host,
  });

  // Test using the education API.
  api.platform = 'education';

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
        expect(apiHost.host).to.be.equal('https://api.commonsense.org');

        var apiHost = new CommonSenseApi({
          clientId: config.clientId,
          appId: config.appId,
          host: 'http://foobar.com',
        });
        expect(apiHost.host).to.be.equal('http://foobar.com');
      });
    });

    describe('#request()', function() {
      it('should make a request to an external service.', function(done) {
        api.request('users/1', {}, function(err, response) {
          var user = response.response;
          expect(user.id).to.be.equal(1);
          expect(user.first_name).to.be.equal('testing');
          expect(user.last_name).to.be.equal('tester');
          expect(user.display_name).to.be.equal('testing t.');
          done();
        });
      });

      it('should return a 401 authentication error.', function(done) {
        var clientId = api.clientId;
        api.clientId = 'foobar';

        api.request('users/1', {}, function(err, response) {
          expect(err).to.be.equal('Unauthorized');
          api.clientId = clientId;
          done();
        });
      });

      it('should return a 404 page not found error.', function(done) {
        api.request('foo', {}, function(err, response) {
          expect(err).to.be.equal('Not Found');
          done();
        });
      });

      it('should override default query parameters.', function(done) {
        api.request('foo', {}, function(err, response) {
          expect(api.query.limit).to.be.equal(10);
          expect(api.query.page).to.be.equal(1);

          api.request('foo', { limit: 15, page: 3, fields: 'hello,world' }, function(err, response) {
            expect(api.query.limit).to.be.equal(15);
            expect(api.query.page).to.be.equal(3);
            expect(api.query.fields).to.be.equal('hello,world');
            done();
          });
        });
      });

      it('should return result sets with different limits.', function(done) {
        api.request('products', { limit: 3 }, function(err, response) {
          expect(response.response.length).to.be.equal(3);

          api.request('products', { limit: 10 }, function(err, response) {
            expect(response.response.length).to.be.equal(10);
            done();
          });
        });
      });

      it('should return result sets from different pages (pagenation).', function(done) {
        // Get a data set to test against.
        api.request('products', { limit: 10 }, function(err, response) {
          var productSet = response.response;

          // Get data subset (page) and compare to the initial data set.
          api.request('products', { limit: 5, page: 1 }, function(err, response) {
            var productsPage1 = response.response;

            api.request('products', { limit: 5, page: 2 }, function(err, response) {
              var productsPage2 = response.response;

              // Check the data set from page 1 with limit 5.
              productsPage1.forEach(function(product, index) {
                expect(product.id).to.be.equal(productSet[index].id);
                expect(product.title).to.be.equal(productSet[index].title);
              });

              // Check the data set from page 2 with limit 5.
              productsPage2.forEach(function(product, index) {
                var index2 = index + productsPage1.length;
                expect(product.id).to.be.equal(productSet[index2].id);
                expect(product.title).to.be.equal(productSet[index2].title);
              });

              done();
            });
          });
        });
      });

      it('should return result sets with specified fields.', function(done) {
        api.request('products', {}, function(err, response) {
          response.response.forEach(function(product) {
            expect(product.id).to.exist;
            expect(product.title).to.exist;
            expect(product.type).to.exist;
            expect(product.status).to.exist;
            expect(product.created).to.exist;
          });

          api.request('products', { fields: 'id,title' }, function(err, response) {
            response.response.forEach(function(product) {
              expect(product.id).to.exist;
              expect(product.title).to.exist;
              expect(product.type).to.not.exist;
              expect(product.status).to.not.exist;
              expect(product.created).to.not.exist;
            });

            done();
          });
        });
      });
    });

    describe('#serialize()', function() {
      it('should convert a key/value object to a query string.', function() {
        var obj = {
          foo: 'bar',
          bar: 'bats',
          hello: 'world',
        }

        query = api.serialize(obj);
        expect(query).to.be.equal('foo=bar&bar=bats&hello=world');
      });
    });

    describe('#camelCaser()', function() {
      it('should convert a string to camel-cased.', function() {
        expect(api.camelCaser('FOO_BAR')).to.be.equal('fooBar');
        expect(api.camelCaser('foo_bar')).to.be.equal('fooBar');
      });
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
        api.getList('products', {}, function(err, response) {
          var products = response.response;
          expect(response.count).to.be.above(0);
          expect(products.length).to.be.above(0);

          products.forEach(function(product) {
            expect(product.id).to.be.a('number');
            expect(product.title).to.exist;
          });

          done();
        });
      });

      it('should take filter options.', function(done) {
        var limit = 7;
        var fields = ['id', 'title', 'status'];

        api.getList('products', { limit: limit, fields: fields.join(',') }, function(err, response) {
          var products = response.response;

          expect(products.length).to.be.equal(limit);

          products.forEach(function(product) {
            // Iterate through object keys and see if only the ones expected show up.
            for (var key in product) {
              expect(fields.indexOf(key)).to.be.above(-1);
            }
          });

          done();
        });
      });
    });

    describe('#getItem()', function() {
      it('should get a single content item.', function(done) {
        // Get a bunch of random products to test with from the getList() call.
        var options = {
          limit: 50,
          page: Math.floor(Math.random() * 10) + 1,
        }

        api.getList('products', options, function(err, response) {
          var products = response.response;

          var ids = [];
          products.forEach(function(product) {
            ids.push(product.id);
          });

          // Get the product item from the API.
          var id = ids[Math.floor(Math.random()*ids.length)]; // get random id from the list.
          api.getItem('products', id, {}, function(err, response) {
            var product = response.response;

            expect(product.id).to.be.a('number');
            expect(product.status).to.be.a('number');
            expect(product.title).to.be.exists;

            done();
          });
        });
      });

      it('should take filter options.', function(done) {
        var fields = ['id', 'title', 'status'];

        // Get a bunch of random products to test with from the getList() call.
        var options = {
          limit: 50,
          page: Math.floor(Math.random() * 10) + 1,
        }

        api.getList('products', options, function(err, response) {
          var products = response.response;

          var ids = [];
          products.forEach(function(product) {
            ids.push(product.id);
          });

          // Get the product item from the API.
          var id = ids[Math.floor(Math.random()*ids.length)]; // get random id from the list.
          api.getItem('products', id, { fields: fields.join(',') }, function(err, response) {
            var product = response.response;

            // Iterate through object keys and see if only the ones expected show up.
            for (var key in product) {
              expect(fields.indexOf(key)).to.be.above(-1);
            }

            done();
          });
        });
      });
    });
  });

  describe('CommonSenseApiEducation()', function() {
    // Dynamically run tests for each type.
    api.education().types.forEach(function(type) {
      var typeName = api.camelCaser(type).charAt(0).toUpperCase() + api.camelCaser(type).slice(1);

      describe('#get' + typeName + 'List()', function() {
        it('should get a list of type: ' + type, function(done) {
          getContentTypeList(api, type, {}, function(err, response) {
            expect(response.statusCode).to.be.equal(200);
            expect(response.count).to.be.above(0);

            var items = response.response;
            items.forEach(function(item) {
              expect(item.id).to.be.a('number');
            });

            done();
          });
        });

        it('should get a list using options with type: ' + type, function(done) {
          var options = {
            limit: 11,
            fields: 'id,title,status,created',
          };

          getContentTypeList(api, type, options, function(err, response) {
            var items = response.response;

            expect(response.statusCode).to.be.equal(200);
            expect(response.count).to.be.above(0);
            expect(items.length).to.be.equal(options.limit);

            items.forEach(function(item) {
              expect(item.id).to.be.a('number');

              // Iterate through object keys and see if only the ones expected show up.
              for (var key in item) {
                expect(options.fields.split(',').indexOf(key)).to.be.above(-1);
              }
            });

            done();
          });
        });
      });

      describe('#get' + typeName + 'Item()', function() {
        it('should get a single item of type: ' + type, function(done) {
          getContentTypeItem(api, type, {}, function(err, response) {
            var item = response.response;

            expect(response.statusCode).to.be.equal(200);
            expect(item.id).to.be.a('number');

            done();
          });
        });

        it('should get a content item using options with type: ' + type, function(done) {
          var options = {
            fields: 'id,title,status,created',
          };

          getContentTypeItem(api, type, options, function(err, response) {
            var item = response.response;

            expect(response.statusCode).to.be.equal(200);
            expect(item.id).to.be.a('number');

            // Iterate through object keys and see if only the ones expected show up.
            for (var key in item) {
              expect(options.fields.split(',').indexOf(key)).to.be.above(-1);
            }

            done();
          });
        });
      });
    });
  });

  describe('CommonSenseApiMedia()', function() {

  });
});

/**
 * Helper function to get a list of a given type.
 *
 * @param object
 *   an instance of CommonSenseApi().
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
function getContentTypeList(api, type, options, callback) {
  var typeName = api.camelCaser(type).charAt(0).toUpperCase() + api.camelCaser(type).slice(1);

  // Get a list of the given type.
  api.education()['get' + typeName + 'List'](options, function(err, response) {
    callback(err, response);
  });
}

/**
 * Helper function to get a random content item of a given type.
 *
 * @param object
 *   an instance of CommonSenseApi().
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
function getContentTypeItem(api, type, options, callback) {
  var typeName = api.camelCaser(type).charAt(0).toUpperCase() + api.camelCaser(type).slice(1);
  var ids = [];

  // Get a list of IDs of the given type.
  api.education()['get' + typeName + 'List']({ fields: 'id' }, function(err, response) {
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
