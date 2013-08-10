/*
* ===========
* NOTE: This is only a prototype. It doesn't work yet.
* ==========
*/
infinite_scroll = {
  // Called from unite upon activation (when found in the DOM)
  init: function(element, scope, value) {
    var that = this;

    if(!unite.isFunction(value)) { throw("Directive infinite_scroll must reference a Function"); }

    this.executing_callback = false;
    this.scrollPos = this.getScrollPos();
    this.distance = 40;

    unite.addEvent(window, "scroll", dispatchScroll);
    unite.addEvent(document, "touchmove", dispatchScroll);
  },
  
  getScrollPos: function() {
    var pos1 = document.documentElement.scrollTop;
    var pos2 = window.pageYOffset;
    return pos1 > pos2 ? pos1 : pos2;
  },

  dispatchScroll: function(e) {
    if(that.executing_callback) return;
    var pageHeight = document.documentElement.scrollHeight;
    var clientHeight = document.documentElement.clientHeight;

    if (pageHeight - (scrollPos + clientHeight) < that.distance) {
      that.executing_callback = true;
      value();
      that.executing_callback = false;
    }
  }
}
