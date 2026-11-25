/**
 * Unix Timestamp & Epoch Converter Service
 * FormatNook Hub - Universal Developer Platform
 */

export type TimestampUnit = 'auto' | 's' | 'ms' | 'us' | 'ns';

export interface TimezoneOption {
  label: string;
  tz: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { label: 'UTC (Coordinated Universal Time)', tz: 'UTC' },
  { label: 'London, Dublin (GMT/BST)', tz: 'Europe/London' },
  { label: 'Paris, Berlin, Rome (CET/CEST)', tz: 'Europe/Paris' },
  { label: 'New York (EST/EDT)', tz: 'America/New_York' },
  { label: 'Chicago (CST/CDT)', tz: 'America/Chicago' },
  { label: 'Denver (MST/MDT)', tz: 'America/Denver' },
  { label: 'Los Angeles, San Francisco (PST/PDT)', tz: 'America/Los_Angeles' },
  { label: 'Dubai (GST)', tz: 'Asia/Dubai' },
  { label: 'India (IST - New Delhi, Mumbai)', tz: 'Asia/Kolkata' },
  { label: 'Singapore, Hong Kong, Beijing (SGT/CST)', tz: 'Asia/Singapore' },
  { label: 'Tokyo, Seoul (JST/KST)', tz: 'Asia/Tokyo' },
  { label: 'Sydney, Melbourne (AEST/AEDT)', tz: 'Australia/Sydney' },
  { label: 'Auckland (NZST/NZDT)', tz: 'Pacific/Auckland' },
];

/**
 * Detect whether a numeric string represents seconds, milliseconds, microseconds, or nanoseconds
 */
export function detectTimestampUnit(val: string | number): 's' | 'ms' | 'us' | 'ns' {
  const str = String(val).replace(/^-/, '').split('.')[0];
  const digits = str.length;

  if (digits <= 11) return 's';
  if (digits <= 14) return 'ms';
  if (digits <= 17) return 'us';
  return 'ns';
}

export interface TimestampParseResult {
  valid: boolean;
  date: Date | null;
  detectedUnit: 's' | 'ms' | 'us' | 'ns';
  seconds: number;
  milliseconds: number;
  utcString: string;
  isoString: string;
  localString: string;
  targetTzString: string;
  relativeTime: string;
  error?: string;
}

/**
 * Formats relative time from now (e.g. "5 minutes ago", "in 2 hours")
 */
export function formatRelativeTime(date: Date, now = new Date()): string {
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const isPast = diffSec < 0;
  const absSec = Math.abs(diffSec);

  if (absSec < 5) return 'Just now';
  if (absSec < 60) return `${absSec} seconds ${isPast ? 'ago' : 'from now'}`;

  const absMin = Math.round(absSec / 60);
  if (absMin < 60) return `${absMin} minute${absMin === 1 ? '' : 's'} ${isPast ? 'ago' : 'from now'}`;

  const absHour = Math.round(absMin / 60);
  if (absHour < 24) return `${absHour} hour${absHour === 1 ? '' : 's'} ${isPast ? 'ago' : 'from now'}`;

  const absDays = Math.round(absHour / 24);
  if (absDays < 30) return `${absDays} day${absDays === 1 ? '' : 's'} ${isPast ? 'ago' : 'from now'}`;

  const absMonths = Math.round(absDays / 30);
  if (absMonths < 12) return `${absMonths} month${absMonths === 1 ? '' : 's'} ${isPast ? 'ago' : 'from now'}`;

  const absYears = Math.round(absDays / 365);
  return `${absYears} year${absYears === 1 ? '' : 's'} ${isPast ? 'ago' : 'from now'}`;
}

/**
 * Convert numeric timestamp to human readable date and timezone breakdowns
 */
export function timestampToDate(
  input: string | number,
  unit: TimestampUnit = 'auto',
  targetTz = 'UTC'
): TimestampParseResult {
  const str = String(input).trim();
  if (!str) {
    return {
      valid: false,
      date: null,
      detectedUnit: 's',
      seconds: 0,
      milliseconds: 0,
      utcString: '',
      isoString: '',
      localString: '',
      targetTzString: '',
      relativeTime: '',
      error: 'Please enter a numeric timestamp.',
    };
  }

  const rawNum = Number(str);
  if (isNaN(rawNum) || !isFinite(rawNum)) {
    return {
      valid: false,
      date: null,
      detectedUnit: 's',
      seconds: 0,
      milliseconds: 0,
      utcString: '',
      isoString: '',
      localString: '',
      targetTzString: '',
      relativeTime: '',
      error: 'Invalid numeric timestamp format.',
    };
  }

  const detected = unit === 'auto' ? detectTimestampUnit(str) : unit;
  let ms: number;

  switch (detected) {
    case 'ms':
      ms = rawNum;
      break;
    case 'us':
      ms = rawNum / 1000;
      break;
    case 'ns':
      ms = rawNum / 1000000;
      break;
    case 's':
    default:
      ms = rawNum * 1000;
      break;
  }

  const date = new Date(ms);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      date: null,
      detectedUnit: detected,
      seconds: 0,
      milliseconds: 0,
      utcString: '',
      isoString: '',
      localString: '',
      targetTzString: '',
      relativeTime: '',
      error: 'Timestamp results in an out-of-range date.',
    };
  }

  const seconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms);

  // Timezone formatting using standard Intl API
  let targetTzString = '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
    targetTzString = formatter.format(date);
  } catch {
    targetTzString = date.toUTCString();
  }

  return {
    valid: true,
    date,
    detectedUnit: detected,
    seconds,
    milliseconds,
    utcString: date.toUTCString(),
    isoString: date.toISOString(),
    localString: date.toLocaleString(),
    targetTzString,
    relativeTime: formatRelativeTime(date),
  };
}

export interface DateParseResult {
  valid: boolean;
  seconds: number;
  milliseconds: number;
  hexSeconds: string;
  isoString: string;
  utcString: string;
  error?: string;
}

/**
 * Convert human date input into Unix epoch seconds and milliseconds
 */
export function dateToTimestamp(dateStr: string): DateParseResult {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return {
      valid: false,
      seconds: 0,
      milliseconds: 0,
      hexSeconds: '',
      isoString: '',
      utcString: '',
      error: 'Please provide a valid date string.',
    };
  }

  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      seconds: 0,
      milliseconds: 0,
      hexSeconds: '',
      isoString: '',
      utcString: '',
      error: 'Unrecognized date format. Try YYYY-MM-DD HH:mm:ss or ISO 8601.',
    };
  }

  const ms = date.getTime();
  const s = Math.floor(ms / 1000);
  const hex = '0x' + s.toString(16).toUpperCase();

  return {
    valid: true,
    seconds: s,
    milliseconds: ms,
    hexSeconds: hex,
    isoString: date.toISOString(),
    utcString: date.toUTCString(),
  };
}
