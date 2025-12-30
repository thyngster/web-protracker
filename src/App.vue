<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ModPlayer, parseMod, type Module } from './lib';
import PatternView from './components/PatternView.vue';
import Quadrascope from './components/Quadrascope.vue';
import ControlPanel from './components/ControlPanel.vue';

// State
const audioContext = ref<AudioContext | null>(null);
const player = ref<ModPlayer | null>(null);
const currentModule = ref<Module | null>(null);
const isPlaying = ref(false);
const currentPos = ref(0);
const currentRow = ref(0);
const currentPattern = ref(0);
const status = ref('ALL RIGHT');
const songTitle = ref('--------------------');
const currentSample = ref(1);
const sampleName = ref('--------------------');
const sampleVolume = ref(0);

// Animation
let animationId: number | null = null;

function initAudio() {
  if (!audioContext.value) {
    audioContext.value = new AudioContext();
    player.value = new ModPlayer(audioContext.value);

    player.value.onRowChange = (pos, row) => {
      currentPos.value = pos;
      currentRow.value = row;
      if (currentModule.value) {
        currentPattern.value = currentModule.value.patternTable[pos];
      }
    };

    player.value.onStop = () => {
      isPlaying.value = false;
      status.value = 'STOPPED';
    };
  }
  if (audioContext.value.state === 'suspended') {
    audioContext.value.resume();
  }
}

async function loadFile(file: File) {
  status.value = 'LOADING...';
  try {
    initAudio();
    const buf = await file.arrayBuffer();
    currentModule.value = parseMod(buf);
    await player.value?.loadModule(currentModule.value);

    songTitle.value = currentModule.value.title || '--------------------';
    currentPos.value = 0;
    currentRow.value = 0;
    currentPattern.value = currentModule.value.patternTable[0];
    currentSample.value = 1;
    updateSampleInfo();
    status.value = 'ALL RIGHT';
  } catch (e) {
    status.value = 'ERROR!';
    console.error(e);
  }
}

function updateSampleInfo() {
  if (!currentModule.value) return;
  const sample = currentModule.value.samples[currentSample.value - 1];
  if (sample && sample.length > 0) {
    sampleName.value = sample.name || '--------------------';
    sampleVolume.value = sample.volume;
  } else {
    sampleName.value = '--------------------';
    sampleVolume.value = 0;
  }
}

function play() {
  if (!player.value || !currentModule.value) return;
  initAudio();
  player.value.play();
  isPlaying.value = true;
  status.value = 'PLAYING';
}

function stop() {
  player.value?.stop();
  isPlaying.value = false;
}

function changeSample(delta: number) {
  currentSample.value = Math.max(1, Math.min(31, currentSample.value + delta));
  updateSampleInfo();
}

// Drag and drop
function onDragOver(e: DragEvent) {
  e.preventDefault();
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file && file.name.toLowerCase().endsWith('.mod')) {
    loadFile(file);
  }
}

