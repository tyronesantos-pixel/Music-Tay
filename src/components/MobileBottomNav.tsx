import React from 'react';
import { Home, Zap, Plus, Layers, Tv, ShieldCheck, History } from 'lucide-react';
import { useVideoLibrary } from '../context/VideoLibraryContext';
import { useAuth } from '../context/AuthContext';
import { YouTubeViewMode } from '../services/youtubeService';

interface MobileBottomNavProps {
  onOpenAddModal: () => void;
  onOpenPlaylistsModal?: () => void;
  onOpenAdminModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenAddModal,
  onOpenPlaylistsModal,
  onOpenAdminModal,
}) => {
  const { currentView, setCurrentView, videos, collections, openCollection } = useVideoLibrary();
  const { isAdmin } = useAuth();

  const navItems: Array<{
    id: YouTubeViewMode;
    label: string;
    icon: React.ReactNode;
    isAction?: boolean;
    badge?: number;
    onClick?: () => void;
  }> = [
    {
      id: 'home',
      label: 'Início',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'collection',
      label: 'Playlists',
      icon: <Layers className="w-5 h-5" />,
      badge: collections.length,
      onClick: () => {
        if (onOpenPlaylistsModal) {
          onOpenPlaylistsModal();
        } else if (collections.length > 0) {
          openCollection(collections[0].id);
        } else {
          setCurrentView('manage');
        }
      },
    },
    {
      id: 'home', // placeholder id since it's an action
      label: 'Adicionar',
      icon: <Plus className="w-6 h-6 text-black" />,
      isAction: true,
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'manage',
      label: 'Biblioteca',
      icon: <Layers className="w-5 h-5" />,
      badge: videos.length,
    },
  ];

  // If user is Admin, add Admin panel button to mobile bar
  if (isAdmin && onOpenAdminModal) {
    navItems.push({
      id: 'admin',
      label: 'Admin',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      onClick: onOpenAdminModal,
    });
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#121018]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] flex items-center justify-around select-none shadow-2xl">
      {navItems.map((item, index) => {
        if (item.isAction) {
          return (
            <button
              key={index}
              onClick={onOpenAddModal}
              className="flex flex-col items-center justify-center -mt-5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 transition-transform transform active:scale-95 group-hover:scale-105">
                {item.icon}
              </div>
              <span className="text-[10px] font-semibold text-zinc-300 mt-1">Adicionar</span>
            </button>
          );
        }

        const isActive = currentView === item.id;

        return (
          <button
            key={index}
            onClick={() => (item.onClick ? item.onClick() : setCurrentView(item.id))}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all cursor-pointer touch-manipulation active:scale-95 ${
              isActive ? 'text-violet-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-violet-600 text-white text-[9px] font-extrabold min-w-4 text-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 transition-all ${
                isActive ? 'font-bold text-white' : 'font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
