/**
 * Period Table for MOD playback
 *
 * In MOD files, notes are stored as "periods" - the time between
 * samples. Higher period = lower frequency (lower pitch).
 *
 * The Amiga used these specific period values. We need to convert
 * them to frequencies for Web Audio playback.
 *
 * Formula: frequency = 7093789.2 / (period * 2)
 * (7093789.2 is the PAL Amiga clock rate)
 */

// Period values for each note (C-1 to B-3, 3 octaves)
// These are the "canonical" ProTracker periods (finetune 0)
export const PERIOD_TABLE: number[] = [
  // Octave 1: C-1 to B-1
  856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
  // Octave 2: C-2 to B-2
  428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
  // Octave 3: C-3 to B-3
  214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
];

// Full finetune period table (16 finetune values × 36 notes)
// Finetune 0-7 = 0 to +7, Finetune 8-15 = -8 to -1
export const FINETUNE_TABLE: number[][] = [
  // Finetune 0
  [856,808,762,720,678,640,604,570,538,508,480,453,428,404,381,360,339,320,302,285,269,254,240,226,214,202,190,180,170,160,151,143,135,127,120,113],
  // Finetune 1
  [850,802,757,715,674,637,601,567,535,505,477,450,425,401,379,357,337,318,300,284,268,253,239,225,213,201,189,179,169,159,150,142,134,126,119,113],
  // Finetune 2
  [844,796,752,709,670,632,597,563,532,502,474,447,422,398,376,355,335,316,298,282,266,251,237,224,211,199,188,177,167,158,149,141,133,125,118,112],
  // Finetune 3
  [838,791,746,704,665,628,592,559,528,498,470,444,419,395,373,352,332,314,296,280,264,249,235,222,209,198,187,176,166,157,148,140,132,125,118,111],
  // Finetune 4
  [832,785,741,699,660,623,588,555,524,495,467,441,416,392,370,350,330,312,294,278,262,247,233,220,208,196,185,175,165,156,147,139,131,124,117,110],
  // Finetune 5
  [826,779,736,694,655,619,584,551,520,491,463,437,413,390,368,347,328,309,292,276,260,245,232,219,206,195,184,174,164,155,146,138,130,123,116,109],
  // Finetune 6
  [820,774,730,689,651,614,580,547,516,487,460,434,410,387,365,345,325,307,290,274,258,244,230,217,205,193,183,172,163,154,145,137,129,122,115,109],
  // Finetune 7
  [814,768,725,684,646,610,575,543,513,484,457,431,407,384,363,342,323,305,288,272,256,242,228,216,204,192,181,171,161,152,144,136,128,121,114,108],
  // Finetune -8
  [907,856,808,762,720,678,640,604,570,538,508,480,453,428,404,381,360,339,320,302,285,269,254,240,226,214,202,190,180,170,160,151,143,135,127,120],
  // Finetune -7
  [900,850,802,757,715,675,636,601,567,535,505,477,450,425,401,379,357,337,318,300,284,268,253,238,225,212,200,189,179,169,159,150,142,134,126,119],
  // Finetune -6
  [894,844,796,752,709,670,632,597,563,532,502,474,447,422,398,376,355,335,316,298,282,266,251,237,223,211,199,188,177,167,158,149,141,133,125,118],
  // Finetune -5
  [887,838,791,746,704,665,628,592,559,528,498,470,444,419,395,373,352,332,314,296,280,264,249,235,222,209,198,187,176,166,157,148,140,132,125,118],
  // Finetune -4
  [881,832,785,741,699,660,623,588,555,524,494,467,441,416,392,370,350,330,312,294,278,262,247,233,220,208,196,185,175,165,156,147,139,131,123,117],
  // Finetune -3
  [875,826,779,736,694,655,619,584,551,520,491,463,437,413,390,368,347,328,309,292,276,260,245,232,219,206,195,184,174,164,155,146,138,130,123,116],
  // Finetune -2
  [868,820,774,730,689,651,614,580,547,516,487,460,434,410,387,365,345,325,307,290,274,258,244,230,217,205,193,183,172,163,154,145,137,129,122,115],
  // Finetune -1
  [862,814,768,725,684,646,610,575,543,513,484,457,431,407,384,363,342,323,305,288,272,256,242,228,216,203,192,181,171,161,152,144,136,128,121,114],
];

