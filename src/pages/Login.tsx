import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  ShieldCheck,
  PieChart,
  WifiOff,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Login() {
  const { loginAsLocal, loginWithGoogle, authLoading } = useAuth();
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const navigate = useNavigate();

  const handleLocalLogin = () => {
    setIsLoadingLocal(true);
    setTimeout(() => {
      loginAsLocal();
      navigate('/');
    }, 800);
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen w-full flex bg-[#030712] font-sans text-gray-100 selection:bg-indigo-500/30">
      {/* Left Side: Premium Glassmorphic Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-gray-800/40">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"
            alt="Abstract Premium Gradient"
            className="w-full h-full object-cover opacity-35 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#030712] via-[#090d1a]/80 to-transparent" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />

        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo.png" alt="VukaPay" className="w-full h-full object-contain rounded-2xl" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              VukaPay
            </span>
          </div>

          {/* Main Copy */}
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Sincronização offline e nuvem híbrida
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.15] mb-6 bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
              Domine suas finanças locais com poder da nuvem.
            </h1>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              O controle financeiro offline definitivo com opção de sincronizar seus dados com segurança no seu próprio Google Drive.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-200">Privacidade Total</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Seus dados no seu próprio controle</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-200">Inteligente</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Insights analíticos poderosos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-600">
            © 2026 VukaPay. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side: Authentication Cards */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        {/* Mobile Background and Glows */}
        <div className="lg:hidden absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#030712]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-12">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Como deseja acessar?
            </h2>
            <p className="text-gray-400 text-sm">
              Selecione o método de login abaixo. Os dados são salvos localmente e você escolhe se quer fazer o backup.
            </p>
          </div>

          <div className="space-y-5">
            {/* Card 1: Google Account Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading || isLoadingLocal}
              className="w-full text-left p-6 bg-gradient-to-r from-gray-900 to-gray-900/40 border border-gray-800 hover:border-indigo-500/40 rounded-3xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  {/* Google Custom SVG Icon */}
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.38-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                      Entrar com Google
                    </h3>
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Habilita o backup automático e seguro de suas finanças no seu próprio Google Drive.
                  </p>
                </div>
              </div>
            </button>

            {/* Card 2: Local Only Offline Mode */}
            <button
              onClick={handleLocalLogin}
              disabled={authLoading || isLoadingLocal}
              className="w-full text-left p-6 bg-gradient-to-r from-gray-900 to-gray-900/40 border border-gray-800 hover:border-gray-700 rounded-3xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-gray-700 disabled:opacity-50"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <WifiOff className="w-6 h-6 text-gray-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white group-hover:text-gray-300 transition-colors">
                      Modo Convidado (Offline)
                    </h3>
                    {isLoadingLocal ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Armazenamento estritamente local (SQLite). Ideal para uso offline e sem vínculo com contas.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-12 p-4 bg-gray-950/40 border border-gray-900 rounded-2xl flex items-center gap-3 text-gray-500 text-xs leading-relaxed">
            <Database className="w-5 h-5 shrink-0 text-indigo-500/60" />
            <p>
              Tanto no modo Google quanto local, os dados principais residem no seu computador via SQLite. O login com Google é usado exclusivamente para autenticação e upload de backups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
