import React, { useState } from 'react';
import { Play, Heart, FolderPlus, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { YouTubeVideo, formatDuration } from '../../services/youtubeService';
import { useVideoPlayer, PlaylistContextInfo } from '../../context/VideoPlayerContext';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface VideoCardProps {
  video: YouTubeVideo;
  queueContext?: YouTubeVideo[];
  playlistContext?: PlaylistContextInfo | null;
  onOpenCollectionModal?: (videoId: string) => void;
  showDelete?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  queueContext,
  playlistContext,
  onOpenCollectionModal,
  showDelete = true,
}) => {
  const { currentVideo, isPlaying, playVideo, likedVideoIds, toggleLike } = useVideoPlayer();
  const { openVideoView, deleteVideo, syncVideoById } = useVideoLibrary();
  const [isHovered, setIsHovered] = useState(false);
  const [isSyncingThis, setIsSyncingThis] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isCurrent = currentVideo?.id === video.id;
  const isLiked = likedVideoIds.has(video.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playVideo(video, queueContext, playlistContext);
    openVideoView(video);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(video.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    await deleteVideo(video.id);
  };

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncingThis(true);
    await syncVideoById(video.id);
    setIsSyncingThis(false);
  };

  return (
    <>
      <div
        onClick={handlePlayClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col bg-[#181622] hover:bg-[#221e30] p-3 rounded-2xl overflow-hidden border border-white/5 hover:border-violet-500/30 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Playing indicator */}
          {isCurrent && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500 text-black font-extrabold text-[10px] shadow-lg animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span>{isPlaying ? 'TOCANDO' : 'PAUSADO'}</span>
            </div>
          )}

          {/* Short badge */}
          {video.isShort && (
            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[9px] uppercase shadow-md">
              Short
            </div>
          )}

          {/* Duration */}
          {video.duration > 0 && !video.isShort && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white backdrop-blur-sm">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Center Play Button on hover */}
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-violet-600/40 transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Quick Overlay Action Bar - visible on mobile touch and on desktop hover */}
          <div
            className={`absolute bottom-2 left-2 flex items-center gap-1 transition-opacity duration-200 opacity-90 sm:opacity-0 ${
              isHovered ? 'sm:opacity-100' : ''
            }`}
          >
            {/* Like */}
            <button
              onClick={handleLikeClick}
              title={isLiked ? 'Remover dos favoritos' : 'Curtir'}
              className={`p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer active:scale-90 ${
                isLiked
                  ? 'bg-rose-600 text-white'
                  : 'bg-black/75 hover:bg-black text-zinc-300 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Add to playlist */}
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

            {/* Sync live metadata from YouTube */}
            <button
              onClick={handleSyncClick}
              title="Atualizar título e imagem do YouTube"
              className="p-1.5 rounded-full bg-black/75 hover:bg-black text-zinc-300 hover:text-cyan-400 backdrop-blur-md transition-colors cursor-pointer active:scale-90"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Delete button with guaranteed custom modal confirmation */}
            {showDelete && (
              <button
                onClick={handleDeleteClick}
                title="Excluir Vídeo da Biblioteca"
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

          {/* Tags & Quick Actions */}
          <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
            <div className="flex items-center gap-1 truncate">
              {video.tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {/* Quick direct delete button */}
              {showDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Excluir Vídeo da Biblioteca"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                title="Abrir no YouTube"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Guaranteed In-App Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Vídeo"
        message={`Tem certeza que deseja remover "${video.title}" da sua biblioteca? Esta alteração será sincronizada na sua nuvem.`}
        confirmLabel="Sim, Excluir"
      />
    </>
  );
};
