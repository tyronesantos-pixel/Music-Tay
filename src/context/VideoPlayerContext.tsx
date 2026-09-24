import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { YouTubeVideo } from '../services/youtubeService';
import { realTimeLoad, realTimeSave } from '../services/dbStorage';
import { db, doc, setDoc, getDoc } from '../lib/firebase';
import {
  startBackgroundAudioSession,
  stopBackgroundAudioSession,
  updateMediaSession,
} from '../services/backgroundAudio';
import { useAuth } from './AuthContext';
import { VideoLibraryContext } from './VideoLibraryContext';

interface WatchHistoryItem {
  videoId: string;
  watchedAt: string;
}

export interface PlaylistContextInfo {
  id: string;
  name: string;
  videos: YouTubeVideo[];
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
  playlistContext: PlaylistContextInfo | null;
  setPlaylistContext: (ctx: PlaylistContextInfo | null) => void;
  playVideo: (
    video: YouTubeVideo,
    newQueue?: YouTubeVideo[],
    context?: PlaylistContextInfo | null
  ) => void;
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
  libraryVideos: YouTubeVideo[];
}

const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

export const VideoPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.email?.toLowerCase().trim() || user?.id || 'guest';

  // Read video library from parent VideoLibraryContext safely
  const libraryCtx = useContext(VideoLibraryContext);
  const libraryVideos = libraryCtx?.videos || [];

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
  const [playlistContext, setPlaylistContext] = useState<PlaylistContextInfo | null>(null);

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

  // Mutable refs for callbacks and event listeners
  const autoPlayNextRef = useRef(autoPlayNext);
  autoPlayNextRef.current = autoPlayNext;
  const playlistContextRef = useRef(playlistContext);
  playlistContextRef.current = playlistContext;
  const currentVideoRef = useRef(currentVideo);
  currentVideoRef.current = currentVideo;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const libraryVideosRef = useRef(libraryVideos);
  libraryVideosRef.current = libraryVideos;

  // Reload likes and history when user changes and fetch cloud backup
  useEffect(() => {
    const list = realTimeLoad<string[]>(USER_LIKED_KEY, []);
    setLikedVideoIds(new Set(list));
    const hist = realTimeLoad<WatchHistoryItem[]>(USER_HISTORY_KEY, []);
    setWatchHistory(hist);

    if (currentUserId && currentUserId !== 'guest') {
      const cleanUserId = currentUserId.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
      getDoc(doc(db, 'user_libraries', cleanUserId))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.likedVideoIds) && data.likedVideoIds.length > 0) {
              setLikedVideoIds((prev) => {
                const merged = new Set([...prev, ...data.likedVideoIds]);
                realTimeSave(USER_LIKED_KEY, Array.from(merged));
                return merged;
              });
            }
            if (Array.isArray(data.watchHistory) && data.watchHistory.length > 0) {
              setWatchHistory((prev) => {
                if (prev.length === 0) {
                  realTimeSave(USER_HISTORY_KEY, data.watchHistory);
                  return data.watchHistory;
                }
                return prev;
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [USER_LIKED_KEY, USER_HISTORY_KEY, currentUserId]);

  // Real-time synchronization to storage and cloud
  useEffect(() => {
    const list = Array.from(likedVideoIds);
    realTimeSave(USER_LIKED_KEY, list);
    if (currentUserId && currentUserId !== 'guest') {
      const cleanUserId = currentUserId.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
      setDoc(
        doc(db, 'user_libraries', cleanUserId),
        { likedVideoIds: list, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    }
  }, [likedVideoIds, USER_LIKED_KEY, currentUserId]);

  useEffect(() => {
    const sliced = watchHistory.slice(0, 60);
    realTimeSave(USER_HISTORY_KEY, sliced);
    if (currentUserId && currentUserId !== 'guest') {
      const cleanUserId = currentUserId.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
      setDoc(
        doc(db, 'user_libraries', cleanUserId),
        { watchHistory: sliced, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    }
  }, [watchHistory, USER_HISTORY_KEY, currentUserId]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopBackgroundAudioSession();
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
    startBackgroundAudioSession();
  }, []);

  const playVideo = useCallback(
    (
      video: YouTubeVideo,
      newQueue?: YouTubeVideo[],
      context?: PlaylistContextInfo | null
    ) => {
      setCurrentVideo(video);
      setIsPlaying(true);

      if (context !== undefined) {
        setPlaylistContext(context);
        playlistContextRef.current = context;
      }

      if (newQueue) {
        const filtered = newQueue.filter((v) => v.id !== video.id);
        setQueue(filtered);
        queueRef.current = filtered;
      }

      // Start background audio keep-alive for locked screen playback
      startBackgroundAudioSession();

      // Setup lock screen controls
      updateMediaSession(
        {
          title: video.title,
          artist: video.channelTitle,
          album: (context || playlistContextRef.current)?.name || 'Player Pessoal',
          artworkUrl: video.thumbnailUrl,
        },
        {
          onNext: () => nextVideoRef.current(),
          onPrev: () => prevVideoRef.current(),
          onPlay: () => resume(),
          onPause: () => pause(),
        }
      );

      setWatchHistory((prev) => {
        const filtered = prev.filter((item) => item.videoId !== video.id);
        const next = [{ videoId: video.id, watchedAt: new Date().toISOString() }, ...filtered];
        realTimeSave(USER_HISTORY_KEY, next);
        return next;
      });
    },
    [USER_HISTORY_KEY, pause, resume]
  );

  const nextVideo = useCallback(() => {
    const currentCtx = playlistContextRef.current;
    const curVideo = currentVideoRef.current;

    // 1. Strict Playlist Isolation: only play videos from this playlist in order
    if (currentCtx && currentCtx.videos.length > 0) {
      const all = currentCtx.videos;
      const idx = all.findIndex((v) => v.id === curVideo?.id);
      let nextIndex = 0;
      if (idx !== -1 && idx + 1 < all.length) {
        nextIndex = idx + 1;
      } else {
        // Continuous playlist loop back to clip #1
        nextIndex = 0;
      }
      const nextVid = all[nextIndex];
      // Filter remaining queue strictly from this playlist
      const nextQueue = all.filter((_, i) => i !== nextIndex);
      playVideo(nextVid, nextQueue, currentCtx);
      return;
    }

    // 2. Standalone playback queue fallback
    const currentQ = queueRef.current;
    if (currentQ.length > 0) {
      const next = currentQ[0];
      const rest = currentQ.slice(1);
      playVideo(next, rest, null);
      return;
    }

    // 3. User Library sequential playback fallback
    const library = libraryVideosRef.current;
    if (library && library.length > 0) {
      const idx = library.findIndex((v) => v.id === curVideo?.id);
      let nextIndex = 0;
      if (idx !== -1 && idx + 1 < library.length) {
        nextIndex = idx + 1;
      } else {
        nextIndex = 0;
      }
      const nextVid = library[nextIndex];
      const nextQueue = library.filter((_, i) => i !== nextIndex);
      playVideo(nextVid, nextQueue, null);
    }
  }, [playVideo]);

  const prevVideo = useCallback(() => {
    const currentCtx = playlistContextRef.current;
    const curVideo = currentVideoRef.current;

    // 1. Strict Playlist Isolation: navigate backwards only within this playlist
    if (currentCtx && currentCtx.videos.length > 0) {
      const all = currentCtx.videos;
      const idx = all.findIndex((v) => v.id === curVideo?.id);
      let prevIndex = all.length - 1;
      if (idx > 0) {
        prevIndex = idx - 1;
      }
      const prevVid = all[prevIndex];
      const nextQueue = all.filter((_, i) => i !== prevIndex);
      playVideo(prevVid, nextQueue, currentCtx);
      return;
    }

    const currentQ = queueRef.current;
    if (currentQ.length > 0) {
      const last = currentQ[currentQ.length - 1];
      playVideo(last, currentQ.slice(0, -1), null);
      return;
    }

    const library = libraryVideosRef.current;
    if (library && library.length > 0) {
      const idx = library.findIndex((v) => v.id === curVideo?.id);
      let prevIndex = library.length - 1;
      if (idx > 0) {
        prevIndex = idx - 1;
      }
      const prevVid = library[prevIndex];
      const nextQueue = library.filter((_, i) => i !== prevIndex);
      playVideo(prevVid, nextQueue, null);
    }
  }, [playVideo]);

  // Keep fresh reference for global event listeners
  const nextVideoRef = useRef(nextVideo);
  nextVideoRef.current = nextVideo;
  const prevVideoRef = useRef(prevVideo);
  prevVideoRef.current = prevVideo;

  // Global YouTube postMessage listener for ended events
  // This automatically jumps to the next clip in the playlist when the current clip finishes
  useEffect(() => {
    let lastHandledTime = 0;

    const handleWindowMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // YouTube player events indicating track finish:
        // 1. onStateChange with info === 0 (YT.PlayerState.ENDED)
        // 2. infoDelivery with playerState === 0
        // 3. stateChange event with data === 0
        // 4. near-end progress: currentTime within 0.75s of duration
        const isEnded =
          (data?.event === 'onStateChange' &&
            (data?.info === 0 || data?.info?.playerState === 0 || data?.data === 0)) ||
          (data?.event === 'infoDelivery' &&
            (data?.info?.playerState === 0 || data?.info === 0)) ||
          (data?.info && (data.info === 0 || data.info.playerState === 0)) ||
          (data?.event === 'infoDelivery' &&
            typeof data?.info?.currentTime === 'number' &&
            typeof data?.info?.duration === 'number' &&
            data.info.duration > 4 &&
            data.info.currentTime >= data.info.duration - 0.75);

        if (isEnded) {
          const now = Date.now();
          if (now - lastHandledTime > 1500) {
            lastHandledTime = now;
            if (autoPlayNextRef.current) {
              console.log('[Player] Clip finished. Playing next track automatically.');
              nextVideoRef.current();
            }
          }
        }
      } catch (_) {
        // Non-JSON postMessage, ignore safely
      }
    };

    window.addEventListener('message', handleWindowMessage);

    // Keep YouTube iframes actively reporting their state by posting listening handshake periodically
    const handshakeInterval = setInterval(() => {
      if (typeof document !== 'undefined') {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
              iframe.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
                '*'
              );
            }
          } catch (_) {}
        });
      }
    }, 1500);

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      clearInterval(handshakeInterval);
    };
  }, []);

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
        playlistContext,
        setPlaylistContext,
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
        libraryVideos,
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
