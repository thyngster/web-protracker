/**
 * MOD Player AudioWorklet Processor
 *
 * This runs in the audio thread for sample-accurate timing.
 * All mixing and effect processing happens here.
 */

// AudioWorklet global declarations
declare const sampleRate: number;
declare function registerProcessor(name: string, processorCtor: new () => AudioWorkletProcessor): void;

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

// Period table for note lookup
const PERIOD_TABLE = [
  856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
  428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
  214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
];

// Finetune period table (16 finetune values x 36 notes)
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

// Sine table for vibrato/tremolo
const SINE_TABLE = [
  0, 24, 49, 74, 97, 120, 141, 161,
  180, 197, 212, 224, 235, 244, 250, 253,
  255, 253, 250, 244, 235, 224, 212, 197,
  180, 161, 141, 120, 97, 74, 49, 24
];

// Amiga PAL clock rate
const AMIGA_CLOCK = 7093789.2;

interface SampleData {
  data: Float32Array;
  length: number;
  loopStart: number;
  loopLength: number;
  finetune: number;
  volume: number;
}

interface ChannelState {
  sample: SampleData | null;
  sampleNum: number;
  samplePos: number;      // Current position in sample (fractional)
  period: number;
  basePeriod: number;
  volume: number;
  pan: number;
  finetune: number;
  active: boolean;

  // Effect state
  portamentoSpeed: number;
  portamentoTarget: number;
  vibratoPos: number;
  vibratoSpeed: number;
  vibratoDepth: number;
  tremoloPos: number;
  tremoloSpeed: number;
  tremoloDepth: number;
  arpeggioNote1: number;
  arpeggioNote2: number;
  lastVolumeSlide: number;
  sampleOffset: number;
  noteDelayTick: number;
  noteDelayNote: { sampleNumber: number; period: number } | null;
  noteCutTick: number;
  retrigSpeed: number;
  glissando: boolean;
}

interface ModuleData {
  channelCount: number;
  songLength: number;
  restartPosition: number;
  patternTable: number[];
  patterns: Array<{
    rows: Array<Array<{
      sampleNumber: number;
      period: number;
      effect: number;
      effectParam: number;
    }>>;
  }>;
}

class ModWorkletProcessor extends AudioWorkletProcessor {
  private playing = false;
  private module: ModuleData | null = null;
  private samples: Map<number, SampleData> = new Map();
  private channels: ChannelState[] = [];

  // Playback position
  private currentPattern = 0;
  private currentRow = 0;
  private currentTick = 0;

  // Timing
  private bpm = 125;
  private speed = 6;
  private samplesPerTick = 0;
  private tickSampleCounter = 0;

  // Pattern loop/delay
  private patternLoopRow = 0;
  private patternLoopCount = 0;
  private patternDelayCount = 0;

  // Mute state per channel
  private channelMutes: boolean[] = [];

  // Scope visualization buffers
  private scopeBuffers: Float32Array[] = [];
  private scopeBufferSize = 128;
  private scopeWritePos = 0;
  private scopeSendCounter = 0;
  private scopeSendInterval = 2048;  // Send scope data every N samples

