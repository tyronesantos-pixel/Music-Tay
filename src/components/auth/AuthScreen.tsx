import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PlayerLogo } from '../common/PlayerLogo';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await login(emailOrUser, password);
        if (!result.success) {
          if (result.pendingApproval) {
            setPendingNotice(result.error || 'Seu cadastro está aguardando liberação do administrador.');
          } else {
            setError(result.error || 'Erro ao entrar. Verifique seus dados.');
          }
        }
      } else {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
          setIsSubmitting(false);
          return;
        }

        const result = await register(name, emailOrUser, password);
        if (!result.success) {
          setError(result.error || 'Erro ao criar conta.');
        } else if (result.pendingApproval) {
          setPendingNotice(
            'Conta criada com sucesso! Solicitação enviada. Assim que o administrador liberar seu acesso, você poderá fazer login normalmente.'
          );
          setMode('login');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0812] relative overflow-hidden font-sans select-none">
      {/* Ambient background glowing orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Card */}
        <div className="bg-[#14121d]/90 backdrop-blur-xl border border-violet-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-950/40 flex flex-col gap-6">
          {/* Top Logo & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 scale-110">
              <PlayerLogo size="lg" animate />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Player do Tyrone
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Vídeo clipes do YouTube com reprodução sem interrupção e salvamento em nuvem.
            </p>
          </div>

          {/* Tab Switcher: Entrar vs Cadastre-se */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#0d0b14] border border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setPendingNotice(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setPendingNotice(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name field (only for register) */}
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Seu Nome ou Apelido
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-[#0d0b14] border border-white/10 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email or Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                {mode === 'register' ? 'Email ou Nome de Usuário' : 'Email ou Usuário'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  placeholder={mode === 'register' ? 'seuemail@exemplo.com ou seu.usuario' : 'Digite seu email ou usuário'}
                  className="w-full bg-[#0d0b14] border border-white/10 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full bg-[#0d0b14] border border-white/10 focus:border-violet-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only for register) */}
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full bg-[#0d0b14] border border-white/10 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Pending Notice Message */}
            {pendingNotice && (
              <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pendingNotice}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Player</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              ) : (
                <>
                  <span>Solicitar Acesso</span>
                  <Sparkles className="w-4 h-4 fill-current" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-white/10 text-center">
            <p className="text-[11px] text-zinc-500">
              {mode === 'login' ? (
                <>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setPendingNotice(null);
                    }}
                    className="text-cyan-400 hover:underline font-bold cursor-pointer"
                  >
                    Cadastre-se grátis
                  </button>
                </>
              ) : (
                <>
                  Já possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setPendingNotice(null);
                    }}
                    className="text-violet-400 hover:underline font-bold cursor-pointer"
                  >
                    Faça login aqui
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Acesso Protegido • Banco em Nuvem Global</span>
        </div>
      </div>
    </div>
  );
};
