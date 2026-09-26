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
  Play,
  Youtube,
  FolderPlus,
  Sparkles,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { YouTubeVideo } from '../../services/youtubeService';

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
  const editCategory = 'videoclipe';
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const filteredVideos = videos.filter((v) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.channelTitle.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredVideos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVideos.map((v) => v.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const promptBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: `Excluir ${selectedIds.length} Vídeo(s)`,
      message: `Tem certeza de que deseja excluir permanentemente ${selectedIds.length} vídeo(s) selecionado(s)? Esta alteração é irreversível e removerá os dados da nuvem.`,
      action: async () => {
        await bulkDeleteVideos(selectedIds);
        setSelectedIds([]);
      },
    });
  };

  const promptClearAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Limpar Toda a Biblioteca',
      message:
        'Atenção: Esta ação excluirá PERMANENTEMENTE todos os vídeos da sua conta. Você tem certeza?',
      action: async () => {
        await clearAllVideos();
        setSelectedIds([]);
      },
    });
  };

  const promptDeleteVideo = (video: YouTubeVideo) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Vídeo da Biblioteca',
      message: `Tem certeza de que deseja remover permanentemente "${video.title}" da sua biblioteca?`,
      action: async () => {
        await deleteVideo(video.id);
      },
    });
  };

  const startEdit = (v: YouTubeVideo) => {
    setEditingId(v.id);
    setEditTitle(v.title);
    setEditNotes(v.notes || '');
  };

  const saveEdit = async (id: string, originalTags: string[] = []) => {
    let updatedTags = [...originalTags];
    if (!updatedTags.includes('clipe')) {
      updatedTags.push('clipe');
    }

    await updateVideo(id, {
      title: editTitle.trim() || 'Vídeo sem título',
      notes: editNotes.trim(),
      category: 'videoclipe',
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

  const getCategoryBadge = (_cat?: string) => {
    return (
      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[9px] uppercase border border-cyan-500/30">
        Videoclip
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 flex flex-col gap-4 sm:gap-5 max-w-6xl mx-auto w-full pb-36 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Gerenciar Biblioteca</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-cyan-300 border border-violet-500/30 font-semibold">
                Nuvem Ativa
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              {videos.length} vídeo(s) salvos com sincronização e exclusão persistente.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => syncAllVideos()}
            disabled={isSyncing || videos.length === 0}
            className="px-3 py-2 rounded-xl bg-[#201c2b] hover:bg-[#2b263b] disabled:opacity-40 text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5 border border-white/5 cursor-pointer active:scale-95"
            title="Atualizar títulos e capas de todos os vídeos com o YouTube"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Todos'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar nesta lista..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-[#1b1825] border border-white/10 rounded-lg pl-8.5 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 text-xs font-semibold border border-white/5 cursor-pointer transition-colors active:scale-95"
            >
              {selectedIds.length === filteredVideos.length && filteredVideos.length > 0
                ? 'Desmarcar Todos'
                : 'Selecionar Todos'}
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={promptBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-xs font-semibold border border-rose-500/30 cursor-pointer flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir ({selectedIds.length})</span>
              </button>
            )}
          </div>

          {videos.length > 0 && (
            <button
              onClick={promptClearAll}
              className="px-3 py-1.5 rounded-lg bg-[#201c2b] hover:bg-rose-950 text-zinc-400 hover:text-rose-400 text-xs font-semibold border border-white/5 cursor-pointer transition-colors active:scale-95"
              title="Excluir todos os vídeos da biblioteca"
            >
              Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {/* Videos List / Table */}
      {filteredVideos.length === 0 ? (
        <div className="bg-[#16141f] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Youtube className="w-12 h-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {filterQuery ? 'Nenhum resultado para esta busca' : 'Sua biblioteca está vazia'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-5">
            {filterQuery
              ? 'Tente buscar por outro termo, nome de canal ou categoria.'
              : 'Adicione links do YouTube para organizar seus clipes e músicas.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/25 cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Primeiro Link</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredVideos.map((video) => {
            const isSelected = selectedIds.includes(video.id);
            const isEditing = editingId === video.id;
            const isJustSaved = savedFeedbackId === video.id;

            return (
              <div
                key={video.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-violet-950/30 border-violet-500/40'
                    : 'bg-[#171522] hover:bg-[#1d1a2c] border-white/5'
                }`}
              >
                {/* Left: Checkbox + Thumbnail + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(video.id)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                  />

                  {/* Thumbnail with Play Overlay */}
                  <div
                    onClick={() => {
                      playVideo(video, filteredVideos);
                      openVideoView(video);
                    }}
                    className="relative w-20 sm:w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 cursor-pointer group/thumb shadow-sm"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>

                  {/* Title and metadata */}
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-2 p-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Título do vídeo"
                          className="w-full bg-[#13111c] border border-violet-500/40 rounded px-2.5 py-1 text-xs text-white outline-none"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                            🎬 Videoclip
                          </span>

                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Anotações / Tags extras..."
                            className="flex-1 min-w-[120px] bg-[#13111c] border border-white/10 rounded px-2 py-1 text-[11px] text-zinc-300 outline-none"
                          />

                          <button
                            onClick={() => saveEdit(video.id, video.tags)}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Salvar</span>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => {
                              playVideo(video, filteredVideos);
                              openVideoView(video);
                            }}
                            className="text-xs sm:text-sm font-semibold text-white truncate cursor-pointer hover:text-cyan-400 transition-colors"
                          >
                            {video.title}
                          </h4>
                          {isJustSaved && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center gap-1 border border-cyan-500/30 animate-pulse">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Atualizado!
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
                      className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer border border-white/5 active:scale-95"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Sync this video */}
                  <button
                    onClick={() => handleSyncVideo(video.id)}
                    title="Atualizar dados deste vídeo na nuvem"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer border border-white/5 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === video.id ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => startEdit(video)}
                    title="Editar Título e Categoria"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5 active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Open in YouTube */}
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir no YouTube"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-[#2b263a] text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5 active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => promptDeleteVideo(video)}
                    title="Excluir da Nuvem"
                    className="p-2 rounded-lg bg-[#201c2b] hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer border border-white/5 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel="Sim, Excluir"
      />
    </div>
  );
};
