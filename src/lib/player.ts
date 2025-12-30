/**
 * MOD Player Engine
 *
 * Uses AudioWorklet for sample-accurate playback.
 */

import { Module } from './mod-parser';

/**
 * The main player class using AudioWorklet
 */
export class ModPlayer {
  private audioContext: AudioContext;
  private workletNode: AudioWorkletNode | null = null;
  private module: Module | null = null;
  private workletReady = false;

  // Playback state (mirrored from worklet)
  private playing = false;
  private currentPattern = 0;
  private currentRow = 0;

  // Audio nodes
  private masterGain: GainNode;
  private masterAnalyser: AnalyserNode;
  private channelAnalysers: AnalyserNode[] = [];

  // Timing
  private startTime = 0;
  private elapsedTime = 0;

  // Scope visualization data (received from worklet)
  private scopeData: number[][] = [];

  // Callbacks
  onRowChange?: (pattern: number, row: number) => void;
  onStop?: () => void;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    // Master analyser for visualization
    this.masterAnalyser = audioContext.createAnalyser();
    this.masterAnalyser.fftSize = 256;

    // Master gain
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(audioContext.destination);

    this.initWorklet();
  }

  private async initWorklet(): Promise<void> {
    try {
      // Load worklet from public folder (works in both dev and production)
      await this.audioContext.audioWorklet.addModule('/mod-worklet-processor.js');
      this.workletReady = true;
    } catch (err) {
      console.error('Failed to load AudioWorklet:', err);
    }
  }

  async loadModule(mod: Module): Promise<void> {
    this.stop();
    this.module = mod;

    // Wait for worklet to be ready
    while (!this.workletReady) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Create worklet node
    this.workletNode = new AudioWorkletNode(this.audioContext, 'mod-worklet-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    // Create per-channel analysers
    this.channelAnalysers = [];
    for (let i = 0; i < mod.channelCount; i++) {
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      this.channelAnalysers.push(analyser);
    }

    this.workletNode.connect(this.masterGain);

    // Handle messages from worklet
    this.workletNode.port.onmessage = (e) => {
      const { type, pattern, row, channels } = e.data;
      if (type === 'rowChange') {
        this.currentPattern = pattern;
        this.currentRow = row;
        this.onRowChange?.(pattern, row);
      } else if (type === 'stopped') {
        this.playing = false;
        this.onStop?.();
      } else if (type === 'scopeData') {
        this.scopeData = channels;
      }
    };

    // Serialize patterns
    const serializedPatterns = mod.patterns.map(pattern => ({
      rows: pattern.rows.map(row =>
        row.map(note => ({
          sampleNumber: note.sampleNumber,
          period: note.period,
          effect: note.effect,
          effectParam: note.effectParam,
        }))
      ),
    }));

    // Send module data (without sample audio data)
    this.workletNode.port.postMessage({
      type: 'loadModule',
      module: {
        title: mod.title,
        channelCount: mod.channelCount,
        songLength: mod.songLength,
        restartPosition: mod.restartPosition,
        patternTable: Array.from(mod.patternTable),
        patterns: serializedPatterns,
      },
    });

    // Send each sample separately
    for (let i = 0; i < mod.samples.length; i++) {
      const sample = mod.samples[i];
      if (sample.data && sample.length > 0) {
        // Convert Int8Array to Float32Array for the worklet
        const floatData = new Float32Array(sample.length);
        for (let j = 0; j < sample.length; j++) {
          floatData[j] = sample.data[j] / 128;
        }

        // Transfer the array buffer for efficiency
        this.workletNode.port.postMessage({
          type: 'loadSample',
          index: i + 1,  // Samples are 1-indexed
          sample: {
            data: floatData,
            length: sample.length,
            loopStart: sample.loopStart,
            loopLength: sample.loopLength,
            finetune: sample.finetune,
            volume: sample.volume,
          },
        }, [floatData.buffer]);
      }
    }

    console.log(`Loaded: ${mod.title} (${mod.patterns.length} patterns, ${mod.samples.filter(s => s.length > 0).length} samples)`);
  }

  play(): void {
    if (!this.workletNode || this.playing) return;
    this.playing = true;
    this.startTime = this.audioContext.currentTime;
    this.workletNode.port.postMessage({ type: 'play' });
  }

  stop(): void {
    if (!this.workletNode) return;
    this.playing = false;
    this.elapsedTime = 0;
    this.workletNode.port.postMessage({ type: 'stop' });
    this.currentPattern = 0;
    this.currentRow = 0;
    this.onStop?.();
  }

  // === Public API ===

  get isPlaying(): boolean {
    return this.playing;
  }

  get position(): { pattern: number; row: number } {
    return { pattern: this.currentPattern, row: this.currentRow };
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setChannelMute(channelIndex: number, muted: boolean): void {
    if (!this.workletNode) return;
    this.workletNode.port.postMessage({
      type: 'setMute',
      channel: channelIndex,
      muted,
    });
  }

  getChannelAnalyser(channelIndex: number): AnalyserNode | null {
    if (channelIndex < 0 || channelIndex >= this.channelAnalysers.length) return null;
    return this.channelAnalysers[channelIndex];
  }

  getMasterAnalyser(): AnalyserNode {
    return this.masterAnalyser;
  }

  getElapsedTime(): number {
    if (!this.playing) return this.elapsedTime;
    return this.audioContext.currentTime - this.startTime;
  }

  get channelCount(): number {
    return this.module?.channelCount || 0;
  }

  getChannelScopeData(channelIndex: number): number[] | null {
    if (channelIndex < 0 || channelIndex >= this.scopeData.length) return null;
    return this.scopeData[channelIndex];
  }

  getAllScopeData(): number[][] {
    return this.scopeData;
  }
}