  constructor() {
    super();
    this.updateSamplesPerTick();

    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  private handleMessage(data: { type: string; [key: string]: unknown }): void {
    switch (data.type) {
      case 'loadModule':
        this.loadModule(data.module as ModuleData);
        break;
      case 'loadSample':
        this.loadSample(data.index as number, data.sample as SampleData);
        break;
      case 'play':
        this.play();
        break;
      case 'stop':
        this.stop();
        break;
      case 'setMute':
        this.channelMutes[data.channel as number] = data.muted as boolean;
        break;
    }
  }

  private loadModule(module: ModuleData): void {
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

  private loadSample(index: number, sample: SampleData): void {
    this.samples.set(index, sample);
  }

  private createChannel(index: number, totalChannels: number): ChannelState {
    // Classic Amiga panning: L-R-R-L
    let pan = 0;
    if (totalChannels === 4) {
      pan = (index === 0 || index === 3) ? -0.7 : 0.7;
    }

    return {
      sample: null,
      sampleNum: 0,
      samplePos: 0,
      period: 0,
      basePeriod: 0,
      volume: 64,
      pan,
      finetune: 0,
      active: false,
      portamentoSpeed: 0,
      portamentoTarget: 0,
      vibratoPos: 0,
      vibratoSpeed: 0,
      vibratoDepth: 0,
      tremoloPos: 0,
      tremoloSpeed: 0,
      tremoloDepth: 0,
      arpeggioNote1: 0,
      arpeggioNote2: 0,
      lastVolumeSlide: 0,
      sampleOffset: 0,
      noteDelayTick: 0,
      noteDelayNote: null,
      noteCutTick: 0,
      retrigSpeed: 0,
      glissando: false,
    };
  }

  private play(): void {
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

  private stop(): void {
    this.playing = false;
    for (const ch of this.channels) {
      ch.active = false;
    }
  }

  private updateSamplesPerTick(): void {
    // Samples per tick = sampleRate * 2.5 / bpm
    this.samplesPerTick = Math.floor(sampleRate * 2.5 / this.bpm);
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0];
    if (!output || output.length < 2) return true;

    const leftChannel = output[0];
    const rightChannel = output[1];

    if (!this.playing || !this.module) {
      // Output silence
      leftChannel.fill(0);
      rightChannel.fill(0);
      return true;
    }

    for (let i = 0; i < leftChannel.length; i++) {
      // Process tick if needed
      if (this.tickSampleCounter <= 0) {
        this.processTick();
        this.tickSampleCounter = this.samplesPerTick;
      }
      this.tickSampleCounter--;

      // Mix all channels
      let left = 0;
      let right = 0;

      for (let ch = 0; ch < this.channels.length; ch++) {
        const channel = this.channels[ch];
        if (!channel.active || !channel.sample || this.channelMutes[ch]) {
          // Store 0 for inactive/muted channels
          if (this.scopeBuffers[ch]) {
            this.scopeBuffers[ch][this.scopeWritePos] = 0;
          }
          continue;
        }

        const sample = this.mixChannel(channel);
        const vol = channel.volume / 64;

        // Store sample for scope visualization (pre-pan, post-volume)
        if (this.scopeBuffers[ch]) {
          this.scopeBuffers[ch][this.scopeWritePos] = sample * vol;
        }

        // Pan: -1 = full left, 0 = center, 1 = full right
        const leftGain = Math.min(1, 1 - channel.pan);
        const rightGain = Math.min(1, 1 + channel.pan);

        left += sample * vol * leftGain;
        right += sample * vol * rightGain;
      }

      // Advance scope write position
      this.scopeWritePos = (this.scopeWritePos + 1) % this.scopeBufferSize;

      // Master volume and soft clip
      const masterVol = 0.5;
      leftChannel[i] = this.softClip(left * masterVol);
      rightChannel[i] = this.softClip(right * masterVol);

      // Send scope data periodically
      this.scopeSendCounter++;
      if (this.scopeSendCounter >= this.scopeSendInterval) {
        this.scopeSendCounter = 0;
        this.sendScopeData();
      }
    }

    return true;
  }

  private sendScopeData(): void {
    if (this.scopeBuffers.length === 0) return;

    // Create copies of the scope buffers to send
    const scopeData: number[][] = this.scopeBuffers.map(buf => Array.from(buf));

    this.port.postMessage({
      type: 'scopeData',
      channels: scopeData,
    });
  }

  private mixChannel(channel: ChannelState): number {
    if (!channel.sample || channel.period === 0) return 0;

    const sample = channel.sample;
    const pos = Math.floor(channel.samplePos);

    // Get sample value with bounds check
    let value = 0;
    if (pos >= 0 && pos < sample.length) {
      value = sample.data[pos];
    } else if (sample.loopLength > 2) {
      // Handle looping
      const loopPos = sample.loopStart + ((pos - sample.loopStart) % sample.loopLength);
      if (loopPos >= 0 && loopPos < sample.length) {
        value = sample.data[loopPos];
      }
    } else {
      // Sample ended
      channel.active = false;
      return 0;
    }

    // Advance sample position based on period
    // period -> frequency: freq = AMIGA_CLOCK / (period * 2)
    // increment = freq / sampleRate
    const freq = AMIGA_CLOCK / (channel.period * 2);
    const increment = freq / sampleRate;
    channel.samplePos += increment;

    // Handle looping
    if (sample.loopLength > 2) {
      const loopEnd = sample.loopStart + sample.loopLength;
      while (channel.samplePos >= loopEnd) {
        channel.samplePos -= sample.loopLength;
      }
    } else if (channel.samplePos >= sample.length) {
      channel.active = false;
    }

    return value;
  }

  private softClip(x: number): number {
    if (x > 1) return 1;
    if (x < -1) return -1;
    return x;
  }

  private processTick(): void {
    if (!this.module) return;

    // Bounds check pattern position
    if (this.currentPattern < 0 || this.currentPattern >= this.module.songLength) {
      this.currentPattern = 0;
    }
    if (this.currentRow < 0 || this.currentRow >= 64) {
      this.currentRow = 0;
    }

    const patternIndex = this.module.patternTable[this.currentPattern];
    const pattern = this.module.patterns[patternIndex];

    if (!pattern) {
      this.stop();
      return;
    }

    const row = pattern.rows[this.currentRow];
    if (!row) {
      this.currentRow = 0;
      return;
    }

    if (this.currentTick === 0) {
      // Tick 0: Process notes and effects
      for (let ch = 0; ch < this.channels.length; ch++) {
        const note = row[ch];
        const channel = this.channels[ch];
        this.processNote(channel, note);
      }

      // Notify main thread of row change
      this.port.postMessage({
        type: 'rowChange',
        pattern: this.currentPattern,
        row: this.currentRow,
      });
    } else {
      // Other ticks: Process continuous effects
      for (let ch = 0; ch < this.channels.length; ch++) {
        const note = row[ch];
        const channel = this.channels[ch];
        this.processEffectTick(channel, note);
      }
    }

    // Advance position
    this.currentTick++;
    if (this.currentTick >= this.speed) {
      this.currentTick = 0;

      // Handle pattern delay
      if (this.patternDelayCount > 0) {
        this.patternDelayCount--;
        return;
      }

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

  private processNote(
    channel: ChannelState,
    note: { sampleNumber: number; period: number; effect: number; effectParam: number }
  ): void {
    if (!this.module) return;

    const effect = note.effect;
    const param = note.effectParam;
    const paramHi = (param >> 4) & 0x0F;

    // Check for note delay
    const hasNoteDelay = effect === 0xE && paramHi === 0xD;

    // Reset note delay state
    channel.noteDelayTick = 0;
    channel.noteDelayNote = null;
    channel.noteCutTick = 0;

    // Update sample if specified
    if (note.sampleNumber > 0) {
      const sample = this.samples.get(note.sampleNumber);
      if (sample) {
        channel.sample = sample;
        channel.sampleNum = note.sampleNumber;
        channel.volume = sample.volume;
        channel.finetune = sample.finetune;
      }
    }

    // Handle tone portamento - don't trigger, just set target
    if (effect === 3 || effect === 5) {
      if (note.period > 0) {
        channel.portamentoTarget = note.period;
      }
      if (effect === 3 && param > 0) {
        channel.portamentoSpeed = param;
      }
    } else if (note.period > 0) {
      if (hasNoteDelay) {
        channel.noteDelayNote = { sampleNumber: note.sampleNumber, period: note.period };
      } else {
        // Normal note trigger
        channel.basePeriod = note.period;
        channel.period = this.applyFinetune(note.period, channel.finetune);
        channel.vibratoPos = 0;
        this.triggerNote(channel);
      }
    }

    // Process effect on tick 0
    this.processEffect(channel, effect, param);
  }

  private triggerNote(channel: ChannelState): void {
    if (!channel.sample) return;

    channel.samplePos = channel.sampleOffset;
    channel.active = true;
    channel.sampleOffset = 0;
  }

  private applyFinetune(period: number, finetune: number): number {
    if (period === 0 || finetune === 0) return period;

    // Find note index
    const noteIndex = this.periodToNoteIndex(period);
    if (noteIndex < 0) return period;

    // Get finetuned period
    let ftIndex = finetune & 0x0F;
    if (finetune < 0) {
      ftIndex = 16 + finetune;
    }

    return FINETUNE_TABLE[ftIndex][noteIndex];
  }

  private periodToNoteIndex(period: number): number {
    if (period === 0) return -1;

    let closestIndex = 0;
    let closestDiff = Math.abs(PERIOD_TABLE[0] - period);

    for (let i = 1; i < PERIOD_TABLE.length; i++) {
      const diff = Math.abs(PERIOD_TABLE[i] - period);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  private processEffect(channel: ChannelState, effect: number, param: number): void {
    const paramHi = (param >> 4) & 0x0F;
    const paramLo = param & 0x0F;

    switch (effect) {
      case 0x0:  // Arpeggio
        if (param > 0) {
          channel.arpeggioNote1 = paramHi;
          channel.arpeggioNote2 = paramLo;
        }
        break;

      case 0x1:  // Portamento up
        if (param > 0) channel.portamentoSpeed = param;
        break;

      case 0x2:  // Portamento down
        if (param > 0) channel.portamentoSpeed = param;
        break;

      case 0x3:  // Tone portamento
        if (param > 0) channel.portamentoSpeed = param;
        break;

      case 0x4:  // Vibrato
        if (paramHi > 0) channel.vibratoSpeed = paramHi;
        if (paramLo > 0) channel.vibratoDepth = paramLo;
        break;

      case 0x5:  // Tone portamento + volume slide
        if (param > 0) channel.lastVolumeSlide = paramHi > 0 ? paramHi : -paramLo;
        break;

      case 0x6:  // Vibrato + volume slide
        if (param > 0) channel.lastVolumeSlide = paramHi > 0 ? paramHi : -paramLo;
        break;

      case 0x7:  // Tremolo
        if (paramHi > 0) channel.tremoloSpeed = paramHi;
        if (paramLo > 0) channel.tremoloDepth = paramLo;
        break;

      case 0x8:  // Set panning
        channel.pan = (param - 128) / 128;
        break;

      case 0x9:  // Sample offset
        if (param > 0) {
          channel.sampleOffset = param * 256;
        }
        break;

      case 0xA:  // Volume slide
        if (param > 0) channel.lastVolumeSlide = paramHi > 0 ? paramHi : -paramLo;
        break;

      case 0xB:  // Position jump
        this.currentPattern = param;
        this.currentRow = -1;
        break;

      case 0xC:  // Set volume
        channel.volume = Math.min(64, param);
        break;

      case 0xD:  // Pattern break
        this.currentRow = paramHi * 10 + paramLo - 1;  // BCD encoded
        this.currentPattern++;
        if (this.currentPattern >= (this.module?.songLength || 0)) {
          this.currentPattern = 0;
        }
        break;

      case 0xE:  // Extended effects
        this.processExtendedEffect(channel, paramHi, paramLo);
        break;

      case 0xF:  // Set speed/tempo
        if (param < 32) {
          this.speed = param || 1;
        } else {
          this.bpm = param;
          this.updateSamplesPerTick();
        }
        break;
    }
  }

  private processExtendedEffect(channel: ChannelState, type: number, param: number): void {
    switch (type) {
      case 0x1:  // Fine portamento up
        channel.period = Math.max(113, channel.period - param);
        channel.basePeriod = channel.period;
        break;

      case 0x2:  // Fine portamento down
        channel.period = Math.min(856, channel.period + param);
        channel.basePeriod = channel.period;
        break;

      case 0x3:  // Glissando control
        channel.glissando = param !== 0;
        break;

      case 0x4:  // Set vibrato waveform
        // 0=sine, 1=ramp, 2=square, 3=random
        // (keeping state for future use)
        break;

      case 0x5:  // Set finetune
        channel.finetune = param > 7 ? param - 16 : param;
        break;

      case 0x6:  // Pattern loop
        if (param === 0) {
          this.patternLoopRow = this.currentRow;
        } else {
          if (this.patternLoopCount === 0) {
            this.patternLoopCount = param;
          } else {
            this.patternLoopCount--;
          }
          if (this.patternLoopCount > 0) {
            this.currentRow = this.patternLoopRow - 1;
          }
        }
        break;

      case 0x7:  // Set tremolo waveform
        break;

      case 0x9:  // Retrigger note
        channel.retrigSpeed = param;
        break;

      case 0xA:  // Fine volume slide up
        channel.volume = Math.min(64, channel.volume + param);
        break;

      case 0xB:  // Fine volume slide down
        channel.volume = Math.max(0, channel.volume - param);
        break;

      case 0xC:  // Note cut
        channel.noteCutTick = param;
        break;

      case 0xD:  // Note delay
        channel.noteDelayTick = param;
        break;

      case 0xE:  // Pattern delay
        this.patternDelayCount = param;
        break;
    }
  }

  private processEffectTick(
    channel: ChannelState,
    note: { effect: number; effectParam: number }
  ): void {
    const effect = note.effect;
    const param = note.effectParam;
    const paramHi = (param >> 4) & 0x0F;
    const paramLo = param & 0x0F;

    switch (effect) {
      case 0x0:  // Arpeggio
        if (param > 0) {
          this.processArpeggio(channel);
        }
        break;

      case 0x1:  // Portamento up
        channel.period = Math.max(113, channel.period - channel.portamentoSpeed);
        channel.basePeriod = channel.period;
        break;

      case 0x2:  // Portamento down
        channel.period = Math.min(856, channel.period + channel.portamentoSpeed);
        channel.basePeriod = channel.period;
        break;

      case 0x3:  // Tone portamento
        this.processTonePortamento(channel);
        break;

      case 0x4:  // Vibrato
        this.processVibrato(channel);
        break;

      case 0x5:  // Tone portamento + volume slide
        this.processTonePortamento(channel);
        this.processVolumeSlide(channel);
        break;

      case 0x6:  // Vibrato + volume slide
        this.processVibrato(channel);
        this.processVolumeSlide(channel);
        break;

      case 0x7:  // Tremolo
        this.processTremolo(channel);
        break;

      case 0xA:  // Volume slide
        this.processVolumeSlide(channel);
        break;

      case 0xE:  // Extended effects
        if (paramHi === 0x9 && paramLo > 0) {
          // Retrigger
          if (this.currentTick % paramLo === 0) {
            this.triggerNote(channel);
          }
        } else if (paramHi === 0xC) {
          // Note cut
          if (this.currentTick === paramLo) {
            channel.volume = 0;
          }
        } else if (paramHi === 0xD) {
          // Note delay
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

  private processArpeggio(channel: ChannelState): void {
    if (channel.basePeriod === 0) return;

    const tick = this.currentTick % 3;
    let offset = 0;

    if (tick === 1) offset = channel.arpeggioNote1;
    else if (tick === 2) offset = channel.arpeggioNote2;

    if (offset === 0) {
      channel.period = channel.basePeriod;
    } else {
      const noteIndex = this.periodToNoteIndex(channel.basePeriod);
      if (noteIndex >= 0) {
        const newIndex = Math.min(PERIOD_TABLE.length - 1, noteIndex + offset);
        channel.period = PERIOD_TABLE[newIndex];
      }
    }
  }

  private processTonePortamento(channel: ChannelState): void {
    if (channel.portamentoTarget === 0 || channel.period === 0) return;

    if (channel.period < channel.portamentoTarget) {
      channel.period = Math.min(channel.period + channel.portamentoSpeed, channel.portamentoTarget);
    } else if (channel.period > channel.portamentoTarget) {
      channel.period = Math.max(channel.period - channel.portamentoSpeed, channel.portamentoTarget);
    }

    channel.basePeriod = channel.period;
  }

  private processVibrato(channel: ChannelState): void {
    if (channel.basePeriod === 0) return;

    const pos = channel.vibratoPos & 31;
    let delta = (SINE_TABLE[pos] * channel.vibratoDepth) >> 7;

    if (channel.vibratoPos >= 32) {
      delta = -delta;
    }

    channel.period = channel.basePeriod + delta;
    channel.vibratoPos = (channel.vibratoPos + channel.vibratoSpeed) & 63;
  }

  private processTremolo(channel: ChannelState): void {
    const pos = channel.tremoloPos & 31;
    let delta = (SINE_TABLE[pos] * channel.tremoloDepth) >> 6;

    if (channel.tremoloPos >= 32) {
      delta = -delta;
    }

    channel.volume = Math.max(0, Math.min(64, channel.volume + delta));
    channel.tremoloPos = (channel.tremoloPos + channel.tremoloSpeed) & 63;
  }

  private processVolumeSlide(channel: ChannelState): void {
    channel.volume = Math.max(0, Math.min(64, channel.volume + channel.lastVolumeSlide));
  }
}

registerProcessor('mod-worklet-processor', ModWorkletProcessor);
