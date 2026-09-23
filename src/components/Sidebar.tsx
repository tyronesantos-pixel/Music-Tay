import React from 'react';
import {
  Home,
  Zap,
  Youtube,
  Heart,
  History,
  Plus,
  Layers,
  Cloud,
  Tv,
  Smartphone,
} from 'lucide-react';
import { useVideoLibrary } from '../context/VideoLibraryContext';
import { YouTubeViewMode } from '../services/youtubeService';

interface SidebarProps {
  onCreateCollectionModal: () => void;
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  onOpenPlayStoreModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCreateCollectionModal,
  onOpenAddModal,
  onOpenSyncModal,
  onOpenPlayStoreModal,
}) => {
  const {
    currentView,
    setCurrentView,
    collections,
    openCollection,
    activeCollectionId,
    videos,
    isCloudConnected,
  } = useVideoLibrary();

  const navItems: Array<{ id: YouTubeViewMode; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'home', label: 'Início', icon: <Home className="w-4 h-4" /> },
    {
      id: 'watch',
      label: 'Player Cinema',
      icon: <Tv className="w-4 h-4 text-[#1DB954]" />,
    },
    {
      id: 'manage',
      label: 'Biblioteca',
      icon: <Layers className="w-4 h-4 text-zinc-300" />,
      badge: videos.length,
    },
    { id: 'liked', label: 'Curtidos', icon: <Heart className="w-4 h-4 text-[#1DB954]" /> },
    { id: 'history', label: 'Histórico', icon: <History className="w-4 h-4 text-zinc-400" /> },
  ];

  return (
    <aside className="w-60 bg-[#121212] border-r border-white/5 hidden md:flex flex-col justify-between shrink-0 select-none overflow-y-auto custom-scrollbar">
      <div className="p-3 flex flex-col gap-5">
        {/* Navigation Menu */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Menu Principal
          </div>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#282828] text-[#1DB954] font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-[#1DB954] text-black' : 'bg-[#282828] text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Playlists */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>Playlists</span>
            <button
              onClick={onCreateCollectionModal}
              className="p-1 hover:text-[#1DB954] rounded hover:bg-[#181818] transition-colors"
              title="Nova Playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {collections.map((col) => {
              const isColActive = currentView === 'collection' && activeCollectionId === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => openCollection(col.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                    isColActive
                      ? 'bg-[#282828] text-[#1DB954] font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-[#181818]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                    <span className="truncate">{col.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{col.videoIds.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Cloud Database Indicator & Play Store button */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-2">
        {onOpenPlayStoreModal && (
          <button
            onClick={onOpenPlayStoreModal}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-zinc-900 border border-[#1DB954]/30 hover:border-[#1DB954] text-xs font-semibold text-white flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#1DB954] group-hover:scale-110 transition-transform" />
              <span>Instalar / Play Store</span>
            </div>
            <span className="text-[10px] bg-[#1DB954] text-black font-extrabold px-1.5 py-0.5 rounded-full">
              APK
            </span>
          </button>
        )}

        <div className="bg-[#181818] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#1DB954] font-semibold text-xs">
              <Cloud className="w-3.5 h-3.5" />
              <span>Banco em Nuvem</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">{videos.length} links</span>
          </div>

          <button
            onClick={onOpenAddModal}
            className="w-full py-2 px-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold shadow-md shadow-[#1DB954]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Adicionar Link</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
