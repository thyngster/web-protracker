/**
 * Effect F: Set Speed/Tempo
 *
 * Values 1-31: Set speed (ticks per row)
 * Values 32-255: Set BPM (tempo)
 */

import { PlayerContext } from './types';

/**
 * Effect F: Set speed or tempo (tick 0 only)
 */
export function setSpeedTempo(ctx: PlayerContext, value: number): void {
  if (value === 0) {
    // Value 0 means stop in some trackers, but we'll ignore it
    return;
  }

  if (value < 32) {
    // Set speed (ticks per row)
    ctx.setSpeed(value);
  } else {
    // Set BPM (tempo)
    ctx.setBpm(value);
  }
}
