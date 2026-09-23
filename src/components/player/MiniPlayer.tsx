import React from 'react';
import { Maximize2, X, Youtube } from 'lucide-react';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { useVideoLibrary } from '../../context/VideoLibraryContext';

export const MiniPlayer: React.FC = () => {
  const { currentVideo } = useVideoPlayer();
  const { currentView, setCurrentView } = useVideoLibrary();

  // Only show if a video is active and user is NOT on 'watch' or 'shorts' view
  if (!currentVideo || currentView === 'watch' || currentView === 'shorts') {
    return null;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${currentVideo.id}?autoplay=1&modestbranding=1`;

  return (
    <div className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-30 w-72 sm:w-80 bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col group select-none animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Video Container */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <iframe
          src={embedUrl}
          title={currentVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="w-full h-full border-0 pointer-events-auto"
        />

        {/* Expand Button Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
          <button
            onClick={() => setCurrentView('watch')}
            className="p-1.5 rounded-lg bg-black/80 hover:bg-black text-white backdrop-blur-md shadow-md"
            title="Expandir para Modo Cinema"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Details Bar */}
      <div
        onClick={() => setCurrentView('watch')}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#242424] transition-colors"
      >
        <div className="overflow-hidden">
          <h4 className="text-xs font-semibold text-white truncate">{currentVideo.title}</h4>
          <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
            <span>{currentVideo.channelTitle}</span>
          </p>
        </div>

        <div className="text-[10px] font-mono text-[#1DB954] shrink-0 font-bold">
          ● Tocando
        </div>
      </div>
    </div>
  );
};
