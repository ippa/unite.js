#!/usr/bin/env ruby

#
# Build a standalone, all-including unite.js by combining all the files in src/-directory into one
#
File.open("unite.js", "w") do |out|
  out.write("/* Built at #{Time.now.to_s} */\n")
  files = ["core.js", "router.js"]
  files.each { |file| out.write( File.read("src/#{file}") ) }
  out.write(";unite.addEvent(window, \"load\", function() { if(unite.onload) unite.onload(); }, false);")
end

#
# Minify unite.js into unite-min.js using googles closure compiler
# 
require 'net/http'
require 'uri'

def compress(js_code, compilation_level)
  response = Net::HTTP.post_form(URI.parse('http://closure-compiler.appspot.com/compile'), {
    'js_code' => js_code,
    'compilation_level' => "#{compilation_level}",
    'output_format' => 'text',
    'output_info' => 'compiled_code'
    # 'output_info' => 'errors'
  })
  response.body
end

js_code = File.read("unite.js")
File.open("unite-min.js", "w") { |out| 
  out.write("/* Built at #{Time.now.to_s} */\n")
  out.write compress(js_code, "SIMPLE_OPTIMIZATIONS") # option: ADVANCED_OPTIMIZATIONS
}  

