<script setup lang="ts">
import Quadrascope from './Quadrascope.vue';

interface PlayerLike {
  getChannelScopeData(channelIndex: number): number[] | null;
  channelCount: number;
}

defineProps<{
  pos: number;
  pattern: number;
  length: number;
  sample: number;
  sampleVolume: number;
  isPlaying: boolean;
  player: PlayerLike | null;
}>();

const emit = defineEmits<{
  play: [];
  stop: [];
  sampleChange: [delta: number];
  load: [];
}>();
</script>

<template>
    
  <div class="flex flex-col gap-1 flex-1">
    <!-- Top row: Gadgets + Buttons side by side -->
    <div class="flex gap-1">
      <!-- Left: Numeric Gadgets -->
      <div class="flex flex-col gap-[1px]">
        <!-- POS row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">POS</span>
          <button class="bg-[#888] w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white">I</button>
          <button class="bg-[#888] w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white">D</button>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">{{ pos.toString(16).toUpperCase().padStart(4, '0') }}</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white">▼</button>
          </div>
        </div>
        <!-- PATTERN row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">PATTERN</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">{{ pattern.toString(16).toUpperCase().padStart(4, '0') }}</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
        <!-- LENGTH row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">LENGTH</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">{{ length.toString(16).toUpperCase().padStart(4, '0') }}</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
        <!-- Separator -->
        <div class="h-1 bg-[#888]"></div>
        <!-- FINETUNE row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">FINETUNE</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[2rem]">+0</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
        <!-- SAMPLE row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">SAMPLE</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">{{ sample.toString(16).toUpperCase().padStart(4, '0') }}</span>
          <div class="flex flex-col">
            <button @click="emit('sampleChange', 1)" class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button @click="emit('sampleChange', -1)" class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
        <!-- VOLUME row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">VOLUME</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">{{ sampleVolume.toString(16).toUpperCase().padStart(4, '0') }}</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
        <!-- LENGTH (sample) row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">LENGTH</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">0000</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
        <!-- REPEAT row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">REPEAT</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">0000</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
        <!-- REPLEN row -->
        <div class="bg-[#888] h-6 flex items-center gap-[1px]">
          <span class="text-black font-bold text-sm px-1 text-right w-20 border-r border-[#555]">REPLEN</span>
          <span class="bg-black text-[#888] px-1 text-sm font-bold text-center min-w-[3.5rem]">0002</span>
          <div class="flex flex-col">
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▲</button>
            <button class="bg-[#888] w-4 h-3 flex items-center justify-center text-[8px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]">▼</button>
          </div>
        </div>
      </div>

      <!-- Right: Buttons Grid -->
      <div class="flex flex-col gap-[1px] flex-1">
        <div class="flex gap-[1px]">
          <button @click="emit('play')" class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white active:bg-[#777]">PLAY</button>
          <button @click="emit('stop')" class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white active:bg-[#777]">STOP</button>
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">PLST</button>
          <button class="w-8 h-6 bg-[#cc8800] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#dd9900]">1</button>
        </div>
        <div class="flex gap-[1px]">
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">PATTERN</button>
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">CLEAR</button>
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">PSET-ED</button>
          <button class="w-8 h-6 bg-[#cc8800] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#dd9900]">2</button>
        </div>
        <div class="flex gap-[1px]">
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">EDIT</button>
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">EDIT OP.</button>
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">SETUP</button>
        </div>
        <div class="flex gap-[1px]">
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">RECORD</button>
          <button @click="emit('load')" class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">DISK</button>
          <button class="flex-1 h-6 bg-[#888] text-black font-bold text-sm border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] hover:bg-[#999]">SAMPLER</button>
        </div>
      </div>
    </div>

    <!-- Quadrascope spanning full width below -->
    <Quadrascope :player="player" :isPlaying="isPlaying" />
  </div>
</template>
