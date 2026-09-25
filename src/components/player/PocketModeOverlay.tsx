import React, { useState, useEffect } from 'react';
import { Moon, Play, Pause, Smartphone, Lock, Unlock, X, SkipForward, Info } from 'lucide-react';
import { useVideoPlayer } from '../../context/VideoPlayerContext';

interface PocketModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PocketModeOverlay: React.FC<PocketModeOverlayProps> = ({ isOpen, onClose }) => {
  const { currentVideo, isPlaying, pause, resume, nextVideo } = useVideoPlayer();
  const [tapCount, setTapCount] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen || !currentVideo) return null;

  const handleScreenTap = () => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 2) {
        onClose();
        return 0;
      }
      return next;
    });

    // Reset tap count after 1.5s
    setTimeout(() => {
      setTapCount(0);
    }, 1500);
  };

  return (
    <div
      onClick={handleScreenTap}
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-between p-6 select-none cursor-pointer"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Top Header: Clock & Battery saver notice */}
      <div className="flex items-center justify-between opacity-50 text-xs">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-sm">{currentTimeStr}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-violet-400" />
          <span>Toques Bloqueados</span>
        </div>
      </div>

      {/* Center: Track info & Visualizer */}
      <div className="flex flex-col items-center text-center my-auto px-4 max-w-sm mx-auto">
        {/* Equalizer indicator */}
        <div className="flex items-end gap-1 h-6 mb-4">
          <span className="w-1 bg-violet-400 rounded-full h-3 animate-pulse" />
          <span className="w-1 bg-cyan-400 rounded-full h-6 animate-pulse delay-75" />
          <span className="w-1 bg-indigo-400 rounded-full h-4 animate-pulse delay-150" />
          <span className="w-1 bg-cyan-400 rounded-full h-5 animate-pulse delay-200" />
        </div>

        <h2 className="text-sm font-semibold text-zinc-300 line-clamp-2 mb-1">
          {currentVideo.title}
        </h2>
        <p className="text-xs text-zinc-500 mb-6">
          {currentVideo.channelTitle}
        </p>

        {/* Minimal Control Buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-6 p-2"
        >
          <button
            onClick={() => {
              if (isPlaying) {
                pause();
              } else {
                resume();
              }
            }}
            className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 hover:border-violet-500 flex items-center justify-center text-white hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextVideo}
            className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Próxima Música"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Double-tap hint */}
        <div className="mt-8 py-2 px-4 rounded-full bg-zinc-950/80 border border-zinc-900 text-zinc-400 text-xs flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {tapCount === 1 ? 'Toque mais 1x para desbloquear' : 'Toque 2x em qualquer lugar para sair'}
          </span>
        </div>
      </div>

      {/* Bottom Advice */}
      <div className="flex flex-col items-center gap-2 text-center opacity-40 text-[10px] text-zinc-500">
        <p>Tela 100% preta (Economia máxima de bateria para bolso/mochila)</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-zinc-400 underline hover:text-white"
        >
          Sair do Modo Bolso
        </button>
      </div>
    </div>
  );
};
