var libpath = process.env.TEST_COV ? '../lib-cov' : '../lib';
var krauter = require(libpath + '/krauter');

var chai = require('chai');
var expect = chai.expect;

// var spec = {
//   'dA6f23/info': 'http://hakuna.com/dA6f23/info',
//   '/dA6f23/info': 'http://hakuna.com/dA6f23/info'
// };

describe('url router', function () {

  var names = {
    'service1': 'hakuna.com',
    'service2': 'matata.com',
  };
  var routes = {
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

  describe('leading slash', function () {
    it('should be ignored', function () {
      expect(krauter.route('dA6f23/info')).to.equal('http://hakuna.com/dA6f23/info');
      expect(krauter.route('/A6f23/info')).to.equal('http://hakuna.com/A6f23/info');
    });
  });
});