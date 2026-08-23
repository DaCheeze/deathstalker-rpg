import { describe, expect, it } from 'vitest';
import {
  buildComparisonPrompt,
  detectMimeType,
  extractInteractionText,
  hasConfirmedAudioAccess,
  parseArguments,
} from '../../scripts/gemini-media-compare';

describe('Gemini media comparison tooling', () => {
  it('detects supported video and audio MIME types', () => {
    expect(detectMimeType('fight.MP4')).toBe('video/mp4');
    expect(detectMimeType('fight-audio.wav')).toBe('audio/wav');
    expect(() => detectMimeType('fight.txt')).toThrow(/Unsupported media extension/u);
  });

  it('requires paired video paths and paired optional audio paths', () => {
    expect(() => parseArguments(['--current', 'current.mp4'])).toThrow(/--current and --reference/u);
    expect(() => parseArguments([
      '--current', 'current.mp4',
      '--reference', 'reference.mp4',
      '--current-audio', 'current.wav',
    ])).toThrow(/must be supplied together/u);
  });

  it('extracts text from the current step-based interaction response', () => {
    expect(extractInteractionText({
      steps: [
        { type: 'user_input', content: [{ type: 'text', text: 'ignored' }] },
        { type: 'model_output', content: [{ type: 'text', text: 'heard combat audio' }] },
      ],
    })).toBe('heard combat audio');
  });

  it('accepts only an explicit positive audio-access sentinel', () => {
    expect(hasConfirmedAudioAccess('AUDIO_STREAM_ACCESSIBLE: YES\n00:01 metallic hit')).toBe(true);
    expect(hasConfirmedAudioAccess('Audio probably exists.')).toBe(false);
    expect(hasConfirmedAudioAccess('AUDIO_STREAM_ACCESSIBLE: NO')).toBe(false);
  });

  it('keeps the final prompt grounded in audible evidence and procedural constraints', () => {
    const prompt = buildComparisonPrompt();
    expect(prompt).toContain('actually visible and audible');
    expect(prompt).toContain('timestamped evidence');
    expect(prompt).toContain('may not use recorded audio files');
  });
});
