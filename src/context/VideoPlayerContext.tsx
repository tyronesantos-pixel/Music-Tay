import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { YouTubeVideo } from '../services/youtubeService';
import { realTimeLoad, realTimeSave } from '../services/dbStorage';
import {
  startBackgroundAudioSession,
  stopBackgroundAudioSession,
  updateMediaSession,
} from '../services/backgroundAudio';
import { useAuth } from './AuthContext';

interface WatchHistoryItem {
  videoId: string;
  watchedAt: string;
}

interface VideoPlayerContextType {
  currentVideo: YouTubeVideo | null;
  isPlaying: boolean;
  autoPlayNext: boolean;
  isTheaterMode: boolean;
  isFullscreen: boolean;
  isMiniPlayer: boolean;
  likedVideoIds: Set<string>;
  savedVideoIds: Set<string>;
  watchHistory: WatchHistoryItem[];
  queue: YouTubeVideo[];
  playVideo: (video: YouTubeVideo, newQueue?: YouTubeVideo[]) => void;
  pause: () => void;
  resume: () => void;
  nextVideo: () => void;
  prevVideo: () => void;
  toggleAutoPlayNext: () => void;
  toggleTheater: () => void;
  toggleFullscreen: (element?: HTMLElement | null) => void;
  toggleLike: (videoId: string) => void;
  toggleSave: (videoId: string) => void;
  addToQueue: (video: YouTubeVideo) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsMiniPlayer: (mini: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

export const VideoPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.email?.toLowerCase().trim() || user?.id || 'guest';

  // Per-user isolated storage keys
  const USER_LIKED_KEY = `tyrone_player_liked_${currentUserId}`;
  const USER_HISTORY_KEY = `tyrone_player_history_${currentUserId}`;

  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false);
  const [queue, setQueue] = useState<YouTubeVideo[]>([]);

  // Persistent Likes - per user environment
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(() => {
    const list = realTimeLoad<string[]>(USER_LIKED_KEY, []);
    return new Set(list);
  });

  // Persistent Saved - starts empty
  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(() => {
    return new Set();
  });

  // Persistent History - per user environment
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => {
    return realTimeLoad<WatchHistoryItem[]>(USER_HISTORY_KEY, []);
  });

  // Reload likes and history when user changes
  useEffect(() => {
    const list = realTimeLoad<string[]>(USER_LIKED_KEY, []);
    setLikedVideoIds(new Set(list));
    const hist = realTimeLoad<WatchHistoryItem[]>(USER_HISTORY_KEY, []);
    setWatchHistory(hist);
  }, [USER_LIKED_KEY, USER_HISTORY_KEY]);

  // Real-time synchronization to storage
  useEffect(() => {
    realTimeSave(USER_LIKED_KEY, Array.from(likedVideoIds));
  }, [likedVideoIds, USER_LIKED_KEY]);

  useEffect(() => {
    realTimeSave(USER_HISTORY_KEY, watchHistory.slice(0, 60));
  }, [watchHistory, USER_HISTORY_KEY]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const playVideo = useCallback((video: YouTubeVideo, newQueue?: YouTubeVideo[]) => {
    setCurrentVideo(video);
    setIsPlaying(true);

    if (newQueue) {
      setQueue(newQueue.filter((v) => v.id !== video.id));
    }

    // Start background audio keep-alive for locked screen playback
    startBackgroundAudioSession();

    // Setup lock screen controls
    updateMediaSession({
      title: video.title,
      artist: video.channelTitle,
      album: 'Player Pessoal',
      artworkUrl: video.thumbnailUrl,
    });

    setWatchHistory((prev) => {
      const filtered = prev.filter((item) => item.videoId !== video.id);
      const next = [{ videoId: video.id, watchedAt: new Date().toISOString() }, ...filtered];
      realTimeSave(USER_HISTORY_KEY, next);
      return next;
    });
  }, [USER_HISTORY_KEY]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopBackgroundAudioSession();
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
    startBackgroundAudioSession();
  }, []);

  const nextVideo = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0];
      const rest = queue.slice(1);
      playVideo(next, rest);
    }
  }, [queue, playVideo]);

  const prevVideo = useCallback(() => {
    if (watchHistory.length > 1) {
      // Previous in history
    }
  }, [watchHistory]);

  const toggleAutoPlayNext = useCallback(() => {
    setAutoPlayNext((prev) => !prev);
  }, []);

  const toggleTheater = useCallback(() => {
    setIsTheaterMode((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback((element?: HTMLElement | null) => {
    if (!document.fullscreenElement) {
      const target = element || document.documentElement;
      target.requestFullscreen().catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  }, []);

  const toggleLike = useCallback((videoId: string) => {
    setLikedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);

  const toggleSave = useCallback((videoId: string) => {
    setSavedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);

  const addToQueue = useCallback((video: YouTubeVideo) => {
    setQueue((prev) => [...prev.filter((v) => v.id !== video.id), video]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return (
    <VideoPlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        autoPlayNext,
        isTheaterMode,
        isFullscreen,
        isMiniPlayer,
        likedVideoIds,
        savedVideoIds,
        watchHistory,
        queue,
        playVideo,
        pause,
        resume,
        nextVideo,
        prevVideo,
        toggleAutoPlayNext,
        toggleTheater,
        toggleFullscreen,
        toggleLike,
        toggleSave,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setIsMiniPlayer,
        setIsPlaying,
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
};
