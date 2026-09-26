/**
 * Background Audio & Media Session Service for SoundUp
 *
 * Ensures continuous, uninterrupted playback when the user locks their mobile phone
 * or switches away from the application:
 * 1. Persistent singleton HTML5 <audio> element connected to a continuous audio stream
 *    that retains OS audio focus across Android, iOS Safari, Chrome, and Desktop.
 * 2. Full MediaSession API integration (Title, Artist, Album, Artworks, Play, Pause, Next, Prev, Seek).
 * 3. Page visibility change & background heartbeat to counteract YouTube iframe auto-pauses.
 * 4. Preserves current playback position and state when unlocking the screen.
 */

export interface MediaSessionTrack {
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
}

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeek?: (seekTime: number) => void;
}

// Global service state
let persistentAudioTag: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

let isSessionActive = false;
let lastKnownCurrentTime = 0;
let lastKnownDuration = 0;
let backgroundHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

// Lock screen handler callbacks
let onLockScreenPlay: (() => void) | null = null;
let onLockScreenPause: (() => void) | null = null;
let onLockScreenNext: (() => void) | null = null;
let onLockScreenPrev: (() => void) | null = null;
let onLockScreenSeek: ((seekTime: number) => void) | null = null;

// Continuous silent WAV audio fallback (1 sec loopable PCM wav)
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Initializes or retrieves the permanent hidden <audio> element.
 * This element is NEVER removed from the DOM to maintain OS media session continuity.
 */
function getOrCreatePersistentAudioElement(): HTMLAudioElement | null {
  if (typeof document === 'undefined') return null;

  if (persistentAudioTag && document.body.contains(persistentAudioTag)) {
    return persistentAudioTag;
  }

  let el = document.getElementById('soundup-background-audio-engine') as HTMLAudioElement | null;
  if (!el) {
    el = document.createElement('audio');
    el.id = 'soundup-background-audio-engine';
    el.setAttribute('playsinline', 'true');
    el.setAttribute('webkit-playsinline', 'true');
    el.setAttribute('x-webkit-airplay', 'allow');
    el.loop = true;
    el.volume = 0.01; // Inaudible sub-audible level to maintain hardware DAC active
    el.preload = 'auto';

    // Position off-screen without display:none so mobile browsers treat it as active
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.bottom = '0';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.opacity = '0.001';
    el.style.pointerEvents = 'none';

    document.body.appendChild(el);
  }

  persistentAudioTag = el;
  return persistentAudioTag;
}

/**
 * Configures the Web Audio API stream and connects it to the persistent audio element.
 */
function initWebAudioSession() {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    if (!oscillator && audioContext) {
      // 20Hz sub-audible sine tone to keep Android/iOS audio hardware pipeline running
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(20, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);

      oscillator.connect(gainNode);

      // Try creating MediaStreamDestination to pipe into audio element
      try {
        if (typeof audioContext.createMediaStreamDestination === 'function') {
          mediaStreamDest = audioContext.createMediaStreamDestination();
          gainNode.connect(mediaStreamDest);

          const audioEl = getOrCreatePersistentAudioElement();
          if (audioEl && 'srcObject' in audioEl) {
            audioEl.srcObject = mediaStreamDest.stream;
          }
        }
      } catch (err) {
        console.debug('[BackgroundAudio] MediaStreamDestination fallback to data URL:', err);
      }

      // Also connect to destination for hardware output
      gainNode.connect(audioContext.destination);

      try {
        oscillator.start();
      } catch (_) {
        // Oscillator already started
      }
    }
  } catch (err) {
    console.debug('[BackgroundAudio] WebAudio init notice:', err);
  }

  // Ensure persistent audio element has a valid playable source
  const audioEl = getOrCreatePersistentAudioElement();
  if (audioEl && !audioEl.src && !audioEl.srcObject) {
    audioEl.src = SILENT_WAV_BASE64;
  }
}

/**
 * Send postMessage command to all YouTube iframes in document
 */
export function sendYouTubeIframeCommand(command: string, args: any = '') {
  if (typeof document === 'undefined') return;

  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: command, args }),
          '*'
        );
      }
    } catch (_) {
      // Cross-origin fallback
    }
  });
}

/**
 * Starts continuous background session and claims system lock-screen focus
 */
export function startBackgroundAudioSession() {
  isSessionActive = true;
  initWebAudioSession();

  const audioEl = getOrCreatePersistentAudioElement();
  if (audioEl) {
    if (!audioEl.src && !audioEl.srcObject) {
      audioEl.src = SILENT_WAV_BASE64;
    }
    audioEl.play().catch(() => {});
  }

  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'playing';
  }

  // Watchdog heartbeat: if document is hidden, periodically ensure YouTube stays active
  if (!backgroundHeartbeatTimer) {
    backgroundHeartbeatTimer = setInterval(() => {
      if (isSessionActive && typeof document !== 'undefined' && document.hidden) {
        sendYouTubeIframeCommand('playVideo');
      }
    }, 2500);
  }
}

/**
 * Pauses background session
 */
export function stopBackgroundAudioSession() {
  isSessionActive = false;

  if (backgroundHeartbeatTimer) {
    clearInterval(backgroundHeartbeatTimer);
    backgroundHeartbeatTimer = null;
  }

  if (audioContext && audioContext.state === 'running') {
    audioContext.suspend().catch(() => {});
  }

  if (persistentAudioTag) {
    persistentAudioTag.pause();
  }

  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'paused';
  }
}

