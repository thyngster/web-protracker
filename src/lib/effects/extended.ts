/**
 * Effect E: Extended Effects
 *
 * E0: LED Filter (Amiga low-pass filter)
 * E1: Fine portamento up
 * E2: Fine portamento down
 * E3: Glissando control
 * E4: Vibrato waveform
 * E5: Set finetune
 * E6: Pattern loop
 * E7: Tremolo waveform
 * E8: Set panning (non-standard)
 * E9: Retrigger note
 * EA: Fine volume slide up
 * EB: Fine volume slide down
 * EC: Note cut
 * ED: Note delay
 * EE: Pattern delay
 * EF: Invert loop (Amiga, ignored)
 */

import { ChannelState, PlayerContext } from './types';

// Period limits
const MIN_PERIOD = 113;
const MAX_PERIOD = 856;

/**
 * E0: LED Filter (tick 0 only)
 * 0 = filter ON (muffled), 1+ = filter OFF (bright)
 */
export function setLEDFilter(ctx: PlayerContext, value: number): void {
  ctx.setFilter(value === 0);
}

/**
 * E1: Fine portamento up (tick 0 only)
 */
export function finePortaUp(channel: ChannelState, amount: number): void {
  channel.period = Math.max(MIN_PERIOD, channel.period - amount);
  channel.basePeriod = channel.period;
  updatePitch(channel);
}

/**
 * E2: Fine portamento down (tick 0 only)
 */
export function finePortaDown(channel: ChannelState, amount: number): void {
  channel.period = Math.min(MAX_PERIOD, channel.period + amount);
  channel.basePeriod = channel.period;
  updatePitch(channel);
}

/**
 * E3: Glissando control (tick 0 only)
 * 0 = off (smooth), 1 = on (quantize to semitones)
 */
export function glissandoControl(channel: ChannelState, value: number): void {
  channel.glissando = value !== 0;
}

/**
 * E4: Set vibrato waveform (tick 0 only)
 * 0 = sine, 1 = ramp, 2 = square, 3 = random
 * +4 = don't retrigger on new note
 */
export function setVibratoWaveform(channel: ChannelState, waveform: number): void {
  channel.vibratoWaveform = waveform & 7;
}

/**
 * E5: Set finetune (tick 0 only)
 * Value 0-7 = +0 to +7, 8-15 = -8 to -1
 */
export function setFinetune(channel: ChannelState, value: number): void {
  channel.finetune = value > 7 ? value - 16 : value;
}

/**
 * E6: Pattern loop (tick 0 only)
 * 0 = set loop start, 1-F = loop x times
 */
export function patternLoop(ctx: PlayerContext, count: number): void {
  if (count === 0) {
    // Set loop start point
    ctx.setPatternLoop(ctx.currentRow, ctx.patternLoopCount);
  } else {
    // Loop back
    if (ctx.patternLoopCount === 0) {
      ctx.setPatternLoop(ctx.patternLoopRow, count);
    } else {
      ctx.setPatternLoop(ctx.patternLoopRow, ctx.patternLoopCount - 1);
    }

    if (ctx.patternLoopCount > 0) {
      ctx.setPosition(ctx.currentPattern, ctx.patternLoopRow);
    }
  }
}

/**
 * E7: Set tremolo waveform (tick 0 only)
 */
export function setTremoloWaveform(channel: ChannelState, waveform: number): void {
  channel.tremoloWaveform = waveform & 7;
}

/**
 * E9: Retrigger note - Initialize
 */
export function retriggerInit(channel: ChannelState, speed: number): void {
  channel.retrigSpeed = speed;
}

/**
 * E9: Retrigger note - Check if should retrigger on this tick
 */
export function shouldRetrigger(channel: ChannelState, currentTick: number): boolean {
  if (channel.retrigSpeed === 0) return false;
  return currentTick > 0 && (currentTick % channel.retrigSpeed) === 0;
}

/**
 * EC: Note cut - Initialize
 */
export function noteCutInit(channel: ChannelState, tick: number): void {
  channel.noteCutTick = tick;
}

/**
 * EC: Note cut - Check and apply on tick
 */
export function noteCutTick(channel: ChannelState, currentTick: number): void {
  if (channel.noteCutTick > 0 && currentTick === channel.noteCutTick) {
    channel.volume = 0;
    if (channel.gainNode) {
      channel.gainNode.gain.value = 0;
    }
  }
}

/**
 * ED: Note delay - Initialize
 */
export function noteDelayInit(channel: ChannelState, tick: number, note: { sampleNumber: number; period: number } | null): void {
  channel.noteDelayTick = tick;
  channel.noteDelayNote = note;
}

/**
 * ED: Note delay - Check if should trigger on this tick
 */
export function shouldTriggerDelayed(channel: ChannelState, currentTick: number): boolean {
  return channel.noteDelayTick > 0 &&
         currentTick === channel.noteDelayTick &&
         channel.noteDelayNote !== null;
}

/**
 * ED: Note delay - Get delayed note and clear
 */
export function getDelayedNote(channel: ChannelState): { sampleNumber: number; period: number } | null {
  const note = channel.noteDelayNote;
  channel.noteDelayNote = null;
  channel.noteDelayTick = 0;
  return note;
}

/**
 * EE: Pattern delay (tick 0 only)
 */
export function patternDelay(ctx: PlayerContext, count: number): void {
  ctx.setPatternDelay(count);
}

/**
 * Helper: Update channel pitch
 */
function updatePitch(channel: ChannelState): void {
  if (channel.source && channel.period > 0) {
    const AMIGA_CLOCK = 7093789.2;
    const c2Freq = AMIGA_CLOCK / (428 * 2);
    const freq = AMIGA_CLOCK / (channel.period * 2);
    channel.source.playbackRate.value = freq / c2Freq;
  }
}
