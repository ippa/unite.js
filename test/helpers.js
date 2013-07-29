module("helpers");
QUnit.config.reorder = false;

test("unite.isDirty", function() {
  a = [1,2];
  same( b.isDirty("a", [1,2]), false, "arrays with the same content aren't dirty");
  same( b.isDirty("a", [1,2,3]), true, "arrays with different content are dirty");
  same( b.isDirty("a", false), true, "arrays with different content are dirty");

  o = {foo: "bar"}
  same( b.isDirty("o", {foo: "bar"}), false, "objects with the same content aren't dirty");
  same( b.isDirty("o", {foo: "BOO"}), true, "objects with different content are dirty");
  same( b.isDirty("o", undefined), true, "objects with different content are dirty");

  o = {app: {foo: "bar"}}
  same( b.isDirty("o", {app: {foo: "bar"}}), false, "nested objects with the same content aren't dirty");
  same( b.isDirty("o", {app: {foo: "BOO"}}), true, "nested objects with different content are dirty");
  same( b.isDirty("o", NaN), true, "nested objects with different content are dirty");

  o = {app: [1,2,{foo: "bar"}]}
  same( b.isDirty("o", {app: [1,2,{foo: "bar"}]}), false, "nested objects with the same content aren't dirty");
  same( b.isDirty("o", {app: [1,3,{foo: "bar"}]}), true, "nested objects with different content are dirty");

  n = 1
  same( b.isDirty("n", 1), false, "Equal numbers aren't dirty")
  same( b.isDirty("n", 2), true, "different numbers are dirty")

  f = function() {return true}
  same( b.isDirty("f", function() {return true}), false, "functions with the same content aren't dirty");
  same( b.isDirty("f", function() {return false}), true, "functions with different content are dirty");
});

test("unite.attributesWithVariables", function() {
  tpl = '<head></head><body scope="app"><button action="{{test}}" style="color: {{color}}"></div></body>'
  b.init(tpl, {render: false});
  var element = b.document.getElementsByTagName("button")[0]
  var attributes = b.attributesWithVariables(element)

  same(attributes[0].action, "{{test}}", "Find variables in attributes")
  same(attributes[1].style, "color: {{color}}", "Find variables in attributes")
});
