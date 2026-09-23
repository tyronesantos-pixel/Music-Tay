import React from 'react';
import { Search, Plus, Cloud, Layers, X, ChevronDown, Smartphone } from 'lucide-react';
import { useVideoLibrary } from '../context/VideoLibraryContext';

interface TopNavProps {
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  onOpenPlaylistsModal?: () => void;
  onOpenGuideModal?: () => void;
  onOpenPlayStoreModal?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenAddModal,
  onOpenSyncModal,
  onOpenPlaylistsModal,
  onOpenGuideModal,
  onOpenPlayStoreModal,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    setCurrentView,
    currentView,
    isCloudConnected,
    videos,
    collections,
  } = useVideoLibrary();

  const filterCategories: Array<{
    label: string;
    cat: 'all' | 'musicas' | 'videoclipe' | 'games';
  }> = [
    { label: 'Todos', cat: 'all' },
    { label: '🎬 Videoclipe', cat: 'videoclipe' },
    { label: '🎵 Músicas', cat: 'musicas' },
    { label: '🎮 Games', cat: 'games' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-white/10 px-3.5 sm:px-6 py-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {/* Brand: Player do Tyrone */}
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          {/* Spotify styled green icon */}
          <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-extrabold shadow-md shadow-[#1DB954]/30 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-[#1DB954] transition-colors">
                Player do <span className="text-[#1DB954]">Tyrone</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-[9px] font-bold border border-[#1DB954]/30 hidden sm:inline-flex items-center gap-1">
                <Cloud className="w-3 h-3 text-[#1DB954]" />
                Nuvem Ativa
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-1 sm:mx-3">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar vídeos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'home' && currentView !== 'shorts') {
                  setCurrentView('home');
                }
              }}
              className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#282828] border border-white/5 focus:border-[#1DB954] rounded-full pl-8.5 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Playlists Dropdown Trigger */}
          {onOpenPlaylistsModal && (
            <button
              onClick={onOpenPlaylistsModal}
              className="px-3 py-1.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 hover:text-white border border-white/5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir lista de Playlists"
            >
              <Layers className="w-3.5 h-3.5 text-[#1DB954]" />
              <span className="hidden sm:inline">Playlists</span>
              <span className="text-[10px] text-[#1DB954] font-bold">({collections.length})</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          )}

          {/* App / Play Store Button */}
          {onOpenPlayStoreModal && (
            <button
              onClick={onOpenPlayStoreModal}
              className="px-2.5 py-1.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 hover:text-[#1DB954] border border-white/5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Instalar no Celular ou Baixar para Play Store"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#1DB954]" />
              <span className="hidden lg:inline">App / Loja</span>
            </button>
          )}

          {/* Background play guide */}
          {onOpenGuideModal && (
            <button
              onClick={onOpenGuideModal}
              className="p-1.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-zinc-400 hover:text-[#1DB954] border border-white/5 transition-colors hidden md:flex items-center justify-center"
              title="Dicas para ouvir com celular bloqueado"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Manage Library Button */}
          <button
            onClick={() => setCurrentView('manage')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'manage'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2a2a2a] text-zinc-300 hover:text-white border border-white/5'
            }`}
            title="Gerenciar Biblioteca"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gerenciar</span>
            <span className="text-[10px] opacity-75">({videos.length})</span>
          </button>

          {/* Add YouTube Link Button */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold shadow-md shadow-[#1DB954]/20 transition-all flex items-center gap-1.5 cursor-pointer transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Filter Categories Bar */}
      {videos.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {filterCategories.map((item) => {
            const isSelected = categoryFilter === item.cat;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setCategoryFilter(item.cat);
                  if (currentView !== 'home') {
                    setCurrentView('home');
                  }
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-[#242424] text-zinc-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
