import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Play,
  X,
  Search,
  Music,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { YouTubeCollection, YouTubeVideo } from '../../services/youtubeService';

interface PlaylistsDropdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreatePlaylist: () => void;
}

export const PlaylistsDropdownModal: React.FC<PlaylistsDropdownModalProps> = ({
  isOpen,
  onClose,
  onOpenCreatePlaylist,
}) => {
  const { collections, openCollection, videos } = useVideoLibrary();
  const { playVideo, currentVideo, isPlaying } = useVideoPlayer();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectPlaylist = (col: YouTubeCollection) => {
    openCollection(col.id);
    onClose();
  };

  const handlePlayEntirePlaylist = (e: React.MouseEvent, col: YouTubeCollection) => {
    e.stopPropagation();
    const playlistVideos = col.videoIds
      .map((id: string) => videos.find((v: YouTubeVideo) => v.id === id))
      .filter((v): v is YouTubeVideo => Boolean(v));

    if (playlistVideos.length > 0) {
      playVideo(playlistVideos[0], playlistVideos.slice(1));
      openCollection(col.id);
      onClose();
    } else {
      openCollection(col.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-[#181818] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Suas Playlists
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#1DB954] text-black text-[10px] font-extrabold">
                  {collections.length}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha uma playlist para ver ou tocar agora
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCreatePlaylist();
              }}
              className="px-3 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#1DB954]/25 cursor-pointer transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Nova</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search filter if playlists > 3 */}
        {collections.length > 3 && (
          <div className="p-3 border-b border-white/5 bg-[#121212]/50">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar playlists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#242424] text-white text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1DB954] placeholder:text-zinc-500"
              />
            </div>
          </div>
        )}

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2">
          {collections.length === 0 ? (
            <div className="text-center py-10 px-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#242424] flex items-center justify-center text-zinc-500 mb-3">
                <Folder className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Nenhuma playlist encontrada
              </h4>
              <p className="text-xs text-zinc-400 max-w-xs mb-5">
                Crie sua primeira playlist para organizar suas músicas, videoclipes e vídeos favoritos.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreatePlaylist();
                }}
                className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-[#1DB954]/30 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Criar Minha Primeira Playlist</span>
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              Nenhuma playlist coincide com "{search}"
            </div>
          ) : (
            filtered.map((col) => {
              const count = col.videoIds.length;
              return (
                <div
                  key={col.id}
                  onClick={() => handleSelectPlaylist(col)}
                  className="group flex items-center justify-between p-3 rounded-xl bg-[#202020] hover:bg-[#282828] border border-white/5 hover:border-[#1DB954]/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Folder Icon Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1DB954]/25 to-zinc-800 flex items-center justify-center text-[#1DB954] shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                      <Music className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                        {col.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span className="font-medium text-[#1DB954]">
                          {count} {count === 1 ? 'música' : 'músicas'}
                        </span>
                        {col.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px] text-zinc-500">
                              {col.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions on row */}
                  <div className="flex items-center gap-2 shrink-0">
                    {count > 0 && (
                      <button
                        onClick={(e) => handlePlayEntirePlaylist(e, col)}
                        title="Tocar Playlist Agora"
                        className="w-9 h-9 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-md shadow-[#1DB954]/25 transform active:scale-95 transition-transform cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    )}
                    <span className="text-xs text-zinc-400 group-hover:text-white px-2 py-1 rounded-md bg-[#282828] text-[11px] font-medium hidden sm:inline-block">
                      Abrir
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#141414] flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px]">
            Toque em uma playlist para gerenciar ou no <span className="text-[#1DB954] font-bold">▶</span> para ouvir
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenCreatePlaylist();
            }}
            className="text-[#1DB954] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Nova</span>
          </button>
        </div>
      </div>
    </div>
  );
};
