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
} from '../services/cloudDatabase';
import { realTimeLoad, realTimeSave } from '../services/dbStorage';
import { useAuth } from './AuthContext';

interface VideoLibraryContextType {
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
    notes?: string
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

const VideoLibraryContext = createContext<VideoLibraryContextType | null>(null);

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

export const VideoLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Guaranteed clean, isolated identifier for the user account
  const currentUserId = user?.email?.toLowerCase().trim() || user?.id || 'guest';

  // Per-user isolated storage keys
  const USER_VIDEOS_KEY = `tyrone_usr_videos_${currentUserId}`;
  const USER_COLLECTIONS_KEY = `tyrone_usr_colls_${currentUserId}`;

  // Initial state strictly scoped to this user
  const [videos, setVideos] = useState<YouTubeVideo[]>(() =>
    realTimeLoad<YouTubeVideo[]>(USER_VIDEOS_KEY, [])
  );
  const [collections, setCollections] = useState<YouTubeCollection[]>(() =>
    realTimeLoad<YouTubeCollection[]>(USER_COLLECTIONS_KEY, [])
  );
  const [channels, setChannels] = useState<YouTubeChannelItem[]>(() =>
    deriveChannels(realTimeLoad<YouTubeVideo[]>(USER_VIDEOS_KEY, []))
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

  // 1. When the logged-in user changes, immediately switch local state to their personal storage
  useEffect(() => {
    const loadedVideos = realTimeLoad<YouTubeVideo[]>(USER_VIDEOS_KEY, []);
    const loadedCollections = realTimeLoad<YouTubeCollection[]>(USER_COLLECTIONS_KEY, []);
    setVideos(loadedVideos);
    setCollections(loadedCollections);
    setChannels(deriveChannels(loadedVideos));
    setActiveCollectionId(null);
  }, [currentUserId, USER_VIDEOS_KEY, USER_COLLECTIONS_KEY]);

  // 2. Real-time Cloud Subscription dedicated strictly to this user
  useEffect(() => {
    if (!currentUserId || currentUserId === 'guest') return;

    const unsubscribe = subscribeToUserCloudLibrary(
      currentUserId,
      ({ videos: cloudVideos, collections: cloudCollections }) => {
        setVideos(cloudVideos);
        setCollections(cloudCollections);
        setChannels(deriveChannels(cloudVideos));
        realTimeSave(USER_VIDEOS_KEY, cloudVideos);
        realTimeSave(USER_COLLECTIONS_KEY, cloudCollections);
        setIsCloudConnected(true);
        setCloudError(null);
      },
      (error) => {
        console.warn('[CloudDatabase] User library sync warning:', error);
        setCloudError('Modo local sincronizado');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId, USER_VIDEOS_KEY, USER_COLLECTIONS_KEY]);

  // Helper to persist current user's library in cloud & local
  const persistUserLibrary = useCallback(
    (newVideos: YouTubeVideo[], newCollections: YouTubeCollection[]) => {
      realTimeSave(USER_VIDEOS_KEY, newVideos);
      realTimeSave(USER_COLLECTIONS_KEY, newCollections);
      if (currentUserId && currentUserId !== 'guest') {
        saveUserCloudLibrary(currentUserId, newVideos, newCollections).catch((err) =>
          console.warn('[CloudDatabase] Error persisting library:', err)
        );
      }
    },
    [currentUserId, USER_VIDEOS_KEY, USER_COLLECTIONS_KEY]
  );

  // Sync All Videos with YouTube Metadata
  const syncAllVideos = useCallback(async () => {
    if (videos.length === 0) return;
    setIsSyncing(true);

    try {
      const updatedList: YouTubeVideo[] = [];
      for (const video of videos) {
        const synced = await syncSingleYouTubeVideo(video);
        updatedList.push({ ...synced, userId: currentUserId });
      }
      setVideos(updatedList);
      setChannels(deriveChannels(updatedList));
      setLastGlobalSync(new Date().toISOString());
      persistUserLibrary(updatedList, collectionsRef.current);
    } catch (e) {
      console.warn('Error in cloud sync:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [videos, currentUserId, persistUserLibrary]);

  // Periodic Auto-Sync Timer
  useEffect(() => {
    if (!autoSyncEnabled || videos.length === 0) return;

    const intervalMs = Math.max(1, syncIntervalMinutes) * 60 * 1000;
    const timer = setInterval(() => {
      syncAllVideos().catch(console.warn);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, syncIntervalMinutes, syncAllVideos, videos.length]);

  // Add YouTube Link: personal to this user only
  const addYouTubeLink = useCallback(
    async (
      input: string,
      tags: string[] = [],
      customTitle?: string,
      notes?: string
    ): Promise<YouTubeVideo> => {
      const parsed = parseYouTubeUrl(input);

      if (!parsed.videoId) {
        throw new Error('Link do YouTube inválido. Cole uma URL do youtube.com, youtu.be ou /shorts/.');
      }

      // Check if already in this user's library
      const existing = videos.find((v) => v.id === parsed.videoId);
      if (existing) {
        return existing;
      }

      // Fetch live metadata
      const meta = await fetchYouTubeMetadata(parsed.videoId, parsed.isShort);

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
        tags: tags.length > 0 ? tags : [parsed.isShort ? 'Short' : 'YouTube'],
        addedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        status: 'active',
        notes: notes || '',
        userId: currentUserId,
      };

      const nextVideos = [newVideo, ...videosRef.current.filter((v) => v.id !== newVideo.id)];
      setVideos(nextVideos);
      setChannels(deriveChannels(nextVideos));
      persistUserLibrary(nextVideos, collectionsRef.current);

      return newVideo;
    },
    [videos, currentUserId, persistUserLibrary]
  );

  const deleteVideo = useCallback(
    async (videoId: string) => {
      const nextVideos = videosRef.current.filter((v) => v.id !== videoId);
      const nextCollections = collectionsRef.current.map((c) => ({
        ...c,
        videoIds: c.videoIds.filter((id) => id !== videoId),
      }));

      setVideos(nextVideos);
      setCollections(nextCollections);
      setChannels(deriveChannels(nextVideos));
      persistUserLibrary(nextVideos, nextCollections);
    },
    [persistUserLibrary]
  );

  const bulkDeleteVideos = useCallback(
    async (videoIds: string[]) => {
      const idSet = new Set(videoIds);
      const nextVideos = videosRef.current.filter((v) => !idSet.has(v.id));
      const nextCollections = collectionsRef.current.map((c) => ({
        ...c,
        videoIds: c.videoIds.filter((id) => !idSet.has(id)),
      }));

      setVideos(nextVideos);
      setCollections(nextCollections);
      setChannels(deriveChannels(nextVideos));
      persistUserLibrary(nextVideos, nextCollections);
    },
    [persistUserLibrary]
  );

  const clearAllVideos = useCallback(async () => {
    const nextVideos: YouTubeVideo[] = [];
    const nextCollections = collectionsRef.current.map((c) => ({
      ...c,
      videoIds: [],
    }));

    setVideos(nextVideos);
    setCollections(nextCollections);
    setChannels([]);
    persistUserLibrary(nextVideos, nextCollections);
  }, [persistUserLibrary]);

  const updateVideo = useCallback(
    async (videoId: string, updates: Partial<YouTubeVideo>) => {
      const nextVideos = videosRef.current.map((v) =>
        v.id === videoId ? { ...v, ...updates } : v
      );
      setVideos(nextVideos);
      setChannels(deriveChannels(nextVideos));
      persistUserLibrary(nextVideos, collectionsRef.current);
    },
    [persistUserLibrary]
  );

  const syncVideoById = useCallback(
    async (videoId: string) => {
      const target = videosRef.current.find((v) => v.id === videoId);
      if (!target) return;
      const synced = await syncSingleYouTubeVideo(target);
      const nextVideos = videosRef.current.map((v) => (v.id === videoId ? synced : v));
      setVideos(nextVideos);
      setChannels(deriveChannels(nextVideos));
      persistUserLibrary(nextVideos, collectionsRef.current);
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
      const newCol: YouTubeCollection = {
        id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
      setCollections(nextCollections);
      persistUserLibrary(videosRef.current, nextCollections);

      return newCol;
    },
    [currentUserId, persistUserLibrary]
  );

  const updateCollection = useCallback(
    async (collectionId: string, updates: Partial<YouTubeCollection>) => {
      const nextCollections = collectionsRef.current.map((col) =>
        col.id === collectionId
          ? { ...col, ...updates, updatedAt: new Date().toISOString() }
          : col
      );
      setCollections(nextCollections);
      persistUserLibrary(videosRef.current, nextCollections);
    },
    [persistUserLibrary]
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      const nextCollections = collectionsRef.current.filter((col) => col.id !== id);
      setCollections(nextCollections);

      if (activeCollectionId === id) {
        setCurrentView('home');
        setActiveCollectionId(null);
      }

      persistUserLibrary(videosRef.current, nextCollections);
    },
    [activeCollectionId, persistUserLibrary]
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
      setCollections(nextCollections);
      persistUserLibrary(videosRef.current, nextCollections);
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
      setCollections(nextCollections);
      persistUserLibrary(videosRef.current, nextCollections);
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
      setCollections(nextCollections);
      persistUserLibrary(videosRef.current, nextCollections);
    },
    [persistUserLibrary]
  );

  const openVideoView = useCallback((video: YouTubeVideo) => {
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
      videos,
      collections,
      channels,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player_tyrone_${currentUserId}_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [videos, collections, channels, currentUserId]);

  const importLibrary = useCallback(
    async (jsonString: string): Promise<boolean> => {
      try {
        const data = JSON.parse(jsonString);
        if (data && Array.isArray(data.videos)) {
          const newVideos: YouTubeVideo[] = data.videos.map((v: any) => ({
            ...v,
            userId: currentUserId,
          }));
          const newCollections: YouTubeCollection[] = Array.isArray(data.collections)
            ? data.collections.map((c: any) => ({ ...c, userId: currentUserId }))
            : [];

          setVideos(newVideos);
          setCollections(newCollections);
          setChannels(deriveChannels(newVideos));
          persistUserLibrary(newVideos, newCollections);
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
