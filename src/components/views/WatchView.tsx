import React, { useEffect, useState, useRef } from 'react';
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
  Pause,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { formatDuration, YouTubeVideo } from '../../services/youtubeService';

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
    isPlaying,
    pause,
    resume,
    isTheaterMode,
    toggleTheater,
    isFullscreen,
    isMaximized,
    setIsMaximized,
    toggleFullscreen,
    autoPlayNext,
    toggleAutoPlayNext,
    likedVideoIds,
    toggleLike,
    playVideo,
    selectTrackFromPlaylist,
    nextVideo,
    prevVideo,
    queue,
    playlistContext,
  } = useVideoPlayer();

  const { videos, setCurrentView, syncVideoById, updateCollection } = useVideoLibrary();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncingCurrent, setIsSyncingCurrent] = useState(false);
  const [showMaximizedControls, setShowMaximizedControls] = useState(true);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                    console.log('[WatchView] Clip finished. Moving to next track (maintaining maximized screen).');
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

  // Handle maximized overlay auto-hide timer for controls
  const handleUserActivity = () => {
    setShowMaximizedControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isMaximized) {
        setShowMaximizedControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleMaximize = () => {
    if (isMaximized || isFullscreen) {
      // Exit maximized / fullscreen
      setIsMaximized(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      // Enter maximized & fullscreen
      setIsMaximized(true);
      setShowMaximizedControls(true);
      if (playerContainerRef.current) {
        toggleFullscreen(playerContainerRef.current);
      }
    }
  };

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
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-violet-600/25 active:scale-95"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  const isLiked = likedVideoIds.has(currentVideo.id);

  // STRICT PLAYLIST ISOLATION:
  // If playing from a playlist, the queue strictly shows clips from that playlist only!
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

  /**
   * Manual track selection from playlist (Requirement 3):
   * When selecting another track directly from the playlist:
   * The song that was playing is sent to the END of the list.
   * The new song selected becomes current.
   * Zero duplicates, consistent order, persistent in collection.
   */
  const handleSelectTrack = (video: YouTubeVideo) => {
    if (isPlaylistActive && playlistContext) {
      selectTrackFromPlaylist(video, playlistContext, (playlistId, newIds) => {
        updateCollection(playlistId, { videoIds: newIds });
      });
    } else {
      // General queue fallback
      const fullList = [currentVideo, ...displayedQueue];
      selectTrackFromPlaylist(video, {
        id: 'general_queue',
        name: 'Fila de Reprodução',
        videos: fullList,
      });
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(
    origin
  )}&playsinline=1&widgetid=1`;

  return (
    <div
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col gap-4 sm:gap-5 max-w-6xl mx-auto w-full pb-36 sm:pb-8"
    >
      {/* Back button for mobile */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          onClick={() => setCurrentView(isPlaylistActive ? 'collection' : 'home')}
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-[#1b1825] px-3.5 py-2 rounded-full border border-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isPlaylistActive ? 'Voltar para Playlist' : 'Voltar para Início'}</span>
        </button>

        {isPlaylistActive ? (
          <span className="text-[11px] text-violet-300 font-bold flex items-center gap-1.5 bg-violet-500/15 px-3 py-1 rounded-full border border-violet-500/30 truncate max-w-[180px]">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{playlistContext?.name}</span>
          </span>
        ) : (
          <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Reproduzindo
          </span>
        )}
      </div>

      {/* Playlist Status Banner when isolated playlist is active */}
      {isPlaylistActive && (
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-[#121019] border border-violet-500/30 text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-zinc-400">Playlist:</span>
            <span className="font-bold text-white truncate">{playlistContext?.name}</span>
            <span className="text-cyan-400 font-mono text-[11px] shrink-0">
              ({currentTrackIndex} de {totalTracksInPlaylist})
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shrink-0">
            <Sparkles className="w-3 h-3" />
            Ordem Contínua
          </span>
        </div>
      )}

      {/* Cinema / Theater Grid */}
      <div className={`grid gap-5 sm:gap-6 ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-3'}`}>
        {/* Main Player Column */}
        <div className={isTheaterMode ? 'w-full' : 'xl:col-span-2'}>
          {/*
            Media Player Container
            When isMaximized is true: container fills 100vw x 100vh with fixed positioning
            and STAYS MAXIMIZED when transitioning to the next track! (Requirement 2)
          */}
          <div
            ref={playerContainerRef}
            className={`relative w-full ${
              isMaximized
                ? 'fixed inset-0 z-50 w-screen h-[100dvh] bg-black flex flex-col justify-between overflow-hidden shadow-none rounded-none border-none'
                : `${
                    currentVideo.isShort ? 'max-w-sm mx-auto aspect-[9/16]' : 'aspect-video'
                  } bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10`
            }`}
          >
            {/* Top Bar for Maximized Screen Mode */}
            {isMaximized && (
              <div
                className={`absolute top-0 inset-x-0 z-30 p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
                  showMaximizedControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-bold text-white truncate drop-shadow">
                      {currentVideo.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-zinc-300 truncate drop-shadow">
                      {currentVideo.channelTitle} {isPlaylistActive && `• ${playlistContext?.name}`}
                    </p>
                  </div>
                </div>

                {/* Exit Maximized Mode Button */}
                <button
                  onClick={handleToggleMaximize}
                  className="px-3.5 py-2 rounded-full bg-black/80 hover:bg-black/95 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 shadow-xl cursor-pointer active:scale-95 shrink-0"
                  title="Sair da Tela Cheia / Minimizar (Pressione para sair)"
                >
                  <Minimize2 className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Minimizar</span>
                </button>
              </div>
            )}

            {/* YouTube Iframe Player */}
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

            {/* Floating Maximized Overlay Controls Bar (Hover / Touch) */}
            {isMaximized && (
              <div
                className={`absolute bottom-0 inset-x-0 z-30 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between gap-3 transition-opacity duration-300 ${
                  showMaximizedControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevVideo}
                    className="p-2.5 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 active:scale-95 cursor-pointer"
                    title="Clip Anterior"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => (isPlaying ? pause() : resume())}
                    className="p-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/30"
                    title={isPlaying ? 'Pausar' : 'Reproduzir'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={nextVideo}
                    className="p-2.5 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 active:scale-95 cursor-pointer"
                    title="Próximo Clip"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(currentVideo.id)}
                    className={`p-2.5 rounded-full border border-white/20 active:scale-95 cursor-pointer ${
                      isLiked ? 'bg-rose-600 text-white' : 'bg-black/80 text-white'
                    }`}
                    title={isLiked ? 'Curtido' : 'Curtir'}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={handleToggleMaximize}
                    className="p-2.5 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 active:scale-95 cursor-pointer"
                    title="Minimizar Tela Cheia"
                  >
                    <Minimize2 className="w-5 h-5 text-cyan-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Metadata & Controls */}
          <div className="mt-3.5 flex flex-col gap-3">
            <div>
              <h1 className="text-sm sm:text-xl font-bold text-white leading-tight">
                {currentVideo.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap">
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

            {/* Action Buttons with Primary & Secondary Controls (Fully Responsive on Mobile) */}
            <div className="flex flex-col gap-2.5">
              {/* Row 1: Primary Playback & Maximized Screen Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Prev Clip */}
                <button
                  onClick={prevVideo}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-200 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-white/10"
                  title="Clip Anterior"
                >
                  <SkipBack className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                {/* Skip / Next Clip */}
                <button
                  onClick={nextVideo}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-violet-600/30"
                  title="Pular para o próximo clipe da fila"
                >
                  <span>Próximo Clip</span>
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Maximizar / Tela Cheia (Requirement 2: Stays Maximized on next clip) */}
                <button
                  onClick={handleToggleMaximize}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer border shadow-sm ${
                    isMaximized
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-[#201c2b] hover:bg-[#2b263b] text-cyan-300 hover:text-white border-cyan-500/30'
                  }`}
                  title="Maximizar tela cheia (permanece maximizado durante toda a reprodução)"
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span>{isMaximized ? 'Minimizar' : 'Tela Cheia'}</span>
                </button>

                {/* Like */}
                <button
                  onClick={() => toggleLike(currentVideo.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                    isLiked
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-white border border-white/5'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{isLiked ? 'Curtido' : 'Curtir'}</span>
                </button>

                {/* Add to Playlist */}
                <button
                  onClick={() => onOpenCollectionModal(currentVideo.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-colors active:scale-95 cursor-pointer border border-white/5"
                  title="Adicionar à Playlist"
                >
                  <FolderPlus className="w-4 h-4 text-cyan-400" />
                  <span>Playlist</span>
                </button>
              </div>

              {/* Row 2: Secondary Features & Tools */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Pocket Mode / Modo Bolso */}
                {onOpenPocketMode && (
                  <button
                    onClick={onOpenPocketMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-amber-300 text-xs font-semibold transition-colors active:scale-95 cursor-pointer border border-amber-500/20"
                    title="Modo Bolso (Ouvir com tela apagada / economia de bateria)"
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modo Bolso</span>
                  </button>
                )}

                {/* Lock Screen Help / Guide */}
                {onOpenGuideModal && (
                  <button
                    onClick={onOpenGuideModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-violet-400 text-xs font-semibold transition-colors active:scale-95 cursor-pointer border border-white/5"
                    title="Dicas para tocar com tela bloqueada"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-violet-400" />
                    <span>Dicas Tela Bloqueada</span>
                  </button>
                )}

                {/* Theater Toggle (Desktop) */}
                <button
                  onClick={toggleTheater}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    isTheaterMode
                      ? 'bg-violet-600 text-white'
                      : 'bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-white border border-white/5'
                  }`}
                  title="Modo Cinema"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Cinema</span>
                </button>

                {/* Sync Video Data */}
                <button
                  onClick={handleSyncCurrent}
                  disabled={isSyncingCurrent}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-cyan-400 text-xs font-semibold transition-colors active:scale-95 cursor-pointer border border-white/5"
                  title="Atualizar dados do vídeo com YouTube"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCurrent ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Atualizar</span>
                </button>

                {/* Share Link */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-white text-xs font-semibold transition-colors active:scale-95 cursor-pointer border border-white/5"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201c2b] hover:bg-[#2b263b] text-zinc-300 hover:text-rose-400 text-xs font-semibold transition-colors border border-white/5"
                  title="Abrir no YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>

            {/* Tags */}
            {currentVideo.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {currentVideo.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-[#201c2b] text-zinc-300 text-[11px] border border-white/5"
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
          <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 truncate">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">
                {isPlaylistActive ? `Fila: ${playlistContext?.name}` : 'Próximos Vídeos'}
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

          {/* Queue List */}
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
                    className="mt-3 px-3.5 py-2 rounded-full bg-violet-600/30 hover:bg-violet-600/50 text-cyan-300 text-xs font-semibold border border-cyan-400/30 cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
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
                  onClick={() => handleSelectTrack(video)}
                  className="group flex gap-2.5 p-2 sm:p-2.5 rounded-xl bg-[#171520] hover:bg-[#231f32] cursor-pointer border border-white/5 hover:border-violet-500/30 transition-all active:scale-[0.99]"
                >
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 shadow-sm">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {video.duration > 0 && (
                      <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono text-white">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors leading-snug">
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
