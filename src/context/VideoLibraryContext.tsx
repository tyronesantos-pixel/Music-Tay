import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  YouTubeVideo,
  YouTubeCollection,
  YouTubeChannelItem,
  YouTubeViewMode,
  parseYouTubeUrl,
  fetchYouTubeMetadata,
  syncSingleYouTubeVideo,
} from '../services/youtubeService';
import {
  subscribeToUserCloudLibrary,
  saveUserCloudLibrary,
  deleteCloudVideo,
  deleteCloudCollection,
} from '../services/cloudDatabase';
import { realTimeLoad, realTimeSave, realTimeRemove, STORAGE_KEYS } from '../services/dbStorage';
import { useAuth } from './AuthContext';
import { useVideoPlayer } from './VideoPlayerContext';

interface VideoLibraryContextType {
  currentUserId: string;
  videos: YouTubeVideo[];
  collections: YouTubeCollection[];
  channels: YouTubeChannelItem[];
  currentView: YouTubeViewMode;
  activeCollectionId: string | null;
  searchQuery: string;
  selectedTag: string | null;
  categoryFilter: 'all' | 'musicas' | 'videoclipe' | 'games';
  // Cloud & Sync State
  isSyncing: boolean;
  isCloudConnected: boolean;
  cloudError: string | null;
  lastGlobalSync: string | null;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  // Actions
  setCurrentView: (view: YouTubeViewMode) => void;
  openVideoView: (video: YouTubeVideo) => void;
  openCollection: (collectionId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  addYouTubeLink: (
    input: string,
    tags?: string[],
    customTitle?: string,
    notes?: string,
    category?: 'all' | 'musicas' | 'videoclipe' | 'games'
  ) => Promise<YouTubeVideo>;
  deleteVideo: (videoId: string) => Promise<void>;
  bulkDeleteVideos: (videoIds: string[]) => Promise<void>;
  clearAllVideos: () => Promise<void>;
  updateVideo: (videoId: string, updates: Partial<YouTubeVideo>) => Promise<void>;
  syncAllVideos: () => Promise<void>;
  syncVideoById: (videoId: string) => Promise<void>;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setSyncIntervalMinutes: (mins: number) => void;
  setCategoryFilter: (cat: 'all' | 'musicas' | 'videoclipe' | 'games') => void;
  createCollection: (
    name: string,
    description?: string,
    category?: 'all' | 'musicas' | 'videoclipe' | 'games',
    color?: string
  ) => Promise<YouTubeCollection>;
  updateCollection: (
    collectionId: string,
    updates: Partial<YouTubeCollection>
  ) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addVideoToCollection: (collectionId: string, videoId: string) => Promise<void>;
  removeVideoFromCollection: (collectionId: string, videoId: string) => Promise<void>;
  addMultipleVideosToCollection: (collectionId: string, videoIds: string[]) => Promise<void>;
  exportLibrary: () => void;
  importLibrary: (jsonString: string) => Promise<boolean>;
}

export const VideoLibraryContext = createContext<VideoLibraryContextType | null>(null);

function deriveChannels(videoList: YouTubeVideo[]): YouTubeChannelItem[] {
  const channelMap = new Map<string, { count: number; url?: string }>();
  videoList.forEach((v) => {
    if (v.channelTitle) {
      const current = channelMap.get(v.channelTitle) || { count: 0, url: v.channelUrl };
      channelMap.set(v.channelTitle, { count: current.count + 1, url: v.channelUrl || current.url });
    }
  });

  return Array.from(channelMap.entries()).map(([name, info]) => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    handle: name,
    name,
    channelUrl: info.url || 'https://www.youtube.com',
    videoCount: info.count,
    lastSyncedAt: new Date().toISOString(),
  }));
}

