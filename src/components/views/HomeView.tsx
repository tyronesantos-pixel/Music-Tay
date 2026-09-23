import React from 'react';
import { Plus, Layers, Cloud, Youtube, Music, Film, Gamepad2 } from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { VideoCard } from '../common/VideoCard';

interface HomeViewProps {
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  onOpenCollectionModal: (videoId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenAddModal,
  onOpenSyncModal,
  onOpenCollectionModal,
}) => {
  const {
    videos,
    searchQuery,
    selectedTag,
    setSelectedTag,
    categoryFilter,
    setCategoryFilter,
    setCurrentView,
    isCloudConnected,
  } = useVideoLibrary();
  const { playVideo } = useVideoPlayer();

  const categories: Array<{
    id: 'all' | 'musicas' | 'videoclipe' | 'games';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'all', label: 'Todos', icon: null },
    { id: 'videoclipe', label: 'Videoclipes', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'musicas', label: 'Músicas', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
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
          tagsLower.some((t) => t.includes('clipe') || t.includes('clip') || t.includes('video clipe')) ||
          titleLower.includes('clipe') ||
          titleLower.includes('clip') ||
          titleLower.includes('official video') ||
          titleLower.includes('vídeo oficial');
        if (!isVideoclipe) return false;
      } else if (categoryFilter === 'musicas') {
        const isMusica =
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

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full">
        {/* Spotify Green Icon */}
        <div className="w-20 h-20 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] mb-5 shadow-2xl shadow-[#1DB954]/20 animate-in zoom-in-95 duration-200">
          <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Player do <span className="text-[#1DB954]">Tyrone</span>
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
          Sua biblioteca está conectada à nuvem em tempo real. Adicione links de <strong>Videoclipes</strong>, <strong>Músicas</strong> ou <strong>Games</strong>.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <button
            onClick={onOpenAddModal}
            className="w-full py-3 px-5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-[#1DB954]/25 transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Link do YouTube</span>
          </button>

          <button
            onClick={() => setCurrentView('manage')}
            className="w-full py-2.5 px-4 rounded-full bg-[#242424] hover:bg-[#2a2a2a] text-zinc-300 hover:text-white font-semibold text-xs border border-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Gerenciar Biblioteca</span>
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-[11px] text-zinc-400 bg-[#181818] px-3.5 py-1.5 rounded-full border border-white/5">
          <Cloud className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>Banco em Nuvem Conectado em Tempo Real</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 flex flex-col gap-5 max-w-6xl mx-auto w-full pb-20 sm:pb-6">
      {/* Category Pills Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Clean Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/25'
                    : 'bg-[#242424] hover:bg-[#2a2a2a] text-zinc-300 hover:text-white border border-white/5'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter and Library Link */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-zinc-400">
          <span>{filteredVideos.length} vídeo(s)</span>
          <button
            onClick={() => setCurrentView('manage')}
            className="text-xs font-semibold text-[#1DB954] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Biblioteca</span>
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <section className="flex flex-col gap-3">
        {filteredVideos.length === 0 ? (
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <Youtube className="w-10 h-10 text-zinc-600 mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">Nenhum vídeo nesta categoria</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Adicione links com a tag desta categoria ou troque de filtro.
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all cursor-pointer"
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
