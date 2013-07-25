module("router");
QUnit.config.reorder = false;

test("router matching", function() {
  var f = function() { };
  var f2 = function() { };
  unite.router.init({"/contact": f});

  same(unite.router.match("/404"), undefined, "non-matching route should return undefined")
  same(unite.router.match("/contact"), {url: "/contact", action: f, params: {}}, "existing route should return match-object")
  
  unite.router.init({"/page/:title": f});
  same(unite.router.match("/page/about"), {url: "/page/about", action: f, params: {title: "about"}}, "route should return match-object with params-object")

  unite.router.init({"/category/:category/:page": f});
  same(unite.router.match("/category/javascript/3"), {url: "/category/javascript/3", action: f, params: {category: "javascript", page: "3"}}, "route should return match-object with params-object")
});
