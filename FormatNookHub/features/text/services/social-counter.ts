import { SocialLimitStatus, SocialPlatformConfig } from '../types/text.types';
import { countCodePoints } from './text-counter';

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'x',
    name: 'X (Twitter)',
    maxChars: 280,
    recommendedChars: 250,
    notes: 'Standard tweet limit. URLs are shortened to 23 chars on X. Direct messages support up to 10,000 chars.',
  },
  {
    id: 'instagram',
    name: 'Instagram Caption',
    maxChars: 2200,
    recommendedChars: 125,
    notes: 'Captions truncate with a "...more" button after 125 characters in the mobile feed. Maximum 30 hashtags allowed.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Post',
    maxChars: 3000,
    recommendedChars: 1300,
    notes: 'Posts truncate with "...see more" after ~140 characters on mobile and ~210 characters on desktop.',
  },
  {
    id: 'facebook',
    name: 'Facebook Post',
    maxChars: 63206,
    recommendedChars: 250,
    notes: 'Short posts between 40-80 characters generally generate the highest reader engagement on Facebook.',
  },
];

/**
 * Calculates character usage, remaining characters, and limit warnings across all platforms.
 */
export function calculateSocialLimits(text: string): SocialLimitStatus[] {
  const currentChars = countCodePoints(text);

  return SOCIAL_PLATFORMS.map((platform) => {
    const remainingChars = platform.maxChars - currentChars;
    const isOverLimit = currentChars > platform.maxChars;
    const percentage = Math.min(100, Math.round((currentChars / platform.maxChars) * 100));

    return {
      ...platform,
      currentChars,
      remainingChars,
      isOverLimit,
      percentage,
    };
  });
}
