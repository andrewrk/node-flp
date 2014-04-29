# FL Studio Project File Parser

## Usage

### File API

```js
var flp = require('flp');

flp.parseFile("project.flp", function(err, projectInfo) {
  if (err) throw err;
  console.log(projectInfo);
});
```

### Stream API

```js
var flp = require('flp');
var fs = require('fs');

// or use flp.createParserChild to use a subprocess
var parser = flp.createParser();

parser.on('end', function(project) {
  console.log(project);
});

var inStream = fs.createReadStream("my-cool-project.flp");

inStream.pipe(parser);
```
