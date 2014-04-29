var Writable = require('stream').Writable;
var util = require('util');
var fs = require('fs');

// exports listed at bottom of file

var FLFxChannelCount = 64;

// FL Studio Events
// BYTE EVENTS
var FLP_Byte = 0;
var FLP_Enabled = 0;
var FLP_NoteOn = 1; //+pos (byte)
var FLP_Vol = 2;
var FLP_Pan = 3;
var FLP_MIDIChan = 4;
var FLP_MIDINote = 5;
var FLP_MIDIPatch = 6;
var FLP_MIDIBank = 7;
var FLP_LoopActive = 9;
var FLP_ShowInfo = 10;
var FLP_Shuffle = 11;
var FLP_MainVol = 12;
var FLP_Stretch = 13; // old byte version
var FLP_Pitchable = 14;
var FLP_Zipped = 15;
var FLP_Delay_Flags = 16;
var FLP_PatLength = 17;
var FLP_BlockLength = 18;
var FLP_UseLoopPoints = 19;
var FLP_LoopType = 20;
var FLP_ChanType = 21;
var FLP_MixSliceNum = 22;
var FLP_EffectChannelMuted = 27;

// WORD EVENTS
var FLP_Word = 64;
var FLP_NewChan = FLP_Word;
var FLP_NewPat = FLP_Word + 1; //+PatNum (word)
var FLP_Tempo = FLP_Word + 2;
var FLP_CurrentPatNum = FLP_Word + 3;
var FLP_PatData = FLP_Word + 4;
var FLP_FX = FLP_Word + 5;
var FLP_Fade_Stereo = FLP_Word + 6;
var FLP_CutOff = FLP_Word + 7;
var FLP_DotVol = FLP_Word + 8;
var FLP_DotPan = FLP_Word + 9;
var FLP_PreAmp = FLP_Word + 10;
var FLP_Decay = FLP_Word + 11;
var FLP_Attack = FLP_Word + 12;
var FLP_DotNote = FLP_Word + 13;
var FLP_DotPitch = FLP_Word + 14;
var FLP_DotMix = FLP_Word + 15;
var FLP_MainPitch = FLP_Word + 16;
var FLP_RandChan = FLP_Word + 17;
var FLP_MixChan = FLP_Word + 18;
var FLP_Resonance = FLP_Word + 19;
var FLP_LoopBar = FLP_Word + 20;
var FLP_StDel = FLP_Word + 21;
var FLP_FX3 = FLP_Word + 22;
var FLP_DotReso = FLP_Word + 23;
var FLP_DotCutOff = FLP_Word + 24;
var FLP_ShiftDelay = FLP_Word + 25;
var FLP_LoopEndBar = FLP_Word + 26;
var FLP_Dot = FLP_Word + 27;
var FLP_DotShift = FLP_Word + 28;
var FLP_LayerChans = FLP_Word + 30;

// DWORD EVENTS
var FLP_Int = 128;
var FLP_Color = FLP_Int;
var FLP_PlayListItem = FLP_Int + 1; //+Pos (word) +PatNum (word)
var FLP_Echo = FLP_Int + 2;
var FLP_FXSine = FLP_Int + 3;
var FLP_CutCutBy = FLP_Int + 4;
var FLP_WindowH = FLP_Int + 5;
var FLP_MiddleNote = FLP_Int + 7;
var FLP_Reserved = FLP_Int + 8; // may contain an invalid
 // version info
var FLP_MainResoCutOff = FLP_Int + 9;
var FLP_DelayReso = FLP_Int + 10;
var FLP_Reverb = FLP_Int + 11;
var FLP_IntStretch = FLP_Int + 12;
var FLP_SSNote = FLP_Int + 13;
var FLP_FineTune = FLP_Int + 14;

// TEXT EVENTS
var FLP_Undef = 192; //+Size (var length)
var FLP_Text = FLP_Undef; //+Size (var length)+Text
 // (Null Term. String)
