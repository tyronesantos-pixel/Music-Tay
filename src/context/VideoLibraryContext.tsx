import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  subscribeToCloudVideos,
  saveVideoToCloud,
  deleteVideoFromCloud,
  updateVideoInCloud,
  subscribeToCloudCollections,
  saveCollectionToCloud,
  updateCollectionInCloud,
  deleteCollectionFromCloud,
} from '../services/cloudDatabase';
import { realTimeLoad, realTimeSave } from '../services/dbStorage';

const LOCAL_STORAGE_KEYS = {
  VIDEOS: 'tyrone_player_videos_v3',
  COLLECTIONS: 'tyrone_player_collections_v3',
};

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
  // Pre-load from local storage instantly so there's zero initial wait
  const [videos, setVideos] = useState<YouTubeVideo[]>(() =>
    realTimeLoad<YouTubeVideo[]>(LOCAL_STORAGE_KEYS.VIDEOS, [])
  );
  const [collections, setCollections] = useState<YouTubeCollection[]>(() =>
    realTimeLoad<YouTubeCollection[]>(LOCAL_STORAGE_KEYS.COLLECTIONS, [])
  );
  const [channels, setChannels] = useState<YouTubeChannelItem[]>(() =>
    deriveChannels(realTimeLoad<YouTubeVideo[]>(LOCAL_STORAGE_KEYS.VIDEOS, []))
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

  // Real-time Cloud Subscriptions (Firestore Cloud Database)
  useEffect(() => {
    const unsubVideos = subscribeToCloudVideos(
      (cloudVideos) => {
        // If cloud has videos, update state and local cache
        if (cloudVideos && cloudVideos.length > 0) {
          setVideos(cloudVideos);
          realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, cloudVideos);
          setChannels(deriveChannels(cloudVideos));
        }
        setIsCloudConnected(true);
        setCloudError(null);
      },
      (error) => {
        console.warn('[CloudDatabase] Firestore subscription warning:', error);
        setCloudError('Usando modo local com sincronização em nuvem');
      }
    );

    const unsubCollections = subscribeToCloudCollections(
      (cloudCollections) => {
        if (cloudCollections && cloudCollections.length > 0) {
          setCollections(cloudCollections);
          realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, cloudCollections);
        }
      },
      (error) => {
        console.warn('[CloudDatabase] Collections subscription warning:', error);
      }
    );

    return () => {
      unsubVideos();
      unsubCollections();
    };
  }, []);

  // Sync All Videos with YouTube Metadata
  const syncAllVideos = useCallback(async () => {
    if (videos.length === 0) return;
    setIsSyncing(true);

    try {
      const updatedList: YouTubeVideo[] = [];
      for (const video of videos) {
        const synced = await syncSingleYouTubeVideo(video);
        await saveVideoToCloud(synced);
        updatedList.push(synced);
      }
      setVideos(updatedList);
      realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, updatedList);
      setChannels(deriveChannels(updatedList));
      setLastGlobalSync(new Date().toISOString());
    } catch (e) {
      console.warn('Error in cloud sync:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [videos]);

  // Periodic Auto-Sync Timer
  useEffect(() => {
    if (!autoSyncEnabled || videos.length === 0) return;

    const intervalMs = Math.max(1, syncIntervalMinutes) * 60 * 1000;
    const timer = setInterval(() => {
      syncAllVideos().catch(console.warn);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, syncIntervalMinutes, syncAllVideos, videos.length]);

  // Add YouTube Link: Optimistic update + Cloud save
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

      // Check if already in library
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
      };

      // 1. Instant optimistic state update
      setVideos((prev) => {
        const next = [newVideo, ...prev.filter((v) => v.id !== newVideo.id)];
        realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, next);
        setChannels(deriveChannels(next));
        return next;
      });

      // 2. Cloud database persist
      saveVideoToCloud(newVideo).catch((err) =>
        console.warn('[CloudDatabase] Background save error:', err)
      );

      return newVideo;
    },
    [videos]
  );

  const deleteVideo = useCallback(
    async (videoId: string) => {
      // Optimistic delete
      setVideos((prev) => {
        const next = prev.filter((v) => v.id !== videoId);
        realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, next);
        setChannels(deriveChannels(next));
        return next;
      });

      setCollections((prev) => {
        const next = prev.map((c) => ({
          ...c,
          videoIds: c.videoIds.filter((id) => id !== videoId),
        }));
        realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, next);
        return next;
      });

      // Cloud delete
      deleteVideoFromCloud(videoId).catch(console.warn);
      for (const col of collections) {
        if (col.videoIds.includes(videoId)) {
          saveCollectionToCloud({
            ...col,
            videoIds: col.videoIds.filter((id) => id !== videoId),
          }).catch(console.warn);
        }
      }
    },
    [collections]
  );

  const bulkDeleteVideos = useCallback(async (videoIds: string[]) => {
    const idSet = new Set(videoIds);
    setVideos((prev) => {
      const next = prev.filter((v) => !idSet.has(v.id));
      realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, next);
      setChannels(deriveChannels(next));
      return next;
    });

    for (const id of videoIds) {
      deleteVideoFromCloud(id).catch(console.warn);
    }
  }, []);

  const clearAllVideos = useCallback(async () => {
    const toDelete = [...videos];
    setVideos([]);
    realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, []);
    setChannels([]);

    for (const v of toDelete) {
      deleteVideoFromCloud(v.id).catch(console.warn);
    }
  }, [videos]);

  const updateVideo = useCallback(async (videoId: string, updates: Partial<YouTubeVideo>) => {
    setVideos((prev) => {
      const next = prev.map((v) => (v.id === videoId ? { ...v, ...updates } : v));
      realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, next);
      setChannels(deriveChannels(next));
      return next;
    });

    updateVideoInCloud(videoId, updates).catch(console.warn);
  }, []);

  const syncVideoById = useCallback(
    async (videoId: string) => {
      const target = videos.find((v) => v.id === videoId);
      if (!target) return;
      const synced = await syncSingleYouTubeVideo(target);
      setVideos((prev) => {
        const next = prev.map((v) => (v.id === videoId ? synced : v));
        realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, next);
        setChannels(deriveChannels(next));
        return next;
      });
      saveVideoToCloud(synced).catch(console.warn);
    },
    [videos]
  );

  const createCollection = useCallback(
    async (
      name: string,
      description?: string,
      category?: 'all' | 'musicas' | 'videoclipe' | 'games',
      color?: string
    ): Promise<YouTubeCollection> => {
      const newCol: YouTubeCollection = {
        id: `col_${Date.now()}`,
        name,
        description: description || '',
        category: category || 'all',
        color: color || '',
        videoIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      setCollections((prev) => {
        const next = [newCol, ...prev];
        realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, next);
        return next;
      });

      // Background cloud save
      saveCollectionToCloud(newCol).catch((err) =>
        console.warn('[CloudDatabase] Error saving new collection:', err)
      );

      return newCol;
    },
    []
  );

  const updateCollection = useCallback(
    async (collectionId: string, updates: Partial<YouTubeCollection>) => {
      // 1. Instant optimistic update
      setCollections((prev) => {
        const next = prev.map((col) =>
          col.id === collectionId
            ? { ...col, ...updates, updatedAt: new Date().toISOString() }
            : col
        );
        realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, next);
        return next;
      });

      // 2. Cloud update in background
      updateCollectionInCloud(collectionId, updates).catch((err) =>
        console.warn('[CloudDatabase] Error updating collection:', err)
      );
    },
    []
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      // Optimistic delete
      setCollections((prev) => {
        const next = prev.filter((col) => col.id !== id);
        realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, next);
        return next;
      });

      if (activeCollectionId === id) {
        setCurrentView('home');
        setActiveCollectionId(null);
      }

      deleteCollectionFromCloud(id).catch(console.warn);
    },
    [activeCollectionId]
  );

  const addVideoToCollection = useCallback(async (collectionId: string, videoId: string) => {
    setCollections((prev) => {
      const next = prev.map((col) => {
        if (col.id === collectionId && !col.videoIds.includes(videoId)) {
          const updated = {
            ...col,
            videoIds: [...col.videoIds, videoId],
            updatedAt: new Date().toISOString(),
          };
          saveCollectionToCloud(updated).catch(console.warn);
          return updated;
        }
        return col;
      });
      realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, next);
      return next;
    });
  }, []);

  const removeVideoFromCollection = useCallback(async (collectionId: string, videoId: string) => {
    setCollections((prev) => {
      const next = prev.map((col) => {
        if (col.id === collectionId) {
          const updated = {
            ...col,
            videoIds: col.videoIds.filter((id) => id !== videoId),
            updatedAt: new Date().toISOString(),
          };
          saveCollectionToCloud(updated).catch(console.warn);
          return updated;
        }
        return col;
      });
      realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, next);
      return next;
    });
  }, []);

  const addMultipleVideosToCollection = useCallback(
    async (collectionId: string, videoIds: string[]) => {
      setCollections((prev) => {
        const next = prev.map((col) => {
          if (col.id === collectionId) {
            const combined = Array.from(new Set([...col.videoIds, ...videoIds]));
            const updated = {
              ...col,
              videoIds: combined,
              updatedAt: new Date().toISOString(),
            };
            saveCollectionToCloud(updated).catch(console.warn);
            return updated;
          }
          return col;
        });
        realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, next);
        return next;
      });
    },
    []
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
      version: 4,
      storageType: 'cloud_firestore',
      exportedAt: new Date().toISOString(),
      videos,
      collections,
      channels,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player_do_tyrone_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [videos, collections, channels]);

  const importLibrary = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.videos)) {
        setVideos(data.videos);
        realTimeSave(LOCAL_STORAGE_KEYS.VIDEOS, data.videos);
        setChannels(deriveChannels(data.videos));

        if (Array.isArray(data.collections)) {
          setCollections(data.collections);
          realTimeSave(LOCAL_STORAGE_KEYS.COLLECTIONS, data.collections);
        }

        for (const video of data.videos) {
          saveVideoToCloud(video).catch(console.warn);
        }
        if (Array.isArray(data.collections)) {
          for (const col of data.collections) {
            saveCollectionToCloud(col).catch(console.warn);
          }
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

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
