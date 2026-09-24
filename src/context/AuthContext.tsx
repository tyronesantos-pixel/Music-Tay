import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  db,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
} from '../lib/firebase';

export type UserRole = 'admin' | 'user';
export type UserAccessStatus = 'approved' | 'pending' | 'blocked';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessStatus: UserAccessStatus;
  createdAt: string;
}

export interface UserProfile extends AuthUser {
  lastLoginAt?: string;
}

export interface StoredAccount extends AuthUser {
  nameLower?: string;
  username?: string;
  passwordHash: string;
  plainPassword?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (emailOrUser: string, password: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  register: (name: string, emailOrUser: string, password: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  logout: () => void;
  // Admin Management Actions (Real-time Cloud)
  usersList: UserProfile[];
  approveUserAccess: (userId: string, newStatus: UserAccessStatus) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteUserAccount: (userId: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  resetAllRegisteredUsers: () => Promise<{ success: boolean; error?: string }>;
}

const AUTH_STORAGE_KEY = 'tyrone_player_auth_session_v4';
const ACCOUNTS_STORAGE_KEY = 'tyrone_player_accounts_vault_v4';
const USERS_COLLECTION = 'users';

// Admin master credentials requested by the user
export const ADMIN_EMAIL = 'tayrone.santos1120@gmail.com';
export const ADMIN_INITIAL_PASS = '112025';

const AuthContext = createContext<AuthContextType | null>(null);

// Deterministic hashing for universal cross-browser/cross-device matching
function hashPassword(pass: string): string {
  let hash = 0;
  const p = pass.trim();
  for (let i = 0; i < p.length; i++) {
    const char = p.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${p.length}`;
}

// Clean alphanumeric ID for Firestore document keys
function sanitizeDocId(input: string): string {
  return 'u_' + input.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // 1. Initialize session and ensure Master Admin is initialized in Cloud Firestore
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Restore session from localStorage if present
        const session = localStorage.getItem(AUTH_STORAGE_KEY);
        if (session) {
          const parsed: AuthUser = JSON.parse(session);
          if (parsed && parsed.id && parsed.email) {
            setUser(parsed);
          }
        }

        // Guarantee Master Admin exists in Cloud Firestore
        const adminDocId = sanitizeDocId(ADMIN_EMAIL);
        const adminRef = doc(db, USERS_COLLECTION, adminDocId);
        
        const masterAdminData: StoredAccount = {
          id: 'admin_tayrone_master',
          name: 'Tyrone Santos (Admin)',
          nameLower: 'tyrone santos (admin)',
          email: ADMIN_EMAIL.toLowerCase(),
          username: 'tayrone',
          role: 'admin',
          accessStatus: 'approved',
          passwordHash: hashPassword(ADMIN_INITIAL_PASS),
          plainPassword: ADMIN_INITIAL_PASS,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        // Write/update master admin record
        await setDoc(adminRef, masterAdminData, { merge: true }).catch(() => {});
      } catch (e) {
        console.warn('[Auth] Init auth warning:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 2. Real-time Subscription to Users collection (Real-time live updates)
  useEffect(() => {
    try {
      const colRef = collection(db, USERS_COLLECTION);
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          const list: UserProfile[] = [];
          snap.forEach((d) => {
            const data = d.data();
            const email = (data.email || '').toLowerCase().trim();
            const isAdminAcc = email === ADMIN_EMAIL.toLowerCase();

            list.push({
              id: data.id || d.id,
              name: data.name || (isAdminAcc ? 'Tyrone Santos (Admin)' : 'Usuário'),
              email: data.email || d.id,
              role: isAdminAcc ? 'admin' : data.role || 'user',
              accessStatus: isAdminAcc ? 'approved' : data.accessStatus || 'pending',
              createdAt: data.createdAt || new Date().toISOString(),
              lastLoginAt: data.lastLoginAt,
            });
          });

          // Sort by creation date descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setUsersList(list);

          // If current logged-in user got blocked or status changed, sync state
          if (user && user.role !== 'admin') {
            const currentInDb = list.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
            if (currentInDb && (currentInDb.accessStatus !== user.accessStatus || currentInDb.role !== user.role)) {
              if (currentInDb.accessStatus === 'blocked') {
                setUser(null);
                localStorage.removeItem(AUTH_STORAGE_KEY);
              } else {
                const updated = { ...user, accessStatus: currentInDb.accessStatus, role: currentInDb.role };
                setUser(updated);
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
              }
            }
          }
        },
        (err) => {
          console.warn('[Auth] Realtime users subscription error:', err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('[Auth] Realtime subscription init error:', e);
    }
  }, [user]);

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
   * Universal Login across all browsers via Cloud Firestore + instant master admin guarantee
   */
  const login = async (
    emailOrUser: string,
    password: string
  ): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    const cleanLogin = emailOrUser.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanLogin || !cleanPass) {
      return { success: false, error: 'Preencha o usuário/email e a senha.' };
    }

    // 1. DIRECT MASTER ADMIN AUTHENTICATION
    // Accepts "tayrone.santos1120@gmail.com", "tayrone", or "tayrone santos"
    const isAdminEmail = cleanLogin === ADMIN_EMAIL.toLowerCase();
    const isAdminAlias = cleanLogin === 'tayrone' || cleanLogin === 'tayrone santos';

    if (isAdminEmail || isAdminAlias) {
      if (cleanPass === ADMIN_INITIAL_PASS) {
        const adminUser: AuthUser = {
          id: 'admin_tayrone_master',
          email: ADMIN_EMAIL,
          name: 'Tyrone Santos',
          role: 'admin',
          accessStatus: 'approved',
          createdAt: new Date().toISOString(),
        };

        setUser(adminUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));

        // Ensure record in Cloud Firestore is in sync
        const adminDocId = sanitizeDocId(ADMIN_EMAIL);
        setDoc(
          doc(db, USERS_COLLECTION, adminDocId),
          {
            id: 'admin_tayrone_master',
            name: 'Tyrone Santos (Admin)',
            email: ADMIN_EMAIL,
            role: 'admin',
            accessStatus: 'approved',
            passwordHash: hashPassword(ADMIN_INITIAL_PASS),
            plainPassword: ADMIN_INITIAL_PASS,
            lastLoginAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});

        return { success: true };
      }
    }

    const targetHash = hashPassword(cleanPass);
    let matchedAccount: StoredAccount | null = null;

    // 2. Fetch User from Cloud Firestore
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
          role: data.role || (data.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'),
          accessStatus: data.accessStatus || (data.role === 'admin' ? 'approved' : 'pending'),
          passwordHash: data.passwordHash || '',
          plainPassword: data.plainPassword,
          createdAt: data.createdAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt,
        };
      } else {
        // Query users in database
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
              role: data.role || (docEmail === ADMIN_EMAIL ? 'admin' : 'user'),
              accessStatus: data.accessStatus || 'pending',
              passwordHash: data.passwordHash || '',
              plainPassword: data.plainPassword,
              createdAt: data.createdAt || new Date().toISOString(),
              lastLoginAt: data.lastLoginAt,
            };
            break;
          }
        }
      }
    } catch (cloudErr) {
      console.warn('[Auth] Firestore query error, checking local fallback:', cloudErr);
    }

    // 3. Fallback to local accounts cache
    if (!matchedAccount) {
      const localAccounts = getLocalAccounts();
      matchedAccount =
        localAccounts.find((acc) => {
          const accEmail = acc.email.toLowerCase().trim();
          const accName = acc.name.toLowerCase().trim();
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
        error: 'Conta não encontrada. Verifique o email ou crie uma conta na aba "Criar Conta".',
      };
    }

    // 4. Verify Password (supports both hashed password and plain text check)
    const passMatch =
      matchedAccount.passwordHash === targetHash ||
      matchedAccount.plainPassword === cleanPass ||
      matchedAccount.passwordHash === cleanPass;

    if (!passMatch) {
      return { success: false, error: 'Senha incorreta. Verifique a senha e tente novamente.' };
    }

    // 5. Verify Approval Status
    if (matchedAccount.role !== 'admin') {
      if (matchedAccount.accessStatus === 'pending') {
        return {
          success: false,
          pendingApproval: true,
          error: 'Sua conta foi criada e está aguardando liberação do administrador para acessar o app.',
        };
      }

      if (matchedAccount.accessStatus === 'blocked') {
        return {
          success: false,
          error: 'Este acesso foi desativado pelo administrador. Entre em contato com o suporte.',
        };
      }
    }

    const authUser: AuthUser = {
      id: matchedAccount.id,
      email: matchedAccount.email,
      name: matchedAccount.name,
      role: matchedAccount.role,
      accessStatus: matchedAccount.accessStatus,
      createdAt: matchedAccount.createdAt,
    };

    // 6. Save session and local cache
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
   * Universal Registration
   */
  const register = async (
    name: string,
    emailOrUser: string,
    password: string
  ): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    const cleanName = name.trim();
    const cleanLogin = emailOrUser.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanName) {
      return { success: false, error: 'Por favor, digite seu nome ou apelido.' };
    }

    if (!cleanLogin) {
      return { success: false, error: 'Por favor, digite um email ou nome de usuário.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, error: 'A senha deve conter pelo menos 4 caracteres.' };
    }

    const docId = sanitizeDocId(cleanLogin);
    const targetHash = hashPassword(cleanPass);
    const isAdminAccount = cleanLogin === ADMIN_EMAIL.toLowerCase();

    // 1. Check if user already exists
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
      id: isAdminAccount ? 'admin_tayrone_master' : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      nameLower: cleanName.toLowerCase(),
      email: cleanLogin,
      username: cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin,
      role: isAdminAccount ? 'admin' : 'user',
      accessStatus: isAdminAccount ? 'approved' : 'pending',
      passwordHash: targetHash,
      plainPassword: cleanPass,
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
        error: 'Não foi possível salvar os dados no banco: ' + (cloudErr?.message || 'Falha de conexão.'),
      };
    }

    // 4. Save local backup cache
    saveLocalAccount(newAccount);

    // 5. If this is Admin, log in immediately. Otherwise, pending approval.
    if (isAdminAccount) {
      const authUser: AuthUser = {
        id: newAccount.id,
        email: newAccount.email,
        name: newAccount.name,
        role: 'admin',
        accessStatus: 'approved',
        createdAt: newAccount.createdAt,
      };
      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return { success: true };
    }

    return {
      success: true,
      pendingApproval: true,
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // --- Admin Methods ---

  const approveUserAccess = async (
    userId: string,
    newStatus: UserAccessStatus
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const snap = await getDocs(collection(db, USERS_COLLECTION));
      let docToUpdate = '';
      snap.forEach((d) => {
        const data = d.data();
        if (data.id === userId || d.id === userId) {
          docToUpdate = d.id;
        }
      });

      if (!docToUpdate) {
        docToUpdate = sanitizeDocId(userId);
      }

      await setDoc(doc(db, USERS_COLLECTION, docToUpdate), { accessStatus: newStatus }, { merge: true });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao alterar permissão.' };
    }
  };

  const updateUserPassword = async (
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const newHash = hashPassword(newPassword);
      const snap = await getDocs(collection(db, USERS_COLLECTION));
      let docToUpdate = '';
      snap.forEach((d) => {
        const data = d.data();
        if (data.id === userId || d.id === userId) {
          docToUpdate = d.id;
        }
      });

      if (!docToUpdate) {
        docToUpdate = sanitizeDocId(userId);
      }

      await setDoc(
        doc(db, USERS_COLLECTION, docToUpdate),
        { passwordHash: newHash, plainPassword: newPassword },
        { merge: true }
      );
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao atualizar senha.' };
    }
  };

  const deleteUserAccount = async (
    userId: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanTargetEmail = (email || '').toLowerCase().trim();
      const cleanTargetId = (userId || '').trim();

      // Master admin protection
      if (
        cleanTargetEmail === ADMIN_EMAIL.toLowerCase() ||
        cleanTargetId === 'admin_tayrone_master' ||
        cleanTargetId === ADMIN_EMAIL.toLowerCase()
      ) {
        return { success: false, error: 'A conta de Administrador Mestre não pode ser excluída.' };
      }

      const snap = await getDocs(collection(db, USERS_COLLECTION));
      const docsToDelete: string[] = [];

      snap.forEach((d) => {
        const data = d.data();
        const docEmail = (data.email || '').toLowerCase().trim();
        const docId = d.id;
        const dataId = data.id || '';

        // Never delete master admin
        if (docEmail === ADMIN_EMAIL.toLowerCase() || docId === sanitizeDocId(ADMIN_EMAIL)) {
          return;
        }

        const matchId = cleanTargetId && (docId === cleanTargetId || dataId === cleanTargetId);
        const matchEmail =
          cleanTargetEmail &&
          (docEmail === cleanTargetEmail || docId === sanitizeDocId(cleanTargetEmail));
        const matchTargetAsEmail =
          cleanTargetId.includes('@') && docEmail === cleanTargetId.toLowerCase();

        if (matchId || matchEmail || matchTargetAsEmail) {
          docsToDelete.push(docId);
        }
      });

      // Also try direct docId if none found via iteration
      if (docsToDelete.length === 0 && cleanTargetEmail) {
        docsToDelete.push(sanitizeDocId(cleanTargetEmail));
      }

      for (const dId of docsToDelete) {
        try {
          await deleteDoc(doc(db, USERS_COLLECTION, dId));
        } catch (delErr) {
          console.warn('[Auth] Delete doc warning for', dId, delErr);
        }
      }

      // Also clean user's library in Firestore if exists
      const libraryDocId = cleanTargetEmail
        ? cleanTargetEmail.replace(/[^a-z0-9_.-]/g, '_')
        : cleanTargetId.replace(/[^a-z0-9_.-]/g, '_');
      try {
        await deleteDoc(doc(db, 'user_libraries', libraryDocId));
      } catch (_) {}

      // Clean from local accounts cache
      try {
        const currentAccounts = getLocalAccounts();
        const filteredAccounts = currentAccounts.filter((acc) => {
          const aEmail = acc.email.toLowerCase().trim();
          const aId = acc.id;
          return aEmail !== cleanTargetEmail && aId !== cleanTargetId;
        });
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filteredAccounts));
      } catch (_) {}

      // Immediately update local usersList state
      setUsersList((prev) =>
        prev.filter((u) => {
          const uEmail = u.email.toLowerCase().trim();
          const uId = u.id;
          return (
            uEmail !== cleanTargetEmail &&
            uId !== cleanTargetId &&
            (!cleanTargetId.includes('@') || uEmail !== cleanTargetId.toLowerCase())
          );
        })
      );

      return { success: true };
    } catch (e: any) {
      console.error('[Auth] Error in deleteUserAccount:', e);
      return { success: false, error: e?.message || 'Erro ao excluir usuário.' };
    }
  };

  /**
   * RESET ALL REGISTERED USERS: Cleans out old / test registered accounts,
   * keeping only the Master Admin (tayrone.santos1120@gmail.com / 112025) fresh and ready.
   */
  const resetAllRegisteredUsers = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const snap = await getDocs(collection(db, USERS_COLLECTION));
      const deletePromises: Promise<void>[] = [];

      snap.forEach((d) => {
        const data = d.data();
        const email = (data.email || '').toLowerCase().trim();
        // Do not delete master admin
        if (email !== ADMIN_EMAIL.toLowerCase()) {
          deletePromises.push(deleteDoc(doc(db, USERS_COLLECTION, d.id)));
        }
      });

      await Promise.all(deletePromises);

      // Re-assert master admin account
      const adminDocId = sanitizeDocId(ADMIN_EMAIL);
      const masterAdminData: StoredAccount = {
        id: 'admin_tayrone_master',
        name: 'Tyrone Santos (Admin)',
        nameLower: 'tyrone santos (admin)',
        email: ADMIN_EMAIL.toLowerCase(),
        username: 'tayrone',
        role: 'admin',
        accessStatus: 'approved',
        passwordHash: hashPassword(ADMIN_INITIAL_PASS),
        plainPassword: ADMIN_INITIAL_PASS,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(doc(db, USERS_COLLECTION, adminDocId), masterAdminData, { merge: true });

      // Clean local storage cache
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([masterAdminData]));

      return { success: true };
    } catch (e: any) {
      console.error('[Auth] Error resetting registered users:', e);
      return { success: false, error: e?.message || 'Erro ao resetar usuários.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin' || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
        isLoading,
        login,
        register,
        logout,
        usersList,
        approveUserAccess,
        updateUserPassword,
        deleteUserAccount,
        resetAllRegisteredUsers,
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
