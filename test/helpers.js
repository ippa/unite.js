module("helpers");
QUnit.config.reorder = false;

test("misc", function() {
  same( unite.urlParameters("/?id=1"), {id: "1"}, "parse out single url-parameter")
  same( unite.urlParameters("/?id=1&foo=bar"), {id: "1", foo: "bar"}, "parse out two url-parameters")
  same( unite.urlParameters("http://www.nothing.com/"), {}, "parse out two url-parameters")
});

test("unite.isDirty", function() {
  a = [1,2];
  same( unite.isDirty("a", [1,2]), false, "arrays with the same content aren't dirty");
  same( unite.isDirty("a", [1,2,3]), true, "arrays with different content are dirty");
  same( unite.isDirty("a", false), true, "arrays with different content are dirty");

  o = {foo: "bar"}
  same( unite.isDirty("o", {foo: "bar"}), false, "objects with the same content aren't dirty");
  same( unite.isDirty("o", {foo: "BOO"}), true, "objects with different content are dirty");
  same( unite.isDirty("o", undefined), true, "objects with different content are dirty");

  o = {app: {foo: "bar"}}
  same( unite.isDirty("o", {app: {foo: "bar"}}), false, "nested objects with the same content aren't dirty");
  same( unite.isDirty("o", {app: {foo: "BOO"}}), true, "nested objects with different content are dirty");
  same( unite.isDirty("o", NaN), true, "nested objects with different content are dirty");

  o = {app: [1,2,{foo: "bar"}]}
  same( unite.isDirty("o", {app: [1,2,{foo: "bar"}]}), false, "nested objects with the same content aren't dirty");
  same( unite.isDirty("o", {app: [1,3,{foo: "bar"}]}), true, "nested objects with different content are dirty");

  n = 1
  same( unite.isDirty("n", 1), false, "Equal numbers aren't dirty")
  same( unite.isDirty("n", 2), true, "different numbers are dirty")

  n = 1
  same( unite.isDirty("n", 0), true, "test two diff. numbers with one beeing false'ish")
  
  n = 0
  same( unite.isDirty("n", 1), true, "test two diff. numbers with one beeing false'ish")

  f = function() {return true}
  same( unite.isDirty("f", function() {return true}), false, "functions with the same content aren't dirty");
  same( unite.isDirty("f", function() {return false}), true, "functions with different content are dirty");

  a = {foo: {bar: 0}}
  x = {foo: {bar: 2}}
  v = unite.clone(a.foo.bar)
  same( unite.isDirty("a.foo.bar", v), false, "nested variable replacement results in dirty");

  a = x
  same( unite.isDirty("a.foo.bar", v), true, "nested variable replacement results in dirty"); 

  a.foo.bar = 4
  same( unite.isDirty("a.foo.bar", v), true, "nested variable replacement results in dirty"); 

});

test("unite.attributesWithVariables", function() {
  tpl = '<head></head><body scope="app"><button action="{{test}}" data-style="color: {{color}}"></div></body>'
  unite.init(tpl, {render: false});
  var element = unite.document.getElementsByTagName("button")[0]
  var attributes = unite.attributesWithVariables(element)

  console.log(JSON.stringify(attributes)) // IE misses style!

  // Needed because we can't tell what order they'll come in
  var var1 = attributes[0].action ? attributes[0].action : attributes[1].action
  var var2 = attributes[0]["data-style"] ? attributes[0]["data-style"] : attributes[1]["data-style"]
  same(var1, "{{test}}", "Find variables in attributes")
  same(var2, "color: {{color}}", "Find variables in attributes")
});
