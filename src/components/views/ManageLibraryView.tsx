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
  Download,
  Cloud,
  CheckCircle,
  Play,
  ShieldCheck,
  Youtube,
  FolderPlus,
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
  onOpenSyncModal,
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
    exportLibrary,
    openVideoView,
    isCloudConnected,
  } = useVideoLibrary();

  const { playVideo } = useVideoPlayer();

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

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
  };

  const saveEdit = async (id: string) => {
    await updateVideo(id, { title: editTitle, notes: editNotes });
    setEditingId(null);
  };

  const handleSyncVideo = async (id: string) => {
    setSyncingId(id);
    await syncVideoById(id);
    setSyncingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col gap-5 max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white">Gerenciar Biblioteca</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-[10px] font-bold border border-[#1DB954]/30 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-[#1DB954]" />
                Banco em Nuvem Ativo
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {videos.length} vídeo(s) sincronizados em tempo real no banco de dados.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => syncAllVideos()}
            disabled={isSyncing || videos.length === 0}
            className="px-3 py-2 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] disabled:opacity-40 text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5"
            title="Atualizar títulos e capas de todos os vídeos com o YouTube"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#1DB954]' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Atualizar Todos'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold shadow-lg shadow-[#1DB954]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Link</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Batch Actions */}
      <div className="bg-[#181818] border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search in library */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar vídeos da nuvem..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#1DB954]"
          />
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {videos.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded bg-[#121212] border border-white/5"
            >
              {selectedIds.length === filteredVideos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Excluir da Nuvem ({selectedIds.length})</span>
            </button>
          )}

          {videos.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors px-2 py-1"
              title="Limpar tudo da nuvem"
            >
              Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {/* Videos List */}
      {filteredVideos.length === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
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
              className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold shadow-md shadow-[#1DB954]/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeiro Vídeo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredVideos.map((video) => {
            const isSelected = selectedIds.includes(video.id);
            const isEditing = editingId === video.id;

            return (
              <div
                key={video.id}
                className={`bg-[#181818] hover:bg-[#202020] border transition-all rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected ? 'border-[#1DB954]/50 bg-[#1DB954]/5' : 'border-white/5'
                }`}
              >
                {/* Left: Checkbox + Thumbnail + Details */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(video.id)}
                    className="w-4 h-4 accent-[#1DB954] rounded cursor-pointer shrink-0"
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
                      <Play className="w-5 h-5 text-[#1DB954] fill-current" />
                    </div>
                  </div>

                  {/* Text details or edit form */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 w-full">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#121212] border border-[#1DB954] rounded px-2 py-1 text-xs text-white outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(video.id)}
                            className="px-2 py-0.5 rounded bg-[#1DB954] text-black text-[11px] font-bold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Salvar na Nuvem</span>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4
                          onClick={() => {
                            playVideo(video, videos);
                            openVideoView(video);
                          }}
                          className="text-xs sm:text-sm font-semibold text-white truncate cursor-pointer hover:text-[#1DB954] transition-colors"
                        >
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 truncate">
                          <span className="text-[#1DB954]">{video.channelTitle}</span>
                          <span>•</span>
                          <span>ID: {video.id}</span>
                          {video.isShort && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase">
                              Short
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
                      className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 hover:text-[#1DB954] transition-colors"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Sync this video */}
                  <button
                    onClick={() => handleSyncVideo(video.id)}
                    title="Atualizar dados deste vídeo na nuvem"
                    className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 hover:text-[#1DB954] transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === video.id ? 'animate-spin text-[#1DB954]' : ''}`} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => startEdit(video)}
                    title="Editar Título"
                    className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Open in YouTube */}
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir no YouTube"
                    className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 hover:text-white transition-colors"
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
                    className="p-1.5 rounded-lg bg-[#242424] hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Backup and Restore Footer */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 mt-2">
        <div className="flex items-center gap-2 text-zinc-300">
          <Cloud className="w-4 h-4 text-[#1DB954]" />
          <span>Sincronização em tempo real via Banco de Dados em Nuvem (Cloud Firestore).</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLibrary}
            className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#2e2e2e] text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <Download className="w-3 h-3 text-[#1DB954]" />
            <span>Baixar Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