var FLP_Text_ChanName = FLP_Text; // name for the current channel
var FLP_Text_PatName = FLP_Text + 1; // name for the current pattern
var FLP_Text_Title = FLP_Text + 2; // title of the loop
var FLP_Text_Comment = FLP_Text + 3; // old comments in text format.
 // Not used anymore
var FLP_Text_SampleFileName = FLP_Text + 4; // filename for the sample in
 // the current channel, stored
 // as relative path
var FLP_Text_URL = FLP_Text + 5;
var FLP_Text_CommentRTF = FLP_Text + 6; // new comments in Rich Text
 // format
var FLP_Text_Version = FLP_Text + 7;
var FLP_Text_PluginName = FLP_Text + 9; // plugin file name
 // (without path)

var FLP_Text_EffectChanName = FLP_Text + 12;
var FLP_Text_MIDICtrls = FLP_Text + 16;
var FLP_Text_Delay = FLP_Text + 17;
var FLP_Text_TS404Params = FLP_Text + 18;
var FLP_Text_DelayLine = FLP_Text + 19;
var FLP_Text_NewPlugin = FLP_Text + 20;
var FLP_Text_PluginParams = FLP_Text + 21;
var FLP_Text_ChanParams = FLP_Text + 23;// block of various channel
 // params (can grow)
var FLP_Text_EnvLfoParams = FLP_Text + 26;
var FLP_Text_BasicChanParams= FLP_Text + 27;
var FLP_Text_OldFilterParams= FLP_Text + 28;
var FLP_Text_AutomationData = FLP_Text + 31;
var FLP_Text_PatternNotes = FLP_Text + 32;
var FLP_Text_ChanGroupName = FLP_Text + 39;
var FLP_Text_PlayListItems = FLP_Text + 41;



var FilterTypes = {
  LowPass: 0,
  HiPass: 1,
  BandPass_CSG: 2,
  BandPass_CZPG: 3,
  Notch: 4,
  AllPass: 5,
  Moog: 6,
  DoubleLowPass: 7,
  Lowpass_RC12: 8,
  Bandpass_RC12: 9,
  Highpass_RC12: 10,
  Lowpass_RC24: 11,
  Bandpass_RC24: 12,
  Highpass_RC24: 13,
  Formantfilter: 14,
};

var ArpDirections = {
  Up: 0,
  Down: 1,
  UpAndDown: 2,
  Random: 3,
};

var EnvelopeTargets = {
  Volume: 0,
  Cut: 1,
  Resonance: 2,
  NumTargets: 3,
};

var STATE_COUNT   = 0;
var STATE_START   = STATE_COUNT++;
var STATE_HEADER  = STATE_COUNT++;
var STATE_FLDT    = STATE_COUNT++;
var STATE_EVENT   = STATE_COUNT++;
var STATE_SKIP    = STATE_COUNT++;

