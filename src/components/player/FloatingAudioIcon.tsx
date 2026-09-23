import React, { useState } from 'react';
import { Play, Pause, Maximize2, Music, ChevronDown, Moon } from 'lucide-react';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { useVideoLibrary } from '../../context/VideoLibraryContext';

interface FloatingAudioIconProps {
  onOpenPocketMode?: () => void;
}

export const FloatingAudioIcon: React.FC<FloatingAudioIconProps> = ({ onOpenPocketMode }) => {
  const { currentVideo, isPlaying, pause, resume } = useVideoPlayer();
  const { currentView, setCurrentView } = useVideoLibrary();
  const [isMinimized, setIsMinimized] = useState(false);

  // If there's no current video or we're already on the 'watch' view, don't show the floating widget
  if (!currentVideo || currentView === 'watch') {
    return null;
  }

  const handleExplode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentView('watch');
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  // Ultra-compact bubble mode: just a floating green musical icon that can "explodir"
  if (isMinimized) {
    return (
      <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
        <div
          onClick={() => setIsMinimized(false)}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-xl shadow-[#1DB954]/30 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
          title="Música Tocando - Clique para opções"
        >
          {isPlaying ? (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <Music className="w-5 h-5 fill-current" />
          )}

          {/* Quick Explodir hover pill */}
          <button
            onClick={handleExplode}
            className="absolute -top-9 right-0 px-2.5 py-1 rounded-full bg-black/90 hover:bg-black text-[#1DB954] border border-[#1DB954]/30 text-[11px] font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap"
            title="Explodir / Abrir Player em Tela Cheia"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Explodir</span>
          </button>
        </div>
      </div>
    );
  }

  // Floating pill (sem imagem de capa/vídeo!)
  return (
    <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-[calc(100vw-24px)] sm:w-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        onClick={handleExplode}
        className="flex items-center justify-between gap-3 p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#181818]/95 hover:bg-[#202020] backdrop-blur-xl border border-[#1DB954]/40 shadow-2xl shadow-black/80 cursor-pointer transition-all group"
      >
        {/* Left: Spotify Green Animated Equalizer (Sem imagem de vídeo!) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#1DB954] text-black flex items-center justify-center shrink-0 shadow-md shadow-[#1DB954]/30">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 h-2.5 bg-black rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-black rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-3 bg-black rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <Music className="w-4 h-4 fill-current" />
            )}
          </div>

          {/* Track info */}
          <div className="min-w-0 flex flex-col">
            <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[180px] group-hover:text-[#1DB954] transition-colors">
              {currentVideo.title}
            </span>
            <span className="text-[10px] text-zinc-400 truncate max-w-[130px] sm:max-w-[180px]">
              {currentVideo.channelTitle}
            </span>
          </div>
        </div>

        {/* Right: Controls & "Explodir" Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pocket Mode Toggle */}
          {onOpenPocketMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPocketMode();
              }}
              className="p-1.5 rounded-full bg-[#242424] hover:bg-[#333] text-zinc-400 hover:text-white transition-colors"
              title="Modo Bolso (Ouvir com tela 100% preta / sem toques acidentais)"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Play / Pause Toggle */}
          <button
            onClick={handleTogglePlay}
            className="w-8 h-8 rounded-full bg-[#282828] hover:bg-[#333] text-white flex items-center justify-center transition-colors"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* "Explodir" Button */}
          <button
            onClick={handleExplode}
            className="px-2.5 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-extrabold flex items-center gap-1 shadow-md shadow-[#1DB954]/25 transition-transform active:scale-95 cursor-pointer"
            title="Explodir / Expandir para Tela Cheia"
          >
            <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="font-bold">Explodir</span>
          </button>

          {/* Collapse to tiny icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Minimizar para ícone"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
