import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
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
          });
        });

        // Sort by addedAt descending
        list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.error('[CloudDatabase] Firestore subscription error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('[CloudDatabase] Failed to subscribe to videos:', err);
    return () => {};
  }
}

/**
 * Saves or updates a video directly in the cloud database
 */
export async function saveVideoToCloud(video: YouTubeVideo): Promise<void> {
  const docRef = doc(db, VIDEOS_COLLECTION, video.id);
  await setDoc(docRef, {
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
  });
}

/**
 * Deletes a video from the cloud database
 */
export async function deleteVideoFromCloud(videoId: string): Promise<void> {
  const docRef = doc(db, VIDEOS_COLLECTION, videoId);
  await deleteDoc(docRef);
}

/**
 * Updates video fields in the cloud database
 */
export async function updateVideoInCloud(
  videoId: string,
  updates: Partial<YouTubeVideo>
): Promise<void> {
  const docRef = doc(db, VIDEOS_COLLECTION, videoId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
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
            videoIds: Array.isArray(data.videoIds) ? data.videoIds : [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.error('[CloudDatabase] Firestore collections error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('[CloudDatabase] Failed to subscribe to collections:', err);
    return () => {};
  }
}

/**
 * Saves a collection in the cloud database
 */
export async function saveCollectionToCloud(collectionItem: YouTubeCollection): Promise<void> {
  const docRef = doc(db, COLLECTIONS_COLLECTION, collectionItem.id);
  await setDoc(docRef, {
    id: collectionItem.id,
    name: collectionItem.name,
    description: collectionItem.description || '',
    videoIds: collectionItem.videoIds || [],
    createdAt: collectionItem.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a collection from the cloud database
 */
export async function deleteCollectionFromCloud(collectionId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
  await deleteDoc(docRef);
}
