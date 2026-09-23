import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface StoredAccount extends AuthUser {
  passwordHash: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUser: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, emailOrUser: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'tyrone_player_auth_session_v1';
const ACCOUNTS_STORAGE_KEY = 'tyrone_player_accounts_vault_v1';

const AuthContext = createContext<AuthContextType | null>(null);

// Simple reproducible hash function for client-side password matching
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${pass.length}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const session = localStorage.getItem(AUTH_STORAGE_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && parsed.id && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn('[Auth] Error restoring session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccounts = (): StoredAccount[] => {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch {
      // Fallback
    }
    return [];
  };

  const saveAccounts = (accounts: StoredAccount[]) => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('[Auth] Error saving account:', e);
    }
  };

  const login = async (
    emailOrUser: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanLogin = emailOrUser.trim().toLowerCase();
    if (!cleanLogin || !password) {
      return { success: false, error: 'Preencha o usuário/email e a senha.' };
    }

    const accounts = getAccounts();
    const targetHash = hashPassword(password);

    // Find account by email or username match
    const account = accounts.find(
      (acc) =>
        acc.email.toLowerCase() === cleanLogin ||
        acc.name.toLowerCase() === cleanLogin
    );

    if (!account) {
      return {
        success: false,
        error: 'Conta não encontrada. Clique na aba "Cadastre-se" para criar sua conta gratuitamente!',
      };
    }

    if (account.passwordHash !== targetHash) {
      return { success: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    const authUser: AuthUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      createdAt: account.createdAt,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const register = async (
    name: string,
    emailOrUser: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    const cleanLogin = emailOrUser.trim().toLowerCase();

    if (!cleanName) {
      return { success: false, error: 'Por favor, digite seu nome ou apelido.' };
    }

    if (!cleanLogin) {
      return { success: false, error: 'Por favor, digite um email ou nome de usuário.' };
    }

    if (password.length < 4) {
      return { success: false, error: 'A senha deve conter pelo menos 4 caracteres.' };
    }

    const accounts = getAccounts();

    // Check if account already exists
    const existing = accounts.find(
      (acc) => acc.email.toLowerCase() === cleanLogin
    );

    if (existing) {
      return {
        success: false,
        error: 'Este email ou usuário já está cadastrado. Você pode ir para a aba "Entrar".',
      };
    }

    const newAccount: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      email: cleanLogin,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = [...accounts, newAccount];
    saveAccounts(updatedAccounts);

    const authUser: AuthUser = {
      id: newAccount.id,
      email: newAccount.email,
      name: newAccount.name,
      createdAt: newAccount.createdAt,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
