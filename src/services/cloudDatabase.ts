import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from '../lib/firebase';
import { YouTubeVideo, YouTubeCollection } from './youtubeService';

const VIDEOS_COLLECTION = 'videos';
const COLLECTIONS_COLLECTION = 'collections';

/**
 * Real-time cloud subscription for videos (like Supabase realtime / Firestore onSnapshot)
 */
export function subscribeToCloudVideos(
  onUpdate: (videos: YouTubeVideo[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, VIDEOS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: YouTubeVideo[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            youtubeUrl: data.youtubeUrl || `https://www.youtube.com/watch?v=${d.id}`,
            title: data.title || 'Vídeo do YouTube',
            description: data.description || '',
            channelTitle: data.channelTitle || 'Canal do YouTube',
            channelUrl: data.channelUrl || '',
            thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${d.id}/hqdefault.jpg`,
            duration: Number(data.duration) || 0,
            isShort: Boolean(data.isShort),
            playlistId: data.playlistId || undefined,
            tags: Array.isArray(data.tags) ? data.tags : [],
            addedAt: data.addedAt || new Date().toISOString(),
            lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
            views: Number(data.views) || 0,
            likes: Number(data.likes) || 0,
            status: data.status || 'active',
            notes: data.notes || '',
            category: data.category || 'all',
          });
        });

        // Sort by addedAt descending
        list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('[CloudDatabase] Firestore subscription warning:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[CloudDatabase] Failed to subscribe to videos:', err);
    return () => {};
  }
}

/**
 * Saves or updates a video directly in the cloud database
 */
export async function saveVideoToCloud(video: YouTubeVideo): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, video.id);
    await setDoc(
      docRef,
      {
        id: video.id,
        youtubeUrl: video.youtubeUrl,
        title: video.title,
        description: video.description || '',
        channelTitle: video.channelTitle,
        channelUrl: video.channelUrl || '',
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration || 0,
        isShort: Boolean(video.isShort),
        playlistId: video.playlistId || null,
        tags: video.tags || [],
        addedAt: video.addedAt || new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        views: video.views || 0,
        likes: video.likes || 0,
        status: video.status || 'active',
        notes: video.notes || '',
        category: video.category || 'all',
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[CloudDatabase] Error saving video to cloud:', err);
  }
}

/**
 * Updates video fields in the cloud database with merge: true to avoid "No document to update"
 */
export async function updateVideoInCloud(
  videoId: string,
  updates: Partial<YouTubeVideo>
): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await setDoc(
      docRef,
      {
        ...updates,
        lastSyncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[CloudDatabase] Error updating video in cloud:', err);
  }
}

/**
 * Deletes a video from the cloud database
 */
export async function deleteVideoFromCloud(videoId: string): Promise<void> {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[CloudDatabase] Error deleting video from cloud:', err);
  }
}

/**
 * Subscribes to collections from the cloud database
 */
export function subscribeToCloudCollections(
  onUpdate: (collections: YouTubeCollection[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: YouTubeCollection[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.name || 'Nova Coleção',
            description: data.description || '',
            category: data.category || 'all',
            color: data.color || '',
            videoIds: Array.isArray(data.videoIds) ? data.videoIds : [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('[CloudDatabase] Firestore collections error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[CloudDatabase] Failed to subscribe to collections:', err);
    return () => {};
  }
}

/**
 * Saves a collection in the cloud database
 */
export async function saveCollectionToCloud(collectionItem: YouTubeCollection): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS_COLLECTION, collectionItem.id);
    await setDoc(
      docRef,
      {
        id: collectionItem.id,
        name: collectionItem.name,
        description: collectionItem.description || '',
        category: collectionItem.category || 'all',
        color: collectionItem.color || '',
        videoIds: collectionItem.videoIds || [],
        createdAt: collectionItem.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[CloudDatabase] Error saving collection to cloud:', err);
  }
}

/**
 * Updates collection fields in the cloud database with merge: true
 */
export async function updateCollectionInCloud(
  collectionId: string,
  updates: Partial<YouTubeCollection>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await setDoc(
      docRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[CloudDatabase] Error updating collection in cloud:', err);
  }
}

/**
 * Deletes a collection from the cloud database
 */
export async function deleteCollectionFromCloud(collectionId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[CloudDatabase] Error deleting collection from cloud:', err);
  }
}
