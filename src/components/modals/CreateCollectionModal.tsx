import React, { useState } from 'react';
import {
  Layers,
  X,
  Plus,
  Film,
  Music,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createCollection } = useVideoLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'all' | 'musicas' | 'videoclipe' | 'games'>('all');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'videoclipe', label: 'Videoclipe', icon: <Film className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'musicas', label: 'Músicas', icon: <Music className="w-3.5 h-3.5 text-violet-400" /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'all', label: 'Misto', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    await createCollection(name.trim(), description.trim(), category);
    setIsLoading(false);
    setName('');
    setDescription('');
    setCategory('all');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#16141f] border border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#13111a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Criar Nova Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Nome da Playlist</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Melhores Clipes, Trap, Rock..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0f0d14] border border-white/10 focus:border-violet-500 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Categoria: Videoclipe, Músicas, Games, Misto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Tipo de Conteúdo</label>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((c) => {
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600/20 text-white shadow-sm'
                        : 'border-white/5 bg-[#0f0d14] text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    {c.icon}
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Descrição (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Ex: Minhas músicas favoritas para treinar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0f0d14] border border-white/10 focus:border-violet-500 text-xs text-white placeholder-zinc-500 outline-none resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-[#221f2d] text-zinc-300 text-xs font-semibold hover:bg-[#2b273a] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/25 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Criando...' : 'Criar Playlist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
