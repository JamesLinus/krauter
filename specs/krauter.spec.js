var libpath = process.env.TEST_COV ? '../lib-cov' : '../lib';
var krauter = require(libpath + '/krauter');

var chai = require('chai');
var expect = chai.expect;

describe('url router', function () {

  var names = {
    'service1': 'hakuna.com',
    'service2': 'matata.com',
  };
  var routes = {
    '/': 'service1',
    '': 'service1',
    '*': 'service2',
    'user/*': 'service1',
    ':user_id/info': 'service1',
    'products/:product_id/details': 'service2',
    'customer/:customer_id/info': 'service1|/:customer_id',
    '/more': 'service2|more'
  };

  beforeEach(function () {
    krauter.compile(routes, names);
  });

  it('should fallback to * route', function () {
    expect(krauter.route('my/weird/url')).to.equal('http://matata.com/my/weird/url');
  });

  xit('should handle * sub routes', function () {
    expect(krauter.route('user/12345')).to.equal('http://hakuna.com/user/12345');
  });

  it('should handle parameters', function () {
    expect(krauter.route('dA6f23/info')).to.equal('http://hakuna.com/dA6f23/info');
  });

  it('should ignore leading slash', function () {
    expect(krauter.route('dA6f23/info')).to.equal(krauter.route('/dA6f23/info'));
  });
});