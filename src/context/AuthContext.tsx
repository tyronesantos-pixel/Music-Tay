import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from '../lib/firebase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface StoredAccount extends AuthUser {
  nameLower?: string;
  passwordHash: string;
  lastLoginAt?: string;
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
const USERS_COLLECTION = 'users';

const AuthContext = createContext<AuthContextType | null>(null);

// Deterministic hashing for cross-browser password matching
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${pass.length}`;
}

// Generates safe, consistent document ID for Firestore
function encodeUserDocId(emailOrUser: string): string {
  return 'u_' + encodeURIComponent(emailOrUser.trim().toLowerCase()).replace(/[%.-]/g, '_');
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

  // Local accounts cache helpers
  const getLocalAccounts = (): StoredAccount[] => {
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

  const saveLocalAccount = (account: StoredAccount) => {
    try {
      const current = getLocalAccounts().filter(
        (a) => a.email.toLowerCase() !== account.email.toLowerCase()
      );
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([...current, account]));
    } catch (e) {
      console.warn('[Auth] Local account save error:', e);
    }
  };

  /**
   * Universal Login across all browsers via Cloud Firestore
   */
  const login = async (
    emailOrUser: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanLogin = emailOrUser.trim().toLowerCase();
    if (!cleanLogin || !password) {
      return { success: false, error: 'Preencha o usuário/email e a senha.' };
    }

    const targetHash = hashPassword(password);
    let matchedAccount: StoredAccount | null = null;

    // 1. Try finding user in Firestore Cloud Database (works in any browser/device!)
    try {
      // Direct doc ID check
      const docId = encodeUserDocId(cleanLogin);
      const userDocRef = doc(db, USERS_COLLECTION, docId);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data();
        matchedAccount = {
          id: data.id || snap.id,
          name: data.name || cleanLogin,
          nameLower: data.nameLower || (data.name ? data.name.toLowerCase() : cleanLogin),
          email: data.email || cleanLogin,
          passwordHash: data.passwordHash || '',
          createdAt: data.createdAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt,
        };
      } else {
        // Query by email
        const qEmail = query(collection(db, USERS_COLLECTION), where('email', '==', cleanLogin));
        const emailSnap = await getDocs(qEmail);

        if (!emailSnap.empty) {
          const firstDoc = emailSnap.docs[0];
          const data = firstDoc.data();
          matchedAccount = {
            id: data.id || firstDoc.id,
            name: data.name || cleanLogin,
            nameLower: data.nameLower || cleanLogin,
            email: data.email || cleanLogin,
            passwordHash: data.passwordHash || '',
            createdAt: data.createdAt || new Date().toISOString(),
            lastLoginAt: data.lastLoginAt,
          };
        } else {
          // Query by nameLower / username
          const qName = query(collection(db, USERS_COLLECTION), where('nameLower', '==', cleanLogin));
          const nameSnap = await getDocs(qName);
          if (!nameSnap.empty) {
            const firstDoc = nameSnap.docs[0];
            const data = firstDoc.data();
            matchedAccount = {
              id: data.id || firstDoc.id,
              name: data.name || cleanLogin,
              nameLower: data.nameLower || cleanLogin,
              email: data.email || cleanLogin,
              passwordHash: data.passwordHash || '',
              createdAt: data.createdAt || new Date().toISOString(),
              lastLoginAt: data.lastLoginAt,
            };
          }
        }
      }
    } catch (cloudErr) {
      console.warn('[Auth] Firestore query error, checking local fallback:', cloudErr);
    }

    // 2. Fallback to local accounts cache if Firestore was offline
    if (!matchedAccount) {
      const localAccounts = getLocalAccounts();
      matchedAccount =
        localAccounts.find(
          (acc) =>
            acc.email.toLowerCase() === cleanLogin ||
            acc.name.toLowerCase() === cleanLogin
        ) || null;
    }

    if (!matchedAccount) {
      return {
        success: false,
        error: 'Conta não encontrada. Verifique os dados ou crie sua conta na aba "Criar Conta"!',
      };
    }

    // Verify Password
    if (matchedAccount.passwordHash !== targetHash) {
      return { success: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    const authUser: AuthUser = {
      id: matchedAccount.id,
      email: matchedAccount.email,
      name: matchedAccount.name,
      createdAt: matchedAccount.createdAt,
    };

    // Update session
    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    saveLocalAccount(matchedAccount);

    // Update lastLoginAt in Firestore
    try {
      const docId = encodeUserDocId(matchedAccount.email);
      setDoc(doc(db, USERS_COLLECTION, docId), { lastLoginAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch {
      // Ignore
    }

    return { success: true };
  };

  /**
   * Universal Registration with Cloud Database Persistence (accessible everywhere)
   */
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

    const docId = encodeUserDocId(cleanLogin);
    const targetHash = hashPassword(password);

    // 1. Check if user already exists in Cloud Firestore
    try {
      const existingDoc = await getDoc(doc(db, USERS_COLLECTION, docId));
      if (existingDoc.exists()) {
        return {
          success: false,
          error: 'Este email ou usuário já está cadastrado. Você pode ir para a aba "Entrar"!',
        };
      }
    } catch (e) {
      console.warn('[Auth] Check existing user cloud warning:', e);
    }

    // 2. Prepare user record
    const newAccount: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      nameLower: cleanName.toLowerCase(),
      email: cleanLogin,
      passwordHash: targetHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // 3. Save directly to Cloud Firestore so other browsers can authenticate immediately!
    try {
      await setDoc(doc(db, USERS_COLLECTION, docId), newAccount, { merge: true });
    } catch (cloudErr) {
      console.error('[Auth] Failed to write user to Cloud Firestore:', cloudErr);
    }

    // 4. Save local backup cache
    saveLocalAccount(newAccount);

    // 5. Establish user session
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
