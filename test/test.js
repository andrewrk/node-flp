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
    plugins: ['4Front Piano', 'MjMultibandCompressor'],
  },
  {
    filename: '4frontpiano.flp',
    tempo: 140,
    plugins: ['4Front Piano'],
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
    plugins: ['Ambience'],
  },
  {
    filename: 'audio-clip.flp',
    tempo: 140,
  },
  {
    filename: 'effects.flp',
    tempo: 140,
    plugins: ['Ambience', 'Edison', 'Gross Beat', 'Hardcore',
    'Maximus', 'MjMultibandCompressor', 'Soundgoodizer', 'Vocodex'],
  },
  {
    filename: 'native-plugins.flp',
    tempo: 140,
  },
  {
    filename: 'TheCastle_19.flp',
    tempo: 135,
    plugins: ['Synth1 VST', 'DirectWave', 'Sytrus'],
  },
  {
    filename: 'listen-to-my-synthesizer.flp',
    tempo: 140,
    plugins: ['Nexus', 'Synth1 VST'],
  },
  {
    filename: 'mdl.flp',
    tempo: 140,
    plugins: ['Decimort', 'Altiverb 6', 'FabFilter Timeless 2', 'FabFilter Pro-L'],
  },
  {
    filename: 'nucleon-orbit.flp',
    tempo: 132,
    plugins: ['Harmless', 'Sytrus', 'Slicex', 'Maximus'],
  },
];

describe("in process", function() {
  tests.forEach(function(test) {
    it(test.filename, function(done) {
      var filePath = path.join(__dirname, 'flp', test.filename);
      flp.parseFile(filePath, function(err, project) {
        if (err) return done(err);
        assert.strictEqual(project.tempo, test.tempo);
        if (test.plugins) {
          test.plugins.forEach(projectMustHavePlugin);
        }
        done();

        function projectMustHavePlugin(pluginName) {
          var ok = false;
          for (var i = 0; i < project.channels.length; i += 1) {
            var generatorName = project.channels[i].generatorName;
            if (generatorName === pluginName) ok = true;
          }
          assert.ok(ok, "project is missing plugin: " + pluginName);
        }
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
        if (test.plugins) {
          test.plugins.forEach(projectMustHavePlugin);
        }
        done();

        function projectMustHavePlugin(pluginName) {
          var ok = false;
          for (var i = 0; i < project.channels.length; i += 1) {
            var generatorName = project.channels[i].generatorName;
            if (generatorName === pluginName) ok = true;
          }
          assert.ok(ok, "project is missing plugin: " + pluginName);
        }
      });
      inStream.pipe(parser);
    });
  });
});
