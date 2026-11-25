import { describe, it, expect } from 'vitest';
import {
  calculateTextStatistics,
  countCodePoints,
  countCharactersNoSpaces,
  extractWords,
  countSentences,
  countParagraphs,
  countLines,
  formatDuration,
} from '../services/text-counter';
import {
  calculateReadability,
  countSyllablesInWord,
  isPredominantlyLatin,
} from '../services/readability';
import { calculateKeywordDensity } from '../services/keyword-density';
import { calculateSocialLimits } from '../services/social-counter';
import {
  trimWhitespace,
  removeExtraSpaces,
  removeDuplicateLines,
  removeEmptyLines,
  normalizeLineBreaks,
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
} from '../services/text-cleaner';

describe('Text Counting & Word Segmentation Engine', () => {
  it('handles empty input gracefully', () => {
    const stats = calculateTextStatistics('');
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.charactersNoSpaces).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.paragraphs).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.readingTimeSeconds).toBe(0);
    expect(stats.speakingTimeSeconds).toBe(0);
    expect(stats.readingTimeFormatted).toBe('0 sec');
  });

  it('counts single and multiple words accurately', () => {
    expect(extractWords('Hello')).toEqual(['Hello']);
    expect(extractWords('The quick brown fox')).toHaveLength(4);
  });

  it('handles contractions and apostrophes as unified words', () => {
    const words = extractWords("Don't worry, it's state-of-the-art and they're ready.");
    expect(words).toContain("Don't");
    expect(words).toContain("it's");
    expect(words).toContain("state-of-the-art");
    expect(words).toContain("they're");
  });

  it('handles numbers and alphanumeric tokens consistently', () => {
    const words = extractWords('Product v2.5 released with 1500 units.');
    expect(words.length).toBeGreaterThanOrEqual(4);
  });

  it('correctly counts Unicode code points for emojis and astral symbols', () => {
    // Emojis: '🚀' is 1 code point but 2 UTF-16 code units
    expect(countCodePoints('🚀')).toBe(1);
    expect('🚀'.length).toBe(2);

    const textWithEmoji = 'Fast 🚀 reliable ✨';
    expect(countCodePoints(textWithEmoji)).toBe(17);
    expect(countCharactersNoSpaces(textWithEmoji)).toBe(14);
  });

  it('handles multilingual text and non-Latin scripts', () => {
    // Hindi
    const hindiWords = extractWords('नमस्ते दुनिया');
    expect(hindiWords.length).toBe(2);

    // Chinese / Japanese characters
    const cjkText = '你好世界';
    expect(countCodePoints(cjkText)).toBe(4);
  });

  it('counts sentences avoiding decimals and abbreviations', () => {
    const text = 'Dr. Smith bought 3.14 lbs of apples! Did he enjoy them? Yes.';
    const sentences = countSentences(text);
    expect(sentences).toBe(3); // 1. Dr. Smith bought... 2. Did he enjoy them? 3. Yes.
  });

  it('counts paragraphs and newline separated lines', () => {
    const text = 'First line\nSecond line\n\nNew paragraph here.\nStill in second paragraph.';
    expect(countLines(text)).toBe(5);
    expect(countParagraphs(text)).toBe(2);
  });

  it('calculates reading and speaking durations dynamically', () => {
    // 200 words at 200 WPM = 60 seconds (1 min)
    const twoHundredWords = Array(200).fill('word').join(' ');
    const stats = calculateTextStatistics(twoHundredWords, 200, 100);

    expect(stats.words).toBe(200);
    expect(stats.readingTimeSeconds).toBe(60);
    expect(stats.readingTimeFormatted).toBe('1 min');
    expect(stats.speakingTimeSeconds).toBe(120);
    expect(stats.speakingTimeFormatted).toBe('2 min');

    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(90)).toBe('1 min 30 sec');
  });
});

