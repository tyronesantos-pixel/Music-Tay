import React, { useState } from 'react';
import { History, Trash2, Clock, Sparkles, CheckCircle2, Shield, Tv, Zap, RefreshCw } from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { VideoCard } from '../common/VideoCard';
import { YouTubeVideo } from '../../services/youtubeService';

interface HistoryViewProps {
  onOpenCollectionModal: (videoId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onOpenCollectionModal }) => {
  const { videos } = useVideoLibrary();
  const { watchHistory, clearWatchHistory } = useVideoPlayer();
  const [activeTab, setActiveTab] = useState<'history' | 'changelog'>('history');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Safe mapping that NEVER loses a video from history
  const historyVideos: (YouTubeVideo & { watchedAt: string })[] = watchHistory
    .map((item) => {
      const existingInLibrary = videos.find((video) => video.id === item.videoId);
      if (existingInLibrary) {
        return { ...existingInLibrary, watchedAt: item.watchedAt };
      }
      if (item.video) {
        return { ...item.video, watchedAt: item.watchedAt };
      }
      // Reconstructed snapshot fallback
      return {
        id: item.videoId,
        title: item.title || 'Vídeo do YouTube',
        description: '',
        channelTitle: item.channelTitle || 'YouTube',
        channelUrl: 'https://www.youtube.com',
        thumbnailUrl: item.thumbnailUrl || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: item.duration || 0,
        isShort: Boolean(item.isShort),
        tags: [],
        addedAt: item.watchedAt,
        lastSyncedAt: item.watchedAt,
        views: 0,
        likes: 0,
        status: 'active' as const,
        watchedAt: item.watchedAt,
      };
    })
    .filter((v): v is (YouTubeVideo & { watchedAt: string }) => Boolean(v && v.id));

  const handleClearHistory = () => {
    clearWatchHistory();
    setIsConfirmingClear(false);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 flex flex-col gap-5 max-w-6xl mx-auto w-full pb-36 sm:pb-8">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#16141f] border border-white/5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{activeTab === 'history' ? 'Histórico de Reprodução' : 'Histórico de Atualizações do App'}</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeTab === 'history'
                ? `${historyVideos.length} vídeos assistidos recentemente e salvos permanentemente.`
                : 'Registro de todas as novidades, correções do player e melhorias do app.'}
            </p>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-[#100e18] p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vídeos Reproduzidos ({historyVideos.length})
            </button>
            <button
              onClick={() => setActiveTab('changelog')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'changelog'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Última Atualização</span>
            </button>
          </div>

          {activeTab === 'history' && historyVideos.length > 0 && (
            <div>
              {isConfirmingClear ? (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirmar Limpeza
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#1f1b2b] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Limpar histórico de reprodução"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab: Watch History List */}
      {activeTab === 'history' && (
        <>
          {historyVideos.length === 0 ? (
            <div className="bg-[#16141f] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Clock className="w-12 h-12 text-zinc-700 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Nenhum histórico ainda</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Os clipes que você reproduzir aparecerão aqui automaticamente e serão salvos de forma permanente no seu dispositivo e na nuvem.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {historyVideos.map((video) => (
                <VideoCard
                  key={`${video.id}-${video.watchedAt}`}
                  video={video}
                  queueContext={historyVideos}
                  onOpenCollectionModal={onOpenCollectionModal}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: App Changelog & Update History */}
      {activeTab === 'changelog' && (
        <div className="flex flex-col gap-4">
          {/* Latest Version Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1a1528] via-[#14121d] to-[#121019] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-xs border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Versão 4.2.0 (Atualização Recente)
                </span>
                <span className="text-xs text-zinc-400 font-medium">Lançada recentemente</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Estável & Operante
              </span>
            </div>

            <h3 className="text-base font-extrabold text-white mb-2">
              Resumo das Melhorias e Correções Implementadas:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
              {/* Feature 1 */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Tela Cheia / Maximizado Contínuo</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    O player agora não sai mais da tela cheia quando o clipe termina e troca de música. O iframe é mantido ativo e preenche a tela sem recarregar nem piscar.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Proteção Total Contra Limites de Cota</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Corrigido o erro de cota diária do Firebase Firestore. O app utiliza gravação unificada e armazenamento local duplo (IndexedDB + LocalStorage) para nunca parar de funcionar.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Preservação Permanente do Histórico</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Cada vídeo assistido agora salva seus metadados completos (título, canal, capa e duração). O histórico não some mais ao reiniciar ou atualizar o catálogo.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Transição Rápida e Ordem de Playlist</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Ao clicar diretamente em uma faixa da playlist, ela toca instantaneamente e a anterior vai para o fim da fila sem duplicações.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Updates History */}
          <div className="p-5 rounded-2xl bg-[#16141f] border border-white/5 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Versões Anteriores</span>
            </h4>

            <div className="border-l-2 border-violet-500/30 pl-4 py-1 flex flex-col gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Versão 4.1.0</span>
                  <span className="text-[10px] text-zinc-500">— PWA & Suporte a Instalação Móvel</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Adicionado suporte ao modo PWA instalável no celular Android/iOS e guia para loja de aplicativos.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Versão 4.0.0</span>
                  <span className="text-[10px] text-zinc-500">— Modo Bolso & Áudio de Fundo</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Recurso exclusivo de tela apagada para ouvir músicas sem toques acidentais e economizando 100% de tela.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

