import React from 'react';
import {
  Plus,
  Layers,
  Cloud,
  Youtube,
  Film,
  User,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { VideoCard } from '../common/VideoCard';
import { PlayerLogo } from '../common/PlayerLogo';

interface HomeViewProps {
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  onOpenCollectionModal: (videoId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenAddModal,
  onOpenCollectionModal,
}) => {
  const {
    videos,
    searchQuery,
    selectedTag,
    setCurrentView,
  } = useVideoLibrary();
  const { user } = useAuth();

  // Filtered videos (All videos are Video Clips)
  const filteredVideos = videos.filter((v) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchChannel = v.channelTitle.toLowerCase().includes(q);
      const matchTags = v.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchChannel && !matchTags) return false;
    }

    // Tag filter
    if (selectedTag) {
      return v.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    }

    return true;
  });

  // Empty state (fresh clean space for new users)
  if (videos.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full">
        {/* Custom Audio-Prism Logo */}
        <div className="mb-5">
          <PlayerLogo size="xl" animate />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span>Espaço Privado: {user?.name || 'Usuário'}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">
          Sua biblioteca está{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
            pronta e em branco
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
          Cole links do YouTube para salvar clipes, músicas e vídeos na sua conta com sincronização em nuvem em tempo real.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <button
            onClick={onOpenAddModal}
            className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-violet-600/25 transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Link do YouTube</span>
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-[11px] text-zinc-400 bg-[#16141f] px-4 py-2 rounded-full border border-violet-500/20 shadow-md">
          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sincronização Permanente e Exclusão Segura</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col gap-4 sm:gap-5 max-w-6xl mx-auto w-full pb-36 sm:pb-8">
      {/* Clean Header: Exclusively Video Clips */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Vídeo Clips</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-bold border border-cyan-500/20">
                Oficial
              </span>
            </h1>
          </div>
        </div>

        {/* Counter and Library Link */}
        <div className="flex items-center gap-3 text-xs text-zinc-400 shrink-0">
          <span>{filteredVideos.length} vídeo(s)</span>
          <button
            onClick={() => setCurrentView('manage')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Biblioteca</span>
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <section className="flex flex-col gap-3">
        {filteredVideos.length === 0 ? (
          <div className="bg-[#16141f] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <Youtube className="w-10 h-10 text-zinc-600 mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">Nenhum clipe encontrado</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Adicione links de videoclipes do YouTube ou ajuste sua busca.
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-violet-600/25"
            >
              Adicionar Link
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                queueContext={filteredVideos}
                onOpenCollectionModal={onOpenCollectionModal}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
