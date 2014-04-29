#!/usr/bin/env node

var flp = require('./');
var inputFile = process.argv[2];

if (!inputFile) {
  console.log("Usage: flp-parse filee.flp");
  process.exit(1);
}

flp.parseFile(inputFile, {debug: true}, function(err, projectInfo) {
  if (err) throw err;
  console.log(projectInfo);
});
