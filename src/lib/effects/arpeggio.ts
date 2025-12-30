/**
 * Effect 0: Arpeggio
 *
 * Rapidly cycles between base note and +x and +y semitones.
 * Creates a chord-like effect.
 */

import { ChannelState, PlayerContext } from './types';
import { PERIOD_TABLE, periodToNoteIndex } from '../period-table';

/**
 * Initialize arpeggio on tick 0
 */
export function arpeggioInit(channel: ChannelState, x: number, y: number): void {
  if (x > 0 || y > 0) {
    channel.arpeggioNote1 = x;
    channel.arpeggioNote2 = y;
  }
}

/**
 * Process arpeggio on each tick
 */
export function arpeggioTick(channel: ChannelState, ctx: PlayerContext): void {
  if (channel.basePeriod === 0) return;
  if (channel.arpeggioNote1 === 0 && channel.arpeggioNote2 === 0) return;

  const tick = ctx.currentTick % 3;
  let offset = 0;

  if (tick === 1) {
    offset = channel.arpeggioNote1;
  } else if (tick === 2) {
    offset = channel.arpeggioNote2;
  }

  if (offset === 0) {
    channel.period = channel.basePeriod;
  } else {
    const noteIndex = periodToNoteIndex(channel.basePeriod);
    if (noteIndex >= 0) {
      const newIndex = Math.min(PERIOD_TABLE.length - 1, noteIndex + offset);
      channel.period = PERIOD_TABLE[newIndex];
    }
  }

  // Update playback rate
  if (channel.source && channel.period > 0) {
    const AMIGA_CLOCK = 7093789.2;
    const c2Freq = AMIGA_CLOCK / (428 * 2);
    const freq = AMIGA_CLOCK / (channel.period * 2);
    channel.source.playbackRate.value = freq / c2Freq;
  }
}
