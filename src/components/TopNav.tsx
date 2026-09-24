import React from 'react';
import {
  Search,
  Plus,
  Layers,
  X,
  Smartphone,
  ChevronDown,
  Cloud,
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useVideoLibrary } from '../context/VideoLibraryContext';
import { useAuth } from '../context/AuthContext';
import { PlayerLogo } from './common/PlayerLogo';

interface TopNavProps {
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  onOpenPlaylistsModal?: () => void;
  onOpenGuideModal?: () => void;
  onOpenPlayStoreModal?: () => void;
  onOpenAdminModal?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenAddModal,
  onOpenSyncModal,
  onOpenPlaylistsModal,
  onOpenGuideModal,
  onOpenPlayStoreModal,
  onOpenAdminModal,
}) => {
  const {
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    videos,
    collections,
    categoryFilter,
    setCategoryFilter,
  } = useVideoLibrary();

  const { user, logout, isAdmin } = useAuth();

  const filterCategories: Array<{
    label: string;
    cat: 'videoclipe' | 'musicas' | 'games' | 'all';
  }> = [
    { label: '🎬 Videoclip', cat: 'videoclipe' },
    { label: '🎵 Música', cat: 'musicas' },
    { label: '🎮 Game', cat: 'games' },
    { label: '🌌 Misto', cat: 'all' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#121018]/95 backdrop-blur-xl border-b border-white/10 px-3.5 sm:px-6 py-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {/* Brand: Player do Tyrone with custom Audio-Prism logo */}
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <PlayerLogo size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-violet-300 transition-colors">
                Player do{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
                  Tyrone
                </span>
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[9px] font-bold border border-violet-500/30 hidden sm:inline-flex items-center gap-1">
                <Cloud className="w-3 h-3 text-cyan-400" />
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
              placeholder="Buscar vídeos, clipes, músicas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'home' && currentView !== 'shorts') {
                  setCurrentView('home');
                }
              }}
              className="w-full bg-[#1b1825] hover:bg-[#221f2f] focus:bg-[#242132] border border-white/10 focus:border-violet-500 rounded-full pl-8.5 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Playlists Dropdown Trigger (Desktop / Tablet) */}
          {onOpenPlaylistsModal && (
            <button
              onClick={onOpenPlaylistsModal}
              className="hidden sm:flex px-3 py-1.5 rounded-full bg-[#1f1b2b] hover:bg-[#282337] text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir lista de Playlists"
            >
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>Playlists</span>
              <span className="text-[10px] text-cyan-300 font-bold">({collections.length})</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          )}

          {/* App / Play Store Button (Desktop / Tablet) */}
          {onOpenPlayStoreModal && (
            <button
              onClick={onOpenPlayStoreModal}
              className="hidden md:flex px-2.5 py-1.5 rounded-full bg-[#1f1b2b] hover:bg-[#282337] text-zinc-200 hover:text-cyan-300 border border-white/10 text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
              title="Instalar no Celular ou Baixar para Play Store"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">App / Loja</span>
            </button>
          )}

          {/* Background play guide */}
          {onOpenGuideModal && (
            <button
              onClick={onOpenGuideModal}
              className="p-1.5 rounded-full bg-[#1f1b2b] hover:bg-[#282337] text-zinc-400 hover:text-violet-300 border border-white/10 transition-colors hidden md:flex items-center justify-center cursor-pointer"
              title="Dicas para ouvir com celular bloqueado"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Manage Library Button (Desktop / Tablet) */}
          <button
            onClick={() => setCurrentView('manage')}
            className={`hidden sm:flex px-3 py-1.5 rounded-full text-xs font-semibold transition-all items-center gap-1.5 cursor-pointer ${
              currentView === 'manage'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                : 'bg-[#1f1b2b] hover:bg-[#282337] text-zinc-200 hover:text-white border border-white/10'
            }`}
            title="Gerenciar Biblioteca"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gerenciar</span>
            <span className="text-[10px] opacity-75">({videos.length})</span>
          </button>

          {/* Add YouTube Link Button (Desktop / Tablet) */}
          <button
            onClick={onOpenAddModal}
            className="hidden sm:flex px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-violet-600/25 transition-all items-center gap-1.5 cursor-pointer transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Adicionar</span>
          </button>

          {/* Admin Management Button (ONLY VISIBLE WHEN LOGGED IN AS ADMIN) */}
          {isAdmin && onOpenAdminModal && (
            <button
              onClick={onOpenAdminModal}
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-violet-600/30 hover:from-amber-500/30 hover:to-violet-600/40 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 cursor-pointer active:scale-95"
              title="Painel Administrativo: Liberar Usuários e Senhas"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-1 sm:gap-1.5 pl-1 border-l border-white/10">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white text-[11px] sm:text-xs font-extrabold flex items-center justify-center shadow-sm cursor-default shrink-0 ${
                  isAdmin
                    ? 'bg-gradient-to-br from-amber-500 to-violet-600 ring-2 ring-amber-400/50'
                    : 'bg-gradient-to-br from-violet-600 to-cyan-500'
                }`}
                title={`Logado como: ${user.name} (${user.email}) ${isAdmin ? '★ Administrador' : ''}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                title="Sair da Conta"
                className="p-1 sm:p-1.5 rounded-full bg-[#1f1b2b] hover:bg-rose-950/50 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold shadow-md shadow-violet-600/20'
                    : 'bg-[#1f1b2b] text-zinc-300 hover:text-white hover:bg-[#282337]'
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
