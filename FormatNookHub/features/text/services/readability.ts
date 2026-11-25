import { ReadabilityMetrics } from '../types/text.types';
import { extractWords, countSentences } from './text-counter';

/**
 * Counts syllables in an English word using phonetic heuristic rules.
 */
export function countSyllablesInWord(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;

  // Clean common suffix patterns that don't add syllables
  let processed = word
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  if (!processed) return 1;

  // Match vowel groups (including y)
  const syllableMatches = processed.match(/[aeiouy]+/g);
  const count = syllableMatches ? syllableMatches.length : 1;

  return Math.max(1, count);
}

/**
 * Counts total syllables across an array of words.
 */
export function countTotalSyllables(words: string[]): number {
  return words.reduce((total, word) => total + countSyllablesInWord(word), 0);
}

/**
 * Evaluates whether text is predominantly English / Latin script,
 * which is required for Flesch formulas to produce valid results.
 */
export function isPredominantlyLatin(text: string): boolean {
  if (!text) return true;
  const latinMatches = text.match(/[a-zA-Z]/g) || [];
  const letters = text.match(/[\p{L}]/gu) || [];
  const nonLatinCount = letters.length - latinMatches.length;
  return latinMatches.length >= nonLatinCount;
}

export function calculateReadability(text: string): ReadabilityMetrics {
  const words = extractWords(text);
  const totalWords = words.length;
  const sentences = countSentences(text);
  const totalSyllables = countTotalSyllables(words);
  const isReliableLanguage = isPredominantlyLatin(text);

  if (totalWords === 0 || sentences === 0) {
    return {
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      avgSentenceLength: 0,
      avgSyllablesPerWord: 0,
      interpretation: 'No text provided',
      schoolLevel: 'N/A',
      isReliableLanguage: true,
      notes: 'Enter text to calculate readability metrics.',
    };
  }

  const avgSentenceLength = Number((totalWords / sentences).toFixed(1));
  const avgSyllablesPerWord = Number((totalSyllables / totalWords).toFixed(2));

  // Flesch Reading Ease Formula:
  // 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
  let ease = 206.835 - (1.015 * (totalWords / sentences)) - (84.6 * (totalSyllables / totalWords));
  ease = Number(Math.max(0, Math.min(100, ease)).toFixed(1));

  // Flesch-Kincaid Grade Level Formula:
  // 0.39 * (total words / total sentences) + 11.8 * (total syllables / total words) - 15.59
  let grade = (0.39 * (totalWords / sentences)) + (11.8 * (totalSyllables / totalWords)) - 15.59;
  grade = Number(Math.max(0, grade).toFixed(1));

  let interpretation = '';
  let schoolLevel = '';

  if (ease >= 90) {
    interpretation = 'Very Easy';
    schoolLevel = '5th grade (Conversational)';
  } else if (ease >= 80) {
    interpretation = 'Easy';
    schoolLevel = '6th grade (Plain English)';
  } else if (ease >= 70) {
    interpretation = 'Fairly Easy';
    schoolLevel = '7th grade';
  } else if (ease >= 60) {
    interpretation = 'Standard';
    schoolLevel = '8th & 9th grade (General audience)';
  } else if (ease >= 50) {
    interpretation = 'Fairly Difficult';
    schoolLevel = '10th to 12th grade (High school)';
  } else if (ease >= 30) {
    interpretation = 'Difficult';
    schoolLevel = 'College level';
  } else {
    interpretation = 'Very Difficult';
    schoolLevel = 'College graduate (Academic / Technical)';
  }

  const notes = isReliableLanguage
    ? 'Flesch readability formulas evaluate sentence length and syllable density.'
    : 'Notice: Flesch-Kincaid formulas are calibrated for English text. Syllable counting on non-Latin or other language scripts may not produce accurate readability ratings.';

  return {
    fleschReadingEase: ease,
    fleschKincaidGrade: grade,
    avgSentenceLength,
    avgSyllablesPerWord,
    interpretation,
    schoolLevel,
    isReliableLanguage,
    notes,
  };
}
