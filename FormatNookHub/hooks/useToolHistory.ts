'use client';

import { useState, useEffect } from 'react';
import {
  getRecentToolIds,
  addRecentToolId,
  getFavoriteToolIds,
  toggleFavoriteToolId,
  isToolFavorite,
} from '@/lib/storage';

export function useToolHistory(currentToolId?: string) {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (currentToolId) {
      addRecentToolId(currentToolId);
      setIsFavorite(isToolFavorite(currentToolId));
    }
    setRecentIds(getRecentToolIds());
    setFavoriteIds(getFavoriteToolIds());
  }, [currentToolId]);

  const toggleFavorite = (toolId: string) => {
    const updatedStatus = toggleFavoriteToolId(toolId);
    if (toolId === currentToolId) {
      setIsFavorite(updatedStatus);
    }
    setFavoriteIds(getFavoriteToolIds());
  };

  return { recentIds, favoriteIds, isFavorite, toggleFavorite };
}
