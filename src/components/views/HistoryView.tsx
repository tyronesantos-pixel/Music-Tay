import React from 'react';
import { History, Trash2, Film, Clock } from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { VideoCard } from '../common/VideoCard';

interface HistoryViewProps {
  onOpenCollectionModal: (videoId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onOpenCollectionModal }) => {
  const { videos } = useVideoLibrary();
  const { watchHistory } = useVideoPlayer();

  const historyVideos = watchHistory
    .map((item) => {
      const v = videos.find((video) => video.id === item.videoId);
      return v ? { ...v, watchedAt: item.watchedAt } : null;
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full pb-36 sm:pb-8">
      <div className="flex items-center gap-3.5 p-5 rounded-2xl bg-[#16141f] border border-white/5">
        <div className="w-12 h-12 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Histórico de Reprodução</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {historyVideos.length} vídeos assistidos recentemente no Player do Tyrone.
          </p>
        </div>
      </div>

      {historyVideos.length === 0 ? (
        <div className="bg-[#16141f] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Clock className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Nenhum histórico ainda</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Os vídeos que você reproduzir aparecerão aqui automaticamente.
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
    </div>
  );
};
