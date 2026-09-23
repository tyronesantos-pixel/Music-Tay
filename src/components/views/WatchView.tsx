import React, { useEffect, useState } from 'react';
import {
  Heart,
  Share2,
  FolderPlus,
  ExternalLink,
  Youtube,
  Layers,
  Check,
  RefreshCw,
  Tv,
  ArrowLeft,
  Moon,
  Smartphone,
} from 'lucide-react';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { formatDuration } from '../../services/youtubeService';

interface WatchViewProps {
  onOpenCollectionModal: (videoId: string) => void;
  onOpenPocketMode?: () => void;
  onOpenGuideModal?: () => void;
}

export const WatchView: React.FC<WatchViewProps> = ({
  onOpenCollectionModal,
  onOpenPocketMode,
  onOpenGuideModal,
}) => {
  const {
    currentVideo,
    isTheaterMode,
    toggleTheater,
    autoPlayNext,
    toggleAutoPlayNext,
    likedVideoIds,
    toggleLike,
    playVideo,
  } = useVideoPlayer();

  const { videos, setCurrentView, syncVideoById } = useVideoLibrary();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncingCurrent, setIsSyncingCurrent] = useState(false);

  // If no video is selected, pick first if available
  useEffect(() => {
    if (!currentVideo && videos.length > 0) {
      playVideo(videos[0]);
    }
  }, [currentVideo, videos, playVideo]);

  if (!currentVideo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
        <Youtube className="w-16 h-16 text-zinc-700 mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Nenhum vídeo selecionado</h2>
        <p className="text-xs text-zinc-400 mb-5">
          Adicione um link ou escolha um vídeo da sua biblioteca.
        </p>
        <button
          onClick={() => setCurrentView('home')}
          className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-colors cursor-pointer"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  const isLiked = likedVideoIds.has(currentVideo.id);
  const relatedVideos = videos.filter((v) => v.id !== currentVideo.id);

  const handleShare = () => {
    navigator.clipboard.writeText(currentVideo.youtubeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSyncCurrent = async () => {
    setIsSyncingCurrent(true);
    await syncVideoById(currentVideo.id);
    setIsSyncingCurrent(false);
  };

  const embedUrl = `https://www.youtube-nocookie.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1`;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col gap-4 sm:gap-5 max-w-6xl mx-auto w-full pb-36 sm:pb-8">
      {/* Back button for mobile */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-[#1b1825] px-3 py-1.5 rounded-full border border-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Início</span>
        </button>
        <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Reproduzindo
        </span>
      </div>

      {/* Cinema / Theater Grid */}
      <div className={`grid gap-6 ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-3'}`}>
        {/* Main Player Column */}
        <div className={isTheaterMode ? 'w-full' : 'xl:col-span-2'}>
          {/* IFrame Container */}
          <div
            className={`relative w-full ${
              currentVideo.isShort ? 'max-w-sm mx-auto aspect-[9/16]' : 'aspect-video'
            } bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10`}
          >
            <iframe
              key={currentVideo.id}
              src={embedUrl}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Video Metadata Header */}
          <div className="mt-3.5 flex flex-col gap-3">
            <div className="flex flex-col gap-2.5">
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-white leading-tight">
                  {currentVideo.title}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                  <span className="text-violet-400 font-semibold">{currentVideo.channelTitle}</span>
                  <span>•</span>
                  <span>Salvo em tempo real</span>
                  {currentVideo.duration > 0 && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(currentVideo.duration)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons - smooth horizontal scroll on mobile */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full">
                {/* Like */}
                <button
                  onClick={() => toggleLike(currentVideo.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                    isLiked
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-white border border-white/5'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{isLiked ? 'Curtido' : 'Curtir'}</span>
                </button>

                {/* Add to Playlist */}
                <button
                  onClick={() => onOpenCollectionModal(currentVideo.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-colors whitespace-nowrap active:scale-95 cursor-pointer border border-white/5"
                  title="Adicionar à Playlist"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Playlist</span>
                </button>

                {/* Pocket Mode / Modo Bolso */}
                {onOpenPocketMode && (
                  <button
                    onClick={onOpenPocketMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-amber-300 text-xs font-semibold transition-colors whitespace-nowrap active:scale-95 cursor-pointer border border-amber-500/20"
                    title="Modo Bolso (Ouvir com tela 100% preta / economia de bateria)"
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modo Bolso</span>
                  </button>
                )}

                {/* Lock Screen Help / Guide */}
                {onOpenGuideModal && (
                  <button
                    onClick={onOpenGuideModal}
                    className="p-2 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-violet-400 transition-colors shrink-0 active:scale-95 cursor-pointer border border-white/5"
                    title="Dicas para tocar com tela bloqueada"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Sync Video Data */}
                <button
                  onClick={handleSyncCurrent}
                  disabled={isSyncingCurrent}
                  className="p-2 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-cyan-400 transition-colors shrink-0 active:scale-95 cursor-pointer border border-white/5"
                  title="Atualizar dados do vídeo"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCurrent ? 'animate-spin text-cyan-400' : ''}`} />
                </button>

                {/* Theater Toggle */}
                <button
                  onClick={toggleTheater}
                  className={`p-2 rounded-full transition-colors hidden sm:block ${
                    isTheaterMode
                      ? 'bg-violet-600 text-white'
                      : 'bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-white border border-white/5'
                  }`}
                  title="Modo Cinema"
                >
                  <Tv className="w-3.5 h-3.5" />
                </button>

                {/* Share Link */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap active:scale-95 cursor-pointer border border-white/5"
                  title="Copiar Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Compartilhar'}</span>
                </button>

                {/* Direct Link on YouTube */}
                <a
                  href={currentVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-rose-400 transition-colors shrink-0 active:scale-95 border border-white/5"
                  title="Abrir no YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Tags */}
            {currentVideo.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentVideo.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-[#242424] text-zinc-300 text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Up Next Column */}
        {relatedVideos.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1DB954]" />
                <span>Próximos da Biblioteca</span>
              </h2>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Autoplay</span>
                <button
                  onClick={toggleAutoPlayNext}
                  className={`w-8 h-4.5 rounded-full transition-colors relative ${
                    autoPlayNext ? 'bg-[#1DB954]' : 'bg-[#333]'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-black absolute top-0.5 transition-transform ${
                      autoPlayNext ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div className="flex flex-col gap-2">
              {relatedVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => playVideo(video, relatedVideos)}
                  className="group flex gap-2.5 p-2 rounded-xl bg-[#181818] hover:bg-[#242424] cursor-pointer border border-white/5 transition-all"
                >
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex flex-col justify-center overflow-hidden">
                    <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-[#1DB954] transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {video.channelTitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
