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
  Sparkles,
  Globe,
  Users,
  Briefcase,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Local translations for the Left Branding Panel since they are specific to this screen
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
    feat4Title: 'Área de Negócios',
    feat4Desc: 'Faturas, recibos e simulações',
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
    feat4Title: 'Business Hub',
    feat4Desc: 'Invoices, receipts and simulations',
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
    feat4Title: 'Cisoko cupange',
    feat4Desc: 'Milavisu yofatura ye milambo',
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
    feat4Title: 'Upange wa mbongo',
    feat4Desc: 'Jifatura ni jindolo ja kusoñgolola',
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
    feat4Title: 'Nkitolo ye faturas',
    feat4Desc: 'Bisalu bia faturas ye nkanu',
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
  const navigate = useNavigate();

  // Language management
  const [lang, setLang] = useState<string>(() => {
    return localStorage.getItem('vukapay_login_lang') || 'pt-AO';
  });

  // Theme management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('vukapay_login_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vukapay_login_theme', theme);
  }, [theme]);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('vukapay_login_lang', newLang);
  };

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

  // Helper translations
  const t = (key: string): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['pt-AO']?.[key] || key;
  };

  const b = (key: string): string => {
    return LOCAL_BRAND_TRANSLATIONS[lang]?.[key] || LOCAL_BRAND_TRANSLATIONS['pt-AO']?.[key] || key;
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex font-sans transition-colors duration-300 selection:bg-indigo-500/30",
      theme === 'dark' ? "bg-[#030712] text-gray-100" : "bg-gray-50 text-gray-900"
    )}>
      {/* Left Side: Premium Branding Panel */}
      <div className={cn(
        "hidden lg:flex lg:w-[55%] relative overflow-hidden border-r transition-colors duration-300",
        theme === 'dark' ? "border-gray-800/40" : "border-gray-250"
      )}>
        {/* Background Graphic */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"
            alt="Abstract Premium Gradient"
            className="w-full h-full object-cover opacity-20 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className={cn(
            "absolute inset-0",
            theme === 'dark' 
              ? "bg-gradient-to-tr from-[#030712] via-[#060b18]/90 to-[#0a0d1a]/70"
              : "bg-gradient-to-tr from-gray-50 via-gray-100/90 to-indigo-50/60"
          )} />
        </div>

        {/* Ambient Glows */}
        <div className={cn(
          "absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] transition-opacity duration-300",
          theme === 'dark' ? "bg-indigo-600/10" : "bg-indigo-500/5"
        )} />
        <div className={cn(
          "absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full blur-[120px] transition-opacity duration-300",
          theme === 'dark' ? "bg-purple-600/10" : "bg-purple-500/5"
        )} />

        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-indigo-600 rounded-2xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className={cn(
                "text-2xl font-extrabold tracking-tight bg-gradient-to-r bg-clip-text text-transparent",
                theme === 'dark' ? "from-white to-gray-400" : "from-indigo-900 to-indigo-700"
              )}>
                VukaPay
              </span>
              <span className="ml-2 text-xs text-indigo-400/80 font-bold border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                v1.0.9
              </span>
            </div>
          </div>

          {/* Main Copy */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-500 dark:text-indigo-400 text-xs font-semibold mb-6">
              <Globe className="w-3.5 h-3.5 animate-spin-slow" />
              {b('madeForAngola')}
            </div>
            <h1 className={cn(
              "text-5xl font-black leading-[1.15] mb-6 bg-gradient-to-br bg-clip-text text-transparent",
              theme === 'dark' ? "from-white via-gray-200 to-gray-500" : "from-indigo-950 via-indigo-900 to-slate-655"
            )}>
              {b('heroTitle')}
            </h1>
            <p className={cn(
              "text-lg mb-10 leading-relaxed",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
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
                  <p className={cn("text-3xl font-black", theme === 'dark' ? "text-white" : "text-indigo-900")}>{value}</p>
                  <p className={cn("text-xs mt-0.5 font-bold", theme === 'dark' ? "text-gray-500" : "text-gray-400")}>{label}</p>
                </div>
              ))}
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, label: b('feat1Title'), desc: b('feat1Desc') },
                { icon: PieChart, label: b('feat2Title'), desc: b('feat2Desc') },
                { icon: Users, label: b('feat3Title'), desc: b('feat3Desc') },
                { icon: Briefcase, label: b('feat4Title'), desc: b('feat4Desc') },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className={cn(
                  "flex items-start gap-3 p-3 border rounded-2xl transition-colors duration-300",
                  theme === 'dark' 
                    ? "bg-white/[0.03] border-white/[0.06]" 
                    : "bg-indigo-50/20 border-indigo-100/40"
                )}>
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0">
                    <Icon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className={cn("font-bold text-sm", theme === 'dark' ? "text-gray-200" : "text-indigo-950")}>{label}</p>
                    <p className={cn("text-xs mt-0.5", theme === 'dark' ? "text-gray-500" : "text-gray-400")}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{b('copyRight')}</p>
            <a href="mailto:suporte.vukapay@gmail.com" className="text-xs text-gray-500 hover:text-indigo-500 transition-colors">
              suporte.vukapay@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Right Side: Authentication */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 relative">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0 -z-10 transition-colors duration-300">
          <div className={cn("absolute inset-0", theme === 'dark' ? "bg-[#030712]" : "bg-gray-50")} />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/5 rounded-full blur-[60px]" />
        </div>

        {/* Global Selectors Floating Top Right */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={lang}
              onChange={handleLangChange}
              className={cn(
                "appearance-none pl-8 pr-7 py-1.5 rounded-full text-xs font-bold border transition-colors outline-none cursor-pointer",
                theme === 'dark' 
                  ? "bg-gray-900 border-gray-800 text-gray-200 hover:border-gray-700" 
                  : "bg-white border-gray-250 text-gray-700 hover:border-gray-300"
              )}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Theme Selector */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center transition-colors shadow-sm",
              theme === 'dark' 
                ? "bg-gray-900 border-gray-800 hover:bg-gray-800 text-amber-400" 
                : "bg-white border-gray-250 hover:bg-gray-50 text-indigo-600"
            )}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-indigo-950")}>VukaPay</span>
            <span className="text-xs text-indigo-400/80 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">v1.0.9</span>
          </div>

          <div className="mb-10">
            <h2 className={cn("text-3xl font-extrabold tracking-tight mb-3", theme === 'dark' ? "text-white" : "text-indigo-950")}>
              {t('welcome')}
            </h2>
            <p className={cn("text-sm leading-relaxed", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
              {t('howToAccess')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading || isLoadingLocal}
              className={cn(
                "w-full text-left p-5 border rounded-2xl transition-all duration-350 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed",
                theme === 'dark'
                  ? "bg-gradient-to-br from-gray-900 to-gray-900/50 border-gray-800 hover:border-indigo-500/50 hover:bg-gray-900/80"
                  : "bg-white border-gray-200 hover:border-indigo-500/35 hover:bg-indigo-50/10 shadow-sm"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.38-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn("font-bold text-base transition-colors", theme === 'dark' ? "text-white group-hover:text-indigo-300" : "text-gray-900 group-hover:text-indigo-600")}>
                      {t('googleMode')}
                    </h3>
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <p className="text-gray-450 dark:text-gray-500 text-xs mt-0.5 leading-relaxed">
                    Ativa a sincronização opcional de backups na nuvem.
                  </p>
                </div>
              </div>
            </button>

            {/* Local / Offline Mode */}
            <button
              onClick={handleLocalLogin}
              disabled={authLoading || isLoadingLocal}
              className={cn(
                "w-full text-left p-5 border rounded-2xl transition-all duration-350 group focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed",
                theme === 'dark'
                  ? "bg-gradient-to-br from-indigo-950/40 to-indigo-900/20 border-indigo-800/40 hover:border-indigo-600/60"
                  : "bg-indigo-50/30 border-indigo-200/50 hover:border-indigo-500/40 hover:bg-indigo-50/50 shadow-sm"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                  <WifiOff className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn("font-bold text-base transition-colors", theme === 'dark' ? "text-white group-hover:text-indigo-300" : "text-gray-900 group-hover:text-indigo-600")}>
                      {t('guestMode')}
                    </h3>
                    {isLoadingLocal ? (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <p className="text-gray-450 dark:text-gray-500 text-xs mt-0.5 leading-relaxed">
                    Armazenamento local rápido via SQLite. 100% offline.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 space-y-3">
            {[
              { text: b('trust1'), color: 'text-emerald-500' },
              { text: b('trust2'), color: 'text-emerald-500' },
              { text: b('trust3'), color: 'text-indigo-500' },
            ].map(({ text, color }) => (
              <div key={text} className="flex items-start gap-2.5">
                <CheckCircle2 className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />
                <p className="text-xs text-gray-500 dark:text-gray-450">{text}</p>
              </div>
            ))}
          </div>

          <div className={cn(
            "mt-8 p-4 border rounded-2xl flex items-center gap-3 text-xs leading-relaxed transition-colors duration-300",
            theme === 'dark' 
              ? "bg-gray-950/40 border-gray-900 text-gray-500" 
              : "bg-gray-100/50 border-gray-200/50 text-gray-600"
          )}>
            <Database className="w-5 h-5 shrink-0 text-indigo-500/50" />
            <p>
              {t('localDataNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