// Keyboard
function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault();
    isPlaying.value ? stop() : play();
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
  if (animationId) cancelAnimationFrame(animationId);
  player.value?.stop();
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 py-4">
    <div
      class=" w-full max-h-[600px] min-h-[600px] max-w-[704px] min-w-[704px] bg-[#888] border-2 border-t-gray-300 border-l-white border-r-[#555] border-b-[#555]"
      @dragover="onDragOver" @drop="onDrop">
      <div class="grid grid-cols-12">
        <div class="col-span-5">
          <div class="grid grid-cols-1">
            <div class="col-span-5 bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none">
                <div class="col-span-2 raised flex items-center justify-center px-2 h-6">POS</div>
                <div class="col-span-1 raised flex items-center justify-center">I</div>
                <div class="col-span-1 raised flex items-center justify-center">D</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5 bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none">
                <div class="col-span-4 raised-no-bottom flex items-center justify-center px-2 h-6">PATTERN</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5  text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none ">
                <div class="col-span-4 raised-no-top flex items-center justify-center px-2 h-6 ">LENGTH</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5 bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none">
                <div class="col-span-4 raised-no-bottom flex items-center justify-center px-2 h-6">FINETUNE</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5 bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none">
                <div class="col-span-4 raised-no-top-bottom flex items-center justify-center px-2 h-6">SAMPLE</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5 bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none">
                <div class="col-span-4 raised-no-top-bottom flex items-center justify-center px-2 h-6">VOLUME</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5 bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none">
                <div class="col-span-4 raised-no-top-bottom flex items-center justify-center px-2 h-6">LENGTH</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5 bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none">
                <div class="col-span-4 raised-no-top-bottom flex items-center justify-center px-2 h-6">REPEAT</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="col-span-5  text-[#BBBBBB]">
              <div class="grid grid-cols-8 leading-none ">
                <div class="col-span-4 raised-no-top flex items-center justify-center px-2 h-6 ">REPLEN</div>
                <div class="col-span-2 raised flex items-center justify-center text-black no-shadow">0000</div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U"
                    class="w-4 h-4"></div>
                <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D"
                    class="w-4 h-4"></div>
              </div>
            </div>
          </div>

        </div>
        <div class="col-span-7">
          <div class="grid grid-cols-1">
            <div class="bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-10 leading-none">
                <div class="col-span-3 raised flex items-center justify-center px-2 h-6 cursor-pointer hover:bg-[#999]" @click="play">PLAY</div>
                <div class="col-span-3 raised flex items-center justify-center cursor-pointer hover:bg-[#999]" @click="stop">STOP</div>
                <div class="col-span-3 raised flex items-center justify-center">MOD2WAV</div>
                <div class="col-span-1 raised flex items-center justify-center">1</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-10 leading-none">
                <div class="col-span-3 raised flex items-center justify-center px-2 h-6">PATTERN</div>
                <div class="col-span-3 raised flex items-center justify-center">CLEAR</div>
                <div class="col-span-3 raised flex items-center justify-center">PAT2SMP</div>
                <div class="col-span-1 raised flex items-center justify-center">2</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-10 leading-none">
                <div class="col-span-3 raised flex items-center justify-center px-2 h-6">EDIT</div>
                <div class="col-span-3 raised flex items-center justify-center">EDIT OP.</div>
                <div class="col-span-3 raised flex items-center justify-center">POS ED.</div>
                <div class="col-span-1 raised flex items-center justify-center">3</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-10 leading-none">
                <div class="col-span-3 raised flex items-center justify-center px-2 h-6">RECORD</div>
                <div class="col-span-3 raised flex items-center justify-center cursor-pointer hover:bg-[#999]" @click="($refs.fileInput as HTMLInputElement)?.click()">DISK OP.</div>
                <div class="col-span-3 raised flex items-center justify-center">SAMPLER</div>
                <div class="col-span-1 raised flex items-center justify-center">4</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div class="bg-yellow-300 text-[#BBBBBB]">
              <div class="grid grid-cols-10 leading-none">
                <div class="col-span-9 raised flex items-center justify-center px-2 h-6">Quadrascope</div>
                <div class="col-span-1 raised flex items-center justify-center">A</div>
              </div>
            </div>
          </div>
          <div>
            <Quadrascope :player="player" :isPlaying="isPlaying" />
          </div>
          <div class="grid grid-cols-1">
            <div class="text-[#BBBBBB] text-[10px]">
              <div class="grid grid-cols-10">
                <div class="col-span-10 raised flex items-center justify-between px-2 h-6 w-full">
                  <span>DEBUG'EM ALL</span><span>@thyng DECEMBER 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="grid grid-cols-1">
        <div class="grid grid-cols-1 leading-none">
          <div class="col-span-2 raised flex items-center justify-center px-2 h-6 pl-12">
            <span class="text-[#BBBBBB] ">SONGNAME:</span> <span
              class=" text-black no-shadow">______________________________ 00:00</span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1">
        <div class="grid grid-cols-12 leading-none">
          <div class="col-span-10 raised flex items-center justify-center px-2 h-6 pl-0">
            <span class="text-[#BBBBBB]">SAMPLENAME:</span> <span
              class=" text-black no-shadow">__________________________</span>
          </div>
          <div class="col-span-2 raised flex items-center justify-center px-2 h-6">
            <span class="text-[#BBBBBB]">LOAD</span>
          </div>

        </div>
      </div>

      <div class="grid grid-cols-12 leading-none h-11">
        <div class="col-span-1 inset flex items-center justify-center text-black no-shadow">00</div>
        <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U" class="w-4 h-4"></div>
        <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D" class="w-4 h-4"></div>
        <div class="col-span-1 inset flex items-center justify-center text-black no-shadow">125</div>
        <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/uparrow.png" alt="U" class="w-4 h-4"></div>
        <div class="col-span-1 raised flex items-center justify-center"><img src="/icons/downarrow.png" alt="D" class="w-4 h-4"></div>
        <div class="col-span-6 raised flex items-center px-2">
          <span class="text-[#BBBBBB]">STATUS:</span><span class="text-black no-shadow ml-1">ALL RIGHT</span>
          <span class="text-[#BBBBBB] ml-auto">TUNE</span><span class="text-black no-shadow ml-1">2108</span>
        </div>
      </div>
      <div class="grid grid-cols-12 leading-none h-6">
        <div class="col-span-2 raised flex items-center justify-center"><span class="text-[#BBBBBB]">TEMPO</span></div>
        <div class="col-span-4 raised flex items-center justify-center"></div>
        <div class="col-span-4 raised flex items-center px-2">
          <span class="text-[#BBBBBB]">TIMING</span><span class="text-black no-shadow ml-1">CIA</span>
        </div>
        <div class="col-span-2 raised flex items-center justify-center"></div>
      </div>
      <!-- Pattern Editor -->
      <div
        class="bg-[#000022] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white m-1 h-64 min-h-44 overflow-hidden no-shadow">
        <PatternView :module="currentModule" :currentPattern="currentPattern" :currentRow="currentRow" />
      </div>
      <!-- Hidden file input -->
      <input ref="fileInput" type="file" accept=".mod" class="hidden"
        @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) loadFile(f); }" />
    </div>
    <!-- Instructions -->
    <div class="max-w-[704px] text-sm text-gray-400 no-shadow px-2">
      <p class="font-bold text-yellow-400 mb-2">Work in Progress</p>
      <p class="mb-2">Most buttons are not functional yet. To play a MOD file:</p>
      <ol class="list-decimal list-inside space-y-1 mb-2">
        <li>Click <strong>DISK OP.</strong> to select a .MOD file</li>
        <li>Click <strong>PLAY</strong> to start playback</li>
        <li>Click <strong>STOP</strong> to stop</li>
      </ol>
      <p class="text-gray-500">You can also drag and drop a .MOD file onto the player.</p>
    </div>
  </div>
  <div v-if="0"
    class="w-full max-w-[1000px] bg-[#888] border-2 border-t-white border-l-white border-r-[#555] border-b-[#555]"
    @dragover="onDragOver" @drop="onDrop">
    <!-- Top Section -->
    <div class="flex flex-wrap bg-[#888] p-1 gap-1">
      <ControlPanel :pos="currentPos" :pattern="currentPattern" :length="currentModule?.songLength ?? 0"
        :sample="currentSample" :sampleVolume="sampleVolume" :isPlaying="isPlaying" @play="play" @stop="stop"
        @sample-change="changeSample" @load="($refs.fileInput as HTMLInputElement)?.click()" />
      <Quadrascope :player="player" :isPlaying="isPlaying" />
    </div>

    <!-- Title Bar -->
    <div
      class="bg-[#445566] text-[#aabbcc] text-sm py-1 px-2 flex justify-between border-2 border-t-[#555] border-l-[#555] border-r-[#888] border-b-[#888] font-bold">
      <span>PROTRACKER V2.3A</span>
      <span>CLONE 2025</span>
    </div>

    <!-- Song Info -->
    <div class="bg-[#888] p-1">
      <div class="flex items-center gap-1 py-0.5 flex-wrap">
        <span
          class="bg-[#888] text-black text-sm py-0.5 px-2 min-w-7 text-center border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] font-bold">{{
            currentSample }}</span>
        <span class="text-[#555] text-sm font-bold">SONGNAME:</span>
        <span
          class="flex-1 min-w-40 bg-[#888] text-black text-base py-0.5 px-2 border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white overflow-hidden whitespace-nowrap uppercase">{{
            songTitle }}</span>
        <span
          class="bg-[#445566] text-[#00cccc] text-base py-0.5 px-2 border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white">00:00</span>
      </div>
      <div class="flex items-center gap-1 py-0.5 flex-wrap">
        <span class="text-[#555] text-sm font-bold">SAMPLENAME:</span>
        <span
          class="flex-1 min-w-40 bg-[#888] text-black text-base py-0.5 px-2 border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white overflow-hidden whitespace-nowrap uppercase">{{
            sampleName }}</span>
        <button
          class="bg-[#888] text-black text-sm py-1 px-3 cursor-pointer border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] font-bold flex items-center justify-center hover:bg-[#aaa] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white active:bg-[#888]"
          @click="($refs.fileInput as HTMLInputElement)?.click()">LOAD</button>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="flex gap-3 py-1 px-2 bg-[#888] border-t-2 border-[#555] flex-wrap items-center">
      <div class="flex items-center gap-1">
        <span class="text-[#555] text-sm font-bold">♪</span>
        <span
          class="bg-[#445566] text-[#00ff00] text-base py-0.5 px-2 border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white font-bold">125</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[#555] text-sm font-bold">STATUS:</span>
        <span
          class="bg-[#445566] text-[#00ff00] text-base py-0.5 px-2 border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white font-bold">{{
            status }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[#555] text-sm font-bold">TUNE</span>
        <span
          class="bg-[#445566] text-[#00ff00] text-base py-0.5 px-2 border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white font-bold">0</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[#555] text-sm font-bold">FREE</span>
        <span
          class="bg-[#445566] text-[#00ff00] text-base py-0.5 px-2 border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white font-bold">624358</span>
      </div>
    </div>

    <!-- Pattern Editor -->
    <div
      class="bg-[#000022] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white m-1 h-60 min-h-44 overflow-hidden">
      <PatternView :module="currentModule" :currentPattern="currentPattern" :currentRow="currentRow" />
    </div>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept=".mod" class="hidden"
      @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) loadFile(f); }" />
  </div>
</template>

<style>
@import './style.css';
</style>
