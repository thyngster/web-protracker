/**
 * Effect 7: Tremolo
 *
 * Oscillates volume using a waveform (default sine).
 */

import { ChannelState } from './types';
import { SINE_TABLE } from '../period-table';

/**
 * Effect 7: Initialize tremolo
 */
export function tremoloInit(channel: ChannelState, speed: number, depth: number): void {
  if (speed > 0) {
    channel.tremoloSpeed = speed;
  }
  if (depth > 0) {
    channel.tremoloDepth = depth;
  }
}

/**
 * Effect 7: Process tremolo on each tick
 */
export function tremoloTick(channel: ChannelState): void {
  // Get delta from waveform table
  const pos = channel.tremoloPos & 31;
  let delta = 0;

  switch (channel.tremoloWaveform & 3) {
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
  delta = (delta * channel.tremoloDepth) >> 6;

  // Negative for second half of wave
  if (channel.tremoloPos >= 32) {
    delta = -delta;
  }

  // Apply to volume (clamp 0-64)
  const tremoloVolume = Math.max(0, Math.min(64, channel.volume + delta));

  // Update gain
  if (channel.gainNode) {
    channel.gainNode.gain.value = tremoloVolume / 64;
  }

  // Advance tremolo position
  channel.tremoloPos = (channel.tremoloPos + channel.tremoloSpeed) & 63;
}

/**
 * Reset tremolo position (called on new note)
 */
export function tremoloReset(channel: ChannelState): void {
  // Only reset if waveform doesn't have retrigger bit set
  if ((channel.tremoloWaveform & 4) === 0) {
    channel.tremoloPos = 0;
  }
}
