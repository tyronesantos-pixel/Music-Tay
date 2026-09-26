import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { YouTubeVideo } from '../services/youtubeService';
import { realTimeLoad, realTimeSave } from '../services/dbStorage';
import { db, doc, setDoc, getDoc } from '../lib/firebase';
import {
  startBackgroundAudioSession,
  stopBackgroundAudioSession,
  updateMediaSession,
  updateMediaSessionPosition,
  setMediaSessionPlaybackState,
  sendYouTubeIframeCommand,
} from '../services/backgroundAudio';
import { useAuth } from './AuthContext';

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
  isMaximized: boolean;
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
  selectTrackFromPlaylist: (
    selectedVideo: YouTubeVideo,
    context?: PlaylistContextInfo | null,
    onPlaylistOrderChanged?: (playlistId: string, newVideoIds: string[]) => void
  ) => void;
  removeDeletedTrack: (videoId: string) => void;
  pause: () => void;
  resume: () => void;
  nextVideo: () => void;
  prevVideo: () => void;
  toggleAutoPlayNext: () => void;
  toggleTheater: () => void;
  toggleFullscreen: (element?: HTMLElement | null) => void;
  setIsMaximized: (max: boolean) => void;
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
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
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
  const isMaximizedRef = useRef(isMaximized);
  isMaximizedRef.current = isMaximized;

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
      const active = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setIsFullscreen(active);
      if (active) {
        setIsMaximized(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopBackgroundAudioSession();
    sendYouTubeIframeCommand('pauseVideo');
    setMediaSessionPlaybackState('paused');
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
    startBackgroundAudioSession();
    sendYouTubeIframeCommand('playVideo');
    setMediaSessionPlaybackState('playing');
  }, []);

  // Normal / sequential playback
  const playVideo = useCallback(
    (
      video: YouTubeVideo,
      newQueue?: YouTubeVideo[],
      context?: PlaylistContextInfo | null
    ) => {
      setCurrentVideo(video);
      currentVideoRef.current = video;
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

      const activeAlbum = (context || playlistContextRef.current)?.name
        ? `SoundUp • ${(context || playlistContextRef.current)?.name}`
        : 'SoundUp';

      // Setup lock screen controls
      updateMediaSession(
        {
          title: video.title,
          artist: video.channelTitle || 'SoundUp',
          album: activeAlbum,
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

  /**
   * Manual track selection from playlist (Requirement 3):
   * When user is playing song A and manually clicks song C directly from playlist:
   * 1. Song A is removed from its current position and sent to the END of the list.
   * 2. Song C becomes the current song playing (at the end).
   * 3. Order becomes: [other songs in original order, A, C (tocando)].
   * 4. Zero duplications, consistent order across multiple selections.
   */
  const selectTrackFromPlaylist = useCallback(
    (
      selectedVideo: YouTubeVideo,
      context?: PlaylistContextInfo | null,
      onPlaylistOrderChanged?: (playlistId: string, newVideoIds: string[]) => void
    ) => {
      const activeCtx = context || playlistContextRef.current;
      const curVideo = currentVideoRef.current;

      if (!activeCtx || activeCtx.videos.length <= 1 || !curVideo || curVideo.id === selectedVideo.id) {
        playVideo(selectedVideo, activeCtx?.videos.filter((v) => v.id !== selectedVideo.id), activeCtx);
        return;
      }

      const all = activeCtx.videos;
      const curId = curVideo.id;
      const selId = selectedVideo.id;

      const hasCur = all.some((v) => v.id === curId);
      const hasSel = all.some((v) => v.id === selId);

      if (!hasCur || !hasSel) {
        // Not both in playlist, play normally
        playVideo(selectedVideo, all.filter((v) => v.id !== selectedVideo.id), activeCtx);
        return;
      }

      // Filter out both old playing song and new selected song, maintaining order
      const otherVideos = all.filter((v) => v.id !== curId && v.id !== selId);
      const prevPlaying = all.find((v) => v.id === curId)!;
      const selected = all.find((v) => v.id === selId) || selectedVideo;

      // Reordered list: [other songs in order, previous playing song, selected song]
      const reorderedList = [...otherVideos, prevPlaying, selected];

      const updatedCtx: PlaylistContextInfo = {
        id: activeCtx.id,
        name: activeCtx.name,
        videos: reorderedList,
      };

      setPlaylistContext(updatedCtx);
      playlistContextRef.current = updatedCtx;

      // Queue is all tracks in the playlist other than the currently playing one
      const remainingQueue = reorderedList.filter((v) => v.id !== selected.id);

      playVideo(selected, remainingQueue, updatedCtx);

      // Persist new order in collection database if callback provided
      if (onPlaylistOrderChanged && activeCtx.id) {
        onPlaylistOrderChanged(
          activeCtx.id,
          reorderedList.map((v) => v.id)
        );
      }
    },
    [playVideo]
  );

  /**
   * Purge deleted track from active player context (Requirement 5)
   */
  const removeDeletedTrack = useCallback(
    (videoId: string) => {
      // 1. If currently playing this deleted video, advance to next track or pause
      if (currentVideoRef.current?.id === videoId) {
        const nextInQueue = queueRef.current.find((v) => v.id !== videoId);
        if (nextInQueue) {
          playVideo(nextInQueue);
        } else {
          pause();
          setCurrentVideo(null);
          currentVideoRef.current = null;
        }
      }

      // 2. Remove from queue
      setQueue((prev) => {
        const filtered = prev.filter((v) => v.id !== videoId);
        queueRef.current = filtered;
        return filtered;
      });

      // 3. Remove from playlist context
      setPlaylistContext((prev) => {
        if (!prev) return null;
        const filtered = prev.videos.filter((v) => v.id !== videoId);
        const updated = { ...prev, videos: filtered };
        playlistContextRef.current = updated;
        return updated;
      });

      // 4. Remove from likes
      setLikedVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });

      // 5. Remove from watch history
      setWatchHistory((prev) => {
        const filtered = prev.filter((h) => h.videoId !== videoId);
        realTimeSave(USER_HISTORY_KEY, filtered);
        return filtered;
      });
    },
    [USER_HISTORY_KEY, pause, playVideo]
  );

  // Next Video: sequential continuous loop inside playlist or queue
  const nextVideo = useCallback(() => {
    const currentCtx = playlistContextRef.current;
    const curVideo = currentVideoRef.current;

    // 1. Strict Playlist Isolation: loop sequentially through the playlist
    if (currentCtx && currentCtx.videos.length > 0) {
      const all = currentCtx.videos;
      const idx = all.findIndex((v) => v.id === curVideo?.id);
      let nextIndex = 0;
      if (idx !== -1 && idx + 1 < all.length) {
        nextIndex = idx + 1;
      } else {
        // Continuous playlist loop back to start
        nextIndex = 0;
      }
      const nextVid = all[nextIndex];
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
    }
  }, [playVideo]);

  const prevVideo = useCallback(() => {
    const currentCtx = playlistContextRef.current;
    const curVideo = currentVideoRef.current;

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
    }
  }, [playVideo]);

  // Keep fresh reference for global event listeners
  const nextVideoRef = useRef(nextVideo);
  nextVideoRef.current = nextVideo;
  const prevVideoRef = useRef(prevVideo);
  prevVideoRef.current = prevVideo;

  // Global YouTube postMessage listener for ended events
  // When a track finishes, automatically jumps to next track in playlist/queue
  useEffect(() => {
    let lastHandledTime = 0;

    const handleWindowMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // Sync real-time progress bar to lock screen MediaSession
        if (
          data?.event === 'infoDelivery' &&
          typeof data?.info?.currentTime === 'number' &&
          typeof data?.info?.duration === 'number'
        ) {
          updateMediaSessionPosition(data.info.currentTime, data.info.duration);
        }

        // Sync playback state
        const playerState =
          data?.info?.playerState ??
          (data?.event === 'onStateChange' ? data?.info ?? data?.data : undefined);

        if (playerState === 1) {
          setMediaSessionPlaybackState('playing');
        } else if (playerState === 2) {
          setMediaSessionPlaybackState('paused');
        }

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
    const isCurrentlyFullscreen = Boolean(
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      const target = element || document.documentElement;
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(console.warn);
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setIsMaximized(true);
      isMaximizedRef.current = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.warn);
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
      setIsMaximized(false);
      isMaximizedRef.current = false;
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
        isMaximized,
        isMiniPlayer,
        likedVideoIds,
        savedVideoIds,
        watchHistory,
        queue,
        playlistContext,
        setPlaylistContext,
        playVideo,
        selectTrackFromPlaylist,
        removeDeletedTrack,
        pause,
        resume,
        nextVideo,
        prevVideo,
        toggleAutoPlayNext,
        toggleTheater,
        toggleFullscreen,
        setIsMaximized,
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
