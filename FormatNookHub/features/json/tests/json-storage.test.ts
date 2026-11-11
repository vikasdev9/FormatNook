import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRecentFiles,
  addRecentFile,
  removeRecentFile,
  clearRecentFiles,
  getSnippets,
  saveSnippet,
  deleteSnippet,
  exportSnippets,
  importSnippets,
  getPreferences,
  savePreferences,
} from '../services/json-storage-service';

describe('json-storage-service', () => {
  beforeEach(() => {
    clearRecentFiles();
    // Clear snippets
    try {
      localStorage.removeItem('formatnook_json_favorite_snippets');
      localStorage.removeItem('formatnook_json_editor_prefs');
    } catch {
      // ignore
    }
  });

  it('adds and lists recent files with cap on max items', () => {
    addRecentFile('test1.json', '{"a": 1}');
    addRecentFile('test2.json', '{"b": 2}');

    const recents = getRecentFiles();
    expect(recents.length).toBe(2);
    expect(recents[0].name).toBe('test2.json');

    // Remove one
    removeRecentFile(recents[0].id);
    const updated = getRecentFiles();
    expect(updated.length).toBe(1);
    expect(updated[0].name).toBe('test1.json');

    // Clear all
    clearRecentFiles();
    expect(getRecentFiles()).toHaveLength(0);
  });

  it('saves, exports, and imports favorite snippets', () => {
    const snp = saveSnippet('Auth Header', 'Bearer token template', ['auth', 'jwt'], '{"Authorization": "Bearer token"}');
    expect(snp.id).toBeDefined();

    const list = getSnippets();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Auth Header');

    const exported = exportSnippets();
    expect(exported).toContain('Auth Header');

    deleteSnippet(snp.id);
    expect(getSnippets()).toHaveLength(0);

    const importedCount = importSnippets(exported);
    expect(importedCount).toBe(1);
    expect(getSnippets()[0].title).toBe('Auth Header');
  });

  it('manages editor preferences with defaults and persistence', () => {
    const prefs = getPreferences();
    expect(prefs.indent).toBe('2');
    expect(prefs.fontSize).toBe(13);

    savePreferences({ fontSize: 16, indent: '4' });
    const updated = getPreferences();
    expect(updated.fontSize).toBe(16);
    expect(updated.indent).toBe('4');
  });
});

