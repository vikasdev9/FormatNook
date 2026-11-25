export interface TextStatistics {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  avgWordLength: number;
  avgWordsPerSentence: number;
  readingTimeSeconds: number;
  speakingTimeSeconds: number;
  readingTimeFormatted: string;
  speakingTimeFormatted: string;
}

export interface ReadabilityMetrics {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  interpretation: string;
  schoolLevel: string;
  isReliableLanguage: boolean;
  notes: string;
}

export interface KeywordItem {
  keyword: string;
  count: number;
  density: number;
}

export interface KeywordDensityResult {
  oneWord: KeywordItem[];
  twoWord: KeywordItem[];
  threeWord: KeywordItem[];
  totalWords: number;
}

export interface KeywordOptions {
  includeStopWords: boolean;
  caseSensitive: boolean;
}

export interface SocialPlatformConfig {
  id: string;
  name: string;
  maxChars: number;
  recommendedChars?: number;
  notes: string;
}

export interface SocialLimitStatus extends SocialPlatformConfig {
  currentChars: number;
  remainingChars: number;
  isOverLimit: boolean;
  percentage: number;
}

export type TextTabType = 'counter' | 'readability' | 'keywords' | 'social' | 'cleaner';
