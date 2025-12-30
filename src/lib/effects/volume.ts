/**
 * Effects A, C: Volume
 *
 * A: Volume Slide - Slide volume up or down
 * C: Set Volume - Set volume directly
 */

import { ChannelState } from './types';

/**
 * Effect A: Initialize volume slide
 * High nibble = slide up, Low nibble = slide down
 */
export function volumeSlideInit(channel: ChannelState, x: number, y: number): void {
  if (x > 0 || y > 0) {
    // Can't slide both directions, up takes priority
    channel.volumeSlideSpeed = x > 0 ? x : -y;
  }
}

/**
 * Effect A: Process volume slide on each tick
 */
export function volumeSlideTick(channel: ChannelState): void {
  channel.volume = Math.max(0, Math.min(64, channel.volume + channel.volumeSlideSpeed));

  if (channel.gainNode) {
    channel.gainNode.gain.value = channel.volume / 64;
  }
}

/**
 * Effect C: Set volume (tick 0 only)
 */
export function setVolume(channel: ChannelState, volume: number): void {
  channel.volume = Math.min(64, volume);

  if (channel.gainNode) {
    channel.gainNode.gain.value = channel.volume / 64;
  }
}

/**
 * Extended Effect EA: Fine volume slide up (tick 0 only)
 */
export function fineVolumeSlideUp(channel: ChannelState, amount: number): void {
  channel.volume = Math.min(64, channel.volume + amount);

  if (channel.gainNode) {
    channel.gainNode.gain.value = channel.volume / 64;
  }
}

/**
 * Extended Effect EB: Fine volume slide down (tick 0 only)
 */
export function fineVolumeSlideDown(channel: ChannelState, amount: number): void {
  channel.volume = Math.max(0, channel.volume - amount);

  if (channel.gainNode) {
    channel.gainNode.gain.value = channel.volume / 64;
  }
}
