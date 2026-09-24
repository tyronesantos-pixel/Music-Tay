import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from '../lib/firebase';
import { YouTubeVideo, YouTubeCollection } from './youtubeService';

const USER_DATA_COLLECTION = 'user_libraries';
const VIDEOS_COLLECTION = 'videos';
const COLLECTIONS_COLLECTION = 'collections';

export interface UserLibraryData {
  userId: string;
  videos: YouTubeVideo[];
  collections: YouTubeCollection[];
  likedVideoIds?: string[];
  watchHistory?: any[];
  updatedAt: string;
}

export interface CloudSubscriptionPayload {
  videos: YouTubeVideo[];
  collections: YouTubeCollection[];
  likedVideoIds?: string[];
  watchHistory?: any[];
  isFreshInit: boolean;
}

/**
 * Deep sanitizes objects so no `undefined` values are sent to Firestore,
 * which strictly rejects `undefined` values.
 */
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

function cleanUserIdString(userId: string): string {
  return userId.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
}

/**
 * Real-time cloud subscription for a user's isolated library.
 * Each user has their own dedicated document in 'user_libraries/{userId}'.
 * If the cloud document does not exist yet (isFreshInit: true), the caller preserves
 * local storage and uploads it immediately to cloud.
 */
export function subscribeToUserCloudLibrary(
  userId: string,
  onUpdate: (data: CloudSubscriptionPayload) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) return () => {};

  try {
    const cleanUserId = cleanUserIdString(userId);
    const docRef = doc(db, USER_DATA_COLLECTION, cleanUserId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document not in Firestore yet: signal fresh initialization
          // so local data is NOT wiped and instead uploaded to initialize cloud
          onUpdate({
            videos: [],
            collections: [],
            likedVideoIds: [],
            watchHistory: [],
            isFreshInit: true,
          });
          return;
        }

        const data = snapshot.data();
        const rawVideos = Array.isArray(data.videos) ? data.videos : [];
        const rawCollections = Array.isArray(data.collections) ? data.collections : [];
        const rawLikes = Array.isArray(data.likedVideoIds) ? data.likedVideoIds : [];
        const rawHistory = Array.isArray(data.watchHistory) ? data.watchHistory : [];

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

        onUpdate({
          videos,
          collections,
          likedVideoIds: rawLikes.map(String),
          watchHistory: rawHistory,
          isFreshInit: false,
        });
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
 * Also synchronizes individual documents in 'videos' and 'collections' collections
 * so data is redundantly preserved across all Firestore paths.
 */
export async function saveUserCloudLibrary(
  userId: string,
  videos: YouTubeVideo[],
  collections: YouTubeCollection[],
  extra?: { likedVideoIds?: string[]; watchHistory?: any[] }
): Promise<void> {
  if (!userId) return;

  try {
    const cleanUserId = cleanUserIdString(userId);
    const docRef = doc(db, USER_DATA_COLLECTION, cleanUserId);

    const cleanVideos = cleanForFirestore(videos);
    const cleanCollections = cleanForFirestore(collections);
    const cleanLikes = cleanForFirestore(extra?.likedVideoIds || []);
    const cleanHistory = cleanForFirestore(extra?.watchHistory || []);

    // 1. Save master user library document
    await setDoc(
      docRef,
      {
        userId: cleanUserId,
        videos: cleanVideos,
        collections: cleanCollections,
        likedVideoIds: cleanLikes,
        watchHistory: cleanHistory,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Synchronize individual video records for universal discovery
    const videoWritePromises = videos.slice(0, 100).map((v) => {
      const vRef = doc(db, VIDEOS_COLLECTION, v.id);
      return setDoc(vRef, cleanForFirestore({ ...v, userId: cleanUserId }), { merge: true }).catch(() => {});
    });

    // 3. Synchronize individual collection records
    const collectionWritePromises = collections.map((c) => {
      const cRef = doc(db, COLLECTIONS_COLLECTION, c.id);
      return setDoc(cRef, cleanForFirestore({ ...c, userId: cleanUserId }), { merge: true }).catch(() => {});
    });

    await Promise.allSettled([...videoWritePromises, ...collectionWritePromises]);
  } catch (err) {
    console.error('[CloudDatabase] Error saving user cloud library:', err);
  }
}

/**
 * Deletes a video from the individual videos collection in Firestore
 */
export async function deleteCloudVideo(videoId: string): Promise<void> {
  try {
    const vRef = doc(db, VIDEOS_COLLECTION, videoId);
    await deleteDoc(vRef);
  } catch (err) {
    console.warn('[CloudDatabase] Error removing individual video doc:', err);
  }
}

/**
 * Deletes a collection from the individual collections collection in Firestore
 */
export async function deleteCloudCollection(collectionId: string): Promise<void> {
  try {
    const cRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await deleteDoc(cRef);
  } catch (err) {
    console.warn('[CloudDatabase] Error removing individual collection doc:', err);
  }
}
