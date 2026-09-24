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
  SkipForward,
  SkipBack,
  Play,
  Sparkles,
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
    nextVideo,
    prevVideo,
    queue,
    playlistContext,
  } = useVideoPlayer();

  const { videos, setCurrentView, syncVideoById } = useVideoLibrary();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncingCurrent, setIsSyncingCurrent] = useState(false);

  // Load YouTube IFrame API script once if not already present
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const first = document.getElementsByTagName('script')[0];
      first?.parentNode?.insertBefore(tag, first);
    }
  }, []);

  // Direct YT.Player binding to capture onStateChange: 0 (ENDED)
  useEffect(() => {
    let player: any = null;
    let isDisposed = false;

    const setupPlayer = () => {
      if (isDisposed) return;
      const iframeEl = document.getElementById('youtube-player-iframe');
      if (!iframeEl) return;

      if ((window as any).YT && (window as any).YT.Player) {
        try {
          player = new (window as any).YT.Player('youtube-player-iframe', {
            events: {
              onStateChange: (event: any) => {
                // 0 is YT.PlayerState.ENDED
                if (event.data === 0) {
                  if (autoPlayNext) {
                    console.log('[WatchView] YT.Player ended event, moving to next track');
                    nextVideo();
                  }
                }
              },
            },
          });
        } catch (err) {
          console.debug('[WatchView] YT.Player init error:', err);
        }
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setupPlayer();
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        setupPlayer();
      };
    }

    return () => {
      isDisposed = true;
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (_) {}
      }
    };
  }, [currentVideo?.id, autoPlayNext, nextVideo]);

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

  // STRICT PLAYLIST ISOLATION:
  // If playing from a playlist, the queue MUST strictly show clips from that playlist only!
  const isPlaylistActive = Boolean(playlistContext && playlistContext.videos.length > 0);
  const displayedQueue = isPlaylistActive
    ? playlistContext!.videos.filter((v) => v.id !== currentVideo.id)
    : queue.length > 0
    ? queue
    : videos.filter((v) => v.id !== currentVideo.id);

  const currentTrackIndex = isPlaylistActive
    ? playlistContext!.videos.findIndex((v) => v.id === currentVideo.id) + 1
    : 0;
  const totalTracksInPlaylist = isPlaylistActive ? playlistContext!.videos.length : 0;

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

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}&playsinline=1&widgetid=1`;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col gap-4 sm:gap-5 max-w-6xl mx-auto w-full pb-36 sm:pb-8">
      {/* Back button for mobile */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          onClick={() => setCurrentView(isPlaylistActive ? 'collection' : 'home')}
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-[#1b1825] px-3 py-1.5 rounded-full border border-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isPlaylistActive ? 'Voltar para Playlist' : 'Voltar para Início'}</span>
        </button>

        {isPlaylistActive ? (
          <span className="text-[10px] text-violet-300 font-bold flex items-center gap-1 bg-violet-500/15 px-2.5 py-0.5 rounded-full border border-violet-500/30 truncate max-w-[170px]">
            <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{playlistContext?.name}</span>
          </span>
        ) : (
          <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Reproduzindo
          </span>
        )}
      </div>

      {/* Playlist Status Banner when isolated playlist is active */}
      {isPlaylistActive && (
        <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-[#121019] border border-violet-500/30 text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-zinc-400">Tocando Playlist:</span>
            <span className="font-bold text-white truncate">{playlistContext?.name}</span>
            <span className="text-cyan-400 font-mono text-[11px] shrink-0">
              ({currentTrackIndex} de {totalTracksInPlaylist})
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shrink-0">
            <Sparkles className="w-3 h-3" />
            Isolada da Biblioteca
          </span>
        </div>
      )}

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
              id="youtube-player-iframe"
              key={currentVideo.id}
              src={embedUrl}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
              onLoad={(e) => {
                try {
                  const cw = e.currentTarget.contentWindow;
                  if (cw) {
                    cw.postMessage(JSON.stringify({ event: 'listening' }), '*');
                    cw.postMessage(
                      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
                      '*'
                    );
                  }
                } catch (_) {}
              }}
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
                  <span>Sincronizado na Nuvem</span>
                  {currentVideo.duration > 0 && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(currentVideo.duration)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons with Next/Prev Clip Controls */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full">
                {/* Prev Clip */}
                <button
                  onClick={prevVideo}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap active:scale-95 cursor-pointer border border-white/5"
                  title="Clip Anterior"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {/* Skip / Next Clip */}
                <button
                  onClick={nextVideo}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer shadow-md shadow-violet-600/30"
                  title="Pular para o próximo clip da fila"
                >
                  <span>Próximo Clip</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

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

        {/* Up Next Column - ISOLATED to active playlist when playing playlist */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 truncate">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">
                {isPlaylistActive ? `Fila da Playlist: ${playlistContext?.name}` : 'Próximos Vídeos'}
              </span>
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-zinc-400">Autoplay</span>
              <button
                onClick={toggleAutoPlayNext}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  autoPlayNext ? 'bg-cyan-500' : 'bg-zinc-700'
                }`}
                title={autoPlayNext ? 'Autoplay ativado (pula para o próximo clipe)' : 'Autoplay pausado'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black absolute top-0.5 transition-transform ${
                    autoPlayNext ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Queue List - strictly filtered to this playlist */}
          {displayedQueue.length === 0 ? (
            <div className="p-5 rounded-2xl bg-[#15131e] border border-white/5 text-center text-xs text-zinc-400">
              {isPlaylistActive ? (
                <div>
                  <p className="font-semibold text-zinc-300">Fim da fila da playlist</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Com o Autoplay ativado, a playlist retornará ao início automaticamente.
                  </p>
                  <button
                    onClick={() => {
                      if (playlistContext?.videos.length) {
                        playVideo(playlistContext.videos[0], playlistContext.videos.slice(1), playlistContext);
                      }
                    }}
                    className="mt-3 px-3 py-1.5 rounded-full bg-violet-600/30 hover:bg-violet-600/50 text-cyan-300 text-xs font-semibold border border-cyan-400/30 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Reiniciar Playlist</span>
                  </button>
                </div>
              ) : (
                <p>Nenhum outro vídeo na fila.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {displayedQueue.map((video) => (
                <div
                  key={video.id}
                  onClick={() => playVideo(video, displayedQueue, playlistContext)}
                  className="group flex gap-2.5 p-2 rounded-xl bg-[#171520] hover:bg-[#231f32] cursor-pointer border border-white/5 hover:border-violet-500/30 transition-all"
                >
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {video.duration > 0 && (
                      <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono text-white">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center overflow-hidden">
                    <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {video.channelTitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
