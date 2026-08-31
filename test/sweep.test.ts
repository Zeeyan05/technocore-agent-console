import { describe, it, expect } from 'vitest';
import { sweep } from '../src/lib/crypto/sweep';

describe('Technocore Single-Line Sweep', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sweep('   hello world   ')).toBe('hello world');
  });

  it('replaces newlines, carriage returns, and tabs with spaces', () => {
    expect(sweep('line1\nline2\r\nline3\tline4')).toBe('line1 line2  line3 line4');
  });

  it('replaces control characters and zero-width joiners with space', () => {
    // \u200B (Zero-width space - Cf), \u0000 (Null - Cc)
    expect(sweep('alpha\u200Bbeta\u0000gamma')).toBe('alpha beta gamma');
  });

  it('preserves valid unicode characters like emojis and accents', () => {
    expect(sweep('hello 🚀 世界 ñ á')).toBe('hello 🚀 世界 ñ á');
  });
});
