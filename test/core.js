module("core");
QUnit.config.reorder = false;
b = unite

test("public conf/api", function() {
  ok(b.isString("string"), "isString works")
  ok(b.isArray(["foo", "bar"]), "isArray works")
  ok(b.isFunction( function() {} ), "isFunction works")
  ok(b.isObject( {} ), "isObject works")
});

test("Scopes", function() {
  app = { strings: { header: "my header" } }
  tpl = '<head></head><body scope="app"><div scope="strings"><h1>{{header}}</h1></div></body>'
  out = '<head></head><body scope="app"><div scope="strings"><h1>my header</h1></div></body>'
  same(b.init(tpl).render(), out, "scoped variable, depth: 2")

  app = { strings: {headers: { header: "my header" } } }
  tpl = '<head></head><body scope="app"><div scope="strings"><h1 scope="headers">{{header}}</h1></div></body>'
  out = '<head></head><body scope="app"><div scope="strings"><h1 scope="headers">my header</h1></div></body>'
  same(b.init(tpl).render(), out, "scoped variable, depth: 3")
});

test("Variable replacement", function() {
  app = { header: "my header" }
  tpl = '<head></head><body scope="app"><h1>{{header}}</h1></body>'
  out = '<head></head><body scope="app"><h1>my header</h1></body>'
  same(b.init(tpl).render(), out, "simple variable")

  app = { greeting: "Hello", name: "ippa" }
  tpl = '<head></head><body scope="app"><h1>{{greeting}} {{name}}</h1></body>'
  out = '<head></head><body scope="app"><h1>Hello ippa</h1></body>'
  same(b.init(tpl).render(), out, "multiple variables")
  
  app = { greeting: "Hello", friends: {first: "ippa", second: "harrison"} }
  tpl = '<head></head><body scope="app"><h1>{{greeting}} {{friends.first}} and {{friends.second}}</h1></body>'
  out = '<head></head><body scope="app"><h1>Hello ippa and harrison</h1></body>'
  same(b.init(tpl).render(), out, "nested variables")

  root = { app: { greeting: "Hello", friends: {first: "ippa", second: "harrison"} } }
  tpl = '<head></head><body scope="root.app"><h1>{{greeting}} {{friends.first}} and {{friends.second}}</h1></body>'
  out = '<head></head><body scope="root.app"><h1>Hello ippa and harrison</h1></body>'
  same(b.init(tpl).render(), out, "more nested variables")

  app = { color: "red" }
  tpl = '<head></head><body scope="app" style="background: {{color}}"></body>'
  out = '<head></head><body scope="app" style="background: red"></body>'
  same(b.init(tpl).render(), out, "variable in attribute value")

  app = { colors: { background: "red" } }
  tpl = '<head></head><body scope="app" style="background: {{colors.background}}"></body>'
  out = '<head></head><body scope="app" style="background: red"></body>'
  same(b.init(tpl).render(), out, "nested variable in attribute value")


  /*
  root = { app: { strings: {greeting: "Hello", friends: {first: "ippa", second: "harrison"} } } }
  tpl = '<head></head><body scope="root.app"><h1 scope="strings">{{greeting}} {{friends.first}} and {{friends.second}}</h1></body>'
  out = '<head></head><body scope="root.app"><h1 scope="strings">Hello ippa and harrison</h1></body>'
  same(b.init(tpl).render(), out, "even more nested variables")

  app = {header: "my header"}
  app2 = {header: "the other header"}
  tpl = '<head></head><body scope="app"><h1>{{window.app2.header}}</h1></body>'
  out = '<head></head><body scope="app"><h1>breakout header</h1></body>'
  same(b.init(tpl).render(), out, "breakout variable")
  */
});
test("Variable() replacement with functions", function() {
  app = { getHeader: function() { return "my header" } }
  tpl = '<head></head><body scope="app"><h1>{{getHeader()}}</h1></body>'
  out = '<head></head><body scope="app"><h1>my header</h1></body>'
  same(b.init(tpl).render(), out, "execute variable() and use returnvalue")

  app = { color: "red", getColor: function() { return this.color } }
  tpl = '<head></head><body scope="app"><h1 style="color: {{getColor()}}">header</h1></body>'
  out = '<head></head><body scope="app"><h1 style="color: red">header</h1></body>'
  same(b.init(tpl).render(), out, "execute variable() in attribute and use returnvalue")
});

