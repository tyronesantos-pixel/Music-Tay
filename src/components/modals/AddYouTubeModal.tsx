import React, { useState, useEffect } from 'react';
import {
  X,
  Youtube,
  Link,
  CheckCircle,
  AlertCircle,
  Tag,
  RefreshCw,
  Plus,
  Cloud,
  Film,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { parseYouTubeUrl, fetchYouTubeMetadata } from '../../services/youtubeService';

interface AddYouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddYouTubeModal: React.FC<AddYouTubeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addYouTubeLink, openVideoView } = useVideoLibrary();
  const { playVideo } = useVideoPlayer();

  const [inputUrl, setInputUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const category = 'videoclipe';
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live preview state
  const [previewInfo, setPreviewInfo] = useState<{
    videoId: string;
    isShort: boolean;
    title?: string;
    channelTitle?: string;
    thumbnailUrl?: string;
  } | null>(null);

  useEffect(() => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setPreviewInfo(null);
      setError(null);
      return;
    }

    const parsed = parseYouTubeUrl(trimmed);
    if (!parsed.videoId) {
      setPreviewInfo(null);
      return;
    }

    let isMounted = true;
    setPreviewInfo({
      videoId: parsed.videoId,
      isShort: parsed.isShort,
      thumbnailUrl: `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`,
    });

    fetchYouTubeMetadata(parsed.videoId, parsed.isShort)
      .then((meta) => {
        if (isMounted) {
          setPreviewInfo({
            videoId: parsed.videoId!,
            isShort: parsed.isShort,
            title: meta.title,
            channelTitle: meta.channelTitle,
            thumbnailUrl: meta.thumbnailUrl,
          });
          if (!customTitle && meta.title) {
            setCustomTitle(meta.title);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [inputUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const tags: string[] = [category];
      if (previewInfo?.isShort) tags.push('Short');

      const added = await addYouTubeLink(inputUrl, tags, customTitle, notes, category);
      setIsLoading(false);
      setInputUrl('');
      setCustomTitle('');
      setNotes('');
      onClose();
      // Instantly play and open the video
      playVideo(added);
      openVideoView(added);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar link na nuvem.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex items-center justify-center">
              <Youtube className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Adicionar ao Player do Tyrone</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                O link será gravado diretamente no banco de dados em nuvem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          {/* URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-[#1DB954]" />
                URL do Vídeo ou Short
              </span>
              <span className="text-[11px] text-zinc-500">youtube.com ou youtu.be</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: https://www.youtube.com/watch?v=... ou /shorts/..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-white/10 focus:border-[#1DB954] text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => setInputUrl('')}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Live Preview Card */}
          {previewInfo && (
            <div className="p-3 rounded-xl bg-[#121212] border border-white/10 flex gap-3 items-center">
              <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                <img
                  src={previewInfo.thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                {previewInfo.isShort && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-amber-500 text-[8px] font-bold text-black uppercase">
                    Short
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-center overflow-hidden">
                <div className="flex items-center gap-1.5 text-[#1DB954] text-[11px] font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Vídeo Identificado</span>
                </div>
                <h4 className="text-xs font-semibold text-white truncate mt-0.5">
                  {previewInfo.title || 'Carregando dados...'}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  Canal: {previewInfo.channelTitle || 'YouTube'}
                </p>
              </div>
            </div>
          )}

          {/* Custom Title (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Título Customizado (Opcional)
            </label>
            <input
              type="text"
              placeholder="Deixe em branco para usar o original"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#121212] border border-white/10 focus:border-[#1DB954] text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Category: Exclusively Video Clip */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#14121b] border border-white/10">
            <div className="flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-300">Categoria:</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold text-xs border border-cyan-500/30">
              🎬 Vídeo Clip
            </span>
          </div>

          {/* Cloud Database Guarantee Banner */}
          <div className="p-3 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/25 text-[#1DB954] text-xs flex items-center gap-2">
            <Cloud className="w-4 h-4 shrink-0" />
            <span>
              <strong>Gravado em Nuvem Permanente:</strong> Este vídeo fica armazenado no banco em nuvem e será sincronizado em tempo real para qualquer pessoa que acessar o link.
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold shadow-lg shadow-[#1DB954]/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando na nuvem...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Salvar na Nuvem & Assistir</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
