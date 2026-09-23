import React from 'react';
import { Heart } from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { VideoCard } from '../common/VideoCard';

interface LikedViewProps {
  onOpenCollectionModal: (videoId: string) => void;
}

export const LikedView: React.FC<LikedViewProps> = ({ onOpenCollectionModal }) => {
  const { videos } = useVideoLibrary();
  const { likedVideoIds } = useVideoPlayer();

  const likedVideos = videos.filter((v) => likedVideoIds.has(v.id));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20 sm:pb-6">
      <div className="flex items-center gap-3.5 p-5 rounded-2xl bg-[#181818] border border-white/5">
        <div className="w-12 h-12 rounded-xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center shrink-0">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Vídeos Curtidos</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {likedVideos.length} vídeos salvos nos seus favoritos.
          </p>
        </div>
      </div>

      {likedVideos.length === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Heart className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Nenhum vídeo curtido ainda</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Clique no ícone de coração em qualquer vídeo para salvá-lo aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {likedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              queueContext={likedVideos}
              onOpenCollectionModal={onOpenCollectionModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
