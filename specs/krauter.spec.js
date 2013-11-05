var libpath = process.env.TEST_COV ? '../lib-cov' : '../lib';
var krauter = require(libpath + '/krauter');

var chai = require('chai');
var expect = chai.expect;

describe('krauter', function () {

  var names = {
    'service1': 'hakuna.com',
    'service2': 'matata.com',
    'service3': 'batata.com'
  };

  var routes = {
    '/': 'service1',
    '': 'service1',
    '*': 'service2',
    'user/*': 'service1',
    'info/:user_id': 'service1',
    ':user_id/info': 'service1',
    'products/:product_id/details': 'service2',
    'customer/:customer_id/info': 'service3#:customer_id',
    '/more': 'service2#no-more',
    '/less': 'patata.com',
    '/even-less': 'http://www.matata.com'
  };

  beforeEach(function () {
    krauter.compile(routes, names);
  });

  function test (input, expected) {
    var url = krauter.route(input);
    expect(url).to.equal(expected);
  }

  it('should resolve service name correctly', function () {
    test('more', 'http://matata.com/no-more');
    test('less', 'http://patata.com/less');
  });

  it('should add missing protocol to the resolved url', function () {
    var url = krauter.route('meoh');
    expect(url).to.match(/^https?/);
  });

  it('should fallback to * route', function () {
    test('my/weird/url', 'http://matata.com/my/weird/url');
    test('yet-another-one','http://matata.com/yet-another-one');
  });

  it('should handle * sub routes', function () {
    test('user/12345', 'http://hakuna.com/user/12345');
  });

  it('should handle parameters', function () {
    test('info/dA6f23', 'http://hakuna.com/info/dA6f23')
    test('dA6f23/info', 'http://hakuna.com/dA6f23/info');
  });

  it('should ignore leading slash', function () {
    var url1 = krauter.route('dA6f23/info');
    var url2 = krauter.route('/dA6f23/info');
    expect(url1).to.equal(url2);
  });
});