/**
 * Effect 8: Set Panning
 *
 * Non-standard but commonly supported effect.
 * Sets stereo panning position.
 */

import { ChannelState } from './types';

/**
 * Effect 8: Set panning (tick 0 only)
 * 0 = full left, 128 = center, 255 = full right
 */
export function setPanning(channel: ChannelState, pan: number): void {
  // Convert 0-255 to -1 to +1
  channel.pan = (pan - 128) / 128;

  if (channel.panNode) {
    channel.panNode.pan.value = channel.pan;
  }
}
