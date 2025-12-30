/**
 * MOD File Parser
 * 
 * The MOD format originated on the Amiga in 1987 (ProTracker).
 * It stores:
 * - Song metadata (name, sample info)
 * - Pattern data (notes and effects)
 * - Sample data (the actual audio)
 * 
 * This is a "tracker" format - music is arranged in patterns,
 * and patterns contain rows of notes for each channel.
 */

/**
 * Sample information from the MOD header
 * Each MOD can have up to 31 samples (instruments)
 */
export interface Sample {
  name: string;           // Sample name (22 chars max)
  length: number;         // Length in bytes (stored as words, so multiply by 2)
  finetune: number;       // Fine tuning (-8 to +7)
  volume: number;         // Default volume (0-64)
  loopStart: number;      // Loop start point in bytes
  loopLength: number;     // Loop length in bytes (>1 means looping)
  data: Int8Array | null; // The actual audio data (filled in later)
}

/**
 * A single note in a pattern
 * Each channel plays one note per row
 */
export interface Note {
  sampleNumber: number;   // Which sample to play (0 = no change)
  period: number;         // Note pitch (higher = lower pitch, 0 = no note)
  effect: number;         // Effect type (0-F)
  effectParam: number;    // Effect parameter
}

/**
 * A pattern contains 64 rows of notes
 * Classic MOD has 4 channels
 */
export interface Pattern {
  rows: Note[][];  // [row][channel]
}

/**
 * The complete parsed MOD file
 */
export interface Module {
  title: string;          // Song title
  samples: Sample[];      // Up to 31 samples
  songLength: number;     // Number of patterns in song
  restartPosition: number;// Where to loop back to
  patternTable: number[]; // Order to play patterns (128 entries)
  formatId: string;       // "M.K.", "4CHN", "8CHN", etc.
  channelCount: number;   // Usually 4, can be 6 or 8
  patterns: Pattern[];    // The actual pattern data
}

/**
 * Parse a MOD file from an ArrayBuffer
 * 
 * We use DataView to read bytes at specific offsets.
 * MOD files are big-endian (most significant byte first).
 */
