/**
 * Effect 9: Sample Offset
 *
 * Sets the starting position for sample playback.
 */

import { ChannelState } from './types';

/**
 * Effect 9: Set sample offset (tick 0 only)
 * Parameter * 256 = offset in bytes
 */
export function sampleOffsetInit(channel: ChannelState, offset: number): void {
  if (offset > 0) {
    channel.sampleOffset = offset * 256;
  }
}

/**
 * Get sample offset and reset it
 * Called when triggering a note
 */
export function getSampleOffset(channel: ChannelState): number {
  const offset = channel.sampleOffset;
  channel.sampleOffset = 0;
  return offset;
}
