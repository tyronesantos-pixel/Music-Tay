import React, { useState } from 'react';
import { Layers, Trash2, Play, Music, Plus, ExternalLink, X } from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { VideoCard } from '../common/VideoCard';
import { AddSongsToPlaylistModal } from '../modals/AddSongsToPlaylistModal';

interface CollectionViewProps {
  onOpenCollectionModal: (videoId: string) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({ onOpenCollectionModal }) => {
  const { collections, activeCollectionId, videos, deleteCollection, removeVideoFromCollection } =
    useVideoLibrary();
  const { playVideo } = useVideoPlayer();
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);

  const currentPlaylist = collections.find((c) => c.id === activeCollectionId) || collections[0];

  if (!currentPlaylist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Layers className="w-12 h-12 text-zinc-600 mb-2" />
        <h2 className="text-lg font-bold text-white">Playlist não encontrada</h2>
      </div>
    );
  }

  const playlistVideos = currentPlaylist.videoIds
    .map((id) => videos.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20 sm:pb-6">
      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#181818] border border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex items-center justify-center shrink-0">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#1DB954] tracking-wider">
                Playlist
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400">
                {playlistVideos.length} música(s)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {currentPlaylist.name}
            </h1>
            {currentPlaylist.description && (
              <p className="text-xs text-zinc-400 mt-1 max-w-md">
                {currentPlaylist.description}
              </p>
            )}
          </div>
        </div>

        {/* Playlist Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {playlistVideos.length > 0 && (
            <button
              onClick={() => playVideo(playlistVideos[0], playlistVideos)}
              className="px-4 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#1DB954]/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Reproduzir Playlist</span>
            </button>
          )}

          <button
            onClick={() => setIsAddSongsModalOpen(true)}
            className="px-3.5 py-2.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
          >
            <Plus className="w-4 h-4 text-[#1DB954]" />
            <span>Adicionar Músicas</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Deseja excluir a playlist "${currentPlaylist.name}"?`)) {
                deleteCollection(currentPlaylist.id);
              }
            }}
            className="p-2.5 rounded-full bg-[#242424] hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Excluir Playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playlist Content Grid */}
      {playlistVideos.length === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Music className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Playlist vazia</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-5">
            Adicione músicas que você já salvou na sua biblioteca a esta playlist para ouvi-las em sequência.
          </p>
          <button
            onClick={() => setIsAddSongsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#1DB954]/25"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Músicas da Biblioteca</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {playlistVideos.map((video) => (
            <div key={video.id} className="relative group">
              <VideoCard
                video={video}
                queueContext={playlistVideos}
                onOpenCollectionModal={onOpenCollectionModal}
                showDelete={false}
              />
              {/* Quick Remove from this Playlist button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVideoFromCollection(currentPlaylist.id, video.id);
                }}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-black/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-md"
                title="Remover desta playlist"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Songs Modal */}
      <AddSongsToPlaylistModal
        isOpen={isAddSongsModalOpen}
        onClose={() => setIsAddSongsModalOpen(false)}
        playlistId={currentPlaylist.id}
      />
    </div>
  );
};
