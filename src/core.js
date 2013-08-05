'use strict';
/*
 *
 * unite.js - lightweight 2-way hierarchical databinding 
 *
 * - no dependencies, work with vanilla js-objects, lightwight powerfull scoping
 * - supports webkit, firefox, ie 8+
 *
 * introduces 3 custom attributes called directives:
 *
 * - scope            <div scope="header"><h1>{{title}}</h1></div>
 * - event            <button event="doSomething">Click me</button>
 * - loop             <li loop="persons">{{name}}</li>
 *
 */
var unite = (function(unite) {

  /* Private variables */
  var tag_to_default_events = {
    "SELECT": ["change"],
    "INPUT":  ["change"],
    "BUTTON": ["click", "touchend"],
    "A":      ["click", "touchend"]
  }

  /* Public variables / configuration */
  unite.variable_regexp = /{{([\w\.\(\)]+)}}/gi;

  /* Returns the new HTML with variables/directives fullfilled */
  unite.render = function() {
    return unite.document.documentElement.innerHTML;
  }

  /*
   * Our main entry point:
   *
   * 1) Parses provided HTML or current document. 
   * 2) Creates a list of referenced (by directives or variables) elements in array unite.bindings.
   * 3) Applies directives and variables to the right elements
   * 4) Attaches
   *
   * @returns this
   */
  unite.init = function(html, options) {
    if(options === undefined) options = {render: true};

    var elements;
    unite.debug = unite.urlParameters()["debug"] == "1";

    /* masterlist containing all variables referenced in the DOM and their values */
    unite.variable_content = {};

    /* masterlist containing all bindings/variables referenced in the DOM */
    unite.bindings = [];

    if(unite.isString(html)) {
      unite.document = document.implementation.createHTMLDocument(""); // IE needs a title-argument here
      unite.document.documentElement.innerHTML = html;
    }
    else {
      unite.document = document;
    }

    elements = unite.document.querySelectorAll("*");
    unite.bindings = getBindings(elements).reverse();
    // addEvent(unite.document.uniteody, "mouseup", unite.update);
    if(options.render != false) unite.applyDirty();
    return this;
  }

  /*
   * Runs when it's possible that a variable has changed.
   */
  unite.update = function() {
    unite.applyDirty();
  }

  /* Applies a bindings data to it's elements */
  unite.apply = function(binding) {
    var tag = binding.element.tagName;
    unite.log("Apply() " + tag + ": " + binding.scope + " -> " + identifyObject(scope));

    // Resolve what event we should listen to
    var events = tag_to_default_events[tag];
    if(!events) events = ["click"];

    // Callback object(el) -> el.srcElement vs el.target
    if(binding.event && binding.loop) {
      unite.log("event + loop for " + tag);
      var event_handler = getValue(binding.scope + "." + binding.event);
      var event_handler_with_logic = function(e) { 
        var target = e.target || e.srcElement;
        event_handler(e);  // Default behaivor, call event_handler with event-object
        unite.update(); 
      }
      unite.addEvent(binding.element.parentNode, events, event_handler_with_logic);

      var scope = getValue(binding.scope + "." + binding.loop);
      loopElement(binding.element, scope, binding);
    }
    else if(binding.event && !binding.loop) {
      var event_handler = getValue(binding.scope + "." + binding.event);
      var event_handler_with_update = function(e) { event_handler(e); unite.update(); }
      unite.addEvent(binding.element, events, event_handler_with_update);
    }
    else if(!binding.event && binding.loop)  { 
      var scope = getValue(binding.scope + "." + binding.loop);
      loopElement(binding.element, scope, binding);
    }
    else { 
      var scope = getValue(binding.scope);
      applyElement(binding.element, scope, binding);
    }
  }

  function applyElement(element, scope, binding) {
    // Denna får ALLA underelement. så när den körs på <BODY> så gås hela sidan igenom.
    // NOTE: <div loop="persons">{{name}}</div> will return 0 elements
    var elements = element.querySelectorAll("*");

    unite.log("binding.scope: ", binding.scope, ", elements: ", elements.length, ", content", binding.content);
    unite.applyAttributes(element, binding.attributes, binding, scope);
    unite.applyText(element, scope, binding);     

    /* Apply to all child-elements */
    for(var i=0; i < elements.length; i++) {
      var attrs = unite.attributesWithVariables(elements[i]);
      unite.applyText(elements[i], scope, binding);
      unite.applyAttributes(elements[i], attrs, binding, scope);
    }
  }

  unite.applyAttributes = function(element, attributes, binding, scope) {
    for(var i=0; i < attributes.length; i++) {
      for(var attr in attributes[i]) {
        var value = attributes[i][attr].replace(unite.variable_regexp, function(match, name) { 
          if(scope[name] !== undefined) { return scope[name] }
          else {
            var ret = getValue(binding.scope + "." + name);
            return (ret !== undefined) ? ret : match
          }
        });
        
        // IE workaround. IE won't add this to the DOM: style="color: {{color}}" cause it's "malformed attribute".
        // data-style could contain whatever though, so that's our workaround for now.
        if(attr == "data-style")  element.setAttribute("style", value);
        element.setAttribute(attr, value);
      }
    }
  }

  unite.applyText = function(element, scope, binding) {
    var child = element.childNodes[0];
    if(child && child.nodeType == 3) {
      var value = binding.content || child.nodeValue;
      child.nodeValue = value.replace(unite.variable_regexp, function(match, name) { 
        if(scope[name] !== undefined) { 
          unite.log("applyElement(): ", name, " -> ", scope[name]);
          return scope[name];
        }
        else { 
          var variable = binding.scope + "." + name;
          unite.log("applyElement(): ", variable, " -> " + getValue(variable));
          var ret = getValue(variable);
          return (ret !== undefined) ? ret : match;
        }
      });
    }
  }

  /* Checks for bindings with dirty data and runs apply() on them */
  unite.applyDirty = function() {
    for(var variable in unite.variable_content) {
      if( unite.isDirty(variable, unite.variable_content[variable]) ) {
        var new_value = getValue(variable);
        unite.log("Variable has changed: ", variable, ": ", unite.variable_content[variable], " -> ", new_value);

        unite.variable_content[variable] = unite.clone(new_value);

        var bindings = findBindingsWithVariable(variable);
        for(var i=0; i < bindings.length; i++)  unite.apply( bindings[i] );
      }
    }
  }

  /* Applies all data to all variables */
  unite.applyAll = function() {
    for(var variable in unite.variable_content) {
      var bindings = findBindingsWithVariable(variable);
      for(var i=0; i < bindings.length; i++)  unite.apply( bindings[i] );
    }
  }


  /*
   * Clones objects and arrays. Returns argument for other datatypes.
   *
   * http://jsperf.com/cloning-an-object/2
   *
   */
  unite.clone = function(value) {
    if(unite.isArray(value))    return value.slice(0);
    if(unite.isObject(value))   return JSON.parse(JSON.stringify(value));
    //return JSON.parse(JSON.stringify(value));
    return value;
  }

  /*
   * Checks if a variable has a new value (with regards to prev_content). 
   * Checking arrays means iterating over all values and comparing.
   *
   * A bit simplified and crude:
   * - Treats NaN, false, undefined as the same value.
   * - Doesn't detect functions in arrays
   * - Probably other things
   *
   * @returns true|false
   *
   * http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
   */
  unite.isDirty = function(variable, prev_value) {
    var current_value = getValue(variable);

    if(!prev_value && !current_value)   return false;
    if(!prev_value && current_value)    return true;
    if(prev_value && !current_value)    return true;
    if(unite.isFunction(prev_value) && unite.isFunction(current_value)) { return (prev_value.toString() != current_value.toString()) }
    
    if(prev_value.length !== undefined && current_value.length !== undefined) {
      if(prev_value.length != current_value.length) return true;
    }
    if(JSON.stringify(prev_value) != JSON.stringify(current_value)) {
      return true;
    }
    if(JSON.stringify(prev_value) == JSON.stringify(current_value)) return false;
    else if(prev_value != current_value)     return true;
    return false;
  }

  /*
   * Find all bindings that are references by a certain variable 
   * @returns array of bindings
   */
  function findBindingsWithVariable(variable) {
    var list = [];
    for(var i=0; i < unite.bindings.length; i++) {
      if( indexOf.call(unite.bindings[i].variables, variable) != -1 ) {
        list.push(unite.bindings[i])
      }
    }
    return list;
  }

  /*
   * General way to add events across browsers
   */
  unite.addEvent = function(obj, type, fn, useCapture) {
    // If event-type is an array, bind to all events in that array
    if(unite.isArray(type)) {
      for(var i=0; i < type.length; i++) unite.addEvent(obj, type[i], fn, useCapture);
      return;
    }

    // alert("addEvent " + type + " -> " + fn.toString())
    if(obj.addEventListener) { obj.addEventListener(type, fn, useCapture); }
    else if(obj.attachEvent) {
      obj["e" + type + fn] = fn;
      obj[type + fn] = function () { obj["e" + type + fn](window.event); }
      obj.attachEvent("on" + type, obj[type + fn]);
    }
    else { obj["on" + type] = obj["e" + type + fn]; }
  }

  /*
   * Parses a document (consisting of several elements), looking for unite.js directives
   * Creates a list with element, variable-name and value
   */
  function getBindings(elements) {
    var list = [];

    for(var i=0; i < elements.length; i++) {
      var element = elements[i];

      var attributes = unite.attributesWithVariables(element);
      var content = contentWithVariables(element);
      var scope = getScope(element);
      var variables = cleanedVariables(element, scope);  // Get _all_ variables without {{ }} references in an element

      if(variables.length > 0) {
        for(var v=0; v < variables.length; v++) { unite.variable_content[ variables[v] ] = ""; }

        var event = element.getAttribute("event");
        var loop = element.getAttribute("loop");
        var tpl_element = null;

        var entry = {element: element, scope: scope, event: event, attributes: attributes, variables: variables, content: content}

        // Looping element, clone original element (for later further cloning) and hide it.
        if(loop) {
          element["loop_id"] = genID();
          tpl_element = element.cloneNode(); 
          tpl_element.innerHTML = element.innerHTML; 
          tpl_element["loop_id"] = element["loop_id"];
          tpl_element.removeAttribute("loop"); 
          entry["tpl_element"] = tpl_element;
          entry["loop"] = loop;

          element.style.display = "none";
        }
        list.push(entry);
      }
    }
    return list;
  }

  /**
   * @param {element}
   * @returns {array} list of elements creapted by loop
   */
  function getLoopedElements(element, loop_id) {
    var list = [];
    var elements = element.parentNode.querySelectorAll("*");
    for(var i=0; i < elements.length; i++) {
      if( elements[i]["looped_id"] == loop_id ) list.push(elements[i]);
    }
    return list;
  }


  function loopElement(element, scopes, binding) {
    // http://jsperf.com/replace-text-vs-reuse/2
    var reusable_elements = getLoopedElements(element, element["loop_id"]);
    var reuse_counter = 0;
    var new_element, prev_element;

    // console.log(">> loopElement() .. found ", reusable_elements.length, " reusable elements");

    //
    // TEMP HACK UNTILL WE SORT OUT:
    // <a loop='images' href="/bilder/{{id}}"><img src="/bilder/{{id}}_size2.jpg" id="{{id}}"/></a>
    //
    // ( img src="" doesn't change )
    //
    while(reuse_counter < reusable_elements.length) {
      element.parentNode.removeChild( reusable_elements[reuse_counter] );
      reuse_counter += 1;
    }

    for(var i=0; scopes && (i < scopes.length); i++) {
      var scope = scopes[i];

      if( !unite.isObject(scope) ) {
        scope = {};
        scope["this"] = scopes[i];
        scope["_index"] = i;
        scope["_human_index"] = i+1;
      }

      if(reuse_counter < reusable_elements.length) {
        new_element = reusable_elements[reuse_counter];
        applyElement(new_element, scope, binding);
        reuse_counter += 1;
      }
      else {
        new_element = binding.tpl_element.cloneNode();
        new_element.innerHTML = binding.tpl_element.innerHTML;
        new_element["looped_id"] = element["loop_id"];
        applyElement(new_element, scope, binding);
        if(prev_element)  insertAfter(prev_element, new_element);
        else              insertAfter(element, new_element);

      }
      prev_element = new_element;
    }

    // Remove all un-used elements generated from previous loops
    while(reuse_counter < reusable_elements.length) {
      element.parentNode.removeChild( reusable_elements[reuse_counter] );
      reuse_counter += 1;
    }
  }

  function insertAfter(node, new_node) {
    node.parentNode.insertBefore(new_node, node.nextSibling);
  }

  function cleanedVariables(element, scope) {
    var list = [];
    var tmp_list = [];
    var tmp_list2 = "";

    // Create array with variables from  text-content
    var content = elementContent(element);
    if(content)   tmp_list2 = content.match(unite.variable_regexp);
    if(tmp_list2) tmp_list = tmp_list.concat(tmp_list2)

      // Create array with variables from attribute-values
      for(var i=0; i < element.attributes.length; i++) {
        tmp_list2 = element.attributes[i].nodeValue.match(unite.variable_regexp);
        if(tmp_list2) tmp_list = tmp_list.concat( tmp_list2 );
      }

    // Scrub variables from {{ }}-brackets and scope them properly before adding to list
    for(var i=0; i < tmp_list.length; i++) {
      var tmp = tmp_list[i].replace(unite.variable_regexp, function(m, n) { return n });
      if(tmp != "_index" && tmp != "_human_index" && tmp != "this") {
        list.push(scope + "." + tmp);
      }
    }

    // Add special attribute-variables like  event="doSomething"
    for(var i=0; i < element.attributes.length; i++) {
      var name = element.attributes[i].nodeName;
      var value = element.attributes[i].nodeValue;
      if(name == "scope" || name == "loop")   list.push(scope);
      else if(name == "event")                list.push(scope + "." + value);
    }

    return list;
  }

  /*
   * Gets scope from element
   * @return String
   */
  function getScope(element) {
    var path = [];
    var value = element.getAttribute("scope")// || element.getAttribute("loop");
    if(value) {
      // if(value.indexOf("window.") != -1) return undefined;
      if(value[0] == ".") return undefined; 
      path = [value]
    }

    var element = element.parentNode;
    while(element.getAttribute) {
      var scope = element.getAttribute("scope");
      if(scope) path.push(scope);
      element = element.parentNode
    }    
    return path.length > 0 ? path.reverse().join(".") : undefined
  }

  function elementContent(element) {
    var child = element.childNodes[0];
    if(child && child.nodeType == 3) {
      return child.nodeValue;
    }
  }

  /* Find {{vars}} in text-nodes */
  function contentWithVariables(element) {
    var child = element.childNodes[0];
    if(child && child.nodeType == 3) {
      if(containsVariable(child.nodeValue)) {
        return child.nodeValue;
      }
    }
  }

  /* Find {{vars}} in attributes */
  unite.attributesWithVariables = function(element) {
    // value = binding.attributes[i][attr].replace(unite.variable_regexp, function(match, name) { });
    var list = [];
    for(var i=0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      if( containsVariable(attr.nodeValue) ) {
        var obj = {}
        obj[attr.nodeName] = attr.nodeValue;
        list.push(obj);
      }
    }
    return list;
  }

  function containsVariable(string) {
    return string.match(unite.variable_regexp);
  }

  /**
   * Takes an string representing a value as argument, ie. "app.home.value" and returns the object.
   * We do this without using eval but rather looking up the values starting with "window".
   *  
   * Notes:
   * - if the object is a function, execute it and use return value
   * - if there's ".."-breakout in the string, restart lookup from global window.
   *
   */
  function getValue(variable) {
    if(!variable) return undefined;
    // console.log("* getValue(" + variable +")")
    var tmp, object, prev;
    
    /* ".." means breakout-value, basically <div scope="app">{{.value}}</div> */
    var array = variable.split("..");
    if(array.length > 1) {
      variable = array[array.length-1];
    }

    array = variable.split(".");

    object = window[array[0]];
    for(var i=1; (object !== undefined) && (i < array.length); i++) {
      prev = object;
      tmp = object[array[i]];

      /* If variable name is ending with () AND are functions, execute them and use return value! */
      if(array[i].slice(-2) == "()") {
        var var2 = array[i].replace("()","");
        try {
          tmp = object[var2]();
        }
        catch(e) {
          console.log(e)
        }
        unite.log("EXECUTE FUNCTION: ", array[i]);
      }
      if(i == array.length-1) {
        /* Bind function to parent to get a correct _this_ */
        if( unite.isFunction(tmp) ) { tmp = tmp.bind(prev) }
        return tmp;
      }
      if( !unite.isFunction(tmp) )  object = tmp;
    }
    return object;
  }

  function identifyObject(object) {
    if(unite.isArray(object))     return "array";
    if(unite.isFunction(object))  return "function";
    if(unite.isString(object))    return "string";
    if(unite.isNumber(object))    return "number";
    return "object";
  }

  /**
   * Return a hash of url-parameters and their values
   *
   * @example
   *   // Given the current URL is <b>http://test.com/?debug=1&foo=bar</b>
   *   urlParameters() // --> {debug: 1, foo: bar}
   */
  unite.urlParameters = function() {
    var parameters = {}, hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
      hash = hashes[i].split('=');
      parameters[hash[0]] = hash[1];
    }
    return parameters;
  }

  /** A better debug printer. Mostly cause console.log("Important Object: " + obj) => obj.toString() which sucks */
  unite.log = function() {
    if(!unite.debug) return;
    var s = "";
    for(var i=0; i < arguments.length; i++) {
      var arg = arguments[i];
      if(unite.isString(arg))       s += arg;
      else if(unite.isObject(arg))  s += JSON.stringify(arg);
      else                          s += arg.toString();
    }
    if(console) console.log(s);
    else        alert(s);
  }

  /** Returns true if obj is a String */
  unite.isString = function(value) { 
    return (typeof value == 'string') 
  }

  /** Returns true if value is simple Object */
  unite.isObject = function(value) { 
    return value != null && typeof value == 'object';
  }

  /** Returns true if obj is an Array */
  unite.isArray = function(value)  { 
    if(value === undefined) return false;
    return !(value.constructor.toString().indexOf("Array") == -1) 
  }

  /** Returns true of obj is a Function */
  unite.isFunction = function(value) { 
    return (Object.prototype.toString.call(value) === "[object Function]") 
  }

  /** Returns true of obj is a Number */
  unite.isNumber = function(value) { 
    return !isNaN(value)
  }

  /** gen a 16 char long hexadec id */ 
  function genID() {
    return Math.floor(Math.random() * 0x100000000).toString(16) + Math.floor(Math.random() * 0x100000000).toString(16);
  }

  function indexOf(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
      indexOf = Array.prototype.indexOf;
    } 
    else {
      indexOf = function(needle) {
        var i = -1, index;

        for(i = 0; i < this.length; i++) {
          if(this[i] === needle) {
            index = i;
            break;
          }
        }

        return index;
      }
    }
    return indexOf.call(this, needle);
  };

  /* START POLYFILLS */
  /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind */
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5 internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }

      var aArgs = Array.prototype.slice.call(arguments, 1), 
          fToBind = this, 
          fNOP = function () {},
          fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis
                ? this
                : oThis,
                aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  /* END POLYFILLS */

  return unite;
})(unite || {});

