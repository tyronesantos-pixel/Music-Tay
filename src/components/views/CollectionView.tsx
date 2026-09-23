import React, { useState } from 'react';
import {
  Layers,
  Trash2,
  Play,
  Music,
  Plus,
  Edit3,
  Film,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { VideoCard } from '../common/VideoCard';
import { AddSongsToPlaylistModal } from '../modals/AddSongsToPlaylistModal';
import { EditCollectionModal } from '../modals/EditCollectionModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface CollectionViewProps {
  onOpenCollectionModal: (videoId: string) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({ onOpenCollectionModal }) => {
  const { collections, activeCollectionId, videos, deleteCollection, removeVideoFromCollection } =
    useVideoLibrary();
  const { playVideo } = useVideoPlayer();
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

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

  const getCategoryInfo = (cat?: string) => {
    switch (cat) {
      case 'videoclipe':
        return {
          label: 'Videoclipe',
          icon: <Film className="w-3.5 h-3.5 text-cyan-400" />,
          color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'musicas':
        return {
          label: 'Músicas',
          icon: <Music className="w-3.5 h-3.5 text-violet-400" />,
          color: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
        };
      case 'games':
        return {
          label: 'Games',
          icon: <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      default:
        return {
          label: 'Misto / Geral',
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
    }
  };

  const catInfo = getCategoryInfo(currentPlaylist.category);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full pb-36 sm:pb-8">
      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#16141f] border border-violet-500/20 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white border border-violet-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/25">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                Playlist
              </span>
              <span className="text-zinc-600">•</span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${catInfo.color}`}>
                {catInfo.icon}
                <span>{catInfo.label}</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-medium">
                {playlistVideos.length} vídeo(s)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
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
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          {playlistVideos.length > 0 && (
            <button
              onClick={() => playVideo(playlistVideos[0], playlistVideos)}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Reproduzir</span>
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2.5 rounded-full bg-[#221f2d] hover:bg-[#2b273a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            title="Editar nome e categoria da playlist"
          >
            <Edit3 className="w-3.5 h-3.5 text-violet-400" />
            <span>Editar Playlist</span>
          </button>

          <button
            onClick={() => setIsAddSongsModalOpen(true)}
            className="px-3.5 py-2.5 rounded-full bg-[#221f2d] hover:bg-[#2b273a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Adicionar Vídeos</span>
          </button>

          <button
            onClick={() => {
              setConfirmConfig({
                isOpen: true,
                title: 'Excluir Playlist',
                message: `Deseja realmente excluir a playlist "${currentPlaylist.name}"? Os vídeos originais continuarão salvos na sua biblioteca.`,
                action: () => deleteCollection(currentPlaylist.id),
              });
            }}
            className="p-2.5 rounded-full bg-[#221f2d] hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer border border-white/5"
            title="Excluir Playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playlist Content Grid */}
      {playlistVideos.length === 0 ? (
        <div className="bg-[#16141f] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Music className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Playlist vazia</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-5">
            Adicione vídeos e músicas que você já salvou na sua biblioteca a esta playlist para ouvi-los em sequência.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddSongsModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/25"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Vídeos da Biblioteca</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-[#221f2d] hover:bg-[#2b273a] text-zinc-300 text-xs font-semibold transition-colors cursor-pointer border border-white/10"
            >
              Editar Categoria
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {playlistVideos.map((video) => (
            <div key={video.id} className="relative group/item">
              <VideoCard
                video={video}
                queueContext={playlistVideos}
                onOpenCollectionModal={onOpenCollectionModal}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Remover da Playlist',
                    message: `Deseja remover "${video.title}" desta playlist? O vídeo continuará na sua biblioteca geral.`,
                    action: () => removeVideoFromCollection(currentPlaylist.id, video.id),
                  });
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-all z-20 cursor-pointer shadow-md"
                title="Remover desta playlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal to add songs from existing library to this playlist */}
      <AddSongsToPlaylistModal
        isOpen={isAddSongsModalOpen}
        onClose={() => setIsAddSongsModalOpen(false)}
        collection={currentPlaylist}
      />

      {/* Modal to edit playlist name, description, and category (videoclipe, musicas, games) */}
      <EditCollectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        collection={currentPlaylist}
      />

      {/* In-App Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel="Sim, Remover"
      />
    </div>
  );
};
