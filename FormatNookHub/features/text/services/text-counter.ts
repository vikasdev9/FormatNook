import { TextStatistics } from '../types/text.types';

// Common abbreviations to prevent false sentence splits
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'eg', 'ie', 'inc', 'ltd', 'co', 'dept', 'approx', 'est', 'lbs', 'ft', 'in', 'oz'
]);

/**
 * Counts Unicode code points in a string (handling surrogate pairs, emojis, etc.)
 */
export function countCodePoints(text: string): number {
  if (!text) return 0;
  return Array.from(text).length;
}

/**
 * Counts characters excluding all whitespace characters
 */
export function countCharactersNoSpaces(text: string): number {
  if (!text) return 0;
  return Array.from(text.replace(/\s/gu, '')).length;
}

/**
 * Extracts words using Intl.Segmenter if available, or a comprehensive Unicode fallback regex.
 * Handles contractions (don't), hyphenated words (state-of-the-art), and numbers consistently.
 */
export function extractWords(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Try Intl.Segmenter first (standard ECMAScript internationalization API)
  if (typeof Intl !== 'undefined' && (Intl as unknown as { Segmenter?: unknown }).Segmenter) {
    try {
      const segmenter = new (Intl as unknown as {
        Segmenter: new (locales?: string | string[], options?: { granularity: 'word' }) => {
          segment: (input: string) => Iterable<{ segment: string; isWordLike?: boolean }>;
        };
      }).Segmenter(undefined, { granularity: 'word' });

      const words: string[] = [];
      const segments = Array.from(segmenter.segment(text));

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!seg.isWordLike) continue;

        let word = seg.segment;

        // Check if next segments form a contraction or hyphenation (e.g. state-of-the-art)
        while (i + 2 < segments.length) {
          const connector = segments[i + 1].segment;
          const nextSeg = segments[i + 2];
          if ((connector === '-' || connector === "'" || connector === '’') && nextSeg.isWordLike) {
            word += connector + nextSeg.segment;
            i += 2;
          } else {
            break;
          }
        }

        // Clean any stray edge punctuation while keeping internal apostrophes/hyphens
        const cleaned = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        if (cleaned) {
          words.push(cleaned);
        }
      }

      if (words.length > 0) {
        return words;
      }
    } catch {
      // Fall through to regex tokenizer on any runtime exception
    }
  }

  // Fallback: Unicode-aware regex matching words, contractions, hyphenated compounds, and alphanumeric numbers
  // Matches \p{L} or \p{N} with internal apostrophes/hyphens
  const regex = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;
  const matches = text.match(regex);
  return matches ? matches.map((w) => w.trim()).filter(Boolean) : [];
}

/**
 * Counts sentences while avoiding false positives from numbers (3.14) and abbreviations (Dr., e.g.).
 */
export function countSentences(text: string): number {
  if (!text || !text.trim()) return 0;

  // Mask decimal numbers like 3.14 so they are not treated as sentence terminators
  const maskedText = text.replace(/(\d)\.(\d)/g, '$1\u2024$2');

  // Split on paragraph/newlines first
  const paragraphs = maskedText.split(/\r\n|\r|\n+/);
  let totalSentences = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // Split on sentence-ending punctuation: . ! ? … or East Asian full stops 。 ！？
    const tokens = trimmedPara.split(/([.!?…]+|[。！？])/gu).filter(Boolean);

    let sentencesInPara = 0;
    let pendingWords = '';

    for (let i = 0; i < tokens.length; i++) {
      const part = tokens[i];
      if (/^[.!?…]+$/u.test(part) || /^[。！？]$/u.test(part)) {
        const words = extractWords(pendingWords);
        const lastWord = words.length > 0 ? words[words.length - 1].toLowerCase() : '';

        // If the preceding word is an honorific/abbreviation (e.g. Dr., Mr., vs.), don't split
        const isAbbr = ABBREVIATIONS.has(lastWord);

        if (isAbbr) {
          pendingWords += part;
        } else if (words.length > 0) {
          sentencesInPara++;
          pendingWords = '';
        }
      } else {
        pendingWords += part;
      }
    }

    // If remaining text had words but no terminating punctuation
    if (extractWords(pendingWords).length > 0) {
      sentencesInPara++;
    }

    totalSentences += Math.max(sentencesInPara, 1);
  }

  return totalSentences;
}

/**
 * Counts non-empty paragraphs separated by one or more blank lines.
 */
export function countParagraphs(text: string): number {
  if (!text || !text.trim()) return 0;
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

/**
 * Counts actual lines, including intentional empty lines.
 */
export function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\r\n|\r|\n/).length;
}

/**
 * Formats time in seconds to human-readable string ("X sec" or "X min Y sec")
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 sec';
  if (seconds < 60) return `${seconds} sec`;

  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (remainingSecs === 0) {
    return `${minutes} min`;
  }
  return `${minutes} min ${remainingSecs} sec`;
}

/**
 * Calculates complete text statistics from input text.
 */
export function calculateTextStatistics(
  text: string,
  readingWpm: number = 200,
  speakingWpm: number = 130
): TextStatistics {
  if (!text) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      avgWordLength: 0,
      avgWordsPerSentence: 0,
      readingTimeSeconds: 0,
      speakingTimeSeconds: 0,
      readingTimeFormatted: '0 sec',
      speakingTimeFormatted: '0 sec',
    };
  }

  const characters = countCodePoints(text);
  const charactersNoSpaces = countCharactersNoSpaces(text);
  const wordsArray = extractWords(text);
  const words = wordsArray.length;
  const sentences = countSentences(text);
  const paragraphs = countParagraphs(text);
  const lines = countLines(text);

  // Total letters/digits in words for avg word length
  const totalLetters = wordsArray.reduce((acc, word) => acc + countCodePoints(word), 0);
  const avgWordLength = words > 0 ? Number((totalLetters / words).toFixed(1)) : 0;
  const avgWordsPerSentence = sentences > 0 ? Number((words / sentences).toFixed(1)) : 0;

  // Reading & Speaking times
  const validReadingWpm = Math.max(readingWpm, 50);
  const validSpeakingWpm = Math.max(speakingWpm, 50);

  const readingTimeSeconds = words > 0 ? Math.ceil((words / validReadingWpm) * 60) : 0;
  const speakingTimeSeconds = words > 0 ? Math.ceil((words / validSpeakingWpm) * 60) : 0;

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    avgWordLength,
    avgWordsPerSentence,
    readingTimeSeconds,
    speakingTimeSeconds,
    readingTimeFormatted: formatDuration(readingTimeSeconds),
    speakingTimeFormatted: formatDuration(speakingTimeSeconds),
  };
}
