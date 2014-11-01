var expect = chai.expect;

describe('CS.Api()', function() {
  var api;
  var clientId = '3b536f246f52ab62cafc4970960b5558';
  var appId = '101252815b8736362b5bd9f21eb6ce35';

  before(function() {
    api = new CSAPI({
      clientId: clientId,
      appId: appId,
      mode: 'dev',
    });
  });

  it('should load options when instantiated.', function() {
    expect(api.clientId).to.be.equal(clientId);
    expect(api.appId).to.be.equal(appId);
  });

  describe('#request()', function() {
    it('should make a request to an external service.', function(done) {
      api.request('v3/education/users/1', {}, function(err, response) {
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

      api.request('v3/education/users/1', {}, function(err, response) {
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
      api.request('v3/education/products', { limit: 3 }, function(err, response) {
        expect(response.response.length).to.be.equal(3);

        api.request('v3/education/products', { limit: 10 }, function(err, response) {
          expect(response.response.length).to.be.equal(10);
          done();
        });
      });
    });

    it('should return result sets from different pages (pagenation).', function(done) {
      // Get a data set to test against.
      api.request('v3/education/products', { limit: 10 }, function(err, response) {
        var productSet = response.response;

        // Get data subset (page) and compare to the initial data set.
        api.request('v3/education/products', { limit: 5, page: 1 }, function(err, response) {
          var productsPage1 = response.response;

          api.request('v3/education/products', { limit: 5, page: 2 }, function(err, response) {
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
      api.request('v3/education/products', {}, function(err, response) {
        response.response.forEach(function(product) {
          expect(product.id).to.exist;
          expect(product.title).to.exist;
          expect(product.type).to.exist;
          expect(product.status).to.exist;
          expect(product.created).to.exist;
        });

        api.request('v3/education/products', { fields: 'id,title' }, function(err, response) {
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

  describe('#educationProducts()', function() {
    it('should get a list of Education products.', function(done) {
      api.educationProducts({}, function(err, response) {
        expect(response.statusCode).to.be.equal(200);
        expect(response.count).to.be.above(0);
        expect(response.response.length).to.be.above(0);
        done();
      });
    });
  });

  describe('#educationProduct()', function() {
    it('should get the details of an Education product.', function(done) {
      api.educationProduct(1247882, {}, function(err, response) {
        var product = response.response;

        expect(product.id).to.be.equal(1247882);
        expect(product.title).to.be.equal('Minecraft');
        expect(product.type).to.be.equal('game');
        done();
      });
    });
  });

  describe('#educationSearchProducts()', function() {
    it('should get a list of Education products searched for.', function(done) {
      var q = 'math';

      api.educationSearchProducts(q, {}, function(err, response) {
        expect(response.statusCode).to.be.equal(200);
        expect(response.count).to.be.above(0);
        expect(response.response.length).to.be.above(0);
        done();
      });
    });
  });
});