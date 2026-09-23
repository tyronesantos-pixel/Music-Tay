export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  channelTitle: string;
  channelUrl: string;
  thumbnailUrl: string;
  isShort: boolean;
  playlistId?: string;
}

export interface YouTubeVideo {
  id: string; // YouTube Video ID (e.g., "jfKfPfyJRdk")
  youtubeUrl: string;
  title: string;
  description?: string;
  channelTitle: string;
  channelUrl?: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  isShort: boolean;
  playlistId?: string;
  tags: string[];
  addedAt: string;
  lastSyncedAt: string;
  views: number;
  likes: number;
  status: 'active' | 'unavailable';
  notes?: string;
}

export interface YouTubeCollection {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeChannelItem {
  id: string;
  handle: string;
  name: string;
  channelUrl: string;
  videoCount: number;
  lastSyncedAt: string;
}

export type YouTubeViewMode =
  | 'home'
  | 'watch'
  | 'shorts'
  | 'library'
  | 'collections'
  | 'collection'
  | 'liked'
  | 'history'
  | 'manage';

/**
 * Extracts YouTube video ID, short status, playlist ID, or channel from URL or input string
 */
export function parseYouTubeUrl(input: string): {
  videoId: string | null;
  playlistId: string | null;
  channelHandle: string | null;
  isShort: boolean;
  normalizedUrl: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { videoId: null, playlistId: null, channelHandle: null, isShort: false, normalizedUrl: '' };
  }

  // Check if it's already a direct 11-char YouTube ID (e.g., "dQw4w9WgXcQ")
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return {
      videoId: trimmed,
      playlistId: null,
      channelHandle: null,
      isShort: false,
      normalizedUrl: `https://www.youtube.com/watch?v=${trimmed}`,
    };
  }

  try {
    let urlString = trimmed;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }

    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();

    // Check for YouTube Shorts: youtube.com/shorts/VIDEO_ID
    if (url.pathname.includes('/shorts/')) {
      const parts = url.pathname.split('/shorts/');
      const videoId = parts[1]?.split(/[^a-zA-Z0-9_-]/)[0];
      if (videoId && videoId.length >= 10) {
        return {
          videoId,
          playlistId: null,
          channelHandle: null,
          isShort: true,
          normalizedUrl: `https://www.youtube.com/shorts/${videoId}`,
        };
      }
    }

    // Check for youtu.be/VIDEO_ID
    if (host.includes('youtu.be')) {
      const videoId = url.pathname.slice(1).split(/[^a-zA-Z0-9_-]/)[0];
      const playlistId = url.searchParams.get('list');
      if (videoId && videoId.length >= 10) {
        return {
          videoId,
          playlistId,
          channelHandle: null,
          isShort: false,
          normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }
    }

    // Check for youtube.com/watch?v=VIDEO_ID
    if (host.includes('youtube.com')) {
      const videoId = url.searchParams.get('v');
      const playlistId = url.searchParams.get('list');

      // YouTube Channel @handle
      if (url.pathname.startsWith('/@')) {
        const handle = url.pathname.split('/')[1];
        return {
          videoId: null,
          playlistId: null,
          channelHandle: handle,
          isShort: false,
          normalizedUrl: `https://www.youtube.com/${handle}`,
        };
      }

      // YouTube Playlist alone
      if (!videoId && playlistId) {
        return {
          videoId: null,
          playlistId,
          channelHandle: null,
          isShort: false,
          normalizedUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
        };
      }

      if (videoId) {
        return {
          videoId,
          playlistId,
          channelHandle: null,
          isShort: false,
          normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }

      // Embed url: /embed/VIDEO_ID
      if (url.pathname.startsWith('/embed/')) {
        const videoId = url.pathname.split('/embed/')[1]?.split('?')[0];
        if (videoId) {
          return {
            videoId,
            playlistId,
            channelHandle: null,
            isShort: false,
            normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error parsing YouTube URL:', err);
  }

  // Fallback regex search for 11 chars
  const fallbackMatch = trimmed.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/);
  if (fallbackMatch && fallbackMatch[1]) {
    const isShort = trimmed.includes('shorts');
    return {
      videoId: fallbackMatch[1],
      playlistId: null,
      channelHandle: null,
      isShort,
      normalizedUrl: isShort
        ? `https://www.youtube.com/shorts/${fallbackMatch[1]}`
        : `https://www.youtube.com/watch?v=${fallbackMatch[1]}`,
    };
  }

  return { videoId: null, playlistId: null, channelHandle: null, isShort: false, normalizedUrl: trimmed };
}

/**
 * Gets high-resolution thumbnail URL for YouTube video ID
 */
export function getYouTubeThumbnail(videoId: string, quality: 'maxres' | 'hq' | 'mq' = 'maxres'): string {
  if (quality === 'maxres') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (quality === 'hq') {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Fetches real-time YouTube metadata via oEmbed
 */
export async function fetchYouTubeMetadata(videoId: string, isShort = false): Promise<YouTubeVideoInfo> {
  const videoUrl = isShort
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;

  let title = 'Vídeo do YouTube';
  let channelTitle = 'Canal do YouTube';
  let channelUrl = 'https://www.youtube.com';
  let thumbnailUrl = getYouTubeThumbnail(videoId, 'hq');

  try {
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });

    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        title = data.title;
        channelTitle = data.author_name || channelTitle;
        channelUrl = data.author_url || channelUrl;
        if (data.thumbnail_url) {
          thumbnailUrl = data.thumbnail_url;
        }
      }
    } else {
      const ytRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (ytRes.ok) {
        const data = await ytRes.json();
        title = data.title || title;
        channelTitle = data.author_name || channelTitle;
        channelUrl = data.author_url || channelUrl;
        if (data.thumbnail_url) {
          thumbnailUrl = data.thumbnail_url;
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch oEmbed metadata for YouTube video, using default thumbnails:', err);
  }

  if (!thumbnailUrl || thumbnailUrl.includes('default.jpg')) {
    thumbnailUrl = getYouTubeThumbnail(videoId, 'hq');
  }

  return {
    videoId,
    title,
    channelTitle,
    channelUrl,
    thumbnailUrl,
    isShort,
  };
}

/**
 * Automatically synchronizes a video with live YouTube data
 */
export async function syncSingleYouTubeVideo(video: YouTubeVideo): Promise<YouTubeVideo> {
  try {
    const meta = await fetchYouTubeMetadata(video.id, video.isShort);
    return {
      ...video,
      title: meta.title || video.title,
      channelTitle: meta.channelTitle || video.channelTitle,
      channelUrl: meta.channelUrl || video.channelUrl,
      thumbnailUrl: meta.thumbnailUrl || video.thumbnailUrl,
      lastSyncedAt: new Date().toISOString(),
      status: 'active',
    };
  } catch (e) {
    console.warn(`Failed syncing video ${video.id}:`, e);
    return {
      ...video,
      lastSyncedAt: new Date().toISOString(),
    };
  }
}

/**
 * Formats duration in seconds
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return 'YouTube';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Zero demo videos - library starts clean as requested by user
 */
export const INITIAL_YOUTUBE_VIDEOS: YouTubeVideo[] = [];
