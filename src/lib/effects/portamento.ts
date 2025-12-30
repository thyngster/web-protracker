/**
 * Effects 1, 2, 3: Portamento
 *
 * 1: Portamento Up - Slide pitch up
 * 2: Portamento Down - Slide pitch down
 * 3: Tone Portamento - Slide toward target note
 */

import { ChannelState } from './types';

// Period limits (ProTracker standard)
const MIN_PERIOD = 113;  // B-3
const MAX_PERIOD = 856;  // C-1

/**
 * Effect 1: Initialize portamento up
 */
export function portaUpInit(channel: ChannelState, speed: number): void {
  if (speed > 0) {
    channel.portamentoSpeed = speed;
  }
}

/**
 * Effect 1: Process portamento up on each tick
 */
export function portaUpTick(channel: ChannelState): void {
  channel.period = Math.max(MIN_PERIOD, channel.period - channel.portamentoSpeed);
  channel.basePeriod = channel.period;
  updatePitch(channel);
}

/**
 * Effect 2: Initialize portamento down
 */
export function portaDownInit(channel: ChannelState, speed: number): void {
  if (speed > 0) {
    channel.portamentoSpeed = speed;
  }
}

/**
 * Effect 2: Process portamento down on each tick
 */
export function portaDownTick(channel: ChannelState): void {
  channel.period = Math.min(MAX_PERIOD, channel.period + channel.portamentoSpeed);
  channel.basePeriod = channel.period;
  updatePitch(channel);
}

/**
 * Effect 3: Initialize tone portamento
 * Sets the target period and optionally the speed
 */
export function tonePortaInit(channel: ChannelState, targetPeriod: number, speed: number): void {
  if (targetPeriod > 0) {
    channel.portamentoTarget = targetPeriod;
  }
  if (speed > 0) {
    channel.portamentoSpeed = speed;
  }
}

/**
 * Effect 3: Process tone portamento on each tick
 * Slides toward target period
 */
export function tonePortaTick(channel: ChannelState): void {
  if (channel.portamentoTarget === 0 || channel.period === 0) return;

  if (channel.period < channel.portamentoTarget) {
    channel.period = Math.min(channel.period + channel.portamentoSpeed, channel.portamentoTarget);
  } else if (channel.period > channel.portamentoTarget) {
    channel.period = Math.max(channel.period - channel.portamentoSpeed, channel.portamentoTarget);
  }

  channel.basePeriod = channel.period;
  updatePitch(channel);
}

/**
 * Update channel playback rate based on current period
 */
function updatePitch(channel: ChannelState): void {
  if (channel.source && channel.period > 0) {
    const AMIGA_CLOCK = 7093789.2;
    const c2Freq = AMIGA_CLOCK / (428 * 2);
    const freq = AMIGA_CLOCK / (channel.period * 2);
    channel.source.playbackRate.value = freq / c2Freq;
  }
}
