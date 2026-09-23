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
  deleteCollectionFromCloud,
} from '../services/cloudDatabase';

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
  createCollection: (name: string, description?: string) => Promise<YouTubeCollection>;
  deleteCollection: (id: string) => Promise<void>;
  addVideoToCollection: (collectionId: string, videoId: string) => Promise<void>;
  removeVideoFromCollection: (collectionId: string, videoId: string) => Promise<void>;
  addMultipleVideosToCollection: (collectionId: string, videoIds: string[]) => Promise<void>;
  exportLibrary: () => void;
  importLibrary: (jsonString: string) => Promise<boolean>;
}

const VideoLibraryContext = createContext<VideoLibraryContextType | null>(null);

export const VideoLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [collections, setCollections] = useState<YouTubeCollection[]>([]);
  const [channels, setChannels] = useState<YouTubeChannelItem[]>([]);
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
        setVideos(cloudVideos);
        setIsCloudConnected(true);
        setCloudError(null);

        // Derive channels dynamically from cloud videos
        const channelMap = new Map<string, { count: number; url?: string }>();
        cloudVideos.forEach((v) => {
          if (v.channelTitle) {
            const current = channelMap.get(v.channelTitle) || { count: 0, url: v.channelUrl };
            channelMap.set(v.channelTitle, { count: current.count + 1, url: v.channelUrl || current.url });
          }
        });

        const derivedChannels: YouTubeChannelItem[] = Array.from(channelMap.entries()).map(([name, info]) => ({
          id: name.toLowerCase().replace(/\s+/g, '_'),
          handle: name,
          name,
          channelUrl: info.url || 'https://www.youtube.com',
          videoCount: info.count,
          lastSyncedAt: new Date().toISOString(),
        }));
        setChannels(derivedChannels);
      },
      (error) => {
        console.warn('[CloudDatabase] Firestore subscription warning:', error);
        setCloudError('Conectando ao banco em nuvem...');
      }
    );

    const unsubCollections = subscribeToCloudCollections(
      (cloudCollections) => {
        setCollections(cloudCollections);
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
      for (const video of videos) {
        const synced = await syncSingleYouTubeVideo(video);
        await saveVideoToCloud(synced);
      }
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

  // Add YouTube Link directly to Cloud Database
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

      // Save directly to Cloud Database (Firestore)
      await saveVideoToCloud(newVideo);

      return newVideo;
    },
    [videos]
  );

  const deleteVideo = useCallback(async (videoId: string) => {
    // Delete from Cloud Database
    await deleteVideoFromCloud(videoId);

    // Also remove from any cloud collections that had it
    for (const col of collections) {
      if (col.videoIds.includes(videoId)) {
        await saveCollectionToCloud({
          ...col,
          videoIds: col.videoIds.filter((id) => id !== videoId),
        });
      }
    }
  }, [collections]);

  const bulkDeleteVideos = useCallback(async (videoIds: string[]) => {
    for (const id of videoIds) {
      await deleteVideoFromCloud(id);
    }
  }, []);

  const clearAllVideos = useCallback(async () => {
    for (const v of videos) {
      await deleteVideoFromCloud(v.id);
    }
  }, [videos]);

  const updateVideo = useCallback(async (videoId: string, updates: Partial<YouTubeVideo>) => {
    await updateVideoInCloud(videoId, updates);
  }, []);

  const syncVideoById = useCallback(async (videoId: string) => {
    const target = videos.find((v) => v.id === videoId);
    if (!target) return;
    const synced = await syncSingleYouTubeVideo(target);
    await saveVideoToCloud(synced);
  }, [videos]);

  const createCollection = useCallback(async (name: string, description?: string): Promise<YouTubeCollection> => {
    const newCol: YouTubeCollection = {
      id: `col_${Date.now()}`,
      name,
      description: description || '',
      videoIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveCollectionToCloud(newCol);
    return newCol;
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    await deleteCollectionFromCloud(id);
    if (activeCollectionId === id) {
      setCurrentView('home');
      setActiveCollectionId(null);
    }
  }, [activeCollectionId]);

  const addVideoToCollection = useCallback(async (collectionId: string, videoId: string) => {
    const target = collections.find((c) => c.id === collectionId);
    if (target && !target.videoIds.includes(videoId)) {
      await saveCollectionToCloud({
        ...target,
        videoIds: [...target.videoIds, videoId],
        updatedAt: new Date().toISOString(),
      });
    }
  }, [collections]);

  const removeVideoFromCollection = useCallback(async (collectionId: string, videoId: string) => {
    const target = collections.find((c) => c.id === collectionId);
    if (target) {
      await saveCollectionToCloud({
        ...target,
        videoIds: target.videoIds.filter((id) => id !== videoId),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [collections]);

  const addMultipleVideosToCollection = useCallback(
    async (collectionId: string, videoIds: string[]) => {
      const target = collections.find((c) => c.id === collectionId);
      if (target) {
        const combined = Array.from(new Set([...target.videoIds, ...videoIds]));
        await saveCollectionToCloud({
          ...target,
          videoIds: combined,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [collections]
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
        for (const video of data.videos) {
          await saveVideoToCloud(video);
        }
        if (Array.isArray(data.collections)) {
          for (const col of data.collections) {
            await saveCollectionToCloud(col);
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