test("Loops", function() {
  app = { list: ["foo", "bar"] }
  tpl = '<head></head><body scope="app"><div loop="list">{{this}}</div></body>'
  out = '<head></head><body scope="app"><div loop="list" style="display: none;">{{this}}</div><div>foo</div><div>bar</div></body>'
  same(b.init(tpl).render(), out, "loop over array with strings")

  /*
  app = { list: ["foo", "bar"], "class": "test" }
  tpl = '<head></head><body scope="app"><div loop="list"><span class="{{class}}">{{this}}</span></div></body>'
  out = '<head></head><body scope="app"><div loop="list" style="display: none;"><span class="test">foo</span></div><div><span class="test">bar</span></div></body>'
  same(b.init(tpl).render(), out, "loop with childs")
  */

  app = { list: ["foo", "bar"] }
  tpl = '<head></head><body scope="app"><div loop="list">{{_index}} - {{_human_index}} - {{this}}</div></body>'
  out = '<head></head><body scope="app"><div loop="list" style="display: none;">{{_index}} - {{_human_index}} - {{this}}</div><div>0 - 1 - foo</div><div>1 - 2 - bar</div></body>'
  same(b.init(tpl).render(), out, "special loop-variables")

  app = { list: [{name: "ippa", speciality: "javascript"}, {name: "harrison", speciality: "design"}] }
  tpl = '<head></head><body scope="app"><div loop="list">{{name}} does {{speciality}}</div></body>'
  out = '<head></head><body scope="app"><div loop="list" style="display: none;">{{name}} does {{speciality}}</div><div>ippa does javascript</div><div>harrison does design</div></body>'
  same(b.init(tpl).render(), out, "looping through objects")
});

test("Datareplacement and re-render", function() {
  app = { list: [1, 2] }
  tpl = '<head></head><body scope="app"><div loop="list">{{this}}</div></body>'
  out = '<head></head><body scope="app"><div loop="list" style="display: none;">{{this}}</div><div>1</div><div>2</div></body>'
  same(b.init(tpl).render(), out, "loop over array of numbers")

  app.list = [3, 4]
  b.update();
  out = '<head></head><body scope="app"><div loop="list" style="display: none;">{{this}}</div><div>3</div><div>4</div></body>'
  same(b.render(), out, "loop over new same-size array of numbers")

  app = { list: [{nr: 1}, {nr: 2}] }
  tpl = '<head></head><body scope="app"><div loop="list">{{nr}}</div></body>'
  out = '<head></head><body scope="app"><div loop="list" style="display: none;">{{nr}}</div><div>1</div><div>2</div></body>'
  same(b.init(tpl).render(), out, "loop over array of objects")

  app.list = [{nr: 3}, {nr: 4}]
  b.update();
  out = '<head></head><body scope="app"><div loop="list" style="display: none;">{{nr}}</div><div>3</div><div>4</div></body>'
  same(b.render(), out, "loop over new same-size array of numbers")


  app = { list: [{nr: 1}, {nr: 2}] }
  tpl = '<head></head><body scope="app"><div loop="list"><span id="{{nr}}"></span></div></body>'
  out = '<head></head><body scope="app"><div loop="list" style="display: none;"><span id="{{nr}}"></span></div><div><span id="1"></span></div><div><span id="2"></span></div></body>'
  same(b.init(tpl).render(), out, "loop over array of objects with var-filled html-tag within loop")

  app.list = [{nr: 3}, {nr: 4}]
  b.update();
  out = '<head></head><body scope="app"><div loop="list" style="display: none;"><span id="{{nr}}"></span></div><div><span id="3"></span></div><div><span id="4"></span></div></body>'
  same(b.render(), out, "loop over new same-size array of objects with var-filled html-tag within loop")

});

test("Events", function() {
  /*
  app = { 
    clicks: 0,
    increment_counter: function() { this.clicks += 1; }
  }
  tpl = '<head></head><body scope="app"><button id="mainbutton" action="increment_counter"></body>'
  b.init(tpl);
  same(app.clicks, 0, "clicks = 0 to start")
  */

  //b.document.getElementById("mainbutton").click();
  //same(app.clicks, 1, "clicks = 1 after click-event")
});
