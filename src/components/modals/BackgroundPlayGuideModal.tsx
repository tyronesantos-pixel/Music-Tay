import React from 'react';
import { X, Smartphone, Moon, Play, Volume2, ShieldCheck, HelpCircle } from 'lucide-react';

interface BackgroundPlayGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPocketMode: () => void;
}

export const BackgroundPlayGuideModal: React.FC<BackgroundPlayGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenPocketMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#181818] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Ouvir com Celular Bloqueado
              </h3>
              <p className="text-xs text-zinc-400">
                Dicas para reprodução contínua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-zinc-300">
          {/* Method 1: Lock Screen Play */}
          <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[#1DB954] font-bold text-sm">
              <Play className="w-4 h-4 fill-current" />
              <span>1. Controles na Tela de Bloqueio</span>
            </div>
            <p className="leading-relaxed text-zinc-400">
              Ao bloquear a tela do celular, o navegador pode tentar pausar o vídeo por economia de energia. No entanto, o <strong>Player do Tyrone</strong> envia os controles para a sua tela de bloqueio e fone de ouvido:
            </p>
            <div className="bg-[#121212] p-2.5 rounded-lg border border-white/5 font-mono text-[11px] text-zinc-300">
              👉 <strong>Basta apertar Play (▶)</strong> no widget da tela de bloqueio ou no botão do seu fone de ouvido para a música continuar tocando com a tela desligada!
            </div>
          </div>

          {/* Method 2: Pocket Mode (Modo Bolso) */}
          <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Moon className="w-4 h-4" />
              <span>2. Modo Bolso (Tela 100% Apagada)</span>
            </div>
            <p className="leading-relaxed text-zinc-400">
              Quer colocar o celular no bolso sem risco de toques acidentais e sem gastar bateria? Use o <strong>Modo Bolso</strong>. Ele deixa a tela totalmente preta (pixels desligados) e mantém o áudio tocando direto.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenPocketMode();
              }}
              className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Moon className="w-3.5 h-3.5 text-[#1DB954]" />
              <span>Ativar Modo Bolso Agora</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141414] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
