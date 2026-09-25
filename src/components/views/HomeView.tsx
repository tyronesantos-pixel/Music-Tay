import React from 'react';
import {
  Plus,
  Layers,
  Cloud,
  Youtube,
  Music,
  Film,
  Gamepad2,
  Sparkles,
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
    categoryFilter,
    setCategoryFilter,
    setCurrentView,
  } = useVideoLibrary();
  const { user } = useAuth();

  const categories: Array<{
    id: 'videoclipe' | 'musicas' | 'games' | 'all';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'videoclipe', label: '🎬 Videoclip', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'musicas', label: '🎵 Música', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'games', label: '🎮 Game', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'all', label: '🌌 Misto', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  // Filtered videos
  const filteredVideos = videos.filter((v) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchChannel = v.channelTitle.toLowerCase().includes(q);
      const matchTags = v.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchChannel && !matchTags) return false;
    }

    // Category filter
    if (categoryFilter !== 'all') {
      const titleLower = v.title.toLowerCase();
      const tagsLower = v.tags.map((t) => t.toLowerCase());

      if (categoryFilter === 'videoclipe') {
        const isVideoclipe =
          v.category === 'videoclipe' ||
          tagsLower.some((t) => t.includes('clipe') || t.includes('clip') || t.includes('video clipe')) ||
          titleLower.includes('clipe') ||
          titleLower.includes('clip') ||
          titleLower.includes('official video') ||
          titleLower.includes('vídeo oficial');
        if (!isVideoclipe) return false;
      } else if (categoryFilter === 'musicas') {
        const isMusica =
          v.category === 'musicas' ||
          tagsLower.some((t) => t.includes('música') || t.includes('musica') || t.includes('music') || t.includes('som')) ||
          titleLower.includes('música') ||
          titleLower.includes('musica') ||
          titleLower.includes('music') ||
          titleLower.includes('audio') ||
          titleLower.includes('álbum') ||
          titleLower.includes('album') ||
          titleLower.includes('remix') ||
          titleLower.includes('letra') ||
          titleLower.includes('lyric');
        if (!isMusica) return false;
      } else if (categoryFilter === 'games') {
        const isGame =
          v.category === 'games' ||
          tagsLower.some((t) => t.includes('game') || t.includes('gaming') || t.includes('jogos')) ||
          titleLower.includes('game') ||
          titleLower.includes('gameplay') ||
          titleLower.includes('jogando') ||
          titleLower.includes('playthrough') ||
          titleLower.includes('trailer');
        if (!isGame) return false;
      }
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
      {/* Category Pills Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Clean Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-600/25'
                    : 'bg-[#1b1825] hover:bg-[#242132] text-zinc-300 hover:text-white border border-white/5'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter and Library Link */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-zinc-400 shrink-0">
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
            <h3 className="text-sm font-bold text-white mb-1">Nenhum vídeo nesta categoria</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Adicione links com a tag desta categoria ou selecione outro filtro.
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
