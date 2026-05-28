import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Lock, User, Key, CheckCircle, ShieldAlert, LogOut, Loader2, TrendingUp } from 'lucide-react';

interface AppSecurityGuardProps {
  children: React.ReactNode;
}

export default function AppSecurityGuard({ children }: AppSecurityGuardProps) {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, loading: financeLoading } = useFinance();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('vukapay_session_unlocked') === 'true';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill username from profile metadata when available
  useEffect(() => {
    if (profile && !profile.password) {
      setUsername(profile.full_name || user?.user_metadata?.full_name || '');
    }
  }, [profile, user]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('O nome de usuário não pode estar vazio.');
      return;
    }

    if (password.length < 4) {
      setError('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        full_name: username.trim(),
        password: password
      });
      sessionStorage.setItem('vukapay_session_unlocked', 'true');
      setIsUnlocked(true);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao configurar o perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile?.password) return;

    if (enteredPassword === profile.password) {
      sessionStorage.setItem('vukapay_session_unlocked', 'true');
      setIsUnlocked(true);
    } else {
      setError('Senha incorreta. Tente novamente.');
      setEnteredPassword('');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza de que deseja sair da conta?')) {
      sessionStorage.removeItem('vukapay_session_unlocked');
      await signOut();
      window.location.reload();
    }
  };

  // If not logged in, pass through (app will redirect to /login via App.tsx)
  if (!user) {
    return <>{children}</>;
  }

  // Show premium loader if finance data is loading
  if (financeLoading || !profile) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#030712] text-gray-100 font-sans">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verificando credenciais locais...</p>
      </div>
    );
  }

  // Case 1: First login, setup username and password
  if (!profile.password) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] font-sans text-gray-100 p-4 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-md bg-gray-950/80 border border-gray-900 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Configurar Acesso Seguro</h2>
            <p className="text-xs text-gray-400 text-center mt-2 px-4 leading-relaxed">
              Para garantir a privacidade das suas finanças locais no **VukaPay**, configure o seu nome de usuário e uma senha de acesso.
            </p>
          </div>

          <form onSubmit={handleSetup} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nome de Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
                  placeholder="Nome ou Apelido"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Senha de Acesso</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
                  placeholder="Mínimo 4 caracteres"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirmar Senha</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
                  placeholder="Repita a senha"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Configurar e Entrar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 bg-transparent hover:bg-gray-900/50 text-gray-400 hover:text-white rounded-2xl text-xs font-medium transition-all flex items-center justify-center gap-2 border border-gray-800/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Voltar ao Login</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Case 2: Subsequent login, locked app. Needs password verification
  if (!isUnlocked) {
    const initials = profile.full_name?.substring(0, 2).toUpperCase() || 'JD';
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] font-sans text-gray-100 p-4 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-md bg-gray-950/80 border border-gray-900 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/10 mb-4 scale-105 border border-indigo-400/20">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-white mt-2">{profile.full_name}</h2>
            <p className="text-xs text-gray-500 mt-1">Insira a sua senha de acesso para desbloquear o aplicativo.</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Senha de Acesso</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-6"
            >
              <Lock className="w-4 h-4" />
              <span>Desbloquear App</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-2xl text-xs font-medium transition-all flex items-center justify-center gap-2 border border-red-950/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Case 3: Fully unlocked session
  return <>{children}</>;
}
