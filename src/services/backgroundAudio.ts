/**
 * Background Audio & Media Session Service
 * 
 * Maximizes background and lock-screen playback across mobile browsers (Android Chrome & iOS Safari):
 * 1. Web Audio API continuous sub-audible stream to maintain active audio session with the OS
 * 2. Real MediaSession API integration for lock-screen controls (Play, Pause, Next, Previous)
 * 3. YouTube iframe postMessage control to resume playback on lock-screen actions
 * 4. VisibilityChange handler to counteract automatic iframe pause when screen locks
 */

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let silentAudioTag: HTMLAudioElement | null = null;
let isSessionActive = false;

// Callbacks for lock screen controls
let onLockScreenPlay: (() => void) | null = null;
let onLockScreenPause: (() => void) | null = null;
let onLockScreenNext: (() => void) | null = null;
let onLockScreenPrev: (() => void) | null = null;

/**
 * Initializes the Web Audio API sub-audible stream to retain OS media focus
 */
function initWebAudioSession() {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    if (!oscillator) {
      // 20Hz inaudible sine wave (keeps hardware audio pipeline active)
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(20, audioContext.currentTime);

      // Inaudible volume (0.001) so it doesn't interfere with YouTube audio
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      try {
        oscillator.start();
      } catch {
        // Already started
      }
    }
  } catch (err) {
    console.debug('WebAudio init error (non-fatal):', err);
  }
}

/**
 * Direct postMessage helper to send commands to all YouTube iframes on page
 */
export function sendYouTubeIframeCommand(command: 'playVideo' | 'pauseVideo') {
  if (typeof document === 'undefined') return;
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: command, args: '' }),
          '*'
        );
      }
    } catch {
      // Cross-origin restriction fallback
    }
  });
}

/**
 * Starts continuous background session and claims system lock-screen focus
 */
export function startBackgroundAudioSession() {
  isSessionActive = true;
  initWebAudioSession();

  // Also setup HTML5 Audio tag fallback
  if (!silentAudioTag && typeof window !== 'undefined') {
    // 3-second continuous silent PCM wav
    const SILENT_WAV_BASE64 =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    silentAudioTag = new Audio(SILENT_WAV_BASE64);
    silentAudioTag.loop = true;
    silentAudioTag.volume = 0.01;
  }

  if (silentAudioTag) {
    silentAudioTag.play().catch(() => {});
  }

  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'playing';
  }
}

/**
 * Pauses background session
 */
export function stopBackgroundAudioSession() {
  isSessionActive = false;

  if (audioContext && audioContext.state === 'running') {
    audioContext.suspend().catch(() => {});
  }

  if (silentAudioTag) {
    silentAudioTag.pause();
  }

  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'paused';
  }
}

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
}

/**
 * Updates Media Session metadata on lock screen and registers media keys
 */
export function updateMediaSession(track: MediaSessionTrack, handlers?: MediaSessionHandlers) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Player do Tyrone',
      artwork: track.artworkUrl
        ? [
            { src: track.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });

    navigator.mediaSession.playbackState = 'playing';

    if (handlers?.onPlay) onLockScreenPlay = handlers.onPlay;
    if (handlers?.onPause) onLockScreenPause = handlers.onPause;
    if (handlers?.onNext) onLockScreenNext = handlers.onNext;
    if (handlers?.onPrev) onLockScreenPrev = handlers.onPrev;

    // Register lock-screen / headphone Play handler
    navigator.mediaSession.setActionHandler('play', () => {
      startBackgroundAudioSession();
      sendYouTubeIframeCommand('playVideo');
      if (onLockScreenPlay) onLockScreenPlay();
    });

    // Register lock-screen / headphone Pause handler
    navigator.mediaSession.setActionHandler('pause', () => {
      stopBackgroundAudioSession();
      sendYouTubeIframeCommand('pauseVideo');
      if (onLockScreenPause) onLockScreenPause();
    });

    // Next track handler
    if (handlers?.onNext) {
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (onLockScreenNext) onLockScreenNext();
      });
    }

    // Previous track handler
    if (handlers?.onPrev) {
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (onLockScreenPrev) onLockScreenPrev();
      });
    }

    // Seek handlers (prevents OS from closing notification)
    navigator.mediaSession.setActionHandler('seekto', () => {});
    navigator.mediaSession.setActionHandler('seekforward', () => {});
    navigator.mediaSession.setActionHandler('seekbackward', () => {});
  } catch (err) {
    console.debug('MediaSession config warning:', err);
  }
}

/**
 * Setup global visibilitychange listener so when the phone screen is locked or unlocked,
 * we keep the YouTube playback active and seamless.
 */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isSessionActive) {
      // Screen locked / app hidden: re-trigger play command with staggered timings to counter auto-pause
      [80, 250, 600, 1200].forEach((ms) => {
        setTimeout(() => {
          if (isSessionActive) {
            sendYouTubeIframeCommand('playVideo');
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume().catch(() => {});
            }
          }
        }, ms);
      });
    } else if (!document.hidden && isSessionActive) {
      // Screen unlocked / app restored: ensure video continues seamlessly from the same spot!
      [50, 200].forEach((ms) => {
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
}