var states = new Array(STATE_COUNT);
states[STATE_START] = function(parser) {
  if (parser.buffer.length < 4) return true;
  if (parser.buffer.slice(0, 4).toString('ascii') !== 'FLhd') {
    parser.handleError(new Error("Expected magic number"));
    return;
  }

  parser.state = STATE_HEADER;
  parser.buffer = parser.buffer.slice(4);
};
states[STATE_HEADER] = function(parser) {
  if (parser.buffer.length < 10) return true;
  var headerLen = parser.buffer.readInt32LE(0);
  if (headerLen !== 6) {
    parser.handleError(new Error("Expected header length 6, not " + headerLen));
    return;
  }

  // some type thing
  var type = parser.buffer.readInt16LE(4);
  if (type !== 0) {
    parser.handleError(new Error("type " + type + " is not supported"));
    return;
  }

  // number of channels
  parser.channelCount = parser.buffer.readInt16LE(6);
  if (parser.channelCount < 1 || parser.channelCount > 1000) {
    parser.handleError(new Error("invalid number of channels: " + parser.channelCount));
    return;
  }
  for (var i = 0; i < parser.channelCount; i += 1) {
    parser.channels.push(new FLChannel());
  }

  // ppq
  parser.ppq = parser.buffer.readInt16LE(8);
  if (parser.ppq < 0) {
    parser.handleError(new Error("invalid ppq: " + parser.ppq));
    return;
  }

  parser.state = STATE_FLDT;
  parser.buffer = parser.buffer.slice(10);
};
states[STATE_FLDT] = function(parser) {
  if (parser.buffer.length < 8) return true;
  var id = parser.buffer.slice(0, 4).toString('ascii');
  var len = parser.buffer.readInt32LE(4);

  // sanity check
  if (len < 0 || len > 0x10000000) {
    parser.handleError(new Error("invalid chunk length: " + len));
    return;
  }

  parser.buffer = parser.buffer.slice(8);
  if (id === 'FLdt') {
    parser.state = STATE_EVENT;
  } else {
    parser.state = STATE_SKIP;
    parser.skipBytesLeft = len;
    parser.nextState = STATE_FLDT;
  }
};
states[STATE_SKIP] = function(parser) {
  var skipBytes = Math.min(parser.buffer.length, parser.skipBytesLeft);
  parser.buffer = parser.buffer.slice(skipBytes);
  parser.skipBytesLeft -= skipBytes;
  if (parser.skipBytesLeft === 0) {
    parser.state = parser.nextState;
  } else {
    return true;
  }
};
states[STATE_EVENT] = function(parser) {
  var eventId = parser.readUInt8();
  var data = parser.readUInt8();

  if (eventId == null || data == null) return true;

  var b;
  if (eventId >= FLP_Word && eventId < FLP_Text) {
    b = parser.readUInt8();
    if (b == null) return true;
    data = data | (b << 8);
  }
  if (eventId >= FLP_Int && eventId < FLP_Text) {
    b = parser.readUInt8();
    if (b == null) return true;
    data = data | (b << 16);

    b = parser.readUInt8();
    if (b == null) return true;
    data = data | (b << 24);
  }
  var text;
  var intList;
  var uchars;
  var strbuf;
  var i;
  if (eventId >= FLP_Text) {
    var textLen = data & 0x7F;
    var shift = 0;
    while (data & 0x80) {
      data = parser.readUInt8();
      if (data == null) return true;
      textLen = textLen | ((data & 0x7F) << (shift += 7));
    }
    text = parser.readString(textLen);
    if (text == null) return true;
    // also interpret same data as intList
    strbuf = parser.strbuf;
    var intCount = Math.floor(parser.strbuf.length / 4);
    intList = [];
    for (i = 0; i < intCount; i += 1) {
      intList.push(strbuf.readInt32LE(i * 4));
    }
  }

  parser.sliceBufferToCursor();

  var cc = parser.curChannel >= 0 ? parser.channels[parser.curChannel] : null;
  var imax;
  var ch;
  var pos, len;

  switch (eventId) {
  // BYTE EVENTS
  case FLP_Byte:
    if (parser.debug) {
      console.log("undefined byte", data);
    }
    break;
  case FLP_NoteOn:
    if (parser.debug) {
      console.log("note on:", data);
    }
    break;
  case FLP_Vol:
    if (parser.debug) {
      console.log("vol", data);
    }
    break;
  case FLP_Pan:
    if (parser.debug) {
      console.log("pan", data);
    }
    break;
  case FLP_LoopActive:
    if (parser.debug) {
      console.log("active loop:", data);
    }
    break;
  case FLP_ShowInfo:
    if (parser.debug) {
      console.log("show info: ", data );
    }
    break;
  case FLP_Shuffle:
    if (parser.debug) {
      console.log("shuffle: ", data );
    }
    break;
  case FLP_MainVol:
    parser.mainVolume = data;
    break;
  case FLP_PatLength:
    if (parser.debug) {
      console.log("pattern length: ", data );
    }
    break;
  case FLP_BlockLength:
    if (parser.debug) {
      console.log("block length: ", data );
    }
    break;
  case FLP_UseLoopPoints:
    if (cc) cc.sampleUseLoopPoints = true;
    break;
  case FLP_LoopType:
    if (parser.debug) {
      console.log("loop type: ", data );
    }
    break;
  case FLP_ChanType:
    if (parser.debug) {
      console.log("channel type: ", data );
    }
    if (cc) {
      switch (data) {
        case 0: cc.generatorName = "Sampler"; break;
        case 1: cc.generatorName = "TS 404"; break;
        case 2: cc.generatorName = "3x Osc"; break;
        case 3: cc.generatorName = "Layer"; break;
        default: break;
      }
    }
    break;
  case FLP_MixSliceNum:
    if (cc) cc.fxChannel = data + 1;
    break;
  case FLP_EffectChannelMuted:
    var isMuted = (data & 0x08) <= 0;
    if (parser.currentEffectChannel >= 0 && parser.currentEffectChannel < FLFxChannelCount) {
      parser.effectChannels[parser.currentEffectChannel].isMuted = isMuted;
    }
    break;

  // WORD EVENTS
  case FLP_NewChan:
    parser.curChannel = data;
    break;
  case FLP_NewPat:
    parser.currentPattern = data - 1;
    parser.maxPatterns = Math.max(parser.currentPattern, parser.maxPatterns);
    break;
  case FLP_Tempo:
    parser.tempo = data;
    break;
  case FLP_CurrentPatNum:
    parser.activeEditPattern = data;
    break;
  case FLP_FX:
    if (parser.debug) {
      console.log("FX:", data);
    }
    break;
  case FLP_Fade_Stereo:
    if (data & 0x02) {
      parser.sampleReversed = true;
    } else if( data & 0x100 ) {
      parser.sampleReverseStereo = true;
    }
    break;
  case FLP_CutOff:
    if (parser.debug) {
      console.log("cutoff (sample):", data);
    }
    break;
  case FLP_PreAmp:
    if (cc) cc.sampleAmp = data;
    break;
  case FLP_Decay:
    if (parser.debug) {
      console.log("decay (sample): ", data );
    }
    break;
  case FLP_Attack:
    if (parser.debug) {
      console.log("attack (sample): ", data );
    }
    break;
  case FLP_MainPitch:
    parser.mainPitch = data;
    break;
  case FLP_Resonance:
    if (parser.debug) {
      console.log("resonance (sample): ", data );
    }
    break;
  case FLP_LoopBar:
    if (parser.debug) {
      console.log("loop bar: ", data );
    }
    break;
  case FLP_StDel:
    if (parser.debug) {
      console.log("stdel (delay?): ", data );
    }
    break;
  case FLP_FX3:
    if (parser.debug) {
      console.log("FX 3: ", data );
    }
    break;
  case FLP_ShiftDelay:
    if (parser.debug) {
      console.log("shift delay: ", data );
    }
    break;
  case FLP_Dot:
    var dotVal = (data & 0xff) + (parser.currentPattern << 8);
    if (cc) cc.dots.push(dotVal);
    break;
  case FLP_LayerChans:
    parser.channels[data].layerParent = parser.curChannel;
    if (cc) cc.generatorName = "Layer";
    break;


  // DWORD EVENTS
  case FLP_Color:
    if (cc) {
      cc.colorRed = (data & 0xFF000000) >> 24;
      cc.colorGreen = (data & 0x00FF0000) >> 16;
      cc.colorBlue = (data & 0x0000FF00) >> 8;
    }
    break;
  case FLP_PlayListItem:
    var item = new FLPlaylistItem();
    item.position = (data & 0xffff) * 192;
    item.length = 192;
    item.pattern = (data >> 16) - 1;
    parser.playListItems.push(item);
    parser.maxPatterns = Math.max(parser.maxPatterns, item.pattern);
    break;
  case FLP_FXSine:
    if (parser.debug) {
      console.log("fx sine: ", data );
    }
    break;
  case FLP_CutCutBy:
    if (parser.debug) {
      console.log("cut cut by: ", data );
    }
    break;
  case FLP_MiddleNote:
    if (cc) cc.baseNote = data+9;
    break;
  case FLP_DelayReso:
    if (parser.debug) {
      console.log("delay resonance: ", data );
    }
    break;
  case FLP_Reverb:
    if (parser.debug) {
      console.log("reverb (sample): ", data );
    }
    break;
  case FLP_IntStretch:
    if (parser.debug) {
      console.log("int stretch (sample): ", data );
    }
    break;


  // TEXT EVENTS
  case FLP_Text_ChanName:
    if (cc) cc.name = text;
    break;
  case FLP_Text_PatName:
    parser.patternNames[parser.currentPattern] = text;
    break;
  case FLP_Text_CommentRTF:
    // TODO: support RTF comments
    if (parser.debug) {
      console.log("RTF text comment:", text);
    }
    break;
  case FLP_Text_Title:
    parser.projectTitle = text;
    break;
  case FLP_Text_SampleFileName:
    if (cc) {
      cc.sampleFileName = text;
      cc.generatorName = "Sampler";
      parser.sampleList.push(cc.sampleFileName);
    }
    break;
  case FLP_Text_Version:
    if (parser.debug) {
      console.log("FLP version: ", text );
    }
    parser.versionString = text;
    // divide the version string into numbers
    var numbers = parser.versionString.split('.');
    parser.version = (parseInt(numbers[0], 10) << 8) +
                     (parseInt(numbers[1], 10) << 4) +
                     (parseInt(numbers[2], 10) << 0);
    if (parser.version >= 0x600) {
      parser.versionSpecificFactor = 100;
    }
    break;
  case FLP_Text_PluginName:
    var pluginName = text;
    // we add all plugins to effects list and then
    // remove the ones that aren't effects later.
    parser.effectPlugins.push(pluginName);
    if (cc) cc.generatorName = pluginName;
    if (parser.debug) {
      console.log("plugin: ", pluginName);
    }
    break;
  case FLP_Text_EffectChanName:
    parser.currentEffectChannel += 1;
    if (parser.currentEffectChannel <= FLFxChannelCount) {
      parser.effectChannels[parser.currentEffectChannel].name = text;
    }
    break;
  case FLP_Text_Delay:
    if (parser.debug) {
      console.log("delay data: ", text );
    }
    // intList[1] seems to be volume or similiar and
    // needs to be divided
    // by parser.versionSpecificFactor
    break;
  case FLP_Text_TS404Params:
    if (cc && cc.pluginSettings == null) {
      cc.pluginSettings = strbuf;
      cc.generatorName = "TS 404";
    }
    break;
  case FLP_Text_NewPlugin:
    // TODO: if it's an effect plugin make a new effect
    if (parser.debug) {
      console.log("new plugin: ", text);
    }
    break;
  case FLP_Text_PluginParams:
    if (cc && cc.pluginSettings == null) {
      cc.pluginSettings = strbuf;
    }
    break;
  case FLP_Text_ChanParams:
    if (cc) {
      cc.arpDir = intList[10];
      cc.arpRange = intList[11];
      cc.selectedArp = intList[12];
      if (cc.selectedArp < 8) {
          var mappedArps = [0, 1, 5, 6, 2, 3, 4];
          cc.selectedArp = mappedArps[cc.selectedArp];
      }
      cc.arpTime = ((intList[13]+1 ) * parser.tempo) / (4 * 16) + 1;
      cc.arpGate = (intList[14] * 100.0) / 48.0;
      cc.arpEnabled = intList[10] > 0;
    }
    break;
  case FLP_Text_EnvLfoParams:
    if (cc) {
      var scaling = 1.0 / 65536.0;
      var e = new FLChannelEnvelope();
      switch (cc.envelopes.length) {
      case 1:
        e.target = EnvelopeTargets.Volume;
        break;
      case 2:
        e.target = EnvelopeTargets.Cut;
        break;
      case 3:
        e.target = EnvelopeTargets.Resonance;
        break;
      default:
        e.target = EnvelopeTargets.NumTargets;
        break;
      }
      e.predelay = intList[2] * scaling;
      e.attack = intList[3] * scaling;
      e.hold = intList[4] * scaling;
      e.decay = intList[5] * scaling;
      e.sustain = 1-intList[6] / 128.0;
      e.release = intList[7] * scaling;
      if (e.target === EnvelopeTargets.Volume) {
        e.amount = intList[1] ? 1 : 0;
      } else {
        e.amount = intList[8] / 128.0;
      }
      cc.envelopes.push(e);
    }
    break;
  case FLP_Text_BasicChanParams:
    cc.volume = intList[1] / parser.versionSpecificFactor;
    cc.panning = intList[0] / parser.versionSpecificFactor;
    if (text.length > 12) {
      cc.filterType = strbuf.readUInt8(20);
      cc.filterCut = strbuf.readUInt8(12);
      cc.filterRes = strbuf.readUInt8(16);
      cc.filterEnabled = (strbuf.readUInt8(13) === 0);
      if (strbuf.readUInt8(20) >= 6) {
        cc.filterCut *= 0.5;
      }
    }
    break;
  case FLP_Text_OldFilterParams:
    cc.filterType = strbuf.readUInt8(8);
    cc.filterCut = strbuf.readUInt8(0);
    cc.filterRes = strbuf.readUInt8(4);
    cc.filterEnabled = (strbuf.readUInt8(1) === 0);
    if (strbuf.readUInt8(8) >= 6) {
      cc.filterCut *= 0.5;
    }
    break;
  case FLP_Text_AutomationData:
    var bpae = 12;
    imax = strbuf.length / bpae;
    for (i = 0; i < imax; ++i) {
      var a = new FLAutomation();
      a.pos = intList[3*i+0] / (4*parser.ppq / 192);
      a.value = intList[3*i+2];
      a.channel = intList[3*i+1] >> 16;
      a.control = intList[3*i+1] & 0xffff;
      if (a.channel >= 0 && a.channel < parser.channelCount) {
        parser.channels[a.channel].automationData.push(a);
      }
    }
    break;
  case FLP_Text_PatternNotes:
    var bpn = 20;
    imax = (strbuf.length + bpn - 1) / bpn;
    for (i = 0; i < imax; ++i) {
      ch = strbuf.readInt32LE(i * bpn + 6);
      var pan = strbuf.readInt32LE(i * bpn + 16);
      var vol = strbuf.readInt32LE(i * bpn + 17);
      pos = strbuf.readInt32LE(i * bpn);
      var key = strbuf.readInt32LE(i * bpn + 12);
      len = strbuf.readInt32LE(i * bpn + 8);
      pos /= (4*parser.ppq) / 192;
      len /= (4*parser.ppq) / 192;
      var n = new FLNote(len, pos, key, vol, pan);
      if (ch < parser.channelCount) {
        parser.channels[ch].notes.push([parser.currentPattern, n]);
      } else if (parser.debug) {
        console.log("Invalid ch: ", ch );
      }
    }
    break;
  case FLP_Text_ChanGroupName:
    if (parser.debug) {
      console.log("channel group name: ", text );
    }
    break;
  case 225:
    var FLP_EffectParamVolume = 0x1fc0;

    var bpi = 12;
    imax = strbuf.length / bpi;
    for (i = 0; i < imax; ++i) {
      var param = intList[i*3+1] & 0xffff;
      ch = ( intList[i*3+1] >> 22 ) & 0x7f;
      if (ch < 0 || ch > FLFxChannelCount) {
        continue;
      }
      var val = intList[i*3+2];
      if (param === FLP_EffectParamVolume) {
        parser.effectChannels[ch].volume = (val / parser.versionSpecificFactor);
      } else if (parser.debug) {
        console.log("FX-ch: ", ch, "  param: " , param, "  value: ", val );
      }
    }
    break;
  case 233:    // playlist items
    bpi = 28;
    imax = strbuf.length / bpi;
    for (i = 0; i < imax; ++i) {
      pos = intList[i*bpi/4+0] / ((4*parser.ppq) / 192);
      len = intList[i*bpi/4+2] / ((4*parser.ppq) / 192);
      var pat = intList[i*bpi/4+3] & 0xfff;
      // whatever these magic numbers are for...
      if( pat > 2146 && pat <= 2278 ) {
        item = new FLPlaylistItem();
        item.position = pos;
        item.length = len;
        item.pattern = 2278 - pat;
        parser.playListItems.push(i);
      } else if (parser.debug) {
        console.log("unknown playlist item: ", text);
      }
    }
    break;
  default:
    if (!parser.debug) break;
    if (eventId >= FLP_Text) {
      console.log("unhandled text (ev:", eventId, "):", text);
    } else {
      console.log("handling of FLP-event", eventId, "not implemented yet (data=", data, ")");
    }
  }
};