function loadInitialVideos(userKey: string, deletedSet: Set<string>): YouTubeVideo[] {
  const userVideos = realTimeLoad<YouTubeVideo[] | null>(userKey, null);
  if (userVideos !== null && Array.isArray(userVideos)) {
    return userVideos.filter((v) => !deletedSet.has(v.id));
  }
  const legacyVideos = realTimeLoad<YouTubeVideo[] | null>(STORAGE_KEYS.VIDEOS, null);
  if (legacyVideos !== null && Array.isArray(legacyVideos) && legacyVideos.length > 0) {
    const filtered = legacyVideos.filter((v) => !deletedSet.has(v.id));
    realTimeSave(userKey, filtered);
    return filtered;
  }
  return [];
}

function loadInitialCollections(userKey: string, deletedSet: Set<string>): YouTubeCollection[] {
  const userColls = realTimeLoad<YouTubeCollection[] | null>(userKey, null);
  if (userColls !== null && Array.isArray(userColls)) {
    return userColls.filter((c) => !deletedSet.has(c.id));
  }
  const legacyColls = realTimeLoad<YouTubeCollection[] | null>(STORAGE_KEYS.COLLECTIONS, null);
  if (legacyColls !== null && Array.isArray(legacyColls) && legacyColls.length > 0) {
    const filtered = legacyColls.filter((c) => !deletedSet.has(c.id));
    realTimeSave(userKey, filtered);
    return filtered;
  }
  return [];
}

