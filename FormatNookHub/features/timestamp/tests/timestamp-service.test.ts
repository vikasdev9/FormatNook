import { describe, it, expect } from 'vitest';
import {
  detectTimestampUnit,
  timestampToDate,
  dateToTimestamp,
  formatRelativeTime,
} from '../services/timestamp-service';

describe('Timestamp Service Suite', () => {
  it('detects timestamp unit accurately based on digit length', () => {
    expect(detectTimestampUnit(1700000000)).toBe('s');
    expect(detectTimestampUnit('1700000000')).toBe('s');
    expect(detectTimestampUnit(1700000000000)).toBe('ms');
    expect(detectTimestampUnit('1700000000000')).toBe('ms');
    expect(detectTimestampUnit(1700000000000000)).toBe('us');
    expect(detectTimestampUnit('1700000000000000000')).toBe('ns');
  });

  it('converts Unix epoch seconds to UTC, ISO, and target timezone dates', () => {
    // 1700000000 = 2023-11-14T22:13:20.000Z
    const res = timestampToDate(1700000000, 's', 'UTC');

    expect(res.valid).toBe(true);
    expect(res.seconds).toBe(1700000000);
    expect(res.isoString).toBe('2023-11-14T22:13:20.000Z');
    expect(res.utcString).toBe('Tue, 14 Nov 2023 22:13:20 GMT');
    expect(res.targetTzString).toContain('Nov 14, 2023, 22:13:20');
  });

  it('converts timestamp to different global timezones correctly', () => {
    const epoch = 1700000000; // 22:13:20 UTC
    const resLondon = timestampToDate(epoch, 's', 'Europe/London');
    const resTokyo = timestampToDate(epoch, 's', 'Asia/Tokyo'); // UTC + 9h -> Nov 15, 07:13:20

    expect(resLondon.valid).toBe(true);
    expect(resTokyo.valid).toBe(true);
    expect(resTokyo.targetTzString).toContain('07:13:20');
  });

  it('converts milliseconds timestamp automatically', () => {
    const msEpoch = 1700000000000;
    const res = timestampToDate(msEpoch, 'auto');

    expect(res.valid).toBe(true);
    expect(res.detectedUnit).toBe('ms');
    expect(res.seconds).toBe(1700000000);
    expect(res.isoString).toBe('2023-11-14T22:13:20.000Z');
  });

  it('converts human date strings back to Unix epoch seconds and milliseconds', () => {
    const res = dateToTimestamp('2023-11-14T22:13:20.000Z');

    expect(res.valid).toBe(true);
    expect(res.seconds).toBe(1700000000);
    expect(res.milliseconds).toBe(1700000000000);
    expect(res.hexSeconds).toBe('0x6553F100');
  });

  it('formats relative time correctly', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const past = new Date('2026-11-25T10:00:00Z'); // 2 hours ago
    const future = new Date('2026-11-27T12:00:00Z'); // in 2 days

    expect(formatRelativeTime(past, now)).toBe('2 hours ago');
    expect(formatRelativeTime(future, now)).toBe('2 days from now');
  });

  it('handles invalid inputs gracefully without throwing', () => {
    const resInvalid = timestampToDate('not-a-number');
    expect(resInvalid.valid).toBe(false);
    expect(resInvalid.error).toBeDefined();

    const resDateInvalid = dateToTimestamp('invalid-date');
    expect(resDateInvalid.valid).toBe(false);
    expect(resDateInvalid.error).toBeDefined();
  });
});
