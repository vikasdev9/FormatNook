import { z } from 'zod';

export const Base64InputSchema = z.string().trim();

export const HexInputSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F\s:\-]+$/, {
    message: 'Invalid hexadecimal characters. Only 0-9 and A-F are allowed.',
  });

export const BasicAuthHeaderSchema = z.string().trim();

export const FilenameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Filename cannot be empty' })
  .regex(/^[^<>:"/\\|?*]+$/, {
    message: 'Filename contains forbidden characters (<>:"/\\|?*)',
  });
