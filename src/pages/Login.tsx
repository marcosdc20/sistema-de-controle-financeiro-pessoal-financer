import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { TRANSLATIONS } from '@/services/translationService';
import {
  TrendingUp,
  ShieldCheck,
  PieChart,
  WifiOff,
  Database,
  ArrowRight,
  Globe,
  Users,
  CheckCircle2,
  Mail,
  Lock,
  Sparkles,
  PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Local translations for the Left Branding Panel
const LOCAL_BRAND_TRANSLATIONS: Record<string, Record<string, string>> = {
  'pt-AO': {
    heroTitle: 'O seu controle financeiro, à medida de Angola.',
    heroDesc: 'Gerencie contas em Kwanza e divisas, mesadas familiares, Kixiquilas, faturas e muito mais. Com suporte a idiomas como Umbundu, Kimbundu e Kikongo.',
    madeForAngola: 'Feito para Angola 🇦🇴',
    statsFeatures: 'Funcionalidades',
    statsLanguages: 'Idiomas',
    statsOffline: 'Offline',
    feat1Title: 'Privacidade Total',
    feat1Desc: 'Dados 100% no seu controle local',
    feat2Title: 'Análises Poderosas',
    feat2Desc: 'Relatórios e gráficos inteligentes',
    feat3Title: 'Comunidade Angola',
    feat3Desc: 'Dicas para a realidade angolana',
    feat4Title: 'Gestão de Poupanças',
    feat4Desc: 'Controle de Kixiquilas e Poupanças locais',
    trust1: 'Os seus dados financeiros ficam no seu computador',
    trust2: 'Sem subscrição — pagamento único por licença',
    trust3: 'Suporte via suporte.vukapay@gmail.com',
    copyRight: '© 2026 VukaPay. Todos os direitos reservados.'
  },
  'en': {
    heroTitle: 'Your financial control, tailored for Angola.',
    heroDesc: 'Manage accounts in Kwanza and currencies, family allowances, Kixiquilas, invoices and more. With support for languages like Umbundu, Kimbundu and Kikongo.',
    madeForAngola: 'Made for Angola 🇦🇴',
    statsFeatures: 'Features',
    statsLanguages: 'Languages',
    statsOffline: 'Offline',
    feat1Title: 'Total Privacy',
    feat1Desc: 'Data 100% under your local control',
    feat2Title: 'Powerful Analytics',
    feat2Desc: 'Smart reports and charts',
    feat3Title: 'Angola Community',
    feat3Desc: 'Tips for the Angolan reality',
    feat4Title: 'Savings Management',
    feat4Desc: 'Control Kixiquilas and local savings',
    trust1: 'Your financial data stays on your computer',
    trust2: 'No subscription — one-time license payment',
    trust3: 'Support via support.vukapay@gmail.com',
    copyRight: '© 2026 VukaPay. All rights reserved.'
  },
  'umb': {
    heroTitle: 'Elelo liove liovimaliwa, ciwa ko Angola.',
    heroDesc: 'Lemba olombanja vio Kwanza, omesada viakundi, kixiquila ye milavisu viokulilongisa. Olovasola Umbundu, Kimbundu y Kikongo.',
    madeForAngola: 'Calingiwa ko Angola 🇦🇴',
    statsFeatures: 'Ovilinga Visukila',
    statsLanguages: 'Alimi',
    statsOffline: 'Ovilua',
    feat1Title: 'Kuenda lumbote',
    feat1Desc: 'Apapelo kosi ovelise ove SQLite',
    feat2Title: 'Ovilinga Viomanji',
    feat2Desc: 'Esapulo lyovimaliwa viteta',
    feat3Title: 'Cisoko Angola',
    feat3Desc: 'Ovoluvila komanu va Angola',
    feat4Title: 'Lemba Oveleka',
    feat4Desc: 'Kixiquila yo lombanja kosi',
    trust1: 'Apapelo ove a kala vocimaliwa ove muene',
    trust2: 'Kakuilika okupapela vali, ofelu layuka',
    trust3: 'Ekuatiso vocisoko suporte.vukapay@gmail.com',
    copyRight: '© 2026 VukaPay. Kosi ovipapo vialinga.'
  },
  'kmb': {
    heroTitle: 'Lungeka kikalakalo kié ja mbongo mu Angola.',
    heroDesc: 'Lungeka jikonta ja Banco ja Kwanza ni jikonga ja kixiquila, makamba ni mesada ja jindolo. Suporte ni alimi ndonge ndenge Umbundu, Kimbundu ni Kikongo.',
    madeForAngola: 'Mukau wa Angola 🇦🇴',
    statsFeatures: 'Jikalakalo',
    statsLanguages: 'Alimi',
    statsOffline: 'Lelo koso',
    feat1Title: 'Lungeka kyambote',
    feat1Desc: 'Mbongo yosi ikala mu komputador eye',
    feat2Title: 'Jinzangela ni mukau',
    feat2Desc: 'Nzangela ja mbongo jifika',
    feat3Title: 'Muiji Angola',
    feat3Desc: 'Nsadisi koso mu Angola lelo',
    feat4Title: 'Lulondolo lwa Kixiquila',
    feat4Desc: 'Kixiquila ni mbongo kithangana',
    trust1: 'Nzangela ja mbongo yé ikala mu komputador',
    trust2: 'Kithangana koso mbongo yé, pagameto moxi ndambu',
    trust3: 'Kukuatekesa mu e-mail suporte.vukapay@gmail.com',
    copyRight: '© 2026 VukaPay. Kukala kikalakalo kyambote.'
  },
  'kg': {
    heroTitle: 'Lulondolo lua mbongo lukuiza mu luyalu lu Angola.',
    heroDesc: 'Lulondolo lua makonta ma Kwanza ye zimfuka, makanda ye kixiquila y fatura diaka. Mu ndinga Umbundu, Kimbundu ye Kikongo.',
    madeForAngola: 'Salilu mu Angola 🇦🇴',
    statsFeatures: 'Bisalu',
    statsLanguages: 'Ndinga',
    statsOffline: 'Kondolo Internet',
    feat1Title: 'Mavangu mansono',
    feat1Desc: 'Mavangu yonsono mekalanga vana komputador eye',
    feat2Title: 'Nsangu ye charts',
    feat2Desc: 'Nsangu ya mbongo yafika lelo',
    feat3Title: 'Kinkundi Angola',
    feat3Desc: 'Nsadisi mu mvuandu ya Angola',
    feat4Title: 'Lulondolo lua Nlundu',
    feat4Desc: 'Kixiquila ye nlundu mbongo local',
    trust1: 'Mavangu maku mekalanga vana komputador',
    trust2: 'Kondolo mbongo yankaka ya fuka, futa moxi kaka',
    trust3: 'Nsadisi mu e-mail suporte.vukapay@gmail.com',
    copyRight: '© 2026 VukaPay. Mavangu ye nsangu yambote.'
  }
};

const LANGUAGES = [
  { code: 'pt-AO', label: 'Português (Angola)', flag: '🇦🇴' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'umb', label: 'Umbundu', flag: '🇦🇴' },
  { code: 'kmb', label: 'Kimbundu', flag: '🇦🇴' },
  { code: 'kg', label: 'Kikongo', flag: '🇦🇴' }
];

export default function Login() {
  const { loginAsLocal, loginWithGoogle, authLoading } = useAuth();
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('1.1.1');
  const navigate = useNavigate();

  // Language management
  const [lang, setLang] = useState<string>(() => {
    return localStorage.getItem('vukapay_login_lang') || 'pt-AO';
  });

  // Force Light Theme (remove dark class completely on mount)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('vukapay_theme', 'light');
    localStorage.setItem('vukapay_login_theme', 'light');
  }, []);

  // Fetch Tauri app version
  useEffect(() => {
    const fetchVersion = async () => {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
      if (isTauri) {
        try {
          const { getVersion } = await import('@tauri-apps/api/app');
          const v = await getVersion();
          setAppVersion(v);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchVersion();
  }, []);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('vukapay_login_lang', newLang);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email.trim() || !password.trim()) {
      setLoginError('Por favor, preencha o e-mail e a palavra-passe.');
      return;
    }

    setIsLoadingLocal(true);
    setTimeout(() => {
      // Create user session details inside localStorage
      const localUser = {
        id: 'local-user',
        email: email.trim(),
        user_metadata: { full_name: email.split('@')[0] || 'Usuário Local' },
        isLocal: true
      };
      localStorage.setItem('vukapay_user', JSON.stringify(localUser));
      loginAsLocal();
      navigate('/');
    }, 800);
  };

  const handleLocalGuestLogin = () => {
    setIsLoadingLocal(true);
    setTimeout(() => {
      loginAsLocal();
      navigate('/');
    }, 800);
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleForgotPassword = () => {
    alert('Como o VukaPay armazena os dados localmente no seu computador (SQLite), as suas credenciais ficam salvas de forma encriptada localmente. Para gerir ou repor as suas definições de segurança, consulte a documentação oficial ou o e-mail de suporte.');
  };

  // Helper translations
  const t = (key: string): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['pt-AO']?.[key] || key;
  };

  const b = (key: string): string => {
    return LOCAL_BRAND_TRANSLATIONS[lang]?.[key] || LOCAL_BRAND_TRANSLATIONS['pt-AO']?.[key] || key;
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-gray-50 text-gray-900 selection:bg-brand-500/30">
      
      {/* Left Side: Premium Branding Panel (Split Layout) */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden border-r border-gray-200 bg-gradient-to-tr from-brand-950 via-brand-800 to-emerald-950">
        
        {/* Background Graphic overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618005198143-e5283b519a7f?q=80&w=2064&auto=format&fit=crop"
            alt="Abstract Premium Gradient"
            className="w-full h-full object-cover opacity-15 scale-105"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] bg-brand-500/10" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full blur-[120px] bg-emerald-500/10" />

        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-brand-600 rounded-2xl shadow-lg shadow-brand-650/20 border border-brand-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                VukaPay
              </span>
              <span className="ml-2.5 text-xs text-brand-300 font-bold border border-brand-500/30 bg-brand-500/20 px-2 py-0.5 rounded-full">
                v{appVersion}
              </span>
            </div>
          </div>

          {/* Main Slogan & Info */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/20 border border-brand-500/30 rounded-full text-brand-300 text-xs font-semibold mb-6">
              <Globe className="w-3.5 h-3.5" />
              {b('madeForAngola')}
            </div>
            <h1 className="text-4xl font-black leading-[1.2] mb-6 text-white tracking-tight">
              {b('heroTitle')}
            </h1>
            <p className="text-base mb-10 leading-relaxed text-gray-300">
              {b('heroDesc')}
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-10">
              {[
                { value: '15+', label: b('statsFeatures') },
                { value: '5', label: b('statsLanguages') },
                { value: '100%', label: b('statsOffline') },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-black text-white">{value}</p>
                  <p className="text-xs mt-0.5 font-bold text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Premium Feature Grid (Clean 2x2 Layout) */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop",
                  svg: (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ),
                  label: b('feat1Title'),
                  desc: b('feat1Desc')
                },
                {
                  img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop",
                  svg: (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 3v18h18" />
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                    </svg>
                  ),
                  label: b('feat2Title'),
                  desc: b('feat2Desc')
                },
                {
                  img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop",
                  svg: (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  label: b('feat3Title'),
                  desc: b('feat3Desc')
                },
                {
                  img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&auto=format&fit=crop",
                  svg: (
                    <PiggyBank className="w-4 h-4 text-emerald-400" />
                  ),
                  label: b('feat4Title'),
                  desc: b('feat4Desc')
                }
              ].map((feat) => (
                <div key={feat.label} className="group relative h-28 rounded-2xl overflow-hidden border border-white/[0.08] shadow-md transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/10">
                  <img
                    src={feat.img}
                    alt={feat.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30" />
                  
                  <div className="absolute inset-0 p-3.5 flex flex-col justify-between z-10">
                    <div className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                      {feat.svg}
                    </div>
                    <div>
                      <p className="font-extrabold text-[11px] text-white leading-tight">{feat.label}</p>
                      <p className="text-[9px] text-gray-300 mt-0.5 font-medium leading-normal">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer branding */}
          <div className="flex items-center justify-between text-[11px] text-gray-450">
            <p>{b('copyRight')}</p>
            <a href="mailto:suporte.vukapay@gmail.com" className="hover:text-white transition-colors">
              suporte.vukapay@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Right Side: Professional Credentials Login Page */}
      <div className="w-full lg:w-[50%] flex flex-col items-center justify-center p-8 sm:p-12 relative bg-white">
        
        {/* Language Selector floating top right */}
        <div className="absolute top-6 right-6">
          <div className="relative">
            <select
              value={lang}
              onChange={handleLangChange}
              className="appearance-none pl-8 pr-7 py-1.5 rounded-full text-xs font-bold border bg-white border-gray-200 text-gray-700 hover:border-gray-300 outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Brand Icon Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 bg-brand-50 border border-brand-100 rounded-3xl flex items-center justify-center text-brand-600 shadow-md shadow-brand-500/5 mb-4">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Olá! Bem-vindo de volta
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Introduza os seus dados para aceder ao controle financeiro.
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-4 bg-red-50 border border-red-150 rounded-2xl text-xs text-red-600 font-semibold leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
              {loginError}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                E-mail ou Nome de Utilizador
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@vukapay.com"
                  required
                  disabled={authLoading || isLoadingLocal}
                  className="w-full pl-10 pr-4 py-3 bg-gray-55 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 font-medium transition-all"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Palavra-passe
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-brand-600 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={authLoading || isLoadingLocal}
                  className="w-full pl-10 pr-4 py-3 bg-gray-55 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 font-medium transition-all"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="remember_me" className="ml-2 text-xs text-gray-500 font-semibold cursor-pointer select-none">
                Manter-me conectado neste dispositivo
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={authLoading || isLoadingLocal}
              className="w-full py-3.5 bg-brand-650 hover:bg-brand-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-brand-600/10 flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {isLoadingLocal ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Aceder ao Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Professional Divider */}
          <div className="my-8 flex items-center justify-center gap-3">
            <div className="h-[1px] bg-gray-150 flex-1" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              ou aceder de outra forma
            </span>
            <div className="h-[1px] bg-gray-150 flex-1" />
          </div>

          {/* Social Logins underneath credentials */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading || isLoadingLocal}
              className="flex items-center justify-center gap-2.5 p-3.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-2xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50 cursor-pointer"
              title="Entrar com a conta Google"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.38-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-xs font-bold text-gray-700">Google</span>
            </button>

            {/* Guest/Local Offline Mode */}
            <button
              onClick={handleLocalGuestLogin}
              disabled={authLoading || isLoadingLocal}
              className="flex items-center justify-center gap-2.5 p-3.5 border border-brand-100 bg-brand-50/20 hover:bg-brand-50 hover:border-brand-200 rounded-2xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50 cursor-pointer"
              title="Entrar localmente sem sincronização de nuvem"
            >
              <WifiOff className="w-4 h-4 text-brand-650 shrink-0" />
              <span className="text-xs font-bold text-brand-700">Convidado</span>
            </button>
          </div>

          {/* Local storage note */}
          <div className="mt-8 p-4 border border-brand-100/30 bg-brand-50/10 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-gray-650">
            <Database className="w-5 h-5 shrink-0 text-brand-500/40 mt-0.5" />
            <p>
              {t('localDataNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
