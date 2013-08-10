/*
* USAGE:
*
* swipe = new Swipe();
*
* swipe.setup();
* swipe.left = function() { alert("left swipe") }
* swipe.right = function() { alert("right swipe") }
*
* ===========
* NOTE: This is only a prototype. It doesn't work yet.
* ===========
*/

function Swipe(options) {
  this.horizontal_margin = 40;
  this.vertical_margin = 90;
  var start_x;
  var start_y;
  var stop_x;
  var stop_y;
  var that = this;

  this.setup = function(options) {
    if(!options.element) { options.element = document.body; } // window
    
    if('ontouchstart' in options.element)   options.element.addEventListener("touchstart", this._ontouchstart);
    if('ontouchend' in options.element)     options.element.addEventListener("touchend", this._ontouchend);

    /*
      options.element.ontouchstart =  this._ontouchstart;
      options.element.ontouchend = this._ontouchend;
    */
  };

  this._ontouchstart = function(e) {
    var touch = e.touches ? e.touches[0] : e.touch;
    start_x = touch.clientX;
    start_y = touch.clientY;
    
    e.preventDefault();
    if(e.stopPropagation) e.stopPropagation();
  };

  this._ontouchend = function(e) {
    var stop_x;
    var stop_y;

    if(e.changedTouches) {
      stop_x = e.changedTouches.item(0).clientX;
      stop_y = e.changedTouches.item(0).clientY;
    }
    else {
      var touch = e.touches ? e.touches[0] : e.touch;
      stop_x = touch.clientX;
      stop_y = touch.clientY;
    }
 
    var swipe_horizontal = start_x - stop_x;
    var swipe_vertical = start_y - stop_y;

    // if(debug) alert("swipe_horizontal: " + swipe_horizontal + ", swipe_vertical: " + swipe_vertical);

    // Only consider horizontal swipes if they have gone further then vertical ones
    if( Math.abs(swipe_horizontal) > Math.abs(swipe_vertical) ) {
      if(swipe_horizontal < -that.horizontal_margin) { that.right(); }
      if(swipe_horizontal > that.horizontal_margin)  { that.left(); }
    }
    // and vice versa.
    else {
      if(swipe_vertical < -that.vertical_margin) { that.down(); }
      if(swipe_vertical > that.vertical_margin)  { that.up(); }
    }
 
    e.preventDefault();
    if(e.stopPropagation) e.stopPropagation();
  };

  this.left = function() {};
  this.right = function() {};
  this.up = function() {};
  this.down = function() {};
  
  this.setup(options);
};
