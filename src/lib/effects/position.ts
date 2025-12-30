/**
 * Effects B, D: Position Control
 *
 * B: Position Jump - Jump to a specific pattern
 * D: Pattern Break - Jump to next pattern at specific row
 */

import { PlayerContext } from './types';

/**
 * Effect B: Position jump (tick 0 only)
 * Jumps to the specified pattern position
 */
export function positionJump(ctx: PlayerContext, position: number): void {
  ctx.setPosition(position, 0);
}

/**
 * Effect D: Pattern break (tick 0 only)
 * Jumps to next pattern at specified row (BCD encoded)
 */
export function patternBreak(ctx: PlayerContext, row: number): void {
  // Row is BCD encoded: high nibble * 10 + low nibble
  const hi = (row >> 4) & 0x0F;
  const lo = row & 0x0F;
  const targetRow = hi * 10 + lo;

  // Jump to next pattern at target row
  const nextPattern = ctx.currentPattern + 1;
  ctx.setPosition(
    nextPattern >= ctx.songLength ? 0 : nextPattern,
    Math.min(63, targetRow)
  );
}
