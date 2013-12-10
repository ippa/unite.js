'use strict';
/*
 *
 * unite.js - router
 *
 * - Add click-listener on body, dispatch all clicks on <A> and <BUTTON> with a href.
 * - Use history.pushState exclusively
 * - Don't bother with old crappy location.hash
 *
 */
var unite = (function(unite) {
  var that = this;

  unite.router = {
    routes: [],
    regexp_routes: [],
    variable_regexp: /:([\w]+)/ig,
    scrolling: false,

    init: function(new_routes) {
      that = this;
      this.routes = new_routes;
      this.regexp_routes = this.createRegexpRoutes(this.routes);

      var body = document.getElementsByTagName('body')[0];

      /* We only fake clicks when there's been no scrolling between touchstart/touchend */
      unite.addEvent(body, "touchstart", function(e) { that.scrolling = false; }, false );
      unite.addEvent(body, "touchmove", function(e) { that.scrolling = true;  }, false );
      unite.addEvent(body, "touchend", this.touchHandler, true);

      // Chrome triggers this on pageload, IE doesn't.
      unite.addEvent(window, "popstate", this.popStateHandler, true);

      // Our standard click-event
      unite.addEvent(body, "click", this.clickHandler, true);
    },

    popStateHandler: function(e) {
      // NOTE: state-object is undefined on first pageload
      // var url = e.state ? e.state.url : window.location.pathname;
      if(!e.state) return;
      var url = e.state.url;
      that.dispatch(url, false);
    },

    touchHandler: function(e) {
      if(that.scrolling) { /* alert("was scrolling, skip fake-click!"); */ return; };

      // Skip click-events for 300ms forward. This makes sure mobile decives doesn't trigger both fake-click And normal click.
      if(that.skipClick) { /* alert("skipped click!"); */ return; }
      that.clickHandler(e);

      that.skipClick = true;
      setTimeout(function() {that.skipClick = false}, 300)
    },

    clickHandler: function(e) {
      if(that.skipClick) { /* alert("skipped clickHandler!");*/ return; }
      that.skipClick = true;
      setTimeout(function() {that.skipClick = false}, 300);

      var element = e.target || e.srcElement;
      /*
       * Travel the dom upwards until we find <A>-tag with a href, trigger click! 
       * This is needed to catch a correct click when <img> is wrapped inside <a> .. we want the <a>, not <img>
       */
      while( (element.getAttribute && element.getAttribute("href") == null) || (element.tagName != "A" && element.tagName != "BUTTON") ) {
        element = element.parentNode;
        if(!element) return;
      }
      if(element && element.getAttribute) {
        var url = element.getAttribute("href");

        // Only intercept non-external links
        if(url.indexOf("http") != 0) {
          that.dispatch(url, true);

          // IE .. as usual.
          e.cancelBubble = true;
          e.returnValue = false;

          if(e.stopPropagation) e.stopPropagation();
          if(e.preventDefault)  e.preventDefault();
        }
      }
    },

    /**
     * Dispatches an URL - meaning, acts on it.
     */
    dispatch: function(url, push_state) {
      if(push_state === undefined) push_state = true;
      if(!url) { url = window.location.pathname + window.location.search }
      console.log(">> Dispatching route " + url);

      var matchresult = that.match(url);
      
      // console.log(">> Route match " + matchresult[0] + "/" + matchresult[1]);
      if(matchresult) {
        unite.log(matchresult);

        if(matchresult.action) {
          if(history && history.pushState && push_state) {
            console.log("pushState " + url);
            history.pushState({url: url}, window.title, url);
          }

          if(unite.isFunction(matchresult.action)) {
            // console.log(">> Routeaction is a Function")
            matchresult.action(matchresult.params);
            unite.apply();
          }
          else {
            // console.log(">> Routeaction is a String")
            var scope_function = that.getScopedVariable(matchresult.action);
            var scope = scope_function[0];
            var fun = scope_function[1];
            fun.call(scope, matchresult.params);
            unite.apply();
          }
        }
      }
    },

    /**
     * 
     * @example processObjectPath("app.home.load") -> [scope(app.home), object(load)]
     */
    getScopedVariable: function(string) {
      if(!string) return undefined;
      var tmp, object, prev;
      var array = string.split(".");

      object = window[array[0]];
      for(var i=1; object && i < array.length; i++) {
        prev = object;
        object = object[array[i]];
      }
      return [prev, object]
    },

    match: function(url) {
      if(!url) return undefined;

      // The parameter-argument we send to the function router matches to.
      // Includes both classic url-parameters (?foo=bar) and unite router params (/pages/:id)
      var params = {};
      
      // Remove paremeter-string (if it exists) from url before matching route.
      if(url.indexOf("?") > 0)  {
        params = unite.urlParameters(url);
        url = url.substring(0, url.indexOf("?"));
      }
      /* First try to match simple routes without parameters */ 
      for(var route in this.routes) {
        if(route == url) return {url: url, action: this.routes[route], params: params};
      }

      /* ... Then match the more complicated regular expression routes */
      for(var i=0; i < this.regexp_routes.length; i++) {
        var regexp_route = this.regexp_routes[i];
        var values = url.match(regexp_route.regexp);

        if(values && values.length > 0) {
          values.shift();
          for(var r=0; r < regexp_route.parameters.length; r++) {
            params[regexp_route.parameters[r]] = values[r]
          }

          //return {action: regexp_route.action, regexp: regexp_route.regexp, params: regexp_route.parameters, values: values};
          return {url: url, action: regexp_route.action, params: params};
        }
      }
    },

    createRegexpRoutes: function(routes) {
      var list = [];
      for(var route in this.routes) {
        var parameters = [];
        var regexp = route.replace(this.variable_regexp, function(match, name) {
          parameters.push(name);
          return "([^/]+)";
          //return "([\\w]+)";
        });

        // We only care to make regexp routes if they contain :parameters
        if(parameters.length > 0) {
          regexp = regexp.replace(/\//g, "\\\/");
          regexp = new RegExp(regexp, "i");
          list.push( {url: route, regexp: regexp, parameters: parameters, action: this.routes[route]} )
        }
      }
      return list;
    }
  }
  return unite;
})(unite || {});

