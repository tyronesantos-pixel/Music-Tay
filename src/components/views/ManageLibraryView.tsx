import React, { useState } from 'react';
import {
  Layers,
  Trash2,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Check,
  X,
  Cloud,
  Play,
  Youtube,
  FolderPlus,
  Sparkles,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';

interface ManageLibraryViewProps {
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  onOpenCollectionModal?: (videoId: string) => void;
}

export const ManageLibraryView: React.FC<ManageLibraryViewProps> = ({
  onOpenAddModal,
  onOpenCollectionModal,
}) => {
  const {
    videos,
    deleteVideo,
    bulkDeleteVideos,
    clearAllVideos,
    updateVideo,
    syncAllVideos,
    syncVideoById,
    isSyncing,
    openVideoView,
  } = useVideoLibrary();

  const { playVideo } = useVideoPlayer();

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState<'all' | 'musicas' | 'videoclipe' | 'games'>('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);

  const filteredVideos = videos.filter((v) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.channelTitle.toLowerCase().includes(q) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      v.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredVideos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVideos.map((v) => v.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Remover os ${selectedIds.length} vídeos selecionados do banco em nuvem?`)) {
      await bulkDeleteVideos(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza de que deseja limpar TODOS os vídeos da nuvem? Esta ação não pode ser desfeita.')) {
      await clearAllVideos();
      setSelectedIds([]);
    }
  };

  const startEdit = (v: typeof videos[0]) => {
    setEditingId(v.id);
    setEditTitle(v.title);
    setEditNotes(v.notes || '');
    setEditCategory(v.category || 'all');
  };

  const saveEdit = async (id: string, originalTags: string[] = []) => {
    let updatedTags = [...originalTags];
    if (editCategory === 'videoclipe' && !updatedTags.includes('clipe')) {
      updatedTags.push('clipe');
    } else if (editCategory === 'musicas' && !updatedTags.includes('musica')) {
      updatedTags.push('musica');
    } else if (editCategory === 'games' && !updatedTags.includes('games')) {
      updatedTags.push('games');
    }

    await updateVideo(id, {
      title: editTitle.trim() || 'Vídeo sem título',
      notes: editNotes.trim(),
      category: editCategory,
      tags: updatedTags,
    });

    setSavedFeedbackId(id);
    setEditingId(null);
    setTimeout(() => {
      setSavedFeedbackId((current) => (current === id ? null : current));
    }, 2500);
  };

  const handleSyncVideo = async (id: string) => {
    setSyncingId(id);
    await syncVideoById(id);
    setSyncingId(null);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'videoclipe':
        return (
          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold">
            🎬 Videoclipe
          </span>
        );
      case 'musicas':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
            🎵 Música
          </span>
        );
      case 'games':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            🎮 Game
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 text-[10px] font-medium">
            🌌 Misto
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col gap-5 max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-[#16141f] border border-violet-500/20 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-600/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white">Gerenciar Biblioteca</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-cyan-300" />
                Nuvem & Local Sincronizados
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {videos.length} vídeo(s) salvos e atualizados em tempo real.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => syncAllVideos()}
            disabled={isSyncing || videos.length === 0}
            className="px-3 py-2 rounded-xl bg-[#201c2b] hover:bg-[#2b263b] disabled:opacity-40 text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5 border border-white/5 cursor-pointer"
            title="Atualizar títulos e capas de todos os vídeos com o YouTube"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Atualizar Todos'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Link</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Batch Actions */}
      <div className="bg-[#16141f] border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search in library */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar vídeos da nuvem..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-[#0f0d14] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {videos.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs text-zinc-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-[#201c2b] border border-white/5 cursor-pointer"
            >
              {selectedIds.length === filteredVideos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Excluir da Nuvem ({selectedIds.length})</span>
            </button>
          )}

          {videos.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors px-2 py-1 cursor-pointer"
              title="Limpar tudo da nuvem"
            >
              Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {/* Videos List */}
      {filteredVideos.length === 0 ? (
        <div className="bg-[#16141f] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <Youtube className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {videos.length === 0 ? 'O banco de dados em nuvem está vazio' : 'Nenhum vídeo com esse filtro'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            {videos.length === 0
              ? 'Cole o link de qualquer vídeo ou Short do YouTube. Ele será gravado na nuvem e ficará disponível para todos.'
              : 'Tente outro termo de busca.'}
          </p>
          {videos.length === 0 && (
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Primeiro Vídeo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredVideos.map((video) => {
            const isSelected = selectedIds.includes(video.id);
            const isEditing = editingId === video.id;
            const isJustSaved = savedFeedbackId === video.id;

            return (
              <div
                key={video.id}
                className={`bg-[#16141f] hover:bg-[#1b1826] border transition-all rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-violet-500/60 bg-violet-950/20'
                    : isJustSaved
                    ? 'border-cyan-500/60 bg-cyan-950/20'
                    : 'border-white/5'
                }`}
              >
                {/* Left: Checkbox + Thumbnail + Details */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(video.id)}
                    className="w-4 h-4 accent-violet-600 rounded cursor-pointer shrink-0"
                  />

                  {/* Thumbnail with quick play */}
                  <div
                    onClick={() => {
                      playVideo(video, videos);
                      openVideoView(video);
                    }}
                    className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 cursor-pointer group"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-5 h-5 text-cyan-400 fill-current" />
                    </div>
                  </div>

                  {/* Text details or edit form */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full p-2.5 rounded-xl bg-[#110f17] border border-violet-500/40 animate-in fade-in duration-150">
                        <label className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                          Editar Título do Vídeo:
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#181522] border border-violet-500/40 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          placeholder="Título do vídeo..."
                          autoFocus
                        />

                        {/* Category selection */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-zinc-400 font-semibold mr-1">
                            Categoria:
                          </span>
                          {(
                            [
                              { id: 'videoclipe', label: '🎬 Videoclipe' },
                              { id: 'musicas', label: '🎵 Músicas' },
                              { id: 'games', label: '🎮 Games' },
                              { id: 'all', label: '🌌 Misto' },
                            ] as const
                          ).map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setEditCategory(cat.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                                editCategory === cat.id
                                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-400 text-white shadow-sm'
                                  : 'bg-[#1b1826] border-white/10 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        {/* Optional notes */}
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full bg-[#181522] border border-white/10 focus:border-violet-500 rounded-lg px-2.5 py-1 text-[11px] text-zinc-300 outline-none placeholder-zinc-600"
                          placeholder="Anotações ou tags adicionais (opcional)..."
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => saveEdit(video.id, video.tags)}
                            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/25 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Salvar Alterações</span>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            onClick={() => {
                              playVideo(video, videos);
                              openVideoView(video);
                            }}
                            className="text-xs sm:text-sm font-semibold text-white truncate cursor-pointer hover:text-cyan-400 transition-colors"
                          >
                            {video.title}
                          </h4>
                          {isJustSaved && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center gap-1 border border-cyan-500/30 animate-pulse">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Atualizado na base!
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1 truncate flex-wrap">
                          <span className="text-violet-300 font-medium">{video.channelTitle}</span>
                          <span>•</span>
                          {getCategoryBadge(video.category)}
                          {video.isShort && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase">
                              Short
                            </span>
                          )}
                          {video.notes && (
                            <span className="text-zinc-500 text-[10px] italic truncate max-w-[150px]">
                              "{video.notes}"
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Add to Playlist */}
                  {onOpenCollectionModal && (
                    <button
                      onClick={() => onOpenCollectionModal(video.id)}
                      title="Adicionar à Playlist"
                      className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer border border-white/5"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Sync this video */}
                  <button
                    onClick={() => handleSyncVideo(video.id)}
                    title="Atualizar dados deste vídeo na nuvem"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer border border-white/5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === video.id ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => startEdit(video)}
                    title="Editar Título e Categoria"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Open in YouTube */}
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir no YouTube"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${video.title}" da nuvem?`)) {
                        deleteVideo(video.id);
                      }
                    }}
                    title="Excluir da Nuvem"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer border border-white/5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
