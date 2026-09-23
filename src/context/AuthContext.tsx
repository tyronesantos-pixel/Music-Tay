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
  username?: string;
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

// Deterministic hashing for universal cross-browser/cross-device matching
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${pass.length}`;
}

// Clean alphanumeric ID for Firestore document keys
function sanitizeDocId(input: string): string {
  return 'u_' + input.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
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
        if (parsed && parsed.id && (parsed.email || parsed.name)) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn('[Auth] Error restoring session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Local accounts backup cache
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

    // 1. Check in Cloud Firestore
    try {
      const docId = sanitizeDocId(cleanLogin);
      const userDocRef = doc(db, USERS_COLLECTION, docId);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data();
        matchedAccount = {
          id: data.id || snap.id,
          name: data.name || cleanLogin,
          nameLower: data.nameLower || (data.name ? data.name.toLowerCase() : cleanLogin),
          email: data.email || cleanLogin,
          username: data.username,
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
            username: data.username,
            passwordHash: data.passwordHash || '',
            createdAt: data.createdAt || new Date().toISOString(),
            lastLoginAt: data.lastLoginAt,
          };
        } else {
          // Query by nameLower
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
              username: data.username,
              passwordHash: data.passwordHash || '',
              createdAt: data.createdAt || new Date().toISOString(),
              lastLoginAt: data.lastLoginAt,
            };
          } else {
            // Broad search over all registered users in the database
            const allUsersSnap = await getDocs(collection(db, USERS_COLLECTION));
            for (const docItem of allUsersSnap.docs) {
              const data = docItem.data();
              const docEmail = (data.email || '').toLowerCase().trim();
              const docName = (data.name || '').toLowerCase().trim();
              const docUsername = (data.username || '').toLowerCase().trim();
              const emailPrefix = docEmail.includes('@') ? docEmail.split('@')[0] : '';

              if (
                docEmail === cleanLogin ||
                docName === cleanLogin ||
                docUsername === cleanLogin ||
                (emailPrefix && emailPrefix === cleanLogin)
              ) {
                matchedAccount = {
                  id: data.id || docItem.id,
                  name: data.name || cleanLogin,
                  nameLower: data.nameLower || docName,
                  email: data.email || cleanLogin,
                  username: data.username,
                  passwordHash: data.passwordHash || '',
                  createdAt: data.createdAt || new Date().toISOString(),
                  lastLoginAt: data.lastLoginAt,
                };
                break;
              }
            }
          }
        }
      }
    } catch (cloudErr) {
      console.warn('[Auth] Firestore query error, checking local fallback:', cloudErr);
    }

    // 2. Fallback to local accounts cache if Firestore was offline or network delayed
    if (!matchedAccount) {
      const localAccounts = getLocalAccounts();
      matchedAccount =
        localAccounts.find((acc) => {
          const accEmail = acc.email.toLowerCase();
          const accName = acc.name.toLowerCase();
          const emailPrefix = accEmail.includes('@') ? accEmail.split('@')[0] : '';
          return (
            accEmail === cleanLogin ||
            accName === cleanLogin ||
            (emailPrefix && emailPrefix === cleanLogin)
          );
        }) || null;
    }

    if (!matchedAccount) {
      return {
        success: false,
        error: 'Conta não encontrada. Verifique o email/usuário digitado ou crie sua conta na aba "Criar Conta"!',
      };
    }

    // 3. Verify Password
    if (matchedAccount.passwordHash !== targetHash) {
      return { success: false, error: 'Senha incorreta. Verifique a senha e tente novamente.' };
    }

    const authUser: AuthUser = {
      id: matchedAccount.id,
      email: matchedAccount.email,
      name: matchedAccount.name,
      createdAt: matchedAccount.createdAt,
    };

    // 4. Save session and local cache
    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    saveLocalAccount(matchedAccount);

    // Update lastLoginAt in Firestore
    try {
      const docId = sanitizeDocId(matchedAccount.email);
      setDoc(doc(db, USERS_COLLECTION, docId), { lastLoginAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch {
      // Ignore background update
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

    const docId = sanitizeDocId(cleanLogin);
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
      username: cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin,
      passwordHash: targetHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // 3. Save directly to Cloud Firestore
    try {
      await setDoc(doc(db, USERS_COLLECTION, docId), newAccount, { merge: true });
    } catch (cloudErr: any) {
      console.error('[Auth] Failed to write user to Cloud Firestore:', cloudErr);
      return {
        success: false,
        error:
          'Não foi possível salvar os dados no banco em nuvem: ' +
          (cloudErr?.message || 'Falha de conexão. Tente novamente.'),
      };
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
