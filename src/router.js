'use strict';
/*
 *
 * unite.js - router
 *
 * - Let's use real URLs per default
 *
 */
var unite = (function(unite) {
  unite.router = {}

  var routes;
  var regexp_routes = [];
  var REGEXP = /(:[\w]+)/ig
 
  unite.getRegexpRoutes = function() {
    return regexp_routes;
  }

  unite.route = function(new_routes) {
    routes = new_routes
    regexp_routes = createRegexpRoutes(routes)
    var body = document.getElementsByTagName('body')[0];
    unite.addEvent(body, "click", clickHandler);
  }

  function clickHandler(e) {
    var element = e.target || e.srcElement;
    var url = element.getAttribute("href")
    var route;
    if(!url) return

    console.log("* ROUTER CLICK: " + url);

    route = matchRoute(url);
    if(!route) route = matchRegexpRoute(url);
    //if(route.action) route.action();

    console.log(route.regexp);
    console.log(route.params);
    console.log(route.values);

    e.preventDefault();
    e.stopPropagation();
  }

  function matchRoute(url) {
    for(var route in routes) {
      if(route == url) return {action: routes[route], params: {}};
    }
  }

  function matchRegexpRoute(url) {
    for(var i=0; i < regexp_routes.length; i++) {
      var regexp_route = regexp_routes[i];
      
      var values = url.match(regexp_route.regexp);
      if(values && values.length > 0) {
        values.shift();
        return {action: regexp_route.action, regexp: regexp_route.regexp, params: regexp_route.parameters, values: values};
      }
    }
  }

  function createRegexpRoutes(routes) {
    var list = []
    for(var route in routes) {
      var parameters = [];
      var regexp = route.replace(REGEXP, function(match, name) {
        parameters.push(name);
        return "([\\w]+)";
      });
      regexp = regexp.replace(/\//g, "\\\/")
      regexp = new RegExp(regexp, "ig")
      var route = {url: route, regexp: regexp, parameters: parameters, action: routes[route]}
      list.push(route);
    }
    return list;
  }


  function harvestRouteParameters(url) {
  }

  return unite;
})(unite || {});

