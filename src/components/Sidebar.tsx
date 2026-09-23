import React from 'react';
import {
  Home,
  Compass,
  Heart,
  History,
  FolderPlus,
  Plus,
  Layers,
  Cloud,
  Smartphone,
  User,
  LogOut,
} from 'lucide-react';
import { useVideoLibrary } from '../context/VideoLibraryContext';
import { useAuth } from '../context/AuthContext';
import { PlayerLogo } from './common/PlayerLogo';

interface SidebarProps {
  onOpenAddModal: () => void;
  onCreateCollectionModal: () => void;
  onOpenPlayStoreModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAddModal,
  onCreateCollectionModal,
  onOpenPlayStoreModal,
}) => {
  const {
    currentView,
    setCurrentView,
    collections,
    openCollection,
    activeCollectionId,
    videos,
  } = useVideoLibrary();

  const { user, logout } = useAuth();

  const mainNavItems = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      action: () => setCurrentView('home'),
      active: currentView === 'home',
    },
    {
      id: 'manage',
      label: 'Biblioteca',
      icon: Layers,
      action: () => setCurrentView('manage'),
      active: currentView === 'manage',
    },
    {
      id: 'liked',
      label: 'Músicas Curtidas',
      icon: Heart,
      action: () => setCurrentView('liked'),
      active: currentView === 'liked',
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: History,
      action: () => setCurrentView('history'),
      active: currentView === 'history',
    },
  ];

  return (
    <aside className="hidden md:flex w-60 bg-[#121018] border-r border-white/5 flex-col h-full select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <PlayerLogo size="sm" />
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors block leading-tight">
              Player do Tyrone
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              Clipes, Músicas & Games
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-6">
        {/* Main Nav */}
        <div className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  item.active
                    ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    item.active ? 'text-cyan-400' : 'text-zinc-400'
                  }`}
                />
                <span>{item.label}</span>
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
              className="p-1 hover:text-cyan-400 rounded hover:bg-white/5 transition-colors cursor-pointer"
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                    isColActive
                      ? 'bg-violet-950/40 text-violet-300 font-semibold border border-violet-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
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

      {/* Bottom User Profile & Cloud Info */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-2 bg-[#0e0c14]">
        {/* User Account Bar */}
        {user && (
          <div className="p-2 rounded-xl bg-[#1a1724] border border-violet-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white truncate block leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-zinc-400 truncate block">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sair da Conta (Logout)"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Play Store button */}
        {onOpenPlayStoreModal && (
          <button
            onClick={onOpenPlayStoreModal}
            className="w-full py-2 px-3 rounded-xl bg-[#1a1724] hover:bg-[#231f30] border border-violet-500/20 hover:border-cyan-500/40 text-xs font-semibold text-white flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Instalar / Play Store</span>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded-full border border-cyan-500/30">
              PWA
            </span>
          </button>
        )}

        {/* Add link button */}
        <button
          onClick={onOpenAddModal}
          className="w-full py-2 px-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Adicionar Link</span>
        </button>
      </div>
    </aside>
  );
};
