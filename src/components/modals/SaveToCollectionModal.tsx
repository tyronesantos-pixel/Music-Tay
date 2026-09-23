import React, { useState } from 'react';
import { Layers, X, Plus, Check } from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';

interface SaveToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
  onOpenCreateCollection: () => void;
}

export const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({
  isOpen,
  onClose,
  videoId,
  onOpenCreateCollection,
}) => {
  const { collections, addVideoToCollection, removeVideoFromCollection, videos } = useVideoLibrary();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const { createCollection } = useVideoLibrary();

  if (!isOpen || !videoId) return null;

  const currentVideo = videos.find((v) => v.id === videoId);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const col = await createCollection(newPlaylistName.trim());
    await addVideoToCollection(col.id, videoId);
    setNewPlaylistName('');
    setIsCreatingQuick(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1DB954]" />
            <h2 className="text-sm font-bold text-white">Adicionar à Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video preview hint */}
        {currentVideo && (
          <div className="px-4 py-2 bg-[#141414] border-b border-white/5 text-[11px] text-zinc-400 truncate">
            Música: <strong className="text-white">{currentVideo.title}</strong>
          </div>
        )}

        {/* Playlist List */}
        <div className="p-4 flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
          {collections.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">
              Nenhuma playlist criada ainda. Crie sua primeira abaixo!
            </p>
          ) : (
            collections.map((col) => {
              const hasVideo = col.videoIds.includes(videoId);
              return (
                <button
                  key={col.id}
                  onClick={() => {
                    if (hasVideo) {
                      removeVideoFromCollection(col.id, videoId);
                    } else {
                      addVideoToCollection(col.id, videoId);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-all ${
                    hasVideo
                      ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40 font-bold'
                      : 'bg-[#121212] text-zinc-300 hover:bg-[#242424] border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{col.name}</span>
                  </div>

                  {hasVideo ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#1DB954]">
                      <Check className="w-4 h-4 stroke-[3]" />
                      Adicionada
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">
                      {col.videoIds.length} músicas
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Quick create inline form */}
        {isCreatingQuick ? (
          <form onSubmit={handleQuickCreate} className="px-4 py-2 bg-[#141414] border-t border-white/5 flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Nome da nova playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#1DB954]"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim()}
              className="px-3 py-1 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-black text-xs font-bold"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingQuick(false)}
              className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs"
            >
              ✕
            </button>
          </form>
        ) : null}

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#121212] flex items-center justify-between">
          <button
            onClick={() => setIsCreatingQuick(true)}
            className="text-xs text-[#1DB954] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Playlist</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#242424] text-white text-xs font-semibold hover:bg-[#2e2e2e] cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
