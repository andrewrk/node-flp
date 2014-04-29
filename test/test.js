var path = require('path');
var assert = require('assert');
var fs = require('fs');
var flp = require('../');

var describe = global.describe;
var it = global.it;

var tests = [
  {
    filename: '1-blank.flp',
    tempo: 140,
  },
  {
    filename: '2-named.flp',
    tempo: 140,
  },
  {
    filename: '3-3.3-time-sig.flp',
    tempo: 140,
  },
  {
    filename: '4-130-bpm.flp',
    tempo: 130,
  },
  {
    filename: '4front+mjcompressor.flp',
    tempo: 140,
  },
  {
    filename: '4frontpiano.flp',
    tempo: 140,
  },
  {
    filename: '5-replace-sampler-with-3xosc.flp',
    tempo: 130,
  },
  {
    filename: '6-turn-osc3-volume-down.flp',
    tempo: 130,
  },
  {
    filename: 'ambience.flp',
    tempo: 140,
  },
  {
    filename: 'audio-clip.flp',
    tempo: 140,
  },
  {
    filename: 'effects.flp',
    tempo: 140,
  },
  {
    filename: 'native-plugins.flp',
    tempo: 140,
  },
  {
    filename: 'TheCastle_19.flp',
    tempo: 135,
  },
];

describe("in process", function() {
  tests.forEach(function(test) {
    it(test.filename, function(done) {
      var filePath = path.join(__dirname, 'flp', test.filename);
      flp.parseFile(filePath, function(err, project) {
        if (err) return done(err);
        assert.strictEqual(project.tempo, test.tempo);
        done();
      });
    });
  });
});

describe("child process", function() {
  tests.forEach(function(test) {
    it(test.filename, function(done) {
      var filePath = path.join(__dirname, 'flp', test.filename);
      var inStream = fs.createReadStream(filePath);
      var parser = flp.createParserChild();
      parser.on('end', function(project) {
        assert.strictEqual(project.tempo, test.tempo);
        done();
      });
      inStream.pipe(parser);
    });
  });
});
