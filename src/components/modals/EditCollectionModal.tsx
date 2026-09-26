import React, { useState, useEffect } from 'react';
import {
  Layers,
  X,
  Check,
  Film,
  Palette,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { YouTubeCollection } from '../../services/youtubeService';

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: YouTubeCollection | null;
}

export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  isOpen,
  onClose,
  collection,
}) => {
  const { updateCollection } = useVideoLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const category = 'videoclipe';
  const [color, setColor] = useState<string>('violet');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (collection) {
      setName(collection.name || '');
      setDescription(collection.description || '');
      setColor(collection.color || 'violet');
    }
  }, [collection]);

  if (!isOpen || !collection) return null;

  const colorOptions = [
    { id: 'violet', label: 'Violeta Neon', bg: 'bg-violet-600', border: 'border-violet-400' },
    { id: 'cyan', label: 'Ciano Cyber', bg: 'bg-cyan-500', border: 'border-cyan-300' },
    { id: 'indigo', label: 'Índigo Real', bg: 'bg-indigo-600', border: 'border-indigo-400' },
    { id: 'rose', label: 'Rose Pink', bg: 'bg-rose-500', border: 'border-rose-400' },
    { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500', border: 'border-emerald-400' },
    { id: 'amber', label: 'Âmbar Dourado', bg: 'bg-amber-500', border: 'border-amber-400' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    await updateCollection(collection.id, {
      name: name.trim(),
      description: description.trim(),
      category,
      color,
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#16141f] border border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#13111a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Editar Playlist</h2>
              <p className="text-[11px] text-zinc-400">Personalize nome, tipo de mídia e cor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>Nome da Playlist</span>
              <span className="text-[10px] text-zinc-500">{name.length}/60</span>
            </label>
            <input
              type="text"
              required
              maxLength={60}
              placeholder="Ex: Meus Videoclipes Favoritos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0f0d14] border border-white/10 focus:border-violet-500 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-200">
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Adicione detalhes sobre o tema desta playlist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0f0d14] border border-white/10 focus:border-violet-500 text-xs text-white placeholder-zinc-500 outline-none resize-none transition-colors"
            />
          </div>

          {/* Escolher Cor do Tema */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-violet-400" />
              <span>Cor da Playlist</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {colorOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform flex items-center justify-center cursor-pointer ${
                    color === c.id ? `ring-2 ring-white ring-offset-2 ring-offset-[#16141f] scale-110` : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {color === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#221f2d] text-zinc-300 text-xs font-semibold hover:bg-[#2b273a] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/25 flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
