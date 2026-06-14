import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithCredential, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';

// Tipagem simplificada compatível com o restante da aplicação
interface AuthContextType {
  session: any | null;
  user: { id: string; email: string; user_metadata?: { full_name?: string; avatar_url?: string }; isLocal?: boolean } | null;
  loading: boolean;
  authLoading: boolean;
  requireLocalPasswordSetup: boolean;
  setRequireLocalPasswordSetup: (v: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  loginAsLocal: () => Promise<void>;
  linkGuestToGoogle: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => void;
  handleGoogleCallback: (hash: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; user_metadata?: { full_name?: string; avatar_url?: string }; isLocal?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [requireLocalPasswordSetup, setRequireLocalPasswordSetup] = useState(false);

  useEffect(() => {
    let active = true;
    let unlistenFn: (() => void) | null = null;

    const initAuth = async () => {
      // 1. Setup Firebase Auth listener to automatically manage session
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!active) return;
        
        if (firebaseUser) {
          // Firebase authenticated user
          const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
          
          let userId = firebaseUser.uid;
          
          const tempUser = {
            id: userId,
            email: firebaseUser.email || '',
            user_metadata: { 
              full_name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Utilizador'),
              avatar_url: firebaseUser.photoURL || undefined
            },
            isLocal: false
          };

          // Save the mapping for Google users just in case
          if (isGoogle && firebaseUser.email) {
            localStorage.setItem(`vukapay_google_mapping_${firebaseUser.email.trim().toLowerCase()}`, userId);
          }

          localStorage.setItem('vukapay_user', JSON.stringify(tempUser));
          setUser(tempUser);
          
          // Ensure local profile exists for SQLite functionality
          try {
            const { getDatabase } = await import('@/database/db');
            const db = await getDatabase();
            const profiles = await db.select<any[]>('SELECT * FROM profiles WHERE id = $1', [userId]);
            
            if (!profiles[0]) {
              await db.execute(
                'INSERT INTO profiles (id, email, full_name, plan, role, created_at, vuka_coins, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [userId, tempUser.email, tempUser.user_metadata.full_name, 'free', 'user', new Date().toISOString(), 0, false]
              );
              // Force password setup on first login
              setRequireLocalPasswordSetup(true);
            } else if (!profiles[0].password) {
              setRequireLocalPasswordSetup(true);
            }
            
            await recordSession(userId, isGoogle ? 'Google' : 'Email');
            
            // Handshake & Security: Update last_sync_at and verify Admin Status
            if (navigator.onLine) {
              await db.execute('UPDATE profiles SET last_sync_at = ? WHERE id = ?', [Date.now(), userId]);
              await verifyAdminBanStatus(userId);
            }
          } catch (e) {
             console.error("Local profile creation error", e);
          }
          
          // Dispara a sincronização em pano de fundo para não bloquear o loading/modo offline
          syncUserToFirebase(tempUser).catch(err => console.error(err));
          
          setLoading(false);
        } else {
          // No Firebase session, check if it's a Local Guest session or Local Password session
          const savedUser = localStorage.getItem('vukapay_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed.id) {
                // Time-bomb Check
                const { getDatabase } = await import('@/database/db');
                const db = await getDatabase();
                const profiles = await db.select<any[]>('SELECT * FROM profiles WHERE id = $1', [parsed.id]);
                if (profiles[0]) {
                   const lastSync = profiles[0].last_sync_at;
                   const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
                   if (lastSync && Date.now() - lastSync > fourteenDaysInMs) {
                      alert('Aviso de Segurança: Este dispositivo esteve offline por mais de 14 dias. Conecte-se à internet para sincronizar com o VukaPay Admin e continuar a usar offline.');
                      await signOut();
                      return;
                   }
                }

                setUser(parsed);
                setLoading(false);
                touchSession(parsed.id).catch(err => console.error(err));
                
                // Em background, tenta autenticar no firebase se houver internet para handshake
                if (navigator.onLine && !parsed.isLocal) {
                   verifyAdminBanStatus(parsed.id).catch(console.error);
                }
                return;
              }
            } catch {}
          }
          setUser(null);
          setLoading(false);
        }
      });

      // Verifica se está rodando no Tauri
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

