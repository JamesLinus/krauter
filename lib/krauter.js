var compiled = {};

function normalize (route) {
  if (typeof route === 'string') {
    route = route.trim().replace(/(^\/)|(\/$)/g, '');
  }
  return route;
}

var routeSplitter = /\//;
function tokenize (route) {
  return route.split(routeSplitter);
}

function compile (routes, names) {
  for (var key in routes) {
    // remove leading/trailing spaces/slashes & break out the rule
    var route = normalize(key);
    var sections = tokenize(route);

    // ignore empty rules
    if (!sections.length) {
      continue;
    }

    // create a trie like structure for faster lookup
    var section, original;
    var node = compiled;
    while (sections.length) {
      original = section = sections.shift();
      // handle tokens
      var isToken = (section[0] === ':');
      if (isToken) {
        section = 0;
      }
      node[section] = node[section] || {}
      node = node[section];
      // keep the original token name
      if (isToken) {
        node[1] = original;
      }
    }

    // extract the routing info
    var rules = routes[key].split('|');
    var name = rules[0];
    var fragment = rules[1];
    if (name in names) {
      var url = names[name];

      // make http the default protocol
      if (!(/^https?/.test(url))) {
        url = 'http://' + url;
      }

      // if a fragment is present, pass that as the route upstream
      if (fragment) {
        // remove spaces & slashes
        fragment = normalize(fragment);
        url += '/' + fragment;
      }
      // Otherwise pass the original route upstream
      else {
        url += '/' + route;
      }

      // map the last node to the url
      node._ = url;
    }
  }
}

function route (url) {
  var sections = tokenize(normalize(url));

  // look up the matching rules
  var section;
  var node = compiled;
  var toReplace = {};
  while (sections.length && node) {
    section = sections.shift();
    node = node[section] || node[0] || node['*'];
    if (node[1]) {
      toReplace[node[1]] = section;
    }
  }
  // try to fallback to '*' route, if defined
  node = node || compiled['*'];

  url = node && node._;
  if (url && toReplace) {
    for (var key in toReplace) {
      url = url.replace(key, toReplace[key]);
    }
  }

  return url;
}

module.exports = {
  'compile': compile,
  'route': route
};