function parseFile(file, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var inStream = fs.createReadStream(file, options);
  var parser = createParser(options);
  var alreadyError = false;
  inStream.on('error', handleError);
  parser.on('error', handleError);
  inStream.pipe(parser);
  parser.on('end', function() {
    if (alreadyError) return;
    alreadyError = true;
    callback(null, parser);
  });

  function handleError(err) {
    if (alreadyError) return;
    alreadyError = true;
    callback(err);
  }
}

function createParser(options) {
  return new FlpParser(options);
}

util.inherits(FlpParser, Writable);
function FlpParser(options) {
  Writable.call(this, options);

  this.state = STATE_START;
  this.buffer = new Buffer(0);
  this.cursor = 0;
  this.debug = !!options.debug;
  this.curChannel = -1;

  this.mainVolume = 300;
  this.mainPitch = 0;
  this.tempo = 140;
  this.channelCount = 0;
  this.channels = [];
  this.effects = [];
  this.playlistItems = [];
  this.patternNames = [];
  this.maxPatterns = 0;
  this.currentPattern = 0;
  this.activeEditPattern = 0;
  this.effectChannels = new Array(FLFxChannelCount);
  for (var i = 0; i < FLFxChannelCount; i += 1) {
    this.effectChannels[i] = new FLEffectChannel();
  }
  this.currentEffectChannel = -1;
  this.projectNotes = null;
  this.projectTitle = null;
  this.versionString = null;
  this.version = 0x100;
  this.versionSpecificFactor = 1;

  this.sampleList = [];
  this.effectPlugins = [];
  this.ppq = null;
  this.effectStrings = [];

  this.error = null;

  setupListeners(this);
}