      if (isTauri) {
        try {
          const { listen } = await import('@tauri-apps/api/event');
          unlistenFn = await listen<string>('oauth-callback', async (event) => {
            console.log('Recebido callback de autenticação do Tauri:', event.payload);
            const queryAndHash = event.payload;
            
            // Busca os parâmetros após o caractere '?'
            const qMarkIndex = queryAndHash.indexOf('?');
            let paramsStr = '';
            if (qMarkIndex !== -1) {
              paramsStr = queryAndHash.substring(qMarkIndex + 1);
            } else {
              // Fallback para buscar a partir de access_token=
              const tokenIndex = queryAndHash.indexOf('access_token=');
              if (tokenIndex !== -1) {
                paramsStr = queryAndHash.substring(tokenIndex);
              }
            }

            if (paramsStr && paramsStr.includes('access_token=')) {
              const success = await handleGoogleCallback('#' + paramsStr);
              if (success && active) {
                setLoading(false);
              }
            } else {
              setAuthLoading(false);
            }
          });
        } catch (e) {
          console.error('Falha ao registrar o listener de OAuth do Tauri:', e);
        }
      } else {
        // 2. Se não houver e for Web normal, verifica se veio um token na URL (Google Callback)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          const success = await handleGoogleCallback(hash);
          if (success) {
            // Limpa o hash da URL para manter limpo
            window.history.replaceState(null, '', window.location.origin + window.location.pathname);
            if (active) setLoading(false);
            return;
          }
        }
      }

      if (active) setLoading(false);
    };

    initAuth();

    return () => {
      active = false;
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  const loginAsLocal = async () => {
    // Generate true guest account
    const guestId = 'guest_' + Date.now();
    const localUser = {
      id: guestId,
      email: `${guestId}@vukapay.local`,
      user_metadata: { full_name: 'Convidado (Offline)' },
      isLocal: true
    };
    localStorage.setItem('vukapay_user', JSON.stringify(localUser));
    
    try {
      const { getDatabase } = await import('@/database/db');
      const db = await getDatabase();
      await db.execute(
        'INSERT INTO profiles (id, email, full_name, plan, role, created_at, vuka_coins, is_verified, last_sync_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [guestId, localUser.email, localUser.user_metadata.full_name, 'free', 'guest', new Date().toISOString(), 0, false, Date.now()]
      );
    } catch(err) {
      console.error(err);
    }
    
    setUser(localUser);
    setRequireLocalPasswordSetup(true); // Requisitar senha para o guest usar offline no futuro
    await recordSession(localUser.id, 'Convidado');
  };

  const loginWithCredentials = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      // 1. Verificação Híbrida Offline (SQLite First)
      const { getDatabase } = await import('@/database/db');
      // Hack: O db precisa de saber qual é o user id do ficheiro SQLite para abrir o correto, 
      // mas se não soubermos, temos de procurar nos mapeamentos locais
      const storedMapping = localStorage.getItem(`vukapay_google_mapping_${cleanEmail}`);
      if (storedMapping) {
         // Temporariamente definir o localstorage user para abrir a DB correta e validar
         const tempUserObj = { id: storedMapping };
         localStorage.setItem('vukapay_user', JSON.stringify(tempUserObj));
         const db = await getDatabase();
         const profiles = await db.select<any[]>('SELECT * FROM profiles WHERE id = $1', [storedMapping]);
         
         if (profiles[0] && profiles[0].password) {
            // Verificar hash (Btoa fallback - DEVE USAR BCRYPT NUMA VERSAO FINAL)
            const passwordHash = btoa(password);
            if (profiles[0].password === passwordHash) {
               // Acesso Local Concedido!
               const fullUserObj = {
                 id: storedMapping,
                 email: cleanEmail,
                 user_metadata: { full_name: profiles[0].full_name, avatar_url: profiles[0].avatar_url },
                 isLocal: false
               };
               localStorage.setItem('vukapay_user', JSON.stringify(fullUserObj));
               setUser(fullUserObj);
               
               // Background Firebase Auth Update se tiver internet
               if (navigator.onLine) {
                 signInWithEmailAndPassword(auth, cleanEmail, password).catch(e => console.log('Background auth sync ignored', e));
               }
               return { success: true };
            } else {
               return { success: false, error: 'Palavra-passe incorreta.' };
            }
         }
      }

      // 2. Se falhar o SQLite (porque nunca logou ou limpou cache), tentar Firebase Auth
      if (!navigator.onLine) {
         return { success: false, error: 'Sem internet e utilizador não encontrado localmente.' };
      }

      try {
        // Tenta fazer login com o Firebase Auth
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        return { success: true };
      } catch (err: any) {
        // Se a conta não existir, criamos a conta automaticamente!
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
          try {
            await createUserWithEmailAndPassword(auth, cleanEmail, password);
            return { success: true };
          } catch (createErr: any) {
            console.error('Registration error:', createErr);
            if (createErr.code === 'auth/email-already-in-use') {
              return { success: false, error: 'A palavra-passe está incorreta.' };
            }
            return { success: false, error: 'Erro ao criar a conta: ' + createErr.message };
          }
        }
        
        console.error('Firebase Login error:', err);
        return { success: false, error: 'Palavra-passe incorreta ou erro de autenticação.' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erro interno ao processar a autenticação.' };
    }
  };

  const registerWithCredentials = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    return loginWithCredentials(email, password);
  };

  const linkGuestToGoogle = async () => {
    // Processo futuro de ligar conta Guest ao Google Auth
    alert('Esta funcionalidade irá exportar os dados do convidado para a sua conta Google (Em implementação).');
    await signOut(); // Force relogin temporarily
  };

  const loginWithGoogle = async () => {
    setAuthLoading(true);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '137020562847-hrfr6a59ejgrehssk6p8in6t3235lulf.apps.googleusercontent.com';
    const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
    const state = Math.random().toString(36).substring(2, 15);
    
    // Armazena o state para validação posterior no callback
    localStorage.setItem('google_oauth_state', state);

    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_google_auth', { clientId, scope, state });
        // Timeout de segurança de 5 minutos
        setTimeout(() => {
          setAuthLoading(false);
        }, 300000);
      } catch (err) {
        console.error('Erro ao invocar login do Google no Tauri:', err);
        alert('Erro ao iniciar o login com o Google: ' + err);
        setAuthLoading(false);
      }
    } else {
      // Fluxo web padrão
      const redirectUri = window.location.origin;
      const responseType = 'token id_token';
      const nonce = Math.random().toString(36).substring(2, 15);

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${encodeURIComponent(responseType)}&scope=${encodeURIComponent(scope)}&state=${state}&nonce=${nonce}&include_granted_scopes=true`;

      window.location.href = googleAuthUrl;
    }
  };

  const handleGoogleCallback = async (hash: string): Promise<boolean> => {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');
    const state = params.get('state');
    const savedState = localStorage.getItem('google_oauth_state');

    if (accessToken && (!savedState || state === savedState)) {
      localStorage.removeItem('google_oauth_state');
      localStorage.setItem('google_access_token', accessToken);

      try {
        const credential = GoogleAuthProvider.credential(idToken || null, accessToken);
        await signInWithCredential(auth, credential);
        setAuthLoading(false);
        return true;
      } catch (err: any) {
        console.error('Erro ao autenticar no Firebase com Google:', err);
        alert('Erro na autenticação do Google: ' + err.message);
        setAuthLoading(false);
        return false;
      }
    } else {
      console.error('Validação de segurança do state falhou ou token ausente');
      alert('Validação de segurança do login falhou. Tente novamente.');
      setAuthLoading(false);
      return false;
    }
  };

  const verifyAdminBanStatus = async (uid: string) => {
    try {
      const { db } = await import('@/lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'community_users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
         const data = snap.data();
         if (data.status === 'blocked' || data.status === 'banned' || data.is_deleted === true) {
            // Handshake Security: Conta foi banida pelo Admin. 
            // Destruir cache local e forçar log out.
            const { getDatabase } = await import('@/database/db');
            const localDb = await getDatabase();
            await localDb.execute("UPDATE profiles SET password = NULL WHERE id = ?", [uid]);
            
            alert('Acesso Negado: Esta conta foi desativada ou bloqueada pelo administrador do VukaPay.');
            await signOut();
         }
      }
    } catch (e) {
      console.warn('Erro ao verificar status admin:', e);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch(e) {}
    localStorage.removeItem('vukapay_user');
    localStorage.removeItem('google_access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session: {}, user, loading, authLoading, requireLocalPasswordSetup, setRequireLocalPasswordSetup, setAuthLoading, signOut, loginAsLocal, linkGuestToGoogle, loginWithCredentials, registerWithCredentials, loginWithGoogle, handleGoogleCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

// Funções Auxiliares para Registro de Sessões de Login
function getDeviceDetails(): string {
  const ua = navigator.userAgent;
  let os = "Dispositivo Desconhecido";
  let browser = "Navegador";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
  return `${browser} no ${os}${isTauri ? ' (App Desktop)' : ' (Web)'}`;
}

async function recordSession(userId: string, loginType: string) {
  try {
    const { getDatabase } = await import('@/database/db');
    const db = await getDatabase();
    const sessionId = crypto.randomUUID();
    const deviceName = getDeviceDetails();
    
    await db.execute('UPDATE user_sessions SET is_current = 0 WHERE user_id = $1', [userId]);
    await db.execute(
      'INSERT INTO user_sessions (id, user_id, device_name, login_type, is_current, last_active) VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)',
      [sessionId, userId, deviceName, loginType]
    );
  } catch (e) {
    console.error('[AuthContext] Falha ao registrar a sessão no banco:', e);
  }
}

async function touchSession(userId: string) {
  try {
    const { getDatabase } = await import('@/database/db');
    const db = await getDatabase();
    await db.execute('UPDATE user_sessions SET last_active = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_current = 1', [userId]);
  } catch (e) {
    console.error('[AuthContext] Falha ao atualizar timestamp da sessão:', e);
  }
}

async function syncUserToFirebase(user: any) {
  try {
    const { db } = await import('@/lib/firebase');
    const { doc, getDoc, setDoc } = await import('firebase/firestore');
    
    if (!user || user.id.startsWith('guest_') || user.id === 'local-user') return;
    
    const userRef = doc(db, 'community_users', user.id);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        name: user.user_metadata?.full_name || user.email.split('@')[0] || 'Utilizador VukaPay',
        email: user.email.toLowerCase(),
        xp: 100,
        badge: '🎯 Guardião',
        avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email.split('@')[0])}&background=random`,
        is_deleted: false,
        created_at: Date.now()
      });
    } else {
      const currentData = snap.data();
      if (currentData.is_deleted || currentData.deleted) {
        await setDoc(userRef, {
          ...currentData,
          is_deleted: false,
          deleted: false,
          name: user.user_metadata?.full_name || currentData.name,
          avatar: user.user_metadata?.avatar_url || currentData.avatar
        }, { merge: true });
      }
    }
  } catch (err) {
    console.error('[syncUserToFirebase] Falha:', err);
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
