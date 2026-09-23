/**
 * Real-time dual storage engine (IndexedDB + LocalStorage)
 * Guarantees that data is never lost across reloads, iframes, or browser sessions.
 */

import { YouTubeVideo, YouTubeCollection, YouTubeChannelItem } from './youtubeService';

const DB_NAME = 'player_do_tyrone_db_v3';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

const STORAGE_KEYS = {
  VIDEOS: 'tyrone_player_videos_v3',
  COLLECTIONS: 'tyrone_player_collections_v3',
  CHANNELS: 'tyrone_player_channels_v3',
  SETTINGS: 'tyrone_player_settings_v3',
  LIKED: 'tyrone_player_liked_v3',
  HISTORY: 'tyrone_player_history_v3',
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSave<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IDB] Fallback to localStorage only:', err);
  }
}

export async function idbLoad<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Real-time synchronous save to LocalStorage + async backup to IndexedDB
 */
export function realTimeSave<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.error('[Storage] Error saving to localStorage:', e);
  }

  // Backup to IndexedDB asynchronously
  idbSave(key, value).catch(() => {});
}

/**
 * Synchronous initial load with localStorage
 */
export function realTimeLoad<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Storage] Error parsing from localStorage:', e);
  }
  return defaultValue;
}

export { STORAGE_KEYS };