// Sine table for vibrato/tremolo (32 entries, values 0-255)
export const SINE_TABLE: number[] = [
  0, 24, 49, 74, 97, 120, 141, 161,
  180, 197, 212, 224, 235, 244, 250, 253,
  255, 253, 250, 244, 235, 224, 212, 197,
  180, 161, 141, 120, 97, 74, 49, 24
];

// Note names for display
export const NOTE_NAMES: string[] = [
  'C-1', 'C#1', 'D-1', 'D#1', 'E-1', 'F-1', 'F#1', 'G-1', 'G#1', 'A-1', 'A#1', 'B-1',
  'C-2', 'C#2', 'D-2', 'D#2', 'E-2', 'F-2', 'F#2', 'G-2', 'G#2', 'A-2', 'A#2', 'B-2',
  'C-3', 'C#3', 'D-3', 'D#3', 'E-3', 'F-3', 'F#3', 'G-3', 'G#3', 'A-3', 'A#3', 'B-3',
];

// Amiga PAL clock rate
const AMIGA_CLOCK = 7093789.2;

// Base sample rate for MOD samples (C-2 at period 428 on PAL Amiga)
// Calculated as: AMIGA_CLOCK / (428 * 2) = 8287.137 Hz
export const MOD_SAMPLE_RATE = 8287;

/**
 * Convert a period value to playback rate
 * 
 * The playback rate is relative to the base sample rate.
 * A rate of 1.0 = normal speed, 2.0 = double speed (octave up)
 */
export function periodToPlaybackRate(period: number): number {
  if (period === 0) return 0;
  
  // Calculate the frequency this period represents
  const frequency = AMIGA_CLOCK / (period * 2);
  
  // The playback rate is relative to C-2 (period 428)
  // C-2 at 8363 Hz sample rate should play at 1.0 rate
  const c2Frequency = AMIGA_CLOCK / (428 * 2);
  
  return frequency / c2Frequency;
}

/**
 * Find the closest note name for a period value
 */
export function periodToNoteName(period: number): string {
  if (period === 0) return '---';
  
  // Find the closest period in our table
  let closestIndex = 0;
  let closestDiff = Math.abs(PERIOD_TABLE[0] - period);
  
  for (let i = 1; i < PERIOD_TABLE.length; i++) {
    const diff = Math.abs(PERIOD_TABLE[i] - period);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  
  return NOTE_NAMES[closestIndex];
}

/**
 * Find the note index (0-35) for a given period
 */
export function periodToNoteIndex(period: number): number {
  if (period === 0) return -1;

  let closestIndex = 0;
  let closestDiff = Math.abs(PERIOD_TABLE[0] - period);

  for (let i = 1; i < PERIOD_TABLE.length; i++) {
    const diff = Math.abs(PERIOD_TABLE[i] - period);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Get period from finetune table
 * @param noteIndex Note index (0-35)
 * @param finetune Finetune value (0-15, where 0-7 = +0 to +7, 8-15 = -8 to -1)
 */
export function getFinetunedPeriod(noteIndex: number, finetune: number): number {
  if (noteIndex < 0 || noteIndex >= 36) return 0;
  const ft = finetune & 0x0F;
  return FINETUNE_TABLE[ft][noteIndex];
}

/**
 * Apply finetune to a period using the finetune table
 * Finetune ranges from -8 to +7 (stored as 0-15)
 */
export function applyFinetune(period: number, finetune: number): number {
  if (period === 0) return period;
  if (finetune === 0) return period;

  // Find note index for this period
  const noteIndex = periodToNoteIndex(period);
  if (noteIndex < 0) return period;

  // Get the finetuned period from the table
  // Convert signed finetune (-8 to +7) to table index (0-15)
  let ftIndex = finetune & 0x0F;
  if (finetune < 0) {
    ftIndex = 16 + finetune; // -8 -> 8, -1 -> 15
  }

  return FINETUNE_TABLE[ftIndex][noteIndex];
}
