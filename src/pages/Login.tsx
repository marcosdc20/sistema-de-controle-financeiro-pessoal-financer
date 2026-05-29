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
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.84-2.46 2.37v2.53h3.97c2.32-2.13 3.54-5.26 3.54-8.75z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.97-2.53c-1.1.74-2.5 1.18-3.96 1.18-3.05 0-5.63-2.06-6.55-4.83H1.37v2.62C3.36 21.53 7.42 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.45 14.91c-.24-.74-.38-1.54-.38-2.37s.14-1.63.38-2.37V7.55H1.37C.49 9.33 0 11.23 0 12.87c0 1.64.49 3.54 1.37 5.32l4.08-3.28z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.36 2.47 1.37 6.44l4.08 3.28c.92-2.77 3.5-4.97 6.55-4.97z"
                    />
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
