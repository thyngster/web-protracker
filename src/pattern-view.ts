/**
 * ProTracker 2.3 Pattern View
 * Authentic ProTracker pattern display with colored channels
 */

import { Module, Note } from './lib/mod-parser';
import { periodToNoteName } from './lib/period-table';

export class PatternView {
  private container: HTMLElement;
  private module: Module | null = null;
  private currentPatternIndex = 0;
  private currentRow = 0;
  private visibleRows = 16;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error('Container not found');
    this.container = el;
  }

  setModule(mod: Module): void {
    this.module = mod;
    this.currentPatternIndex = 0;
    this.currentRow = 0;
    this.render();
  }

  setPosition(patternPos: number, row: number): void {
    if (!this.module) return;
    this.currentPatternIndex = this.module.patternTable[patternPos];
    this.currentRow = row;
    this.render();
  }

  private render(): void {
    if (!this.module) {
      this.container.innerHTML = '<div class="pt-pattern-placeholder">Drop .MOD file here</div>';
      return;
    }

    const pattern = this.module.patterns[this.currentPatternIndex];
    if (!pattern) return;

    const ch = this.module.channelCount;
    let html = '';

    const half = Math.floor(this.visibleRows / 2);

    for (let i = -half; i <= half; i++) {
      const row = this.currentRow + i;
      const isCurrent = i === 0;
      const isBeat = row >= 0 && row % 4 === 0;

      let rowClass = 'pt-row';
      if (isCurrent) {
        rowClass += ' pt-row-current';
      } else if (isBeat) {
        rowClass += ' pt-row-beat';
      } else if (row % 2 === 0) {
        rowClass += ' pt-row-even';
      } else {
        rowClass += ' pt-row-odd';
      }

      html += '<div class="' + rowClass + '">';

      // Row number
      if (row < 0 || row >= 64) {
        html += '<div class="pt-row-num">--</div>';
        for (let c = 0; c < ch; c++) {
          html += '<div class="pt-channel"><span class="pt-dim">--- -- ---</span></div>';
        }
      } else {
        const rowHex = row.toString(16).toUpperCase().padStart(2, '0');
        html += '<div class="pt-row-num">' + rowHex + '</div>';

        for (let c = 0; c < ch; c++) {
          html += '<div class="pt-channel">';
          html += this.formatNote(pattern.rows[row][c]);
          html += '</div>';
        }
      }

      html += '</div>';
    }

    this.container.innerHTML = html;
  }

  private formatNote(note: Note): string {
    // Note name (C-3, D#4, etc)
    let n: string;
    if (note.period === 0) {
      n = '<span class="pt-dim">---</span>';
    } else {
      n = '<span class="pt-note">' + periodToNoteName(note.period) + '</span>';
    }

    // Sample number (hex)
    let s: string;
    if (note.sampleNumber === 0) {
      s = '<span class="pt-dim">--</span>';
    } else {
      s = '<span class="pt-sample">' + note.sampleNumber.toString(16).toUpperCase().padStart(2, '0') + '</span>';
    }

    // Effect + param
    let e: string;
    if (note.effect === 0 && note.effectParam === 0) {
      e = '<span class="pt-dim">---</span>';
    } else {
      e = '<span class="pt-effect">' +
          note.effect.toString(16).toUpperCase() +
          note.effectParam.toString(16).toUpperCase().padStart(2, '0') +
          '</span>';
    }

    return n + ' ' + s + ' ' + e;
  }

  clear(): void {
    this.module = null;
    this.container.innerHTML = '<div class="pt-pattern-placeholder">No module</div>';
  }
}
