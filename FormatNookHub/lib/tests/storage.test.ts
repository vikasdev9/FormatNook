import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRecentToolIds,
  addRecentToolId,
  getFavoriteToolIds,
  toggleFavoriteToolId,
  isToolFavorite,
} from '../storage';

describe('lib/storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('recent tools', () => {
    it('returns empty array when nothing is stored or invalid JSON is present', () => {
      expect(getRecentToolIds()).toEqual([]);

      localStorage.setItem('fn_recent_tools', '{ "invalid": true }');
      expect(getRecentToolIds()).toEqual([]);

      localStorage.setItem('fn_recent_tools', 'not-valid-json');
      expect(getRecentToolIds()).toEqual([]);
    });

    it('adds recent tool IDs up to max 8 and deduplicates with most recent first', () => {
      addRecentToolId('json-formatter');
      addRecentToolId('xml-formatter');
      expect(getRecentToolIds()).toEqual(['xml-formatter', 'json-formatter']);

      // Adding existing tool moves it to the front
      addRecentToolId('json-formatter');
      expect(getRecentToolIds()).toEqual(['json-formatter', 'xml-formatter']);

      // Max 8 capacity
      for (let i = 1; i <= 10; i++) {
        addRecentToolId(`tool-${i}`);
      }
      const recents = getRecentToolIds();
      expect(recents.length).toBe(8);
      expect(recents[0]).toBe('tool-10');
      expect(recents[7]).toBe('tool-3');
    });

    it('ignores empty or whitespace-only tool IDs', () => {
      addRecentToolId('');
      addRecentToolId('   ');
      expect(getRecentToolIds()).toEqual([]);

      addRecentToolId('  valid-tool  ');
      expect(getRecentToolIds()).toEqual(['valid-tool']);
    });
  });

  describe('favorite tools', () => {
    it('returns empty array when nothing is stored or invalid JSON is present', () => {
      expect(getFavoriteToolIds()).toEqual([]);

      localStorage.setItem('fn_favorite_tools', '{"foo":"bar"}');
      expect(getFavoriteToolIds()).toEqual([]);
    });

    it('toggles favorite tool IDs and checks status correctly', () => {
      expect(isToolFavorite('json-formatter')).toBe(false);

      const added = toggleFavoriteToolId('json-formatter');
      expect(added).toBe(true);
      expect(isToolFavorite('json-formatter')).toBe(true);
      expect(getFavoriteToolIds()).toEqual(['json-formatter']);

      const removed = toggleFavoriteToolId('json-formatter');
      expect(removed).toBe(false);
      expect(isToolFavorite('json-formatter')).toBe(false);
      expect(getFavoriteToolIds()).toEqual([]);
    });

    it('ignores empty or whitespace tool IDs on toggle', () => {
      expect(toggleFavoriteToolId('')).toBe(false);
      expect(toggleFavoriteToolId('   ')).toBe(false);
      expect(getFavoriteToolIds()).toEqual([]);
    });
  });
});

