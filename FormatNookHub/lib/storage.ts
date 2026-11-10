const RECENT_TOOLS_KEY = 'fn_recent_tools';
const FAVORITE_TOOLS_KEY = 'fn_favorite_tools';
const MAX_RECENTS = 8;

export function getRecentToolIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentToolId(toolId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentToolIds().filter((id) => id !== toolId);
    const updated = [toolId, ...existing].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function getFavoriteToolIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITE_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteToolId(toolId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const existing = getFavoriteToolIds();
    let updated: string[];
    let isNowFavorite = false;

    if (existing.includes(toolId)) {
      updated = existing.filter((id) => id !== toolId);
      isNowFavorite = false;
    } else {
      updated = [...existing, toolId];
      isNowFavorite = true;
    }

    localStorage.setItem(FAVORITE_TOOLS_KEY, JSON.stringify(updated));
    return isNowFavorite;
  } catch {
    return false;
  }
}

export function isToolFavorite(toolId: string): boolean {
  return getFavoriteToolIds().includes(toolId);
}
