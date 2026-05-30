import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Tipagem simplificada compatível com o restante da aplicação
interface AuthContextType {
  session: any | null;
  user: { id: string; email: string; user_metadata?: { full_name?: string; avatar_url?: string }; isLocal?: boolean } | null;
  loading: boolean;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  loginAsLocal: () => void;
  loginWithGoogle: () => void;
  handleGoogleCallback: (hash: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; user_metadata?: { full_name?: string; avatar_url?: string }; isLocal?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let unlistenFn: (() => void) | null = null;

    const initAuth = async () => {
      // 1. Verifica se já existe um login salvo no localStorage
      const savedUser = localStorage.getItem('vukapay_user');
      if (savedUser) {
        if (active) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setLoading(false);
          // Atualiza a atividade da sessão em background
          touchSession(parsed.id).catch(err => console.error(err));
        }
        return;
      }

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
    const localUser = {
      id: 'local-user',
      email: 'local@vukapay.local',
      user_metadata: { full_name: 'Usuário Local' },
      isLocal: true
    };
    localStorage.setItem('vukapay_user', JSON.stringify(localUser));
    setUser(localUser);
    await recordSession(localUser.id, 'Local');
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
        // Timeout de segurança de 5 minutos para limpar o loading caso o usuário cancele ou ocorra timeout no loopback
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
      const redirectUri = window.location.origin; // Em desenvolvimento: http://localhost:1420
      const responseType = 'token';

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&state=${state}&include_granted_scopes=true`;

      window.location.href = googleAuthUrl;
    }
  };

  const handleGoogleCallback = async (hash: string): Promise<boolean> => {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const state = params.get('state');
    const savedState = localStorage.getItem('google_oauth_state');

    if (accessToken && (!savedState || state === savedState)) {
      localStorage.removeItem('google_oauth_state');
      localStorage.setItem('google_access_token', accessToken);

      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();

        if (data.error) {
          console.error('Erro no token do Google:', data.error);
          alert('Erro na autenticação do Google: ' + (data.error.message || JSON.stringify(data.error)));
          setAuthLoading(false);
          return false;
        }

        const googleUser = {
          id: data.id,
          email: data.email,
          user_metadata: {
            full_name: data.name,
            avatar_url: data.picture
          },
          isLocal: false
        };

        localStorage.setItem('vukapay_user', JSON.stringify(googleUser));
        setUser(googleUser);
        await recordSession(googleUser.id, 'Google');
        setAuthLoading(false);
        return true;
      } catch (err) {
        console.error('Erro ao obter perfil do Google:', err);
        alert('Erro ao obter perfil do Google: ' + err);
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

  const signOut = async () => {
    localStorage.removeItem('vukapay_user');
    localStorage.removeItem('google_access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session: {}, user, loading, authLoading, setAuthLoading, signOut, loginAsLocal, loginWithGoogle, handleGoogleCallback }}>
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
    
    // Desativar a flag de sessão atual nas sessões antigas
    await db.execute('UPDATE user_sessions SET is_current = 0 WHERE user_id = $1', [userId]);
    
    // Inserir nova sessão ativa
    await db.execute(
      'INSERT INTO user_sessions (id, user_id, device_name, login_type, is_current, last_active) VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)',
      [sessionId, userId, deviceName, loginType]
    );
    console.log('[AuthContext] Sessão registrada com sucesso no SQLite:', deviceName);
  } catch (e) {
    console.error('[AuthContext] Falha ao registrar a sessão no banco:', e);
  }
}

async function touchSession(userId: string) {
  try {
    const { getDatabase } = await import('@/database/db');
    const db = await getDatabase();
    
    // Atualiza o last_active para a sessão ativa atual no banco
    await db.execute('UPDATE user_sessions SET last_active = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_current = 1', [userId]);
  } catch (e) {
    console.error('[AuthContext] Falha ao atualizar timestamp da sessão:', e);
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
