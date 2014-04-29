# FL Studio Project File Parser

## Usage

```js
var flp = require('flp');

flp.parseFile("project.flp", function(err, projectInfo) {
  if (err) throw err;
  console.log(projectInfo);
});
```