function setupListeners(parser) {
  parser.on('finish', function() {
    if (parser.state !== STATE_EVENT) {
      parser.handleError(new Error("unexpected end of stream"));
      return;
    }
    finishParsing(parser);
    parser.emit('end');
  });
}

function finishParsing(parser) {
  var i;
  // for each fruity wrapper, extract the plugin name
  for (i = 0; i < parser.channels.length; i += 1) {
    tryFruityWrapper(parser.channels[i]);
  }
  for (i = 0; i < parser.effects.length; i += 1) {
    tryFruityWrapper(parser.effects[i]);
  }
  // effects are the ones that aren't channels.
  var channelPlugins = {};
  for (i = 0; i < parser.channels.length; i += 1) {
    channelPlugins[parser.channels[i].generatorName] = true;
  }
  for (i = 0; i < parser.effectPlugins.length; i += 1) {
    var effectPluginName = parser.effectPlugins[i];
    if (!channelPlugins[effectPluginName]) {
      parser.effectStrings.push(effectPluginName);
    }
  }
}

function tryFruityWrapper(plugin) {
  var lowerName = (plugin.generatorName || "").toLowerCase();
  if (lowerName !== 'fruity wrapper') return;

  plugin.generatorName = fruityWrapper(plugin.pluginSettings);
}

