import React, { useState } from 'react';
import { Play, Heart, FolderPlus, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { YouTubeVideo, formatDuration } from '../../services/youtubeService';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { useVideoLibrary } from '../../context/VideoLibraryContext';

interface VideoCardProps {
  video: YouTubeVideo;
  queueContext?: YouTubeVideo[];
  onOpenCollectionModal?: (videoId: string) => void;
  showDelete?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  queueContext,
  onOpenCollectionModal,
  showDelete = true,
}) => {
  const { currentVideo, isPlaying, playVideo, likedVideoIds, toggleLike } = useVideoPlayer();
  const { openVideoView, deleteVideo, syncVideoById } = useVideoLibrary();
  const [isHovered, setIsHovered] = useState(false);
  const [isSyncingThis, setIsSyncingThis] = useState(false);

  const isCurrent = currentVideo?.id === video.id;
  const isLiked = likedVideoIds.has(video.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playVideo(video, queueContext);
    openVideoView(video);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(video.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remover "${video.title}" da sua biblioteca?`)) {
      deleteVideo(video.id);
    }
  };

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncingThis(true);
    await syncVideoById(video.id);
    setIsSyncingThis(false);
  };

  return (
    <div
      onClick={handlePlayClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-[#181622] hover:bg-[#221e30] p-3 rounded-2xl overflow-hidden border border-white/5 hover:border-violet-500/30 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono font-medium">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Play Button floating on bottom-right of thumbnail */}
        <div
          className={`absolute bottom-2 right-2 transition-all duration-200 ${
            isHovered || (isCurrent && isPlaying)
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-90 sm:opacity-0 translate-y-0 sm:translate-y-2 scale-100 sm:scale-90'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-xl shadow-black/80 transform hover:scale-105 active:scale-95 transition-transform">
            {isCurrent && isPlaying ? (
              <span className="w-3 h-3 bg-white rounded-xs animate-pulse" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </div>
        </div>

        {/* Quick Actions (top right) - visible on mobile, hover on desktop */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {/* Add to Playlist */}
          {onOpenCollectionModal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCollectionModal(video.id);
              }}
              title="Adicionar à Playlist"
              className="p-1.5 rounded-full bg-black/75 hover:bg-black text-zinc-300 hover:text-cyan-400 backdrop-blur-md transition-colors cursor-pointer active:scale-90"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Like */}
          <button
            onClick={handleLikeClick}
            title={isLiked ? 'Descurtir' : 'Curtir'}
            className={`p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer active:scale-90 ${
              isLiked ? 'bg-rose-600 text-white shadow-sm' : 'bg-black/75 text-zinc-300 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Sync Video Data */}
          <button
            onClick={handleSyncClick}
            title="Atualizar dados deste vídeo"
            className="p-1.5 rounded-full bg-black/75 hover:bg-black text-zinc-300 hover:text-cyan-400 backdrop-blur-md transition-colors cursor-pointer active:scale-90"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Delete */}
          {showDelete && (
            <button
              onClick={handleDeleteClick}
              title="Remover Vídeo"
              className="p-1.5 rounded-full bg-black/75 hover:bg-rose-600 text-zinc-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer active:scale-90"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-2.5 flex flex-col gap-1 flex-1 justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-violet-300 transition-colors leading-snug">
            {video.title}
          </h3>
          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
            {video.channelTitle}
          </p>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1 truncate">
            {video.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>

          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir no YouTube"
            className="text-zinc-500 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
