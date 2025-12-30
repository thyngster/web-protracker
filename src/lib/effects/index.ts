/**
 * MOD Effects
 *
 * All ProTracker effects organized into separate modules.
 */

// Types
export type { ChannelState, PlayerContext } from './types';
export { createChannelState } from './types';

// Effect 0: Arpeggio
export { arpeggioInit, arpeggioTick } from './arpeggio';

// Effects 1, 2, 3: Portamento
export {
  portaUpInit, portaUpTick,
  portaDownInit, portaDownTick,
  tonePortaInit, tonePortaTick,
} from './portamento';

// Effect 4: Vibrato
export { vibratoInit, vibratoTick, vibratoReset } from './vibrato';

// Effect 7: Tremolo
export { tremoloInit, tremoloTick, tremoloReset } from './tremolo';

// Effect 8: Panning
export { setPanning } from './panning';

// Effect 9: Sample Offset
export { sampleOffsetInit, getSampleOffset } from './sample';

// Effects A, C: Volume
export {
  volumeSlideInit, volumeSlideTick,
  setVolume,
  fineVolumeSlideUp, fineVolumeSlideDown,
} from './volume';

// Effects B, D: Position
export { positionJump, patternBreak } from './position';

// Effect F: Speed/Tempo
export { setSpeedTempo } from './speed';

// Effect E: Extended Effects
export {
  setLEDFilter,
  finePortaUp, finePortaDown,
  glissandoControl,
  setVibratoWaveform, setTremoloWaveform,
  setFinetune,
  patternLoop, patternDelay,
  retriggerInit, shouldRetrigger,
  noteCutInit, noteCutTick,
  noteDelayInit, shouldTriggerDelayed, getDelayedNote,
} from './extended';