function fruityWrapper(buf) {
  var cidPluginName = 54;
  var cursor = 0;
  var cursorEnd = cursor + buf.length;
  var version = readInt32LE();
  if (version <= 4) {
    // "old format"
    var extraBlockSize = readInt32LE();
    var midiPort = readInt32LE();
    var synthSaved = readInt32LE();
    var pluginType = readInt32LE();
    var pluginSpecificBlockSize = readInt32LE();
    var pluginNameLen = readUInt8();
    return buf.slice(cursor, cursor + pluginNameLen).toString('utf8');
  } else {
    // "new format"
    while (cursor < cursorEnd) {
      var chunkId = readInt32LE();
      var chunkSize = readUInt64LE();
      if (chunkId === cidPluginName) {
        return buf.slice(cursor, cursor + chunkSize).toString('utf8');
      }
      cursor += chunkSize;
    }
  }
  return "";

  function readInt32LE() {
    var val = buf.readInt32LE(cursor);
    cursor += 4;
    return val;
  }

  function readUInt8() {
    var val = buf.readUInt8(cursor);
    cursor += 1;
    return val;
  }

  function readUInt64LE() {
    var val = 0;
    for (var i = 0; i < 8; i += 1) {
      val += buf.readUInt8(cursor + i) * Math.pow(2, 8 * i);
    }
    cursor += 8;
    return val;
  }
}

