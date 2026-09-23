import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Trash2,
  KeyRound,
  Calendar,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminPanelModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    isAdmin,
    usersList,
    approveUserAccess,
    updateUserPassword,
    deleteUserAccount,
    resetAllRegisteredUsers,
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'blocked'>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !isAdmin) return null;

  const handleStatusChange = async (userId: string, newStatus: 'pending' | 'approved' | 'blocked') => {
    setFeedbackMsg(null);
    const res = await approveUserAccess(userId, newStatus);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Status do usuário atualizado para "${newStatus === 'approved' ? 'Aprovado / Liberado' : newStatus === 'blocked' ? 'Bloqueado' : 'Pendente'}"!`,
      });
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Falha ao atualizar status.' });
    }
  };

  const handleSavePassword = async (userId: string) => {
    if (newPassword.length < 4) {
      setFeedbackMsg({ type: 'error', text: 'A nova senha deve ter no mínimo 4 caracteres.' });
      return;
    }
    const res = await updateUserPassword(userId, newPassword);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Senha do usuário redefinida com sucesso!' });
      setEditingUserId(null);
      setNewPassword('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Falha ao redefinir senha.' });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${userEmail}?`)) return;
    const res = await deleteUserAccount(userId);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Usuário excluído com sucesso.' });
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Falha ao excluir usuário.' });
    }
  };

  const handleResetAllUsers = async () => {
    const confirmPrompt = window.confirm(
      'ATENÇÃO: Deseja eliminar TODOS os cadastros existentes no banco e manter SOMENTE a sua conta de Admin (tayrone.santos1120@gmail.com)?'
    );
    if (!confirmPrompt) return;

    setIsResettingAll(true);
    setFeedbackMsg(null);
    try {
      const res = await resetAllRegisteredUsers();
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: 'Todos os cadastros anteriores foram limpos! Apenas o seu login de Administrador Mestre permanece ativo.',
        });
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Erro ao resetar usuários.' });
      }
    } finally {
      setIsResettingAll(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (statusFilter !== 'all' && u.accessStatus !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchName = u.name.toLowerCase().includes(q);
      return matchEmail || matchName;
    }
    return true;
  });

  const pendingCount = usersList.filter((u) => u.accessStatus === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#14121d] border border-violet-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#191624]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
              <ShieldCheck className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Painel Administrativo</h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/30">
                  Tempo Real Ativo
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gerencie quem pode acessar seu app e aprove novos cadastros instantaneamente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset all button */}
            <button
              onClick={handleResetAllUsers}
              disabled={isResettingAll}
              title="Resetar e limpar todos os usuários cadastrados (exceto você)"
              className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingAll ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Resetar Todos Cadastros</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-500/20'
                : 'bg-rose-950/80 text-rose-300 border-b border-rose-500/20'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-[11px] underline opacity-75 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Filters & Actions Bar */}
        <div className="p-4 border-b border-white/5 bg-[#121018] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-[#1b1825] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#1b1825] text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({usersList.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#1b1825] text-amber-300 hover:text-white'
              }`}
            >
              <span>Aguardando Liberação</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-extrabold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1b1825] text-emerald-400 hover:text-white'
              }`}
            >
              Aprovados
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'blocked'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#1b1825] text-rose-400 hover:text-white'
              }`}
            >
              Bloqueados
            </button>
          </div>
        </div>

        {/* Users Table / List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2.5">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
              <Users className="w-8 h-8 opacity-40" />
              <span>Nenhum usuário encontrado neste filtro.</span>
            </div>
          ) : (
            filteredUsers.map((item) => {
              const isMaster = item.role === 'admin';
              const isPending = item.accessStatus === 'pending';
              const isApproved = item.accessStatus === 'approved';
              const isBlocked = item.accessStatus === 'blocked';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPending
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : isBlocked
                      ? 'bg-rose-950/20 border-rose-500/20 opacity-75'
                      : 'bg-[#181522] border-white/5 hover:border-violet-500/20'
                  }`}
                >
                  {/* Left: User Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl text-white text-xs font-black flex items-center justify-center shrink-0 shadow-md ${
                        isMaster
                          ? 'bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500'
                          : isApproved
                          ? 'bg-emerald-600'
                          : isPending
                          ? 'bg-amber-600'
                          : 'bg-zinc-700'
                      }`}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">{item.name}</span>
                        {isMaster ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-600 text-white">
                            ADMIN MESTRE
                          </span>
                        ) : isPending ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            Aguardando Liberação
                          </span>
                        ) : isApproved ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Acesso Liberado
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Bloqueado
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-400 truncate mt-0.5">{item.email}</div>

                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Cadastrado: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        {item.lastLoginAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Último login: {new Date(item.lastLoginAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {!isMaster && (
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-wrap sm:flex-nowrap">
                      {/* Approve button */}
                      {!isApproved && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Liberar Acesso</span>
                        </button>
                      )}

                      {/* Block button */}
                      {isApproved && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'blocked')}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Bloquear temporariamente"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Bloquear</span>
                        </button>
                      )}

                      {/* Change Password Trigger */}
                      <button
                        onClick={() => {
                          setEditingUserId(editingUserId === item.id ? null : item.id);
                          setNewPassword('');
                        }}
                        className="p-1.5 rounded-xl bg-[#221f2f] hover:bg-[#2c283d] text-zinc-300 hover:text-cyan-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                        title="Redefinir senha deste usuário"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(item.id, item.email)}
                        className="p-1.5 rounded-xl bg-[#221f2f] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 text-xs border border-white/10 transition-colors cursor-pointer"
                        title="Excluir conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Inline Reset Password Form */}
                  {editingUserId === item.id && (
                    <div className="w-full mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha..."
                        className="flex-1 bg-[#121018] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={() => handleSavePassword(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Salvar Senha
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#121018] flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Administrador Mestre: tayrone.santos1120@gmail.com
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#242131] hover:bg-[#2f2b40] text-white font-bold cursor-pointer transition-colors"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
