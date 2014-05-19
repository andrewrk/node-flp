#!/usr/bin/env node

var flp = require('./');
var inputFile = process.argv[2];

if (!inputFile) {
  console.log("Usage: flp-parse file.flp");
  process.exit(1);
}

flp.parseFile(inputFile, function(err, projectInfo) {
  if (err) throw err;
  console.log(projectInfo);
});
