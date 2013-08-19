test("Events", function() {
  app = { 
    clicks: 0,
    increment_counter: function() { this.clicks += 1; }
  }
  tpl = '<head></head><body scope="app"><button id="mainbutton" event="increment_counter"></body>'
  unite.init(tpl);
  same(app.clicks, 0, "clicks = 0 to start")

  /*
  var event = unite.document.createEvent("HTMLEvents");
  event.initEvent("click", false, true);
  */
  //var e = new Event("click");

  var mouse_click_event = new MouseEvent('click', {'view': window, 'bubbles': true, 'cancelable': true});
  var button = unite.document.getElementById("mainbutton");
  button.dispatchEvent(mouse_click_event);

  same(app.clicks, 1, "app incs counter on click")
});