export function parseMod(buffer: ArrayBuffer): Module {
  const data = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  
  // Helper: Read ASCII string from buffer
  const readString = (offset: number, length: number): string => {
    let str = '';
    for (let i = 0; i < length; i++) {
      const char = bytes[offset + i];
      if (char === 0) break;  // Null terminator
      str += String.fromCharCode(char);
    }
    return str.trim();
  };
  
  // === PARSE HEADER ===
  
  // Song title: bytes 0-19 (20 bytes)
  const title = readString(0, 20);
  
  // Sample info: bytes 20-949 (31 samples × 30 bytes)
  const samples: Sample[] = [];
  for (let i = 0; i < 31; i++) {
    const offset = 20 + (i * 30);
    
    samples.push({
      name: readString(offset, 22),
      // Length is stored in words (2 bytes), so multiply by 2
      length: data.getUint16(offset + 22, false) * 2,
      // Finetune: lower 4 bits, signed (-8 to +7)
      finetune: signedNibble(bytes[offset + 24] & 0x0F),
      volume: bytes[offset + 25],
      loopStart: data.getUint16(offset + 26, false) * 2,
      loopLength: data.getUint16(offset + 28, false) * 2,
      data: null,  // We'll load this later
    });
  }
  
  // Song length: byte 950
  const songLength = bytes[950];
  
  // Restart position: byte 951
  const restartPosition = bytes[951];
  
  // Pattern table: bytes 952-1079 (128 bytes)
  const patternTable: number[] = [];
  for (let i = 0; i < 128; i++) {
    patternTable.push(bytes[952 + i]);
  }
  
  // Format ID: bytes 1080-1083
  // This tells us the format variant and channel count
  const formatId = readString(1080, 4);
  const channelCount = getChannelCount(formatId);
  
  // Count how many patterns we have
  const patternCount = Math.max(...patternTable.slice(0, songLength)) + 1;
  
  // === PARSE PATTERNS ===
  // Patterns start at byte 1084
  const patterns: Pattern[] = [];
  let patternOffset = 1084;
  
  for (let p = 0; p < patternCount; p++) {
    const pattern: Pattern = { rows: [] };
    
    for (let row = 0; row < 64; row++) {
      const rowNotes: Note[] = [];
      
      for (let ch = 0; ch < channelCount; ch++) {
        // Each note is 4 bytes packed together
        const b0 = bytes[patternOffset++];
        const b1 = bytes[patternOffset++];
        const b2 = bytes[patternOffset++];
        const b3 = bytes[patternOffset++];
        
        // Unpack the note data (this is the tricky bit!)
        // Sample number: upper 4 bits of byte 0 + upper 4 bits of byte 2
        const sampleNumber = (b0 & 0xF0) | ((b2 & 0xF0) >> 4);
        // Period: lower 4 bits of byte 0 + all of byte 1
        const period = ((b0 & 0x0F) << 8) | b1;
        // Effect: lower 4 bits of byte 2
        const effect = b2 & 0x0F;
        // Effect parameter: all of byte 3
        const effectParam = b3;
        
        rowNotes.push({ sampleNumber, period, effect, effectParam });
      }
      
      pattern.rows.push(rowNotes);
    }
    
    patterns.push(pattern);
  }
  
  // === PARSE SAMPLE DATA ===
  // Sample data comes right after all patterns
  let sampleOffset = patternOffset;
  
  for (const sample of samples) {
    if (sample.length > 0) {
      // MOD samples are 8-bit signed
      sample.data = new Int8Array(buffer, sampleOffset, sample.length);
      sampleOffset += sample.length;
    }
  }
  
  return {
    title,
    samples,
    songLength,
    restartPosition,
    patternTable,
    formatId,
    channelCount,
    patterns,
  };
}

/**
 * Convert unsigned nibble to signed (-8 to +7)
 */
function signedNibble(n: number): number {
  return n > 7 ? n - 16 : n;
}

/**
 * Determine channel count from format ID
 */
function getChannelCount(formatId: string): number {
  // 4 channel formats
  const fourChannel = ['M.K.', 'M!K!', 'M&K!', 'FLT4', '4CHN', 'PATT', 'NSMS', 'LARD', 'FEST', 'FIST', 'N.T.'];
  if (fourChannel.includes(formatId)) {
    return 4;
  }

  // 8 channel formats
  if (formatId === 'OKTA' || formatId === 'OCTA' || formatId === 'FLT8' || formatId === '8CHN') {
    return 8;
  }

  if (formatId === '6CHN') return 6;

  // Dynamic channel count formats: xCHN, xxCH, xxxC
  // Examples: 2CHN, 10CH, 16CH, etc.
  if (formatId.endsWith('CHN')) {
    const num = parseInt(formatId.slice(0, 1));
    if (!isNaN(num) && num >= 1) return num;
  }
  if (formatId.endsWith('CH')) {
    const num = parseInt(formatId.slice(0, 2));
    if (!isNaN(num) && num >= 1) return num;
  }
  if (formatId.endsWith('CN') || formatId.endsWith('C')) {
    const num = parseInt(formatId.slice(0, 2));
    if (!isNaN(num) && num >= 1) return num;
  }

  // Formats with channel count after prefix: FLTx, EXOx, CD81, TDZx, FA0x
  if (formatId.startsWith('FLT') || formatId.startsWith('EXO') ||
      formatId.startsWith('TDZ') || formatId.startsWith('FA0')) {
    const num = parseInt(formatId.charAt(3));
    if (!isNaN(num) && num >= 1) return num;
  }
  if (formatId.startsWith('CD')) {
    const num = parseInt(formatId.charAt(2));
    if (!isNaN(num) && num >= 1) return num;
  }

  // Default to 4 channels for unknown formats
  return 4;
}
