'use strict';
/*
 *
 * unite.js - router
 *
 * - Use history.pushState exclusively
 * - Don't bother with old crappy location.hash
 *
 */
var last_click;

var unite = (function(unite) {
  var that = this;

  unite.router = {
    routes: [],
    regexp_routes: [],
    variable_regexp: /:([\w]+)/ig,

    init: function(new_routes) {
      that = this;
      this.routes = new_routes;
      this.regexp_routes = this.createRegexpRoutes(this.routes);

      var body = document.getElementsByTagName('body')[0];
      unite.addEvent(body, "click", this.clickHandler, true);
      console.log("Router.init!")
      console.log(body)
    },

    clickHandler: function(e) {
      var element = e.target || e.srcElement;
      var route;
    
      /*
      * Travel the dom upwards until we find <A>-tag with a href, trigger click! 
      * This is needed to catch a correct click when <img> is wrapped inside <a> .. we want the <a>, not <img>
      */
      while( (element.getAttribute("href") == null) || element.tagName != "A") {
        element = element.parentNode
      }
      var url = element.getAttribute("href");

      var matchresult = that.match(url);
      if(matchresult) {
        unite.log(matchresult)
        
        if(matchresult.action) {
          var state = {url: url}
          history.pushState(state, window.title, url);      
          matchresult.action(matchresult.params);
        }
        e.stopPropagation();
      }
      e.preventDefault();
    },

    match: function(url) {
      if(!url) return undefined;
      /* First try to match simple routes without parameters */ 
      for(var route in this.routes) {
        if(route == url) return {url: url, action: this.routes[route], params: {}};
      }
      
      /* ... Then match the more complicated regular expression routes */
      for(var i=0; i < this.regexp_routes.length; i++) {
        var regexp_route = this.regexp_routes[i];
        var values = url.match(regexp_route.regexp);

        if(values && values.length > 0) {
          values.shift();

          var params = {};
          for(var r=0; r < regexp_route.parameters.length; r++) {
            params[regexp_route.parameters[r]] = values[r]
          }

          //return {action: regexp_route.action, regexp: regexp_route.regexp, params: regexp_route.parameters, values: values};
          return {url: url, action: regexp_route.action, params: params};
        }
      }
    },

    createRegexpRoutes: function(routes) {
      var list = []
      for(var route in this.routes) {
        var parameters = [];
        var regexp = route.replace(this.variable_regexp, function(match, name) {
          parameters.push(name);
          return "([\\w]+)";
        });
        regexp = regexp.replace(/\//g, "\\\/");
        regexp = new RegExp(regexp, "i")
        var route = {url: route, regexp: regexp, parameters: parameters, action: this.routes[route]}
        list.push(route);
      }
      return list;
    }
  }
  return unite;
})(unite || {});

