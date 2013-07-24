'use strict';
/*
 *
 * unite.js - router
 *
 */
var unite = (function(unite) {
  var routes;
  var regexp_routes = [];
  var REGEXP = /(:[\w]+)/ig
 
  unite.debug_routes = function() {
    console.log(routes);
    console.log(regexp_routes);
  }


  unite.route = function(new_routes) {
    routes = new_routes
    regexp_routes = createRegexpRoutes(routes)

  /*
    console.log("Route()");
    console.log(routes);
*/
    var body = document.getElementsByTagName('body')[0];
    unite.addEvent(body, "click", clickHandler);
  }

  function clickHandler(e) {
    var element = e.target || e.srcElement;
    var url = element.getAttribute("href")
    if(!url) return

    console.log("* ROUTER CLICK: " + url);
    console.log("* ROUTER MATCH: ");
    console.log(matchRoute(url));
    console.log("* REGEXP ROUTER MATCH: ");
    console.log(matchRegexpRoute(url));

    e.preventDefault();
    e.stopPropagation();
  }

  function matchRoute(url) {
    for(var route in routes) {
      if(route == url) return {action: routes[route], params: {}};
    }
  }

  function matchRegexpRoute(url) {
    for(var regexp_route in regexp_routes) {
      if(url.match(regexp_route.regexp)) {
        return {action: regexp_route.action, params: regexp_route.parametrers};
      }
    }
  }

  function createRegexpRoutes(routes) {
    var list = []
    for(var route in routes) {
      var parameters = [];
      var regexp = route.replace(REGEXP, function(match, name) {
        parameters.push(name);
        return "([\\w+])";
      });
      var route = {url: route, regexp: regexp, parameters: parameters, action: routes[route]}
      list.push(route);

      console.log(route);
      return route
    }
  }


  function harvestRouteParameters(url) {
  }

  return unite;
})(unite || {});