/**
 * Updates Media Session metadata on lock screen and registers media keys
 */
export function updateMediaSession(track: MediaSessionTrack, handlers?: MediaSessionHandlers) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  try {
    const artworkList: MediaImage[] = track.artworkUrl
      ? [
          { src: track.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: track.artworkUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: track.artworkUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: track.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: track.artworkUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'SoundUp',
      album: track.album || 'SoundUp',
      artwork: artworkList,
    });

    navigator.mediaSession.playbackState = 'playing';

    if (handlers?.onPlay) onLockScreenPlay = handlers.onPlay;
    if (handlers?.onPause) onLockScreenPause = handlers.onPause;
    if (handlers?.onNext) onLockScreenNext = handlers.onNext;
    if (handlers?.onPrev) onLockScreenPrev = handlers.onPrev;
    if (handlers?.onSeek) onLockScreenSeek = handlers.onSeek;

    // Lock-screen & Bluetooth Play
    navigator.mediaSession.setActionHandler('play', () => {
      startBackgroundAudioSession();
      sendYouTubeIframeCommand('playVideo');
      if (onLockScreenPlay) onLockScreenPlay();
    });

    // Lock-screen & Bluetooth Pause
    navigator.mediaSession.setActionHandler('pause', () => {
      stopBackgroundAudioSession();
      sendYouTubeIframeCommand('pauseVideo');
      if (onLockScreenPause) onLockScreenPause();
    });

    // Next track handler
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (onLockScreenNext) {
        onLockScreenNext();
      }
    });

    // Previous track handler
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (onLockScreenPrev) {
        onLockScreenPrev();
      }
    });

    // Seek To handler (OS Lock Screen slider)
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') {
        lastKnownCurrentTime = details.seekTime;
        sendYouTubeIframeCommand('seekTo', [details.seekTime, true]);
        if (onLockScreenSeek) {
          onLockScreenSeek(details.seekTime);
        }
        updateMediaSessionPosition(details.seekTime, lastKnownDuration);
      }
    });

    // Seek Forward 10s
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const offset = details.seekOffset || 10;
      const targetTime = Math.min(lastKnownCurrentTime + offset, lastKnownDuration || 9999);
      lastKnownCurrentTime = targetTime;
      sendYouTubeIframeCommand('seekTo', [targetTime, true]);
      updateMediaSessionPosition(targetTime, lastKnownDuration);
    });

    // Seek Backward 10s
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const offset = details.seekOffset || 10;
      const targetTime = Math.max(lastKnownCurrentTime - offset, 0);
      lastKnownCurrentTime = targetTime;
      sendYouTubeIframeCommand('seekTo', [targetTime, true]);
      updateMediaSessionPosition(targetTime, lastKnownDuration);
    });

    // Stop handler
    navigator.mediaSession.setActionHandler('stop', () => {
      stopBackgroundAudioSession();
      sendYouTubeIframeCommand('pauseVideo');
      if (onLockScreenPause) onLockScreenPause();
    });
  } catch (err) {
    console.debug('[BackgroundAudio] MediaSession setup notice:', err);
  }
}

/**
 * Updates MediaSession progress bar on lock screen
 */
export function updateMediaSessionPosition(currentTime: number, duration: number) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  if (typeof currentTime === 'number' && currentTime >= 0) {
    lastKnownCurrentTime = currentTime;
  }
  if (typeof duration === 'number' && duration > 0) {
    lastKnownDuration = duration;
  }

  try {
    if (
      'setPositionState' in navigator.mediaSession &&
      typeof navigator.mediaSession.setPositionState === 'function' &&
      lastKnownDuration > 0
    ) {
      navigator.mediaSession.setPositionState({
        duration: Math.max(lastKnownDuration, 1),
        playbackRate: 1,
        position: Math.min(Math.max(lastKnownCurrentTime, 0), lastKnownDuration),
      });
    }
  } catch (_) {
    // Non-fatal if browser rejects rapid position changes
  }
}

/**
 * Updates current playback state in MediaSession
 */
export function setMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try {
      navigator.mediaSession.playbackState = state;
    } catch (_) {}
  }
}

/**
 * Setup global visibilitychange listener:
 * When the phone screen is locked or the user leaves the tab,
 * we keep the YouTube playback active and ensure seamless continuation.
 * When unlocked, the video resumes without resetting.
 */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isSessionActive) {
      // Screen locked / App moved to background:
      // Resend play commands at staggered intervals to counteract browser auto-pause
      [30, 100, 250, 600, 1200, 2200].forEach((ms) => {
        setTimeout(() => {
          if (isSessionActive) {
            sendYouTubeIframeCommand('playVideo');
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume().catch(() => {});
            }
            if (persistentAudioTag && persistentAudioTag.paused) {
              persistentAudioTag.play().catch(() => {});
            }
          }
        }, ms);
      });
    } else if (!document.hidden && isSessionActive) {
      // Screen unlocked / App brought back to foreground:
      // Smoothly ensure video canvas is playing without resetting time!
      [40, 180, 450].forEach((ms) => {
        setTimeout(() => {
          if (isSessionActive) {
            sendYouTubeIframeCommand('playVideo');
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume().catch(() => {});
            }
          }
        }, ms);
      });
    }
  });

  // Additional resilience for mobile browsers on blur/pagehide
  window.addEventListener('pagehide', () => {
    if (isSessionActive) {
      sendYouTubeIframeCommand('playVideo');
    }
  });
}
