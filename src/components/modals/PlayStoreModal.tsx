import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PlayStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStoreModal: React.FC<PlayStoreModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'playstore'>('quick');

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#181818] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center text-black font-extrabold shadow-md shadow-[#1DB954]/25">
              <Smartphone className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Transformar em App & Play Store
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] text-[10px] font-bold">
                  PWA Ativo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Instale no seu celular agora ou publique na Google Play Store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#141414] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quick'
                ? 'border-[#1DB954] text-[#1DB954]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Instalar no Celular Agora</span>
          </button>
          <button
            onClick={() => setActiveTab('playstore')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'playstore'
                ? 'border-[#1DB954] text-[#1DB954]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. Publicar na Google Play Store</span>
          </button>
        </div>

        {/* Tab 1: Quick Install on Phone */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
          {activeTab === 'quick' && (
            <>
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#1DB954]/15 via-emerald-900/10 to-transparent border border-[#1DB954]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                    <span>Seu app já está pronto para instalar!</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    Ele funciona como um aplicativo real: tem ícone na tela inicial, abre em tela cheia sem a barra do navegador e guarda suas músicas em cache.
                  </p>
                </div>

                {isInstalled ? (
                  <div className="px-4 py-2 rounded-full bg-emerald-500/20 text-[#1DB954] text-xs font-bold border border-[#1DB954]/30 flex items-center gap-1.5 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Já Instalado</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-extrabold shadow-lg shadow-[#1DB954]/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Download className="w-4 h-4 stroke-[3]" />
                    <span>Instalar no Celular</span>
                  </button>
                ) : isIOS ? (
                  <div className="text-xs text-zinc-300 bg-black/40 p-2.5 rounded-lg border border-white/5">
                    No iPhone: toque no ícone de <strong>Compartilhar</strong> no Safari e escolha <strong>"Adicionar à Tela de Início"</strong>.
                  </div>
                ) : (
                  <button
                    onClick={handleCopyUrl}
                    className="px-4 py-2 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1DB954]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>
                )}
              </div>

              {/* How to install on Android & iOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Android */}
                <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 space-y-2">
                  <div className="font-bold text-[#1DB954] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>No Android (Chrome)</span>
                  </div>
                  <ol className="list-decimal list-inside text-zinc-300 space-y-1">
                    <li>Abra este site no Google Chrome.</li>
                    <li>Toque nos <strong>3 pontinhos (⋮)</strong> no topo.</li>
                    <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    <li>O ícone aparecerá junto aos seus outros apps!</li>
                  </ol>
                </div>

                {/* iPhone */}
                <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 space-y-2">
                  <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>No iPhone (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside text-zinc-300 space-y-1">
                    <li>Abra este site no Safari.</li>
                    <li>Toque no botão de <strong>Compartilhar (quadrado com seta)</strong>.</li>
                    <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                    <li>Toque em <strong>Adicionar</strong> no topo direito.</li>
                  </ol>
                </div>
              </div>

              {/* App URL box */}
              <div className="p-3 rounded-xl bg-[#141414] border border-white/5 flex items-center justify-between gap-3 text-xs">
                <div className="truncate">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">
                    Link Direto do App
                  </span>
                  <span className="font-mono text-zinc-300 text-xs truncate block">
                    {currentAppUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#2c2c2c] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1DB954]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </>
          )}

          {/* Tab 2: Publish to Google Play Store */}
          {activeTab === 'playstore' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-[#1DB954]/30 text-zinc-300 leading-relaxed">
                <strong className="text-white font-bold block mb-1">
                  Sim! Você pode publicar exatamente este app na Google Play Store.
                </strong>
                O Google permite publicar PWAs na Play Store usando a tecnologia oficial chamada <strong>TWA (Trusted Web Activity)</strong>. O app fica disponível na loja para qualquer pessoa baixar como um arquivo <code>.apk</code> ou <code>.aab</code> normal!
              </div>

              {/* 3 Simple Steps */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <strong className="block text-white font-bold mb-1">
                    ⚠️ Atenção sobre qual URL colar no PWABuilder:
                  </strong>
                  <p className="text-zinc-300 leading-relaxed text-xs">
                    Não cole a URL que termina em <code>.ai.studio/</code>! Essa URL é o painel de edição do Google com login protegido. O robô do PWABuilder não tem sua senha e é bloqueado na tela de login, por isso diz que "não encontrou o manifesto".
                  </p>
                </div>

                <h5 className="font-bold text-white text-sm">
                  Como gerar o arquivo da Play Store em 3 passos:
                </h5>

                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1DB954] text-black font-extrabold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <strong className="text-white font-semibold block">
                      Obtenha a URL Pública ou Publique na Vercel/Netlify
                    </strong>
                    <p className="text-zinc-400">
                      Você pode usar a URL pública de compartilhamento (botão <strong>Share / Publish</strong> no topo do AI Studio) ou subir o código no <strong>GitHub + Vercel</strong> (gera um link como <code>playertyrone.vercel.app</code> 100% grátis e público).
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={handleCopyUrl}
                        className="px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1DB954]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar URL Direta do App</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1DB954] text-black font-extrabold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <strong className="text-white font-semibold block">
                      Cole a URL no PWABuilder (Gratuito)
                    </strong>
                    <p className="text-zinc-400">
                      Acesse <strong>pwabuilder.com</strong>, cole a URL pública e clique em Start. O manifesto e ícones que já configuramos receberão sinal verde.
                    </p>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#1DB954] hover:underline font-semibold mt-1"
                    >
                      <span>Abrir PWABuilder.com</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1DB954] text-black font-extrabold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <strong className="text-white font-semibold block">
                      Envie o arquivo no Google Play Console
                    </strong>
                    <p className="text-zinc-400">
                      Na sua conta de desenvolvedor Google (taxa única de $25 do Google), crie o app "Player do Tyrone", faça o upload do arquivo <code>.aab</code> e publique!
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements & Tips */}
              <div className="p-3.5 rounded-xl bg-[#141414] border border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dicas Importantes para Aprovação na Play Store:</span>
                </div>
                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                  <li>
                    <strong>Termos do YouTube:</strong> Como o app usa embeds oficiais do YouTube com iframe transparente, ele cumpre as diretrizes da API do YouTube.
                  </li>
                  <li>
                    <strong>Política de Privacidade:</strong> O Google exige um link de política de privacidade simples (informando que o app usa Firestore para salvar suas playlists).
                  </li>
                  <li>
                    <strong>Domínio Próprio (Recomendado):</strong> Para a Play Store, você pode conectar um domínio personalizado (ex: <code>seusite.com</code>) para gerar as chaves do Digital Asset Links.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141414] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            PWA configurado com Manifest, Service Worker e Ícones 512px
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