export const VideoLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { removeDeletedTrack } = useVideoPlayer();

  // Clean identifier for the user account
  const currentUserId = user?.email?.toLowerCase().trim() || user?.id || 'guest';

  // Per-user isolated storage keys
  const USER_VIDEOS_KEY = `tyrone_usr_videos_${currentUserId}`;
  const USER_COLLECTIONS_KEY = `tyrone_usr_colls_${currentUserId}`;
  const USER_DELETED_VIDEOS_KEY = `tyrone_deleted_videos_v4_${currentUserId}`;
  const USER_DELETED_COLLS_KEY = `tyrone_deleted_colls_v4_${currentUserId}`;

  // Helper to load combined global + user deleted tombstones
  const getCombinedDeletedVideos = useCallback(() => {
    const globalList = realTimeLoad<string[]>(STORAGE_KEYS.GLOBAL_DELETED_VIDEOS, []);
    const userList = realTimeLoad<string[]>(USER_DELETED_VIDEOS_KEY, []);
    return new Set([...globalList, ...userList]);
  }, [USER_DELETED_VIDEOS_KEY]);

  const getCombinedDeletedColls = useCallback(() => {
    const globalList = realTimeLoad<string[]>(STORAGE_KEYS.GLOBAL_DELETED_COLLS, []);
    const userList = realTimeLoad<string[]>(USER_DELETED_COLLS_KEY, []);
    return new Set([...globalList, ...userList]);
  }, [USER_DELETED_COLLS_KEY]);

  // Persistent tombstones so deleted items can NEVER be resurrected
  const deletedVideoIdsRef = useRef<Set<string>>(getCombinedDeletedVideos());
  const deletedCollectionIdsRef = useRef<Set<string>>(getCombinedDeletedColls());

  // Initial state strictly scoped to this user
  const [videos, setVideos] = useState<YouTubeVideo[]>(() =>
    loadInitialVideos(USER_VIDEOS_KEY, deletedVideoIdsRef.current)
  );
  const [collections, setCollections] = useState<YouTubeCollection[]>(() =>
    loadInitialCollections(USER_COLLECTIONS_KEY, deletedCollectionIdsRef.current)
  );
  const [channels, setChannels] = useState<YouTubeChannelItem[]>(() =>
    deriveChannels(loadInitialVideos(USER_VIDEOS_KEY, deletedVideoIdsRef.current))
  );

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<YouTubeViewMode>('home');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'musicas' | 'videoclipe' | 'games'>('all');

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState<number>(5);

  // Keep refs for callbacks so saving to cloud always has latest array reference
  const videosRef = useRef<YouTubeVideo[]>(videos);
  const collectionsRef = useRef<YouTubeCollection[]>(collections);
  videosRef.current = videos;
  collectionsRef.current = collections;

  // 1. When the logged-in user changes, reload tombstones and user storage
  useEffect(() => {
    const combinedDeleted = getCombinedDeletedVideos();
    const combinedColls = getCombinedDeletedColls();
    deletedVideoIdsRef.current = combinedDeleted;
    deletedCollectionIdsRef.current = combinedColls;

    const loadedVideos = loadInitialVideos(USER_VIDEOS_KEY, deletedVideoIdsRef.current);
    const loadedCollections = loadInitialCollections(USER_COLLECTIONS_KEY, deletedCollectionIdsRef.current);
    videosRef.current = loadedVideos;
    collectionsRef.current = loadedCollections;
    setVideos(loadedVideos);
    setCollections(loadedCollections);
    setChannels(deriveChannels(loadedVideos));
    setActiveCollectionId(null);
  }, [currentUserId, USER_VIDEOS_KEY, USER_COLLECTIONS_KEY, getCombinedDeletedVideos, getCombinedDeletedColls]);

  // 2. Real-time Cloud Subscription dedicated strictly to this user
  useEffect(() => {
    if (!currentUserId || currentUserId === 'guest') return;

    const unsubscribe = subscribeToUserCloudLibrary(
      currentUserId,
      ({ videos: cloudVideos, collections: cloudCollections, deletedVideoIds: cloudDeleted, isFreshInit }) => {
        if (isFreshInit) {
          // Cloud document does not exist yet for this new user: initialize from local
          const currentLocalVideos = videosRef.current.filter((v) => !deletedVideoIdsRef.current.has(v.id));
          const currentLocalCollections = collectionsRef.current.filter((c) => !deletedCollectionIdsRef.current.has(c.id));
          if (currentLocalVideos.length > 0 || currentLocalCollections.length > 0) {
            saveUserCloudLibrary(currentUserId, currentLocalVideos, currentLocalCollections, {
              deletedVideoIds: Array.from(deletedVideoIdsRef.current),
            }).catch(console.warn);
          }
          setIsCloudConnected(true);
          return;
        }

        // Merge cloud deleted IDs into local tombstones
        if (Array.isArray(cloudDeleted) && cloudDeleted.length > 0) {
          cloudDeleted.forEach((id) => deletedVideoIdsRef.current.add(id));
          const combinedArr = Array.from(deletedVideoIdsRef.current);
          realTimeSave(USER_DELETED_VIDEOS_KEY, combinedArr);
          realTimeSave(STORAGE_KEYS.GLOBAL_DELETED_VIDEOS, combinedArr);
        }

        // Filter OUT any video that has been deleted!
        const validCloudVideos = cloudVideos.filter((v) => !deletedVideoIdsRef.current.has(v.id));

        // Filter OUT any collection that has been deleted!
        const validCloudColls = cloudCollections.filter((c) => !deletedCollectionIdsRef.current.has(c.id));

        // Cloud is the master source of truth
        videosRef.current = validCloudVideos;
        collectionsRef.current = validCloudColls;

        setVideos(validCloudVideos);
        setCollections(validCloudColls);
        setChannels(deriveChannels(validCloudVideos));

        // Sync to local storage
        realTimeSave(USER_VIDEOS_KEY, validCloudVideos);
        realTimeSave(STORAGE_KEYS.VIDEOS, validCloudVideos);
        realTimeSave(USER_COLLECTIONS_KEY, validCloudColls);

        setIsCloudConnected(true);
        setCloudError(null);

        // If cloud had any deleted item that was filtered out, update Firestore to keep it 100% clean
        if (validCloudVideos.length < cloudVideos.length || validCloudColls.length < cloudCollections.length) {
          saveUserCloudLibrary(currentUserId, validCloudVideos, validCloudColls, {
            deletedVideoIds: Array.from(deletedVideoIdsRef.current),
          }).catch(console.warn);
        }
      },
      (error) => {
        console.warn('[CloudDatabase] User library sync warning:', error);
        setCloudError('Modo local sincronizado');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId, USER_VIDEOS_KEY, USER_COLLECTIONS_KEY, USER_DELETED_VIDEOS_KEY]);

  // Helper to persist current user's library in cloud & local
  const persistUserLibrary = useCallback(
    async (newVideos: YouTubeVideo[], newCollections: YouTubeCollection[]) => {
      // Filter out any accidentally remaining deleted items
      const cleanVideos = newVideos.filter((v) => !deletedVideoIdsRef.current.has(v.id));
      const cleanCollections = newCollections.filter((c) => !deletedCollectionIdsRef.current.has(c.id));

      videosRef.current = cleanVideos;
      collectionsRef.current = cleanCollections;

      // 1. Instant local persistence (localStorage + IndexedDB)
      realTimeSave(USER_VIDEOS_KEY, cleanVideos);
      realTimeSave(STORAGE_KEYS.VIDEOS, cleanVideos);
      realTimeSave(USER_COLLECTIONS_KEY, cleanCollections);
      realTimeSave(STORAGE_KEYS.COLLECTIONS, cleanCollections);

      // 2. Real-time cloud persistence
      if (currentUserId && currentUserId !== 'guest') {
        try {
          await saveUserCloudLibrary(currentUserId, cleanVideos, cleanCollections, {
            deletedVideoIds: Array.from(deletedVideoIdsRef.current),
          });
          setIsCloudConnected(true);
          setCloudError(null);
        } catch (err) {
          console.warn('[CloudDatabase] Error persisting library:', err);
          setCloudError('Sincronizando...');
        }
      }
    },
    [currentUserId, USER_VIDEOS_KEY, USER_COLLECTIONS_KEY]
  );

  // Sync All Videos with YouTube Metadata
  const syncAllVideos = useCallback(async () => {
    if (videosRef.current.length === 0) return;
    setIsSyncing(true);

    try {
      const updatedList: YouTubeVideo[] = [];
      for (const video of videosRef.current) {
        if (deletedVideoIdsRef.current.has(video.id)) continue;
        const synced = await syncSingleYouTubeVideo(video);
        updatedList.push({ ...synced, userId: currentUserId });
      }
      setVideos(updatedList);
      setChannels(deriveChannels(updatedList));
      setLastGlobalSync(new Date().toISOString());
      await persistUserLibrary(updatedList, collectionsRef.current);
    } catch (e) {
      console.warn('Error in cloud sync:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUserId, persistUserLibrary]);

  // Periodic Auto-Sync Timer
  useEffect(() => {
    if (!autoSyncEnabled || videos.length === 0) return;

    const intervalMs = Math.max(1, syncIntervalMinutes) * 60 * 1000;
    const timer = setInterval(() => {
      syncAllVideos().catch(console.warn);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, syncIntervalMinutes, syncAllVideos, videos.length]);

  // Add YouTube Link
  const addYouTubeLink = useCallback(
    async (
      input: string,
      tags: string[] = [],
      customTitle?: string,
      notes?: string,
      category: 'all' | 'musicas' | 'videoclipe' | 'games' = 'all'
    ): Promise<YouTubeVideo> => {
      const parsed = parseYouTubeUrl(input);

      if (!parsed.videoId) {
        throw new Error('Link do YouTube inválido. Cole uma URL do youtube.com, youtu.be ou /shorts/.');
      }

      // If user explicitly re-adds this ID, unmark from tombstones
      if (deletedVideoIdsRef.current.has(parsed.videoId)) {
        deletedVideoIdsRef.current.delete(parsed.videoId);
        const arr = Array.from(deletedVideoIdsRef.current);
        realTimeSave(USER_DELETED_VIDEOS_KEY, arr);
        realTimeSave(STORAGE_KEYS.GLOBAL_DELETED_VIDEOS, arr);
      }

      // Check if already in this user's library
      const existing = videosRef.current.find((v) => v.id === parsed.videoId);
      if (existing) {
        return existing;
      }

      // Fetch live metadata
      const meta = await fetchYouTubeMetadata(parsed.videoId, parsed.isShort);

      const computedTags = [...tags];
      if (category === 'videoclipe' && !computedTags.includes('clipe')) {
        computedTags.push('clipe');
      } else if (category === 'musicas' && !computedTags.includes('musica')) {
        computedTags.push('musica');
      } else if (category === 'games' && !computedTags.includes('games')) {
        computedTags.push('games');
      }

      const newVideo: YouTubeVideo = {
        id: parsed.videoId,
        youtubeUrl: parsed.normalizedUrl,
        title: customTitle?.trim() || meta.title,
        description: '',
        channelTitle: meta.channelTitle,
        channelUrl: meta.channelUrl,
        thumbnailUrl: meta.thumbnailUrl,
        duration: 0,
        isShort: parsed.isShort,
        tags: computedTags.length > 0 ? computedTags : [parsed.isShort ? 'Short' : 'YouTube'],
        addedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        status: 'active',
        notes: notes || '',
        category: category,
        userId: currentUserId,
      };

      const nextVideos = [newVideo, ...videosRef.current.filter((v) => v.id !== newVideo.id)];
      videosRef.current = nextVideos;
      setVideos(nextVideos);
      setChannels(deriveChannels(nextVideos));
      await persistUserLibrary(nextVideos, collectionsRef.current);

      return newVideo;
    },
    [currentUserId, persistUserLibrary, USER_DELETED_VIDEOS_KEY]
  );

  /**
   * Permanent, irreversible deletion (Requirement 5)
   * Wipes the item completely from all storage tiers, Firestore, and memory.
   */
  const deleteVideo = useCallback(
    async (videoId: string) => {
      // 1. Mark in permanent tombstones (both user key and global key)
      deletedVideoIdsRef.current.add(videoId);
      const tombstoneArr = Array.from(deletedVideoIdsRef.current);
      realTimeSave(USER_DELETED_VIDEOS_KEY, tombstoneArr);
      realTimeSave(STORAGE_KEYS.GLOBAL_DELETED_VIDEOS, tombstoneArr);

      // 2. Remove from active videos list and all playlist associations
      const nextVideos = videosRef.current.filter((v) => v.id !== videoId);
      const nextCollections = collectionsRef.current.map((c) => ({
        ...c,
        videoIds: c.videoIds.filter((id) => id !== videoId),
      }));

      videosRef.current = nextVideos;
      collectionsRef.current = nextCollections;
      setVideos(nextVideos);
      setCollections(nextCollections);
      setChannels(deriveChannels(nextVideos));

      // 3. Purge from active player context (queue, history, likes, and current track)
      removeDeletedTrack(videoId);

      // 4. Update all local storage keys immediately
      realTimeSave(USER_VIDEOS_KEY, nextVideos);
      realTimeSave(STORAGE_KEYS.VIDEOS, nextVideos);
      realTimeSave(USER_COLLECTIONS_KEY, nextCollections);
      realTimeSave(STORAGE_KEYS.COLLECTIONS, nextCollections);

      // Also clean guest key if present
      try {
        const guestVideos = realTimeLoad<YouTubeVideo[] | null>('tyrone_usr_videos_guest', null);
        if (guestVideos && Array.isArray(guestVideos)) {
          realTimeSave('tyrone_usr_videos_guest', guestVideos.filter((v) => v.id !== videoId));
        }
      } catch (_) {}

      // 5. Delete individual video record from Firestore
      deleteCloudVideo(videoId).catch(console.warn);

      // 6. Update master cloud library document with tombstones
      await persistUserLibrary(nextVideos, nextCollections);
    },
    [
      persistUserLibrary,
      removeDeletedTrack,
      USER_DELETED_VIDEOS_KEY,
      USER_VIDEOS_KEY,
      USER_COLLECTIONS_KEY,
    ]
  );

  const bulkDeleteVideos = useCallback(
    async (videoIds: string[]) => {
      if (videoIds.length === 0) return;
      const idSet = new Set(videoIds);

      // 1. Mark in permanent tombstones
      videoIds.forEach((id) => {
        deletedVideoIdsRef.current.add(id);
        deleteCloudVideo(id).catch(console.warn);
        removeDeletedTrack(id);
      });
      const tombstoneArr = Array.from(deletedVideoIdsRef.current);
      realTimeSave(USER_DELETED_VIDEOS_KEY, tombstoneArr);
      realTimeSave(STORAGE_KEYS.GLOBAL_DELETED_VIDEOS, tombstoneArr);

      // 2. Remove from active videos list and playlists
      const nextVideos = videosRef.current.filter((v) => !idSet.has(v.id));
      const nextCollections = collectionsRef.current.map((c) => ({
        ...c,
        videoIds: c.videoIds.filter((id) => !idSet.has(id)),
      }));

      videosRef.current = nextVideos;
      collectionsRef.current = nextCollections;
      setVideos(nextVideos);
      setCollections(nextCollections);
      setChannels(deriveChannels(nextVideos));

      // 3. Update localStorage
      realTimeSave(USER_VIDEOS_KEY, nextVideos);
      realTimeSave(STORAGE_KEYS.VIDEOS, nextVideos);
      realTimeSave(USER_COLLECTIONS_KEY, nextCollections);
      realTimeSave(STORAGE_KEYS.COLLECTIONS, nextCollections);

      await persistUserLibrary(nextVideos, nextCollections);
    },
    [
      persistUserLibrary,
      removeDeletedTrack,
      USER_DELETED_VIDEOS_KEY,
      USER_VIDEOS_KEY,
      USER_COLLECTIONS_KEY,
    ]
  );

  const clearAllVideos = useCallback(async () => {
    // 1. Mark all existing IDs in permanent tombstones
    videosRef.current.forEach((v) => {
      deletedVideoIdsRef.current.add(v.id);
      deleteCloudVideo(v.id).catch(console.warn);
      removeDeletedTrack(v.id);
    });
    const tombstoneArr = Array.from(deletedVideoIdsRef.current);
    realTimeSave(USER_DELETED_VIDEOS_KEY, tombstoneArr);
    realTimeSave(STORAGE_KEYS.GLOBAL_DELETED_VIDEOS, tombstoneArr);

    // 2. Empty videos & clear playlist references
    const nextCollections = collectionsRef.current.map((c) => ({
      ...c,
      videoIds: [],
    }));

    videosRef.current = [];
    collectionsRef.current = nextCollections;
    setVideos([]);
    setCollections(nextCollections);
    setChannels([]);

    // 3. Clear both user storage and global storage
    realTimeSave(USER_VIDEOS_KEY, []);
    realTimeSave(STORAGE_KEYS.VIDEOS, []);
    realTimeSave(USER_COLLECTIONS_KEY, nextCollections);
    realTimeSave(STORAGE_KEYS.COLLECTIONS, nextCollections);

    await persistUserLibrary([], nextCollections);
  }, [
    USER_DELETED_VIDEOS_KEY,
    USER_VIDEOS_KEY,
    USER_COLLECTIONS_KEY,
    removeDeletedTrack,
    persistUserLibrary,
  ]);

  const updateVideo = useCallback(
    async (videoId: string, updates: Partial<YouTubeVideo>) => {
      const nextVideos = videosRef.current.map((v) =>
        v.id === videoId ? { ...v, ...updates } : v
      );
      videosRef.current = nextVideos;
      setVideos(nextVideos);
      setChannels(deriveChannels(nextVideos));
      await persistUserLibrary(nextVideos, collectionsRef.current);
    },
    [persistUserLibrary]
  );

  const syncVideoById = useCallback(
    async (videoId: string) => {
      const target = videosRef.current.find((v) => v.id === videoId);
      if (!target) return;
      const synced = await syncSingleYouTubeVideo(target);
      const nextVideos = videosRef.current.map((v) => (v.id === videoId ? synced : v));
      videosRef.current = nextVideos;
      setVideos(nextVideos);
      setChannels(deriveChannels(nextVideos));
      await persistUserLibrary(nextVideos, collectionsRef.current);
    },
    [persistUserLibrary]
  );

  const createCollection = useCallback(
    async (
      name: string,
      description?: string,
      category?: 'all' | 'musicas' | 'videoclipe' | 'games',
      color?: string
    ): Promise<YouTubeCollection> => {
      const newColId = `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      if (deletedCollectionIdsRef.current.has(newColId)) {
        deletedCollectionIdsRef.current.delete(newColId);
        const arr = Array.from(deletedCollectionIdsRef.current);
        realTimeSave(USER_DELETED_COLLS_KEY, arr);
        realTimeSave(STORAGE_KEYS.GLOBAL_DELETED_COLLS, arr);
      }

      const newCol: YouTubeCollection = {
        id: newColId,
        name,
        description: description || '',
        category: category || 'all',
        color: color || '',
        videoIds: [],
        userId: currentUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextCollections = [newCol, ...collectionsRef.current];
      collectionsRef.current = nextCollections;
      setCollections(nextCollections);
      await persistUserLibrary(videosRef.current, nextCollections);

      return newCol;
    },
    [currentUserId, persistUserLibrary, USER_DELETED_COLLS_KEY]
  );

  const updateCollection = useCallback(
    async (collectionId: string, updates: Partial<YouTubeCollection>) => {
      const nextCollections = collectionsRef.current.map((col) =>
        col.id === collectionId
          ? { ...col, ...updates, updatedAt: new Date().toISOString() }
          : col
      );
      collectionsRef.current = nextCollections;
      setCollections(nextCollections);
      await persistUserLibrary(videosRef.current, nextCollections);
    },
    [persistUserLibrary]
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      // 1. Mark in permanent tombstones
      deletedCollectionIdsRef.current.add(id);
      const tombstoneArr = Array.from(deletedCollectionIdsRef.current);
      realTimeSave(USER_DELETED_COLLS_KEY, tombstoneArr);
      realTimeSave(STORAGE_KEYS.GLOBAL_DELETED_COLLS, tombstoneArr);
      deleteCloudCollection(id).catch(console.warn);

      // 2. Remove from active collections
      const nextCollections = collectionsRef.current.filter((col) => col.id !== id);
      collectionsRef.current = nextCollections;
      setCollections(nextCollections);
      realTimeSave(USER_COLLECTIONS_KEY, nextCollections);
      realTimeSave(STORAGE_KEYS.COLLECTIONS, nextCollections);

      if (activeCollectionId === id) {
        setCurrentView('home');
        setActiveCollectionId(null);
      }

      await persistUserLibrary(videosRef.current, nextCollections);
    },
    [activeCollectionId, persistUserLibrary, USER_DELETED_COLLS_KEY, USER_COLLECTIONS_KEY]
  );

  const addVideoToCollection = useCallback(
    async (collectionId: string, videoId: string) => {
      const nextCollections = collectionsRef.current.map((col) => {
        if (col.id === collectionId && !col.videoIds.includes(videoId)) {
          return {
            ...col,
            videoIds: [...col.videoIds, videoId],
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      collectionsRef.current = nextCollections;
      setCollections(nextCollections);
      await persistUserLibrary(videosRef.current, nextCollections);
    },
    [persistUserLibrary]
  );

  const removeVideoFromCollection = useCallback(
    async (collectionId: string, videoId: string) => {
      const nextCollections = collectionsRef.current.map((col) => {
        if (col.id === collectionId) {
          return {
            ...col,
            videoIds: col.videoIds.filter((id) => id !== videoId),
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      collectionsRef.current = nextCollections;
      setCollections(nextCollections);
      await persistUserLibrary(videosRef.current, nextCollections);
    },
    [persistUserLibrary]
  );

  const addMultipleVideosToCollection = useCallback(
    async (collectionId: string, videoIds: string[]) => {
      const nextCollections = collectionsRef.current.map((col) => {
        if (col.id === collectionId) {
          const set = new Set(col.videoIds);
          videoIds.forEach((id) => set.add(id));
          return {
            ...col,
            videoIds: Array.from(set),
            updatedAt: new Date().toISOString(),
          };
        }
        return col;
      });
      collectionsRef.current = nextCollections;
      setCollections(nextCollections);
      await persistUserLibrary(videosRef.current, nextCollections);
    },
    [persistUserLibrary]
  );

  const openVideoView = useCallback((_video: YouTubeVideo) => {
    setCurrentView('watch');
  }, []);

  const openCollection = useCallback((collectionId: string) => {
    setActiveCollectionId(collectionId);
    setCurrentView('collection');
  }, []);

  const exportLibrary = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: currentUserId,
      videos: videosRef.current,
      collections: collectionsRef.current,
      channels: deriveChannels(videosRef.current),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player_tyrone_${currentUserId}_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentUserId]);

  const importLibrary = useCallback(
    async (jsonString: string): Promise<boolean> => {
      try {
        const data = JSON.parse(jsonString);
        if (data && Array.isArray(data.videos)) {
          const newVideos: YouTubeVideo[] = data.videos
            .filter((v: any) => !deletedVideoIdsRef.current.has(v.id))
            .map((v: any) => ({
              ...v,
              userId: currentUserId,
            }));
          const newCollections: YouTubeCollection[] = Array.isArray(data.collections)
            ? data.collections
                .filter((c: any) => !deletedCollectionIdsRef.current.has(c.id))
                .map((c: any) => ({ ...c, userId: currentUserId }))
            : [];

          videosRef.current = newVideos;
          collectionsRef.current = newCollections;
          setVideos(newVideos);
          setCollections(newCollections);
          setChannels(deriveChannels(newVideos));
          await persistUserLibrary(newVideos, newCollections);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [currentUserId, persistUserLibrary]
  );

  return (
    <VideoLibraryContext.Provider
      value={{
        currentUserId,
        videos,
        collections,
        channels,
        currentView,
        activeCollectionId,
        searchQuery,
        selectedTag,
        categoryFilter,
        isSyncing,
        isCloudConnected,
        cloudError,
        lastGlobalSync,
        autoSyncEnabled,
        syncIntervalMinutes,
        setCurrentView,
        openVideoView,
        openCollection,
        setSearchQuery,
        setSelectedTag,
        setCategoryFilter,
        addYouTubeLink,
        deleteVideo,
        bulkDeleteVideos,
        clearAllVideos,
        updateVideo,
        syncAllVideos,
        syncVideoById,
        setAutoSyncEnabled,
        setSyncIntervalMinutes,
        createCollection,
        updateCollection,
        deleteCollection,
        addVideoToCollection,
        removeVideoFromCollection,
        addMultipleVideosToCollection,
        exportLibrary,
        importLibrary,
      }}
    >
      {children}
    </VideoLibraryContext.Provider>
  );
};

export const useVideoLibrary = () => {
  const context = useContext(VideoLibraryContext);
  if (!context) {
    throw new Error('useVideoLibrary must be used within a VideoLibraryProvider');
  }
  return context;
};
