import React, { useRef, useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle,
  Download,
  Upload,
  Cloud,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useVideoLibrary } from '../../context/VideoLibraryContext';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    videos,
    collections,
    isSyncing,
    isCloudConnected,
    lastGlobalSync,
    autoSyncEnabled,
    syncIntervalMinutes,
    syncAllVideos,
    setAutoSyncEnabled,
    exportLibrary,
    importLibrary,
  } = useVideoLibrary();

  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = await importLibrary(text);
        if (ok) {
          setImportSuccess('Vídeos sincronizados com sucesso na nuvem!');
          setTimeout(() => setImportSuccess(null), 3000);
        } else {
          alert('Arquivo JSON inválido.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formattedLastSync = lastGlobalSync
    ? new Date(lastGlobalSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Agora';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Banco de Dados em Nuvem</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Sincronização em tempo real permanente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Status Live Banner */}
          <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Nuvem Conectada em Tempo Real
                </span>
                <p className="text-[11px] text-zinc-300">
                  Última sincronização: <strong>{formattedLastSync}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => syncAllVideos()}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md shadow-violet-600/25"
            >
              {isSyncing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#121212] border border-white/5 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Vídeos na Nuvem</span>
              <p className="text-lg font-extrabold text-white mt-0.5">{videos.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-white/5 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Coleções</span>
              <p className="text-lg font-extrabold text-white mt-0.5">{collections.length}</p>
            </div>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white">Sincronização Contínua</span>
              <p className="text-[10px] text-zinc-400">Atualiza capas e títulos com o YouTube</p>
            </div>
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                autoSyncEnabled ? 'bg-violet-600' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  autoSyncEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Backup & Restore */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Backup dos Seus Links da Nuvem
            </span>

            {importSuccess && (
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{importSuccess}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={exportLibrary}
                className="flex-1 py-2 px-3 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exportar JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-violet-400" />
                <span>Importar JSON</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#121212] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-white text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
