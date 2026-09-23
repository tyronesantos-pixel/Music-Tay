import React, { useState, useEffect } from 'react';
import {
  Heart,
  ChevronUp,
  ChevronDown,
  Share2,
  Zap,
  ExternalLink,
  Check,
  Plus,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';

interface ShortsViewProps {
  onOpenCollectionModal: (videoId: string) => void;
  onOpenAddModal?: () => void;
}

export const ShortsView: React.FC<ShortsViewProps> = ({ onOpenCollectionModal, onOpenAddModal }) => {
  const { videos, setCurrentView } = useVideoLibrary();
  const { likedVideoIds, toggleLike } = useVideoPlayer();

  const shorts = videos.filter((v) => v.isShort);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeClip = shorts[currentIndex] || shorts[0];
  const isLiked = activeClip ? likedVideoIds.has(activeClip.id) : false;

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(shorts.length - 1);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'ArrowDown' || e.code === 'KeyJ') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyK') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, shorts.length]);

  const handleShare = () => {
    if (!activeClip) return;
    navigator.clipboard.writeText(activeClip.youtubeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!activeClip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
          <Zap className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Nenhum Short Adicionado</h2>
        <p className="text-xs text-zinc-400 mb-5">
          Cole a URL de um YouTube Short para assistir no formato Reels.
        </p>
        <button
          onClick={() => {
            if (onOpenAddModal) onOpenAddModal();
            else setCurrentView('manage');
          }}
          className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Short</span>
        </button>
      </div>
    );
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${activeClip.id}?autoplay=1&loop=1&playlist=${activeClip.id}&modestbranding=1`;

  return (
    <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-black/95 p-2 sm:p-4 pb-20 sm:pb-4">
      {/* 9:16 Vertical Phone Frame */}
      <div className="relative w-full max-w-[400px] h-[82vh] max-h-[780px] bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center select-none">
        <iframe
          key={activeClip.id}
          src={embedUrl}
          title={activeClip.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />

        {/* Top Floating Badge */}
        <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Short #{currentIndex + 1} de {shorts.length}</span>
          </div>
        </div>

        {/* Right Floating Actions (Spotify/TikTok style) */}
        <div className="absolute right-3 bottom-14 flex flex-col items-center gap-3.5 z-20">
          {/* Like */}
          <button
            onClick={() => toggleLike(activeClip.id)}
            className="flex flex-col items-center gap-1 group/btn"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-transform transform group-hover/btn:scale-110 ${
                isLiked ? 'bg-[#1DB954] text-black' : 'bg-black/70 text-white hover:bg-black/90'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow">Curtir</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group/btn"
            title="Compartilhar"
          >
            <div className="w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform transform group-hover/btn:scale-110">
              {copiedLink ? <Check className="w-4 h-4 text-[#1DB954]" /> : <Share2 className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow">
              {copiedLink ? 'Copiado' : 'Link'}
            </span>
          </button>

          {/* Open on YouTube */}
          <a
            href={activeClip.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#1DB954] hover:text-black backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-colors"
            title="Abrir no YouTube"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Up / Down Controls beside frame */}
      <div className="hidden sm:flex flex-col gap-3 ml-3">
        <button
          onClick={handlePrev}
          className="p-3 rounded-full bg-[#181818] hover:bg-[#1DB954] hover:text-black border border-white/10 text-white shadow-xl transition-all"
          title="Short Anterior"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-[#181818] hover:bg-[#1DB954] hover:text-black border border-white/10 text-white shadow-xl transition-all"
          title="Próximo Short"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
