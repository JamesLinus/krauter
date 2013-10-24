(function (factory) {

  'use strict';

  var global = this;
  var define = global && global.define;

  // AMD loaders
  if (typeof define === 'function' && define.amd) {
    define(factory);
  }
  // CJS loaders
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  }
  // Regular browsers
  else {
    global.krauter = factory();
  }
}).call(this, function () {

  'use strict';

  var compiled = {};

  function normalize (route) {
    if (typeof route === 'string') {
      route = route.trim().replace(/(^\/)|(\/$)/g, '');
    }
    return route;
  }

  // make http the default protocol
  function protocolize (url) {
    if (typeof url === 'string' && !(/^https?/.test(url))) {
      url = 'http://' + url;
    }
    return url;
  }

  var routeSplitter = /\//;
  function tokenize (route) {
    return route.split(routeSplitter);
  }

  // create a trie like structure for faster lookup
  function createTrie (sections) {
    var section, original;
    var node = compiled;
    while (sections && sections.length) {
      original = section = sections.shift();
      // handle tokens
      var isToken = (section[0] === ':');
      if (isToken) {
        section = 0;
      }
      node[section] = node[section] || {};
      node = node[section];
      // keep the original token name
      if (isToken) {
        node[1] = original;
      }
    }
    return node;
  }

  function scanTrie (sections) {
    var section;
    var node = compiled;
    var toReplace = {};

    while (sections.length && node) {
      section = sections.shift();
      if (section in node) {
        node = node[section];
      } else if (node[0]) {
        node = node[0];
        if (node[1]) {
          toReplace[node[1]] = section;
        }
      } else {
        node = node['*'];
      }
    }

    return {
      'node': node,
      'toReplace': toReplace
    };
  }

  function extractUrl (route, original, names) {
    var rules = route.split('|');
    var name = rules[0];
    var fragment = rules[1];
    var url = protocolize(names[name]);

    // no url, no magic
    if (!url) {
      return;
    }

    // if a fragment is present, pass that as the route upstream
    if (fragment) {
      // remove spaces & slashes
      fragment = normalize(fragment);
      url += '/' + fragment;
    }
    // Otherwise pass the original route upstream
    else {
      url += '/' + original;
    }
    return url;
  }

  function compile (routes, names) {
    for (var key in routes) {
      // remove leading/trailing spaces/slashes & break out the rule
      var original = normalize(key);
      var route = routes[key];
      var sections = tokenize(original);

      // ignore empty rules
      if (!sections.length) {
        continue;
      }

      // get the last node for the sections
      var node = createTrie(sections);

      // extract the routing info
      var url = extractUrl(route, original, names);

      // map the last node to the url
      node._ = url;
    }
  }

  function route (url) {
    url = normalize(url);
    var sections = tokenize(url);

    // look up the matching rules
    var scan = scanTrie(sections);
    var node = scan.node;
    var toReplace = scan.toReplace;

    // try to fallback to top-level '*' route, if defined
    if (!node && '*' in compiled) {
      node = compiled['*'];
      toReplace['*'] = url;
    }

    url = node && node._;
    if (url && toReplace) {
      for (var key in toReplace) {
        url = url.replace(key, toReplace[key]);
      }
    }

    return url;
  }

  return {
    'compile': compile,
    'route': route
  };
});