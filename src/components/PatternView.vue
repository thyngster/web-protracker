<script setup lang="ts">
import { computed } from 'vue';
import type { Module, Note } from '../lib';
import { periodToNoteName } from '../lib';

const props = defineProps<{
  module: Module | null;
  currentPattern: number;
  currentRow: number;
}>();

const visibleRows = 16;

const rows = computed(() => {
  if (!props.module) return [];

  const pattern = props.module.patterns[props.currentPattern];
  if (!pattern) return [];

  const half = Math.floor(visibleRows / 2);
  const result = [];

  for (let i = -half; i <= half; i++) {
    const rowIndex = props.currentRow + i;
    const isCurrent = i === 0;
    const isBeat = rowIndex >= 0 && rowIndex % 4 === 0;

    if (rowIndex < 0 || rowIndex >= 64) {
      result.push({
        index: rowIndex,
        hex: '--',
        isCurrent,
        isBeat,
        isEmpty: true,
        channels: Array(props.module.channelCount).fill(null)
      });
    } else {
      result.push({
        index: rowIndex,
        hex: rowIndex.toString(16).toUpperCase().padStart(2, '0'),
        isCurrent,
        isBeat,
        isEmpty: false,
        channels: pattern.rows[rowIndex]
      });
    }
  }
  return result;
});

function formatNote(note: Note | null): string {
  if (!note) return '<span class="text-[#224488]">--- -- ---</span>';

  const n = note.period === 0
    ? '<span class="text-[#224488]">---</span>'
    : `<span class="text-[#4488ff]">${periodToNoteName(note.period)}</span>`;

  const s = note.sampleNumber === 0
    ? '<span class="text-[#224488]">--</span>'
    : `<span class="text-[#4488ff]">${note.sampleNumber.toString(16).toUpperCase().padStart(2, '0')}</span>`;

  const e = (note.effect === 0 && note.effectParam === 0)
    ? '<span class="text-[#224488]">---</span>'
    : `<span class="text-[#4488ff]">${note.effect.toString(16).toUpperCase()}${note.effectParam.toString(16).toUpperCase().padStart(2, '0')}</span>`;

  return `${n} ${s} ${e}`;
}
</script>

<template>
  <div class="" v-if="module">
    <div
      v-for="row in rows"
      :key="row.index"
      :class="[
        'flex h-4.5 items-center',
        row.isCurrent ? 'bg-[#222266]' : '',
        !row.isCurrent && row.isBeat ? 'bg-[#000044]' : '',
        !row.isCurrent && !row.isBeat && row.index % 2 === 0 ? 'bg-[#000033]' : '',
        !row.isCurrent && !row.isBeat && row.index % 2 !== 0 ? 'bg-[#000022]' : ''
      ]"
    >
      <div :class="[
        'w-8 text-center font-bold text-sm',
        row.isCurrent ? 'bg-[#ffaa00] text-black' : 'text-[#4488ff] bg-[#000022]'
      ]">{{ row.hex }}</div>
      <div
        v-for="(note, chIndex) in row.channels"
        :key="chIndex"
        :class="[
          'flex-1 text-center px-0.5 border-l border-[#334466] whitespace-nowrap text-sm overflow-hidden text-[#4488ff]',
          row.isCurrent ? 'bg-[#222266]' : ''
        ]"
        v-html="formatNote(note)"
      ></div>
    </div>
  </div>
  <div v-else class="text-[#224488] text-center py-24 text-base">
    Drop .MOD file here
  </div>
</template>
