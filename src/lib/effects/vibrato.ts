/**
 * Effect 4: Vibrato
 *
 * Oscillates pitch using a waveform (default sine).
 * Does not modify basePeriod, only the current period.
 */

import { ChannelState } from './types';
import { SINE_TABLE } from '../period-table';

/**
 * Effect 4: Initialize vibrato
 */
export function vibratoInit(channel: ChannelState, speed: number, depth: number): void {
  if (speed > 0) {
    channel.vibratoSpeed = speed;
  }
  if (depth > 0) {
    channel.vibratoDepth = depth;
  }
}

/**
 * Effect 4: Process vibrato on each tick
 */
export function vibratoTick(channel: ChannelState): void {
  if (channel.basePeriod === 0) return;

  // Get delta from waveform table
  const pos = channel.vibratoPos & 31;
  let delta = 0;

  switch (channel.vibratoWaveform & 3) {
    case 0: // Sine (default)
      delta = SINE_TABLE[pos];
      break;
    case 1: // Ramp down
      delta = 255 - (pos << 3);
      break;
    case 2: // Square
      delta = 255;
      break;
    case 3: // Random (use sine for now)
      delta = SINE_TABLE[pos];
      break;
  }

  // Scale by depth
  delta = (delta * channel.vibratoDepth) >> 7;

  // Negative for second half of wave
  if (channel.vibratoPos >= 32) {
    delta = -delta;
  }

  // Apply to pitch (don't modify base period)
  channel.period = channel.basePeriod + delta;

  // Update playback rate
  if (channel.source && channel.period > 0) {
    const AMIGA_CLOCK = 7093789.2;
    const c2Freq = AMIGA_CLOCK / (428 * 2);
    const freq = AMIGA_CLOCK / (channel.period * 2);
    channel.source.playbackRate.value = freq / c2Freq;
  }

  // Advance vibrato position
  channel.vibratoPos = (channel.vibratoPos + channel.vibratoSpeed) & 63;
}

/**
 * Reset vibrato position (called on new note)
 */
export function vibratoReset(channel: ChannelState): void {
  // Only reset if waveform doesn't have retrigger bit set
  if ((channel.vibratoWaveform & 4) === 0) {
    channel.vibratoPos = 0;
  }
}