FlpParser.prototype._write = function(chunk, encoding, callback) {
  this.buffer = Buffer.concat([this.buffer, chunk]);
  this.cursor = 0;
  for (;;) {
    var fn = states[this.state];
    var waitForWrite = fn(this);
    if (this.error || waitForWrite) break;
  }
  callback();
};

FlpParser.prototype.readUInt8 = function() {
  if (this.cursor + 1 >= this.buffer.length) return null;
  var val = this.buffer.readUInt8(this.cursor);
  this.cursor += 1;
  return val;
};

FlpParser.prototype.readString = function(len) {
  if (this.cursor + len >= this.buffer.length) return null;
  this.strbuf = this.buffer.slice(this.cursor, this.cursor + len);
  var val = this.strbuf.toString('utf8');
  this.cursor += len;
  return val;
};

FlpParser.prototype.sliceBufferToCursor = function() {
  this.buffer = this.buffer.slice(this.cursor);
};

FlpParser.prototype.handleError = function(err) {
  this.error = err;
  this.emit('error', err);
};

function FLChannel() {
  this.name = null;
  this.pluginSettings = null;
  this.generatorName = null;
  this.automationData = [];
  this.volume = 100;
  this.panning = 0;
  this.baseNote = 57;
  this.fxChannel = 0;
  this.layerParent = -1;
  this.notes = [];
  this.dots = [];
  this.sampleFileName = null;
  this.sampleAmp = 100;
  this.sampleReversed = false;
  this.sampleReverseStereo = false;
  this.sampleUseLoopPoints = false;
  this.envelopes = [];
  this.filterType = FilterTypes.LowPass;
  this.filterCut = 10000;
  this.filterRes = 0.1;
  this.filterEnabled = false;
  this.arpDir = ArpDirections.Up;
  this.arpRange = 0;
  this.selectedArp = 0;
  this.arpTime = 100;
  this.arpGate = 100;
  this.arpEnabled = false;
  this.colorRed = 64;
  this.colorGreen = 128;
  this.colorBlue = 255;
}

