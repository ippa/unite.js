module("helpers");
QUnit.config.reorder = false;

test("Array.protoype.indexOf", function() {
  var array = ["foo","bar","moo"]
  
  same(array.indexOf("foo"), 0, "finds position of item in array")
  same(array.indexOf("foo2"), -1, "returns -1 if item isn't found")
});
