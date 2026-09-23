import React, { useState } from 'react';
import { Layers, X, Plus } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    await createCollection(name.trim(), description.trim());
    setIsLoading(false);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Criar Nova Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Nome da Playlist</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Melhores Clipes, Trap, Rock..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 focus:border-[#1DB954] text-xs text-white placeholder-zinc-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Descrição (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Ex: Minhas músicas favoritas para treinar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 focus:border-[#1DB954] text-xs text-white placeholder-zinc-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-[#242424] text-white text-xs font-semibold hover:bg-[#2e2e2e]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-black text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
