var flp = require('./');

process.on('message', function(message) {
  var options = message.value;
  var parser = flp.createParser(options);

  parser.on('error', function(err) {
    process.send({
      type: 'error',
      value: err.stack,
    });
  });

  parser.on('end', function() {
    process.send({
      type: 'end',
      value: parser.project,
    });
    process.disconnect();
  });

  process.stdin.pipe(parser);
});
