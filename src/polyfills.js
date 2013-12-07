/* POLYFILLS used by unite.js internally */
if(!Array.prototype.forEach) {
  Array.prototype.forEach = function (fn, scope) {
    var i, len;
    for (i = 0, len = this.length; i < len; ++i) {
      if(i in this) {
        fn.call(scope, this[i], i, this);
      }
    }
  };
}

if(!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(needle) {
    var index = -1;

    for(var i=0; i < this.length; i++) {
      if(this[i] === needle) {
        index = i;
        break;
      }
    }
    return index;
  };
}

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

