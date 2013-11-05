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

  // strip a route of the following
  // - leading & trailling whitespaces
  // - leading & trailing slashes
  function normalize (route) {
    if (typeof route === 'string') {
      route = route.trim().replace(/(^\/)|(\/$)/g, '');
    }
    return route;
  }

  // Add protocol to urls that might be missing it.
  // Make http the default
  function protocolize (url) {
    if (typeof url === 'string' && !(/^https?:/.test(url))) {
      url = 'http://' + url;
    }
    return url;
  }

  // Split a route into tokens for easier processing
  var routeSplitter = /\//;
  function tokenize (route) {
    return route.split(routeSplitter);
  }

  // create a trie like structure for faster lookup
  function createTrie (sections) {
    var section, original;

    // start with the trie root
    var node = compiled;

    // loop through the sections in the tokenized route
    while (sections && sections.length) {
      original = section = sections.shift();

      // handle tokens
      var isToken = (section[0] === ':');
      if (isToken) {
        section = 0;
      }

      // create leaf, if it doesn't exists
      node[section] = node[section] || {};

      // move on to the leaf node
      node = node[section];

      // keep the original token name
      if (isToken) {
        node[1] = original;
      }
    }

    return node;
  }

  // lookup possible matches in the trie, for a tokenized route
  function scanTrie (sections) {
    var section;

    // start with the trie root
    var node = compiled;

    // keep references for tokens that need replacement
    var toReplace = {};

    // loop through the sections in the tokenized route
    while (sections.length && node) {
      section = sections.shift();

      // if a literal node is found
      if (section in node) {
        node = node[section];
      }
      // If a tokenized node is found
      else if (node[0] && sections[0] in node[0]) {
        node = node[0];

        // keep refs for token replacement
        if (node[1]) {
          toReplace[node[1]] = section;
        }
      }
      // Otherwise, Try catch all sub-route, if any exists
      else {
        node = node['*'];
        toReplace['*'] = section;
      }
    }

    return {
      'node': node,
      'toReplace': toReplace
    };
  }

  function extractUrl (route, original, names) {
    var rules = route.split('#');
    var name = rules[0];
    var fragment = rules[1];
    var url = protocolize(names[name] || name);

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

  //
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