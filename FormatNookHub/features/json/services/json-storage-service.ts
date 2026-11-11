import { JsonRecentFile, JsonSnippet, JsonEditorPreferences } from '../types/json.types';

const RECENT_STORAGE_KEY = 'formatnook_json_recent_files';
const SNIPPETS_STORAGE_KEY = 'formatnook_json_favorite_snippets';
const PREFS_STORAGE_KEY = 'formatnook_json_editor_prefs';

const DEFAULT_PREFERENCES: JsonEditorPreferences = {
  theme: 'system',
  viewMode: 'code',
  fontSize: 13,
  indent: '2',
  wordWrap: true,
  panelsRatio: 50,
  autoFormat: true,
};

// Safe localStorage wrapper
function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to save to localStorage (${key}):`, e);
  }
}

/* ==========================================================================
   Recent Files
   ========================================================================== */

export function getRecentFiles(): JsonRecentFile[] {
  const data = safeGetItem(RECENT_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addRecentFile(name: string, content: string): void {
  const recents = getRecentFiles();
  const sizeBytes = new Blob([content]).size;
  const lineCount = content.split('\n').length;
  // Keep preview snippet small to conserve browser storage quota
  const previewSnippet = content.slice(0, 300) + (content.length > 300 ? '...' : '');

  const newEntry: JsonRecentFile = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name || `document_${new Date().toISOString().slice(0, 10)}.json`,
    sizeBytes,
    lineCount,
    timestamp: Date.now(),
    previewSnippet,
  };

  // Keep latest 10 files
  const filtered = recents.filter((r) => r.name !== newEntry.name);
  const updated = [newEntry, ...filtered].slice(0, 10);
  safeSetItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
}

export function removeRecentFile(id: string): void {
  const recents = getRecentFiles();
  const updated = recents.filter((r) => r.id !== id);
  safeSetItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
}

export function clearRecentFiles(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/* ==========================================================================
   Favorite Snippets Manager
   ========================================================================== */

export function getSnippets(): JsonSnippet[] {
  const data = safeGetItem(SNIPPETS_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSnippet(
  title: string,
  description: string,
  tags: string[],
  content: string,
  existingId?: string
): JsonSnippet {
  const snippets = getSnippets();
  const now = Date.now();

  if (existingId) {
    const idx = snippets.findIndex((s) => s.id === existingId);
    if (idx !== -1) {
      snippets[idx] = {
        ...snippets[idx],
        title,
        description,
        tags,
        content,
        updatedAt: now,
      };
      safeSetItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
      return snippets[idx];
    }
  }

  const newSnippet: JsonSnippet = {
    id: `snp_${now}_${Math.random().toString(36).substring(2, 6)}`,
    title: title || 'Untitled Snippet',
    description: description || '',
    tags: tags || [],
    content,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newSnippet, ...snippets];
  safeSetItem(SNIPPETS_STORAGE_KEY, JSON.stringify(updated));
  return newSnippet;
}

export function deleteSnippet(id: string): void {
  const snippets = getSnippets();
  const updated = snippets.filter((s) => s.id !== id);
  safeSetItem(SNIPPETS_STORAGE_KEY, JSON.stringify(updated));
}

export function exportSnippets(): string {
  const snippets = getSnippets();
  return JSON.stringify(snippets, null, 2);
}

export function importSnippets(jsonText: string): number {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return 0;

    const current = getSnippets();
    let importedCount = 0;

    for (const item of parsed) {
      if (item && item.title && item.content) {
        current.push({
          id: `snp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: String(item.title),
          description: String(item.description || ''),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          content: String(item.content),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        importedCount++;
      }
    }

    safeSetItem(SNIPPETS_STORAGE_KEY, JSON.stringify(current));
    return importedCount;
  } catch {
    return 0;
  }
}

/* ==========================================================================
   Saved Editor Preferences
   ========================================================================== */

export function getPreferences(): JsonEditorPreferences {
  const data = safeGetItem(PREFS_STORAGE_KEY);
  if (!data) return DEFAULT_PREFERENCES;
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<JsonEditorPreferences>): void {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  safeSetItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
}

