<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { renderBitmapText, FONT_CHAR_WIDTH, FONT_CHAR_HEIGHT } from '../lib';

const props = withDefaults(defineProps<{
  text: string;
  scale?: number;
  color?: string;
  backgroundColor?: string;
}>(), {
  scale: 1,
  color: '#888888',
  backgroundColor: 'transparent',
});

const canvas = ref<HTMLCanvasElement | null>(null);

const canvasWidth = computed(() => props.text.length * FONT_CHAR_WIDTH * props.scale);
const canvasHeight = computed(() => FONT_CHAR_HEIGHT * props.scale);

function render() {
  if (!canvas.value) return;

  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // Draw background if not transparent
  if (props.backgroundColor !== 'transparent') {
    ctx.fillStyle = props.backgroundColor;
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  }

  // Render text
  renderBitmapText(ctx, props.text.toUpperCase(), 0, 0, {
    scale: props.scale,
    color: props.color,
  });
}

onMounted(() => {
  render();
});

watch(() => [props.text, props.scale, props.color, props.backgroundColor], () => {
  render();
});
</script>

<template>
  <canvas
    ref="canvas"
    :width="canvasWidth"
    :height="canvasHeight"
    class="block"
    :style="{ imageRendering: 'pixelated' }"
  />
</template>
