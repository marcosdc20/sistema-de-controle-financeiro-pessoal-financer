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
  Sparkles,
  Globe,
  Users,
  Briefcase,
  CheckCircle2
} from 'lucide-react';

const FEATURES = [
  { icon: ShieldCheck, label: 'Privacidade Total', desc: 'Dados 100% no seu controle local' },
  { icon: PieChart, label: 'Análises Poderosas', desc: 'Relatórios e gráficos inteligentes' },
  { icon: Users, label: 'Comunidade Angola', desc: 'Dicas para a realidade angolana' },
  { icon: Briefcase, label: 'Área de Negócios', desc: 'Faturas, recibos e simulações' },
];

const STATS = [
  { value: '15+', label: 'Funcionalidades' },
  { value: '5', label: 'Idiomas' },
  { value: '100%', label: 'Offline' },
];

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
      {/* Left Side: Premium Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden border-r border-gray-800/40">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"
            alt="Abstract Premium Gradient"
            className="w-full h-full object-cover opacity-20 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#030712] via-[#060b18]/90 to-[#0a0d1a]/70" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo.png" alt="VukaPay" className="w-full h-full object-contain rounded-2xl" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                VukaPay
              </span>
              <span className="ml-2 text-xs text-indigo-400/80 font-semibold border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                v1.0.8
              </span>
            </div>
          </div>

          {/* Main Copy */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold mb-6">
              <Globe className="w-3.5 h-3.5" />
              Feito para Angola 🇦🇴
            </div>
            <h1 className="text-5xl font-black leading-[1.1] mb-6 bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
              O seu controle financeiro, à medida de Angola.
            </h1>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Gerencie contas em Kwanza e divisas, mesadas familiares, Kixiquilas, faturas e muito mais. Com suporte a idiomas como Umbundu, Kimbundu e Kikongo.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-10">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-black text-white">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-200 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">© 2026 VukaPay. Todos os direitos reservados.</p>
            <a href="mailto:suporte.vukapay@gmail.com" className="text-xs text-gray-600 hover:text-indigo-400 transition-colors">
              suporte.vukapay@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Right Side: Authentication */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 relative">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#030712]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/5 rounded-full blur-[60px]" />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img src="/logo.png" alt="VukaPay" className="w-10 h-10 object-contain rounded-2xl" />
            <span className="text-xl font-extrabold text-white">VukaPay</span>
            <span className="text-xs text-indigo-400/80 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">v1.0.8</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Bem-vindo(a) de volta
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Selecione como deseja aceder. Os seus dados estão guardados localmente em segurança.
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading || isLoadingLocal}
              className="w-full text-left p-5 bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-900/80 rounded-2xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.38-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                      Entrar com Google
                    </h3>
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                    Ativa o backup automático no Google Drive e sincronização.
                  </p>
                </div>
              </div>
            </button>

            {/* Local / Offline Mode */}
            <button
              onClick={handleLocalLogin}
              disabled={authLoading || isLoadingLocal}
              className="w-full text-left p-5 bg-gradient-to-br from-indigo-950/50 to-indigo-900/20 border border-indigo-800/40 hover:border-indigo-600/60 rounded-2xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-indigo-900/40">
                  <WifiOff className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                      Acesso Local (Offline)
                    </h3>
                    {isLoadingLocal ? (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                    Armazenamento local via SQLite. Funciona sem internet.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 space-y-3">
            {[
              { text: 'Os seus dados financeiros ficam no seu computador', color: 'text-emerald-400' },
              { text: 'Sem subscrição — pagamento único por licença', color: 'text-emerald-400' },
              { text: 'Suporte via suporte.vukapay@gmail.com', color: 'text-indigo-400' },
            ].map(({ text, color }) => (
              <div key={text} className="flex items-start gap-2.5">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-950/40 border border-gray-900 rounded-2xl flex items-center gap-3 text-gray-600 text-xs leading-relaxed">
            <Database className="w-5 h-5 shrink-0 text-indigo-500/50" />
            <p>
              O VukaPay usa SQLite local para máxima privacidade. O Google é usado apenas para autenticação e backups opcionais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
