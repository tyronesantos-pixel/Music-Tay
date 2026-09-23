import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { YouTubeVideo } from '../services/youtubeService';
import { realTimeLoad, realTimeSave, STORAGE_KEYS } from '../services/dbStorage';
import {
  startBackgroundAudioSession,
  stopBackgroundAudioSession,
  updateMediaSession,
} from '../services/backgroundAudio';

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
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false);
  const [queue, setQueue] = useState<YouTubeVideo[]>([]);

  // Persistent Likes - starts empty
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(() => {
    const list = realTimeLoad<string[]>(STORAGE_KEYS.LIKED, []);
    return new Set(list);
  });

  // Persistent Saved - starts empty
  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(() => {
    return new Set();
  });

  // Persistent History - starts empty
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => {
    return realTimeLoad<WatchHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
  });

  // Real-time synchronization to storage
  useEffect(() => {
    realTimeSave(STORAGE_KEYS.LIKED, Array.from(likedVideoIds));
  }, [likedVideoIds]);

  useEffect(() => {
    realTimeSave(STORAGE_KEYS.HISTORY, watchHistory.slice(0, 60));
  }, [watchHistory]);

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
      album: 'Player do Tyrone',
      artworkUrl: video.thumbnailUrl,
    });

    setWatchHistory((prev) => {
      const filtered = prev.filter((item) => item.videoId !== video.id);
      const next = [{ videoId: video.id, watchedAt: new Date().toISOString() }, ...filtered];
      realTimeSave(STORAGE_KEYS.HISTORY, next);
      return next;
    });
  }, []);

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

  const prevVideo = useCallback(() => {}, []);

  const toggleAutoPlayNext = useCallback(() => {
    setAutoPlayNext((p) => !p);
  }, []);

  const toggleTheater = useCallback(() => {
    setIsTheaterMode((p) => !p);
  }, []);

  const toggleFullscreen = useCallback((element?: HTMLElement | null) => {
    const target = element || document.documentElement;
    if (!document.fullscreenElement) {
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
      realTimeSave(STORAGE_KEYS.LIKED, Array.from(next));
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
    setQueue((prev) => (prev.some((v) => v.id === video.id) ? prev : [...prev, video]));
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
