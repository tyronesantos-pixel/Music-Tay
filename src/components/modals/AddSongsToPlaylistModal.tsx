import React, { useState } from 'react';
import { Layers, X, Plus, Check, Search, Music } from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { YouTubeCollection } from '../../services/youtubeService';

interface AddSongsToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: YouTubeCollection;
}

export const AddSongsToPlaylistModal: React.FC<AddSongsToPlaylistModalProps> = ({
  isOpen,
  onClose,
  collection,
}) => {
  const { videos, addMultipleVideosToCollection, collections } = useVideoLibrary();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Retrieve current active collection state
  const currentPlaylist = collections.find((c) => c.id === collection?.id) || collection;
  const alreadyInPlaylist = new Set(currentPlaylist?.videoIds || []);

  const filteredVideos = videos.filter((v) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.channelTitle.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddSelected = async () => {
    if (selectedIds.length === 0 || !currentPlaylist) return;
    setIsSubmitting(true);
    await addMultipleVideosToCollection(currentPlaylist.id, selectedIds);
    setIsSubmitting(false);
    setSelectedIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#16141f] border border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#13111a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Adicionar Músicas à Playlist
              </h2>
              <p className="text-[11px] text-zinc-400">
                {currentPlaylist?.name || 'Playlist'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/5 bg-[#0f0d14]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar músicas já adicionadas na biblioteca..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-[#1b1825] border border-white/10 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Song List */}
        <div className="p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-1.5">
          {filteredVideos.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Nenhuma música encontrada na biblioteca.
            </div>
          ) : (
            filteredVideos.map((video) => {
              const isInPlaylist = alreadyInPlaylist.has(video.id);
              const isSelected = selectedIds.includes(video.id);

              return (
                <div
                  key={video.id}
                  onClick={() => {
                    if (!isInPlaylist) {
                      toggleSelect(video.id);
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isInPlaylist
                      ? 'bg-[#121018]/60 border-white/5 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-violet-600/15 border-violet-500/50 cursor-pointer shadow-sm'
                      : 'bg-[#1b1825] hover:bg-[#221f2f] border-white/5 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 aspect-video rounded overflow-hidden bg-black shrink-0">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {video.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {video.channelTitle}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isInPlaylist ? (
                      <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 rounded bg-zinc-800">
                        Já adicionada
                      </span>
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-gradient-to-r from-violet-600 to-cyan-500 border-violet-400 text-white font-bold'
                            : 'border-white/20 bg-zinc-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#13111a] flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {selectedIds.length} selecionada(s)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-[#221f2d] hover:bg-[#2b273a] text-white text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedIds.length === 0 || isSubmitting}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/25"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar à Playlist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
