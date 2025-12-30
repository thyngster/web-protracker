/**
 * MOD Player AudioWorklet Processor
 */

const PERIOD_TABLE = [
  856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
  428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
  214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
];

const FINETUNE_TABLE = [
  [856,808,762,720,678,640,604,570,538,508,480,453,428,404,381,360,339,320,302,285,269,254,240,226,214,202,190,180,170,160,151,143,135,127,120,113],
  [850,802,757,715,674,637,601,567,535,505,477,450,425,401,379,357,337,318,300,284,268,253,239,225,213,201,189,179,169,159,150,142,134,126,119,113],
  [844,796,752,709,670,632,597,563,532,502,474,447,422,398,376,355,335,316,298,282,266,251,237,224,211,199,188,177,167,158,149,141,133,125,118,112],
  [838,791,746,704,665,628,592,559,528,498,470,444,419,395,373,352,332,314,296,280,264,249,235,222,209,198,187,176,166,157,148,140,132,125,118,111],
  [832,785,741,699,660,623,588,555,524,495,467,441,416,392,370,350,330,312,294,278,262,247,233,220,208,196,185,175,165,156,147,139,131,124,117,110],
  [826,779,736,694,655,619,584,551,520,491,463,437,413,390,368,347,328,309,292,276,260,245,232,219,206,195,184,174,164,155,146,138,130,123,116,109],
  [820,774,730,689,651,614,580,547,516,487,460,434,410,387,365,345,325,307,290,274,258,244,230,217,205,193,183,172,163,154,145,137,129,122,115,109],
  [814,768,725,684,646,610,575,543,513,484,457,431,407,384,363,342,323,305,288,272,256,242,228,216,204,192,181,171,161,152,144,136,128,121,114,108],
  [907,856,808,762,720,678,640,604,570,538,508,480,453,428,404,381,360,339,320,302,285,269,254,240,226,214,202,190,180,170,160,151,143,135,127,120],
  [900,850,802,757,715,675,636,601,567,535,505,477,450,425,401,379,357,337,318,300,284,268,253,238,225,212,200,189,179,169,159,150,142,134,126,119],
  [894,844,796,752,709,670,632,597,563,532,502,474,447,422,398,376,355,335,316,298,282,266,251,237,223,211,199,188,177,167,158,149,141,133,125,118],
  [887,838,791,746,704,665,628,592,559,528,498,470,444,419,395,373,352,332,314,296,280,264,249,235,222,209,198,187,176,166,157,148,140,132,125,118],
  [881,832,785,741,699,660,623,588,555,524,494,467,441,416,392,370,350,330,312,294,278,262,247,233,220,208,196,185,175,165,156,147,139,131,123,117],
  [875,826,779,736,694,655,619,584,551,520,491,463,437,413,390,368,347,328,309,292,276,260,245,232,219,206,195,184,174,164,155,146,138,130,123,116],
  [868,820,774,730,689,651,614,580,547,516,487,460,434,410,387,365,345,325,307,290,274,258,244,230,217,205,193,183,172,163,154,145,137,129,122,115],
  [862,814,768,725,684,646,610,575,543,513,484,457,431,407,384,363,342,323,305,288,272,256,242,228,216,203,192,181,171,161,152,144,136,128,121,114],
];

const SINE_TABLE = [
  0, 24, 49, 74, 97, 120, 141, 161,
  180, 197, 212, 224, 235, 244, 250, 253,
  255, 253, 250, 244, 235, 224, 212, 197,
  180, 161, 141, 120, 97, 74, 49, 24
];

const AMIGA_CLOCK = 7093789.2;

class ModWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.playing = false;
    this.module = null;
    this.samples = new Map();
    this.channels = [];
    this.currentPattern = 0;
    this.currentRow = 0;
    this.currentTick = 0;
    this.bpm = 125;
    this.speed = 6;
    this.samplesPerTick = 0;
    this.tickSampleCounter = 0;
    this.patternLoopRow = 0;
    this.patternLoopCount = 0;
    this.patternDelayCount = 0;
    this.channelMutes = [];
    this.scopeBuffers = [];
    this.scopeBufferSize = 128;
    this.scopeWritePos = 0;
    this.scopeSendCounter = 0;
    this.scopeSendInterval = 2048;
    this.updateSamplesPerTick();
    this.port.onmessage = (event) => this.handleMessage(event.data);
  }

  handleMessage(data) {
    switch (data.type) {
      case 'loadModule': this.loadModule(data.module); break;
      case 'loadSample': this.loadSample(data.index, data.sample); break;
      case 'play': this.play(); break;
      case 'stop': this.stop(); break;
      case 'setMute': this.channelMutes[data.channel] = data.muted; break;
    }
  }

  loadModule(module) {
    this.module = module;
    this.channels = [];
    this.channelMutes = [];
    this.scopeBuffers = [];
    for (let i = 0; i < module.channelCount; i++) {
      this.channels.push(this.createChannel(i, module.channelCount));
      this.channelMutes.push(false);
      this.scopeBuffers.push(new Float32Array(this.scopeBufferSize));
    }
  }

  loadSample(index, sample) {
    this.samples.set(index, sample);
  }

  createChannel(index, totalChannels) {
    let pan = 0;
    if (totalChannels === 4) {
      pan = (index === 0 || index === 3) ? -0.7 : 0.7;
    }
    return {
      sample: null, sampleNum: 0, samplePos: 0, period: 0, basePeriod: 0,
      volume: 64, pan, finetune: 0, active: false,
      portamentoSpeed: 0, portamentoTarget: 0,
      vibratoPos: 0, vibratoSpeed: 0, vibratoDepth: 0,
      tremoloPos: 0, tremoloSpeed: 0, tremoloDepth: 0,
      arpeggioNote1: 0, arpeggioNote2: 0, lastVolumeSlide: 0,
      sampleOffset: 0, noteDelayTick: 0, noteDelayNote: null,
      noteCutTick: 0, retrigSpeed: 0, glissando: false,
    };
  }

  play() {
    this.playing = true;
    this.currentPattern = 0;
    this.currentRow = 0;
    this.currentTick = 0;
    this.tickSampleCounter = 0;
    this.bpm = 125;
    this.speed = 6;
    this.updateSamplesPerTick();
    for (const ch of this.channels) {
      ch.vibratoPos = 0;
      ch.tremoloPos = 0;
      ch.active = false;
      ch.samplePos = 0;
    }
  }

  stop() {
    this.playing = false;
    for (const ch of this.channels) ch.active = false;
  }

  updateSamplesPerTick() {
    this.samplesPerTick = Math.floor(sampleRate * 2.5 / this.bpm);
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length < 2) return true;
    const leftChannel = output[0];
    const rightChannel = output[1];

    if (!this.playing || !this.module) {
      leftChannel.fill(0);
      rightChannel.fill(0);
      return true;
    }

    for (let i = 0; i < leftChannel.length; i++) {
      if (this.tickSampleCounter <= 0) {
        this.processTick();
        this.tickSampleCounter = this.samplesPerTick;
      }
      this.tickSampleCounter--;

      let left = 0, right = 0;
      for (let ch = 0; ch < this.channels.length; ch++) {
        const channel = this.channels[ch];
        if (!channel.active || !channel.sample || this.channelMutes[ch]) {
          if (this.scopeBuffers[ch]) this.scopeBuffers[ch][this.scopeWritePos] = 0;
          continue;
        }
        const sample = this.mixChannel(channel);
        const vol = channel.volume / 64;
        if (this.scopeBuffers[ch]) this.scopeBuffers[ch][this.scopeWritePos] = sample * vol;
        const leftGain = Math.min(1, 1 - channel.pan);
        const rightGain = Math.min(1, 1 + channel.pan);
        left += sample * vol * leftGain;
        right += sample * vol * rightGain;
      }

      this.scopeWritePos = (this.scopeWritePos + 1) % this.scopeBufferSize;
      const masterVol = 0.5;
      leftChannel[i] = this.softClip(left * masterVol);
      rightChannel[i] = this.softClip(right * masterVol);

      this.scopeSendCounter++;
      if (this.scopeSendCounter >= this.scopeSendInterval) {
        this.scopeSendCounter = 0;
        this.sendScopeData();
      }
    }
    return true;
  }

  sendScopeData() {
    if (this.scopeBuffers.length === 0) return;
    const scopeData = this.scopeBuffers.map(buf => Array.from(buf));
    this.port.postMessage({ type: 'scopeData', channels: scopeData });
  }

  mixChannel(channel) {
    if (!channel.sample || channel.period === 0) return 0;
    const sample = channel.sample;
    const pos = Math.floor(channel.samplePos);
    let value = 0;
    if (pos >= 0 && pos < sample.length) {
      value = sample.data[pos];
    } else if (sample.loopLength > 2) {
      const loopPos = sample.loopStart + ((pos - sample.loopStart) % sample.loopLength);
      if (loopPos >= 0 && loopPos < sample.length) value = sample.data[loopPos];
    } else {
      channel.active = false;
      return 0;
    }
    const freq = AMIGA_CLOCK / (channel.period * 2);
    const increment = freq / sampleRate;
    channel.samplePos += increment;
    if (sample.loopLength > 2) {
      const loopEnd = sample.loopStart + sample.loopLength;
      while (channel.samplePos >= loopEnd) channel.samplePos -= sample.loopLength;
    } else if (channel.samplePos >= sample.length) {
      channel.active = false;
    }
    return value;
  }

  softClip(x) {
    if (x > 1) return 1;
    if (x < -1) return -1;
    return x;
  }

  processTick() {
    if (!this.module) return;
    if (this.currentPattern < 0 || this.currentPattern >= this.module.songLength) this.currentPattern = 0;
    if (this.currentRow < 0 || this.currentRow >= 64) this.currentRow = 0;

    const patternIndex = this.module.patternTable[this.currentPattern];
    const pattern = this.module.patterns[patternIndex];
    if (!pattern) { this.stop(); return; }

    const row = pattern.rows[this.currentRow];
    if (!row) { this.currentRow = 0; return; }

    if (this.currentTick === 0) {
      for (let ch = 0; ch < this.channels.length; ch++) {
        this.processNote(this.channels[ch], row[ch]);
      }
      this.port.postMessage({ type: 'rowChange', pattern: this.currentPattern, row: this.currentRow });
    } else {
      for (let ch = 0; ch < this.channels.length; ch++) {
        this.processEffectTick(this.channels[ch], row[ch]);
      }
    }

    this.currentTick++;
    if (this.currentTick >= this.speed) {
      this.currentTick = 0;
      if (this.patternDelayCount > 0) { this.patternDelayCount--; return; }
      this.currentRow++;
      if (this.currentRow >= 64) {
        this.currentRow = 0;
        this.currentPattern++;
        this.patternLoopRow = 0;
        if (this.currentPattern >= this.module.songLength) {
          if (this.module.restartPosition < this.module.songLength) {
            this.currentPattern = this.module.restartPosition;
          } else {
            this.stop();
          }
        }
      }
    }
  }

  processNote(channel, note) {
    if (!this.module) return;
    const effect = note.effect;
    const param = note.effectParam;
    const paramHi = (param >> 4) & 0x0F;
    const hasNoteDelay = effect === 0xE && paramHi === 0xD;

    channel.noteDelayTick = 0;
    channel.noteDelayNote = null;
    channel.noteCutTick = 0;

    if (note.sampleNumber > 0) {
      const sample = this.samples.get(note.sampleNumber);
      if (sample) {
        channel.sample = sample;
        channel.sampleNum = note.sampleNumber;
        channel.volume = sample.volume;
        channel.finetune = sample.finetune;
      }
    }

    if (effect === 3 || effect === 5) {
      if (note.period > 0) channel.portamentoTarget = note.period;
      if (effect === 3 && param > 0) channel.portamentoSpeed = param;
    } else if (note.period > 0) {
      if (hasNoteDelay) {
        channel.noteDelayNote = { sampleNumber: note.sampleNumber, period: note.period };
      } else {
        channel.basePeriod = note.period;
        channel.period = this.applyFinetune(note.period, channel.finetune);
        channel.vibratoPos = 0;
        this.triggerNote(channel);
      }
    }

    this.processEffect(channel, effect, param);
  }

  triggerNote(channel) {
    if (!channel.sample) return;
    channel.samplePos = channel.sampleOffset;
    channel.active = true;
    channel.sampleOffset = 0;
  }

  applyFinetune(period, finetune) {
    if (period === 0 || finetune === 0) return period;
    const noteIndex = this.periodToNoteIndex(period);
    if (noteIndex < 0) return period;
    let ftIndex = finetune & 0x0F;
    if (finetune < 0) ftIndex = 16 + finetune;
    return FINETUNE_TABLE[ftIndex][noteIndex];
  }

  periodToNoteIndex(period) {
    if (period === 0) return -1;
    let closestIndex = 0;
    let closestDiff = Math.abs(PERIOD_TABLE[0] - period);
    for (let i = 1; i < PERIOD_TABLE.length; i++) {
      const diff = Math.abs(PERIOD_TABLE[i] - period);
      if (diff < closestDiff) { closestDiff = diff; closestIndex = i; }
    }
    return closestIndex;
  }

  processEffect(channel, effect, param) {
    const paramHi = (param >> 4) & 0x0F;
    const paramLo = param & 0x0F;

    switch (effect) {
      case 0x0: if (param > 0) { channel.arpeggioNote1 = paramHi; channel.arpeggioNote2 = paramLo; } break;
      case 0x1: if (param > 0) channel.portamentoSpeed = param; break;
      case 0x2: if (param > 0) channel.portamentoSpeed = param; break;
      case 0x3: if (param > 0) channel.portamentoSpeed = param; break;
      case 0x4: if (paramHi > 0) channel.vibratoSpeed = paramHi; if (paramLo > 0) channel.vibratoDepth = paramLo; break;
      case 0x5: if (param > 0) channel.lastVolumeSlide = paramHi > 0 ? paramHi : -paramLo; break;
      case 0x6: if (param > 0) channel.lastVolumeSlide = paramHi > 0 ? paramHi : -paramLo; break;
      case 0x7: if (paramHi > 0) channel.tremoloSpeed = paramHi; if (paramLo > 0) channel.tremoloDepth = paramLo; break;
      case 0x8: channel.pan = (param - 128) / 128; break;
      case 0x9: if (param > 0) channel.sampleOffset = param * 256; break;
      case 0xA: if (param > 0) channel.lastVolumeSlide = paramHi > 0 ? paramHi : -paramLo; break;
      case 0xB: this.currentPattern = param; this.currentRow = -1; break;
      case 0xC: channel.volume = Math.min(64, param); break;
      case 0xD: this.currentRow = paramHi * 10 + paramLo - 1; this.currentPattern++; if (this.currentPattern >= (this.module?.songLength || 0)) this.currentPattern = 0; break;
      case 0xE: this.processExtendedEffect(channel, paramHi, paramLo); break;
      case 0xF: if (param < 32) { this.speed = param || 1; } else { this.bpm = param; this.updateSamplesPerTick(); } break;
    }
  }

  processExtendedEffect(channel, type, param) {
    switch (type) {
      case 0x1: channel.period = Math.max(113, channel.period - param); channel.basePeriod = channel.period; break;
      case 0x2: channel.period = Math.min(856, channel.period + param); channel.basePeriod = channel.period; break;
      case 0x3: channel.glissando = param !== 0; break;
      case 0x5: channel.finetune = param > 7 ? param - 16 : param; break;
      case 0x6:
        if (param === 0) { this.patternLoopRow = this.currentRow; }
        else {
          if (this.patternLoopCount === 0) this.patternLoopCount = param;
          else this.patternLoopCount--;
          if (this.patternLoopCount > 0) this.currentRow = this.patternLoopRow - 1;
        }
        break;
      case 0x9: channel.retrigSpeed = param; break;
      case 0xA: channel.volume = Math.min(64, channel.volume + param); break;
      case 0xB: channel.volume = Math.max(0, channel.volume - param); break;
      case 0xC: channel.noteCutTick = param; break;
      case 0xD: channel.noteDelayTick = param; break;
      case 0xE: this.patternDelayCount = param; break;
    }
  }

  processEffectTick(channel, note) {
    const effect = note.effect;
    const param = note.effectParam;
    const paramHi = (param >> 4) & 0x0F;
    const paramLo = param & 0x0F;

    switch (effect) {
      case 0x0: if (param > 0) this.processArpeggio(channel); break;
      case 0x1: channel.period = Math.max(113, channel.period - channel.portamentoSpeed); channel.basePeriod = channel.period; break;
      case 0x2: channel.period = Math.min(856, channel.period + channel.portamentoSpeed); channel.basePeriod = channel.period; break;
      case 0x3: this.processTonePortamento(channel); break;
      case 0x4: this.processVibrato(channel); break;
      case 0x5: this.processTonePortamento(channel); this.processVolumeSlide(channel); break;
      case 0x6: this.processVibrato(channel); this.processVolumeSlide(channel); break;
      case 0x7: this.processTremolo(channel); break;
      case 0xA: this.processVolumeSlide(channel); break;
      case 0xE:
        if (paramHi === 0x9 && paramLo > 0) { if (this.currentTick % paramLo === 0) this.triggerNote(channel); }
        else if (paramHi === 0xC) { if (this.currentTick === paramLo) channel.volume = 0; }
        else if (paramHi === 0xD) {
          if (this.currentTick === paramLo && channel.noteDelayNote) {
            channel.basePeriod = channel.noteDelayNote.period;
            channel.period = this.applyFinetune(channel.noteDelayNote.period, channel.finetune);
            channel.vibratoPos = 0;
            this.triggerNote(channel);
            channel.noteDelayNote = null;
          }
        }
        break;
    }
  }

  processArpeggio(channel) {
    if (channel.basePeriod === 0) return;
    const tick = this.currentTick % 3;
    let offset = 0;
    if (tick === 1) offset = channel.arpeggioNote1;
    else if (tick === 2) offset = channel.arpeggioNote2;
    if (offset === 0) { channel.period = channel.basePeriod; }
    else {
      const noteIndex = this.periodToNoteIndex(channel.basePeriod);
      if (noteIndex >= 0) {
        const newIndex = Math.min(PERIOD_TABLE.length - 1, noteIndex + offset);
        channel.period = PERIOD_TABLE[newIndex];
      }
    }
  }

  processTonePortamento(channel) {
    if (channel.portamentoTarget === 0 || channel.period === 0) return;
    if (channel.period < channel.portamentoTarget) {
      channel.period = Math.min(channel.period + channel.portamentoSpeed, channel.portamentoTarget);
    } else if (channel.period > channel.portamentoTarget) {
      channel.period = Math.max(channel.period - channel.portamentoSpeed, channel.portamentoTarget);
    }
    channel.basePeriod = channel.period;
  }

  processVibrato(channel) {
    if (channel.basePeriod === 0) return;
    const pos = channel.vibratoPos & 31;
    let delta = (SINE_TABLE[pos] * channel.vibratoDepth) >> 7;
    if (channel.vibratoPos >= 32) delta = -delta;
    channel.period = channel.basePeriod + delta;
    channel.vibratoPos = (channel.vibratoPos + channel.vibratoSpeed) & 63;
  }

  processTremolo(channel) {
    const pos = channel.tremoloPos & 31;
    let delta = (SINE_TABLE[pos] * channel.tremoloDepth) >> 6;
    if (channel.tremoloPos >= 32) delta = -delta;
    channel.volume = Math.max(0, Math.min(64, channel.volume + delta));
    channel.tremoloPos = (channel.tremoloPos + channel.tremoloSpeed) & 63;
  }

  processVolumeSlide(channel) {
    channel.volume = Math.max(0, Math.min(64, channel.volume + channel.lastVolumeSlide));
  }
}

registerProcessor('mod-worklet-processor', ModWorkletProcessor);
