var expect = chai.expect;

describe('cs.Api()', function() {
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

        api.request('foo', { limit: 15, page: 3 }, function(err, response) {
          expect(api.query.limit).to.be.equal(15);
          expect(api.query.page).to.be.equal(3);
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
});