/**
 * LicenseGuard.tsx
 *
 * Componente de barreira de licença do VukaPay.
 * Intercepta a renderização do app e exibe as telas correspondentes
 * a cada fase do ciclo de vida da licença.
 *
 * Fases tratadas:
 *  loading        → spinner de verificação
 *  trial_active   → banner de trial + acesso ao app
 *  trial_expired  → modal de bloqueio + campo de chave
 *  activating     → feedback de ativação
 *  active         → app desbloqueado
 *  expired        → modal de licença expirada
 *  revoked        → modal de licença revogada
 *  offline_warning → aviso de revalidação necessária
 *  error          → mensagem de erro crítico
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Loader2,
  Lock,
  Wifi,
  WifiOff,
  ExternalLink,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  X,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useLicense } from '@/context/LicenseContext';
import PurchaseLicenseModal from './PurchaseLicenseModal';

// ─── Constante ───────────────────────────────────────────────────────────────

const PURCHASE_URL = import.meta.env.VITE_LICENSE_PURCHASE_URL as string || 'https://vukapay.com/adquirir';

// ─── Sub-componente: Logo/Brand ──────────────────────────────────────────────

function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-4 animate-pulse">
        <TrendingUp className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-white tracking-tight">VukaPay</h1>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1 text-center">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Sub-componente: Background animado ─────────────────────────────────────

function AnimatedBackground({ variant = 'default' }: { variant?: 'default' | 'danger' | 'warning' }) {
  const colors = {
    default: { primary: 'bg-indigo-600/10', secondary: 'bg-purple-600/10' },
    danger:  { primary: 'bg-red-600/10',    secondary: 'bg-orange-600/10' },
    warning: { primary: 'bg-amber-600/10',  secondary: 'bg-yellow-600/8' },
  };
  const c = colors[variant];

  return (
    <>
      <div className={`fixed top-1/4 -left-1/4 w-[600px] h-[600px] ${c.primary} rounded-full blur-[120px] pointer-events-none`} />
      <div className={`fixed bottom-1/4 -right-1/4 w-[500px] h-[500px] ${c.secondary} rounded-full blur-[120px] pointer-events-none`} />
    </>
  );
}

// ─── Tela: Loading ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030712] font-sans">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <p className="text-sm text-gray-400 animate-pulse">A inicializar VukaPay...</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tela: Trial Expirado / Bloqueio + Ativação ──────────────────────────────

function BlockedScreen({ phase }: { phase: 'trial_expired' | 'expired' | 'revoked' | 'error' | 'activating' }) {
  const { licenseState, activateLicenseKey } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendDesktopNotification = (title: string, body: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '/logo.png' });
          }
        });
      }
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setLicenseKey(value);
    setActivationError(null);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setActivationError('Introduza a sua chave de licença.');
      return;
    }
    if (!licenseKey.match(/^VUKA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      const errMsg = 'Formato inválido. A chave deve seguir o padrão VUKA-XXXX-XXXX-XXXX-XXXX';
      setActivationError(errMsg);
      sendDesktopNotification('Falha de Ativação VukaPay', errMsg);
      return;
    }

    setIsActivating(true);
    setActivationError(null);

    const result = await activateLicenseKey(licenseKey.trim());

    if (result.success) {
      setActivationSuccess(true);
      sendDesktopNotification('VukaPay Ativado!', 'A sua licença foi ativada com sucesso.');
    } else {
      const errorMessages: Record<string, string> = {
        NOT_FOUND:         'Chave de licença não encontrada. Verifique e tente novamente.',
        ALREADY_ACTIVATED: 'Esta chave já está ativada noutro computador. Contacte o suporte.',
        REVOKED:           'Esta chave foi revogada. Contacte o suporte para assistência.',
        EXPIRED:           'Esta chave de licença expirou. Por favor, renove a sua subscrição.',
        NETWORK_ERROR:     'Sem conexão à internet. Verifique a sua ligação e tente novamente.',
        UNKNOWN:           'Erro inesperado. Tente novamente ou contacte o suporte.',
      };
      const errMsg = errorMessages[result.errorCode ?? 'UNKNOWN'] || result.message || 'Falha na ativação.';
      setActivationError(errMsg);
      sendDesktopNotification('Falha de Ativação VukaPay', errMsg);
    }

    setIsActivating(false);
  };

  const headerContent = {
    trial_expired: {
      icon: <Clock className="w-8 h-8 text-amber-400" />,
      iconBg: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
      title: 'Período de Teste Encerrado',
      description: 'O seu período de avaliação gratuita de 7 dias terminou. Adquira uma licença para continuar a gerir as suas finanças com total privacidade e segurança.',
    },
    expired: {
      icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
      iconBg: 'from-red-500/20 to-rose-500/20 border-red-500/30',
      title: 'Licença Expirada',
      description: 'A sua licença VukaPay expirou. Renove para retomar o acesso completo ao aplicativo.',
    },
    revoked: {
      icon: <ShieldAlert className="w-8 h-8 text-red-400" />,
      iconBg: 'from-red-500/20 to-rose-500/20 border-red-500/30',
      title: 'Acesso Suspenso',
      description: 'A sua licença foi desativada. Contacte o suporte em suporte.vukapay@gmail.com para mais informações.',
    },
    error: {
      icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
      iconBg: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
      title: 'Erro de Verificação',
      description: licenseState.errorMessage || 'Não foi possível verificar o estado da licença.',
    },
    activating: {
      icon: <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />,
      iconBg: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
      title: 'Ativando VukaPay...',
      description: 'A verificar a sua chave de licença nos servidores. Aguarde um momento.',
    },
  };

  const content = headerContent[phase] || headerContent['trial_expired'];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030712]/95 backdrop-blur-sm font-sans p-4">
      <AnimatedBackground variant={phase === 'trial_expired' ? 'default' : 'danger'} />

      <div className="relative z-10 w-full max-w-md">
        {/* Card principal */}
        <div className="bg-gray-950/90 border border-gray-800/60 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md">
          {/* Gradiente no topo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-[2rem]" />

          <BrandHeader subtitle="Sistema de Controle Financeiro Pessoal" />

          {/* Ícone de estado */}
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${content.iconBg} border flex items-center justify-center mb-5`}>
            {content.icon}
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-3">{content.title}</h2>
          <p className="text-sm text-gray-400 text-center leading-relaxed mb-8">{content.description}</p>

          {activationSuccess ? (
            /* Estado de sucesso */
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-semibold text-center">Licença ativada com sucesso!</p>
              <p className="text-xs text-gray-500 text-center">O VukaPay está a ser desbloqueado...</p>
            </div>
          ) : phase !== 'revoked' && phase !== 'activating' ? (
            <>
              {/* Botão de compra */}
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.98] mb-4"
              >
                <Zap className="w-4 h-4" />
                Adquirir Licença VukaPay
              </button>
              
              {showPurchaseModal && (
                <PurchaseLicenseModal 
                  onClose={() => setShowPurchaseModal(false)} 
                  userEmail={licenseState.clientEmail} 
                />
              )}

              {/* Separador */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">Já tem uma chave?</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Formulário de ativação */}
              <form onSubmit={handleActivate} className="space-y-3">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    id="license-key-input"
                    value={licenseKey}
                    onChange={handleKeyChange}
                    placeholder="VUKA-XXXX-XXXX-XXXX-XXXX"
                    maxLength={24}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-900/80 border border-gray-800 focus:border-indigo-500/60 rounded-2xl text-sm text-white font-mono tracking-widest placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                {activationError && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{activationError}</span>
                  </div>
                )}

                <button
                  id="activate-license-btn"
                  type="submit"
                  disabled={isActivating || !licenseKey.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm transition-all active:scale-[0.98] border border-gray-700/50"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A verificar...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Ativar VukaPay</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-600 mt-4">
          VukaPay v1.0 · Protegido por licenciamento digital
        </p>
      </div>
    </div>
  );
}

// ─── Tela: Aviso Offline ──────────────────────────────────────────────────────

function OfflineWarningScreen() {
  const { licenseState, refreshLicense } = useLicense();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshLicense();
    setIsRefreshing(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030712]/95 backdrop-blur-sm font-sans p-4">
      <AnimatedBackground variant="warning" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gray-950/90 border border-amber-900/30 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-[2rem]" />

          <BrandHeader />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mb-5">
            <WifiOff className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-3">Revalidação Necessária</h2>
          <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
            O VukaPay não conseguiu verificar a sua licença há{' '}
            <span className="text-amber-400 font-semibold">
              {licenseState.offlineDaysCount ?? 7} dias
            </span>
            . Por favor, conecte-se à internet para uma verificação rápida e segura.
          </p>

          <div className="p-4 bg-amber-900/10 border border-amber-800/20 rounded-2xl mb-6 text-xs text-amber-300/70 leading-relaxed">
            <strong className="text-amber-300">Por que isto acontece?</strong>
            <br />
            Por segurança, o VukaPay verifica periodicamente que a sua licença continua ativa na nossa plataforma. Isto protege contra uso indevido da chave.
          </div>

          {licenseState.licenseKey && (
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-2xl mb-6">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Licença Registada</p>
              <p className="text-xs text-gray-300 font-mono">{licenseState.licenseKey}</p>
              {licenseState.clientEmail && (
                <p className="text-[11px] text-gray-500 mt-1">{licenseState.clientEmail}</p>
              )}
            </div>
          )}

          <button
            id="revalidate-license-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-amber-600/20 active:scale-[0.98]"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A verificar...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Verificar Agora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner: Trial Ativo ──────────────────────────────────────────────────────

function TrialBanner({ onDismiss }: { onDismiss: () => void }) {
  const { licenseState } = useLicense();

  const daysLeft = licenseState.trialDaysRemaining ?? 0;
  const isUrgent = daysLeft <= 2;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between gap-4 px-6 py-2.5 text-xs font-medium transition-all ${
      isUrgent
        ? 'bg-gradient-to-r from-red-900/90 to-rose-900/90 border-b border-red-800/50 text-red-200'
        : 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border-b border-indigo-800/30 text-indigo-200'
    } backdrop-blur-sm`}>
      <div className="flex items-center gap-2">
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-indigo-400'}`} />
        <span>
          {daysLeft === 0 ? (
            'Período de teste termina hoje!'
          ) : (
            <>Período de avaliação: <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong> restante{daysLeft !== 1 ? 's' : ''}</>
          )}
        </span>
        <a
          href={PURCHASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${
            isUrgent
              ? 'bg-red-500/30 hover:bg-red-500/50 text-red-200'
              : 'bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200'
          }`}
        >
          <Zap className="w-3 h-3" />
          Obter Licença
        </a>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fechar banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Componente Principal: LicenseGuard ─────────────────────────────────────

interface LicenseGuardProps {
  children: React.ReactNode;
}

export default function LicenseGuard({ children }: LicenseGuardProps) {
  const { licenseState, isLoading } = useLicense();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isVideoFinished, setIsVideoFinished] = useState(() => {
    return localStorage.getItem('vukapay_intro_played') === 'true';
  });
  const [videoReady, setVideoReady] = useState(false);

  const handleVideoEnded = () => {
    localStorage.setItem('vukapay_intro_played', 'true');
    setIsVideoFinished(true);
  };

  // Safety timeout — if video doesn't end/load within 20s, skip automatically
  useEffect(() => {
    if (isVideoFinished) return;
    const timer = setTimeout(() => {
      handleVideoEnded();
    }, 20000);
    return () => clearTimeout(timer);
  }, [isVideoFinished]);

  if (!isVideoFinished) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#030712] flex items-center justify-center">
        <video
          src="/videos/intro.mp4"
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover pointer-events-none absolute inset-0"
          onEnded={handleVideoEnded}
          onError={handleVideoEnded}
          onCanPlay={() => setVideoReady(true)}
        />
        {/* Fallback loading while video loads */}
        {!videoReady && (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <p className="text-sm text-gray-400 animate-pulse">A carregar VukaPay...</p>
          </div>
        )}
        <button
          onClick={handleVideoEnded}
          className="absolute bottom-8 right-8 z-20 px-5 py-2.5 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white text-xs font-bold rounded-xl backdrop-blur-md transition-all border border-white/10 shadow-lg"
        >
          Pular Introdução →
        </button>
      </div>
    );
 }

  // Fase de carregamento inicial (se o video acabar e ainda não estiver pronto)
  if (isLoading || licenseState.phase === 'loading') {
    return <LoadingScreen />;
  }

  // Fases de bloqueio total — o app não é renderizado
  if (licenseState.phase === 'trial_expired') {
    return <BlockedScreen phase="trial_expired" />;
  }

  if (licenseState.phase === 'expired') {
    return <BlockedScreen phase="expired" />;
  }

  if (licenseState.phase === 'revoked') {
    return <BlockedScreen phase="revoked" />;
  }

  if (licenseState.phase === 'activating') {
    return <BlockedScreen phase="activating" />;
  }

  if (licenseState.phase === 'error') {
    return <BlockedScreen phase="error" />;
  }

  // Aviso de revalidação offline (bloqueia até verificar)
  if (licenseState.phase === 'offline_warning') {
    return <OfflineWarningScreen />;
  }

  // Fase trial ativo — app renderizado com banner de aviso
  if (licenseState.phase === 'trial_active') {
    return (
      <div className="relative">
        {!bannerDismissed && <TrialBanner onDismiss={() => setBannerDismissed(true)} />}
        <div style={{ paddingTop: bannerDismissed ? '0px' : '34px', transition: 'padding-top 0.2s ease' }}>
          {children}
        </div>
      </div>
    );
  }

  // Fase ativa — app totalmente desbloqueado
  return <>{children}</>;
}
