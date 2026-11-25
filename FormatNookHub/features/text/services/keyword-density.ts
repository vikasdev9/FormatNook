import { KeywordDensityResult, KeywordItem, KeywordOptions } from '../types/text.types';
import { extractWords } from './text-counter';

export const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

export function calculateKeywordDensity(
  text: string,
  options: KeywordOptions = { includeStopWords: false, caseSensitive: false }
): KeywordDensityResult {
  const words = extractWords(text);
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      oneWord: [],
      twoWord: [],
      threeWord: [],
      totalWords: 0,
    };
  }

  // Normalize tokens based on options
  const tokens = words.map((w) => (options.caseSensitive ? w : w.toLowerCase()));

  // 1-Word Tokens
  const oneWordCounts: Map<string, number> = new Map();
  for (const token of tokens) {
    const isStopWord = !options.includeStopWords && ENGLISH_STOP_WORDS.has(token.toLowerCase());
    if (isStopWord) continue;

    // Filter out purely numeric standalone strings from keywords if desired, or keep all
    oneWordCounts.set(token, (oneWordCounts.get(token) || 0) + 1);
  }

  // 2-Word Phrases (Bigrams)
  const twoWordCounts: Map<string, number> = new Map();
  for (let i = 0; i < tokens.length - 1; i++) {
    const w1 = tokens[i];
    const w2 = tokens[i + 1];

    if (!options.includeStopWords) {
      // Exclude if both words are stop words
      if (ENGLISH_STOP_WORDS.has(w1.toLowerCase()) && ENGLISH_STOP_WORDS.has(w2.toLowerCase())) {
        continue;
      }
    }

    const phrase = `${w1} ${w2}`;
    twoWordCounts.set(phrase, (twoWordCounts.get(phrase) || 0) + 1);
  }

  // 3-Word Phrases (Trigrams)
  const threeWordCounts: Map<string, number> = new Map();
  for (let i = 0; i < tokens.length - 2; i++) {
    const w1 = tokens[i];
    const w2 = tokens[i + 1];
    const w3 = tokens[i + 2];

    if (!options.includeStopWords) {
      // Exclude if all 3 words are stop words
      if (
        ENGLISH_STOP_WORDS.has(w1.toLowerCase()) &&
        ENGLISH_STOP_WORDS.has(w2.toLowerCase()) &&
        ENGLISH_STOP_WORDS.has(w3.toLowerCase())
      ) {
        continue;
      }
    }

    const phrase = `${w1} ${w2} ${w3}`;
    threeWordCounts.set(phrase, (threeWordCounts.get(phrase) || 0) + 1);
  }

  const mapToSortedItems = (map: Map<string, number>, maxItems = 15): KeywordItem[] => {
    return Array.from(map.entries())
      .map(([keyword, count]) => ({
        keyword,
        count,
        density: Number(((count / totalWords) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword))
      .slice(0, maxItems);
  };

  return {
    oneWord: mapToSortedItems(oneWordCounts),
    twoWord: mapToSortedItems(twoWordCounts),
    threeWord: mapToSortedItems(threeWordCounts),
    totalWords,
  };
}
