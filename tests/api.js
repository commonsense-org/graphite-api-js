var expect = chai.expect;

describe('Common Sense API Tests', function() {
  var api;

  before(function() {
    api = new CommonSenseApi({
      clientId: config.clientId,
      appId: config.appId,
      host: config.host,
    });

    // Test using the education API.
    api.platform = 'education';
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

    describe('#education()', function() {
      it('should get an instance of CommonSenseApiEducation', function() {
        var instance = api.education();
        expect(instance.platform).to.be.equal('education');
        expect(instance.version).to.be.equal(3);
      });
    });

    describe('#media()', function() {
      it('should get an instance of CommonSenseApiMedia', function() {
        var instance = api.media();
        expect(instance.platform).to.be.equal('media');
        expect(instance.version).to.be.equal(3);
      });
    });
  });

  describe('CommonSenseApiEducation()', function() {

  });

  describe('CommonSenseApiMedia()', function() {

  });
});