function FLEffectChannel() {
  this.name = null;
  this.volume = 300;
  this.isMuted = false;
}

function FLPlaylistItem() {
  this.position = 0;
  this.length = 1;
  this.pattern = 0;
}

function FLChannelEnvelope() {
  this.target = null;
  this.predelay = null;
  this.attack = null;
  this.hold = null;
  this.decay = null;
  this.sustain = null;
  this.release = null;
  this.amount = null;
}

function FLAutomation() {
  this.pos = 0;
  this.value = 0;
  this.channel = 0;
  this.control = 0;
}

function FLNote(len, pos, key, vol, pan) {
  this.key = key;
  this.volume = vol;
  this.panning = pan;
  this.length = len;
  this.position = pos;
  this.detuning = null;
}

exports.createParser = createParser;
exports.parseFile = parseFile;
exports.FlpParser = FlpParser;

exports.FLEffectChannel = FLEffectChannel;
exports.FLChannel = FLChannel;
exports.FLPlaylistItem = FLPlaylistItem;
exports.FLChannelEnvelope = FLChannelEnvelope;
exports.FLAutomation = FLAutomation;
exports.FLNote = FLNote;

exports.FilterTypes = FilterTypes;
exports.ArpDirections = ArpDirections;
exports.EnvelopeTargets = EnvelopeTargets;
