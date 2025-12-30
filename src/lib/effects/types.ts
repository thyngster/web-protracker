/**
 * Effect Types and Channel State
 */

import { Sample } from '../mod-parser';

/**
 * State for each channel
 */
export interface ChannelState {
  sample: Sample | null;
  sampleNum: number;
  period: number;              // Current period (with effects applied)
  basePeriod: number;          // Base period (without vibrato etc.)
  volume: number;              // Current volume (0-64)
  pan: number;
  finetune: number;            // Current finetune value

  // Web Audio nodes
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  panNode: StereoPannerNode | null;
  analyser: AnalyserNode | null;

  // Arpeggio state
  arpeggioNote1: number;
  arpeggioNote2: number;

  // Portamento state
  portamentoSpeed: number;
  portamentoTarget: number;

  // Vibrato state
  vibratoPos: number;
  vibratoSpeed: number;
  vibratoDepth: number;
  vibratoWaveform: number;     // 0=sine, 1=ramp, 2=square

  // Tremolo state
  tremoloPos: number;
  tremoloSpeed: number;
  tremoloDepth: number;
  tremoloWaveform: number;

  // Volume slide
  volumeSlideSpeed: number;

  // Sample offset
  sampleOffset: number;

  // Note cut/delay state
  noteCutTick: number;
  noteDelayTick: number;
  noteDelayNote: { sampleNumber: number; period: number } | null;

  // Retrigger state
  retrigSpeed: number;

  // Glissando (tone portamento quantize to semitones)
  glissando: boolean;
}

/**
 * Create initial channel state
 */
export function createChannelState(index: number, totalChannels: number, analyser: AnalyserNode | null): ChannelState {
  // Classic Amiga panning: L-R-R-L
  let pan = 0;
  if (totalChannels === 4) {
    pan = (index === 0 || index === 3) ? -0.7 : 0.7;
  }

  return {
    sample: null,
    sampleNum: 0,
    period: 0,
    basePeriod: 0,
    volume: 64,
    pan,
    finetune: 0,
    source: null,
    gainNode: null,
    panNode: null,
    analyser,
    arpeggioNote1: 0,
    arpeggioNote2: 0,
    portamentoSpeed: 0,
    portamentoTarget: 0,
    vibratoPos: 0,
    vibratoSpeed: 0,
    vibratoDepth: 0,
    vibratoWaveform: 0,
    tremoloPos: 0,
    tremoloSpeed: 0,
    tremoloDepth: 0,
    tremoloWaveform: 0,
    volumeSlideSpeed: 0,
    sampleOffset: 0,
    noteCutTick: 0,
    noteDelayTick: 0,
    noteDelayNote: null,
    retrigSpeed: 0,
    glissando: false,
  };
}

/**
 * Player context passed to effects
 */
export interface PlayerContext {
  bpm: number;
  speed: number;
  currentTick: number;
  currentRow: number;
  currentPattern: number;
  songLength: number;
  restartPosition: number;
  setBpm: (bpm: number) => void;
  setSpeed: (speed: number) => void;
  setPosition: (pattern: number, row: number) => void;
  patternLoopRow: number;
  patternLoopCount: number;
  setPatternLoop: (row: number, count: number) => void;
  patternDelayCount: number;
  setPatternDelay: (count: number) => void;
  setFilter: (enabled: boolean) => void;
}