describe('Readability Analyzer Engine', () => {
  it('counts syllables in standard English words', () => {
    expect(countSyllablesInWord('the')).toBe(1);
    expect(countSyllablesInWord('developer')).toBe(4);
    expect(countSyllablesInWord('beautiful')).toBe(3);
    expect(countSyllablesInWord('code')).toBe(1); // silent 'e'
  });

  it('calculates Flesch Reading Ease and Flesch-Kincaid Grade Level', () => {
    const text = 'FormatNook helps developers format and validate code. It is fast and simple to use.';
    const readability = calculateReadability(text);

    expect(readability.fleschReadingEase).toBeGreaterThan(60);
    expect(readability.fleschKincaidGrade).toBeGreaterThan(0);
    expect(readability.avgSentenceLength).toBeGreaterThan(0);
    expect(readability.isReliableLanguage).toBe(true);
  });

  it('detects non-Latin scripts and sets reliability flag', () => {
    const hindiText = 'यह एक परीक्षण दस्तावेज है।';
    const readability = calculateReadability(hindiText);
    expect(readability.isReliableLanguage).toBe(false);
    expect(readability.notes).toContain('calibrated for English');
  });
});

describe('Keyword Density Engine', () => {
  it('extracts 1-word, 2-word, and 3-word ngrams with density percentage', () => {
    const text = 'developer tools are fast. developer tools are reliable. developer tools protect privacy.';
    const density = calculateKeywordDensity(text, { includeStopWords: false, caseSensitive: false });

    expect(density.totalWords).toBeGreaterThanOrEqual(9);
    expect(density.oneWord.length).toBeGreaterThan(0);
    expect(density.twoWord.length).toBeGreaterThan(0);

    const topWord = density.oneWord.find((item) => item.keyword === 'developer');
    expect(topWord).toBeDefined();
    expect(topWord?.count).toBe(3);
  });

  it('supports stop words and case sensitivity toggles', () => {
    const text = 'The the THE developer Tools tools';
    const withStopWords = calculateKeywordDensity(text, { includeStopWords: true, caseSensitive: true });

    const theItem = withStopWords.oneWord.find((item) => item.keyword === 'The');
    expect(theItem?.count).toBe(1);

    const lowerTheItem = withStopWords.oneWord.find((item) => item.keyword === 'the');
    expect(lowerTheItem?.count).toBe(1);
  });
});

describe('Social Media Limits Engine', () => {
  it('computes character limits and detects overflows', () => {
    const shortPost = 'Just launched FormatNook Hub! 🚀';
    const limits = calculateSocialLimits(shortPost);

    const xLimit = limits.find((l) => l.id === 'x');
    expect(xLimit).toBeDefined();
    expect(xLimit?.isOverLimit).toBe(false);
    expect(xLimit?.remainingChars).toBe(280 - countCodePoints(shortPost));

    // Over 280 characters
    const longPost = 'a'.repeat(300);
    const longLimits = calculateSocialLimits(longPost);
    const xOverLimit = longLimits.find((l) => l.id === 'x');
    expect(xOverLimit?.isOverLimit).toBe(true);
    expect(xOverLimit?.remainingChars).toBe(-20);
  });
});

describe('Text Cleaner & Formatter Engine', () => {
  it('trims whitespace and collapses extra spaces', () => {
    const text = '  Hello    world!   \n   Next   line.  ';
    expect(trimWhitespace(text)).toBe('Hello    world!\nNext   line.');
    expect(removeExtraSpaces(text)).toBe('Hello world!\nNext line.');
  });

  it('removes duplicate and empty lines', () => {
    const text = 'Line 1\nLine 1\n\n\nLine 2';
    expect(removeDuplicateLines(text)).toBe('Line 1\n\nLine 2');
    expect(removeEmptyLines(text)).toBe('Line 1\nLine 1\nLine 2');
  });

  it('normalizes line breaks to unix newlines', () => {
    const text = 'Line 1\r\nLine 2\rLine 3';
    expect(normalizeLineBreaks(text)).toBe('Line 1\nLine 2\nLine 3');
  });

  it('converts uppercase, lowercase, titlecase and sentencecase', () => {
    const text = 'hello WORLD! how are YOU today?';
    expect(toUpperCase(text)).toBe('HELLO WORLD! HOW ARE YOU TODAY?');
    expect(toLowerCase(text)).toBe('hello world! how are you today?');
    expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    expect(toSentenceCase('hello world. this is great! ok? yes.')).toBe('Hello world. This is great! Ok? Yes.');
  });
});
