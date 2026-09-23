import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from '../lib/firebase';
import { YouTubeVideo, YouTubeCollection } from './youtubeService';

const USER_DATA_COLLECTION = 'user_libraries';

export interface UserLibraryData {
  userId: string;
  videos: YouTubeVideo[];
  collections: YouTubeCollection[];
  updatedAt: string;
}

/**
 * Real-time cloud subscription for a user's isolated library.
 * Each user has their own dedicated document in 'user_libraries/{userId}'.
 * New users start 100% empty ([]) and never see or inherit another user's content.
 */
export function subscribeToUserCloudLibrary(
  userId: string,
  onUpdate: (data: { videos: YouTubeVideo[]; collections: YouTubeCollection[] }) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) return () => {};

  try {
    const cleanUserId = userId.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
    const docRef = doc(db, USER_DATA_COLLECTION, cleanUserId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // New user or empty library: strictly clean and blank
          onUpdate({ videos: [], collections: [] });
          return;
        }

        const data = snapshot.data();
        const rawVideos = Array.isArray(data.videos) ? data.videos : [];
        const rawCollections = Array.isArray(data.collections) ? data.collections : [];

        // Strict mapping & guarantee of userId ownership
        const videos: YouTubeVideo[] = rawVideos.map((v: any) => ({
          id: String(v.id || ''),
          youtubeUrl: String(v.youtubeUrl || `https://www.youtube.com/watch?v=${v.id}`),
          title: String(v.title || 'Vídeo do YouTube'),
          description: String(v.description || ''),
          channelTitle: String(v.channelTitle || 'Canal do YouTube'),
          channelUrl: String(v.channelUrl || ''),
          thumbnailUrl: String(v.thumbnailUrl || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`),
          duration: Number(v.duration) || 0,
          isShort: Boolean(v.isShort),
          playlistId: v.playlistId || undefined,
          tags: Array.isArray(v.tags) ? v.tags : [],
          addedAt: String(v.addedAt || new Date().toISOString()),
          lastSyncedAt: String(v.lastSyncedAt || new Date().toISOString()),
          views: Number(v.views) || 0,
          likes: Number(v.likes) || 0,
          status: v.status || 'active',
          notes: String(v.notes || ''),
          category: v.category || 'all',
          userId: cleanUserId,
        }));

        const collections: YouTubeCollection[] = rawCollections.map((c: any) => ({
          id: String(c.id || ''),
          name: String(c.name || 'Nova Playlist'),
          description: String(c.description || ''),
          category: c.category || 'all',
          color: String(c.color || ''),
          videoIds: Array.isArray(c.videoIds) ? c.videoIds.map(String) : [],
          userId: cleanUserId,
          createdAt: String(c.createdAt || new Date().toISOString()),
          updatedAt: String(c.updatedAt || new Date().toISOString()),
        }));

        onUpdate({ videos, collections });
      },
      (error) => {
        console.warn('[CloudDatabase] Firestore library subscription error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[CloudDatabase] Failed to subscribe to user library:', err);
    return () => {};
  }
}

/**
 * Saves a user's entire library state (videos and collections) to their dedicated cloud document.
 * This ensures atomic, isolated real-time persistence per user.
 */
export async function saveUserCloudLibrary(
  userId: string,
  videos: YouTubeVideo[],
  collections: YouTubeCollection[]
): Promise<void> {
  if (!userId) return;

  try {
    const cleanUserId = userId.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
    const docRef = doc(db, USER_DATA_COLLECTION, cleanUserId);

    await setDoc(
      docRef,
      {
        userId: cleanUserId,
        videos,
        collections,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[CloudDatabase] Error saving user cloud library:', err);
  }
}
