<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

interface PlayerLike {
  getChannelScopeData(channelIndex: number): number[] | null;
  channelCount: number;
}

const props = defineProps<{
  player: PlayerLike | null;
  isPlaying: boolean;
}>();

const canvases = ref<(HTMLCanvasElement | null)[]>([null, null, null, null]);
let animationId: number | null = null;

function drawScopes() {
  const channelCount = props.player?.channelCount || 4;

  canvases.value.forEach((canvas, i) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable anti-aliasing for pixelated look
    ctx.imageSmoothingEnabled = false;

    // Dark blue background
    ctx.fillStyle = '#000022';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    ctx.fillStyle = '#ffff00';

    // Draw per-channel waveform or center line
    if (props.isPlaying && i < channelCount) {
      const scopeData = props.player?.getChannelScopeData(i);
      if (scopeData && scopeData.length > 0) {
        // Draw waveform only (no center line when playing)
        for (let x = 0; x < canvas.width; x++) {
          const dataIndex = Math.floor(x * scopeData.length / canvas.width);
          const sample = scopeData[dataIndex] || 0;
          const y = Math.floor(centerY - (sample * centerY * 0.9));
          ctx.fillRect(x, y, 1, 1);
        }
      } else {
        // No data yet, show center line
        for (let x = 0; x < canvas.width; x++) {
          ctx.fillRect(x, Math.floor(centerY), 1, 1);
        }
      }
    } else {
      // Not playing, show center line
      for (let x = 0; x < canvas.width; x++) {
        ctx.fillRect(x, Math.floor(centerY), 1, 1);
      }
    }
  });

  animationId = requestAnimationFrame(drawScopes);
}

function startAnimation() {
  if (animationId) return;
  drawScopes();
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  // Clear scopes with center line
  canvases.value.forEach(canvas => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000022';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffff00';
      for (let x = 0; x < canvas.width; x++) {
        ctx.fillRect(x, Math.floor(canvas.height / 2), 1, 1);
      }
    }
  });
}

watch(() => props.isPlaying, (playing) => {
  if (playing) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

onMounted(() => {
  stopAnimation(); // Initialize with empty scopes
});

onUnmounted(() => {
  stopAnimation();
});
</script>

<template>
  <div class="flex flex-col bg-[#888] border-none border-t-[#555] border-l-[#555] border-r-white border-b-white w-full">
    <div class="flex bg-[#888] p-0 gap-[1px]">
      <div v-for="i in 4" :key="i" class="flex items-stretch flex-1">
        <span class="bg-[#888] text-black text-xs w-4 min-w-4 flex items-center justify-center border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] font-bold">{{ i }}</span>
        <canvas
          :ref="(el) => canvases[i - 1] = el as HTMLCanvasElement"
          class="bg-black flex-1 h-18 "
          style="image-rendering: pixelated"
          width="40"
          height="48"
        ></canvas>
      </div>
    </div>
  </div>
</template>
