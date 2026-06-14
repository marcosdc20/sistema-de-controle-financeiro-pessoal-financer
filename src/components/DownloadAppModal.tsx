import React, { useEffect, useState } from 'react';
import { X, Download, ShieldCheck, ArrowRight, AppWindow, Apple, MonitorSmartphone, Smartphone, Loader2, RefreshCw } from 'lucide-react';

interface DownloadAppModalProps {
  onClose: () => void;
}

// URLs fixas no Firebase Storage — o ficheiro é substituído a cada release,
// mas o link permanece sempre o mesmo.
const FIREBASE_WINDOWS_URL =
  'https://firebasestorage.googleapis.com/v0/b/controle-financeiro-pess-45a60.appspot.com/o/updates%2FVukaPay_x64-setup.exe?alt=media';

const FIREBASE_ANDROID_URL =
  'https://firebasestorage.googleapis.com/v0/b/controle-financeiro-pess-45a60.appspot.com/o/updates%2Fapp-universal-release.apk?alt=media';

// URL do updater.json servido pelo Firebase Hosting (sem cache)
const UPDATER_JSON_URL =
  'https://controle-financeiro-pess-45a60.web.app/updater.json';

export default function DownloadAppModal({ onClose }: DownloadAppModalProps) {
  const [version, setVersion]     = useState<string>('...');
  const [notes, setNotes]         = useState<string>('');
  const [loadingVer, setLoadingVer] = useState(true);
  const [downloading, setDownloading] = useState<'windows' | 'android' | null>(null);

  // Busca a versão mais recente do Firebase Hosting
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch(UPDATER_JSON_URL + '?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao obter versão');
        const data = await res.json();
        setVersion(data.version ?? 'N/A');
        setNotes(data.notes ?? '');
      } catch {
        setVersion('1.1.5'); // fallback
      } finally {
        setLoadingVer(false);
      }
    };
    fetchVersion();
  }, []);

  const handleDownload = (platform: 'windows' | 'android') => {
    setDownloading(platform);
    const url = platform === 'windows' ? FIREBASE_WINDOWS_URL : FIREBASE_ANDROID_URL;
    // Abre numa nova aba — o browser inicia o download automaticamente
    window.open(url, '_blank', 'noopener,noreferrer');
    // Reset após 3 segundos
    setTimeout(() => setDownloading(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#0a0a0b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8">

        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-[300px] bg-gradient-to-tl from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
              Lançamento Oficial
            </span>
            <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Descarregar o VukaPay</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-zinc-400">
              Versão estável atual:{' '}
              {loadingVer ? (
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Loader2 size={12} className="animate-spin" /> A carregar...
                </span>
              ) : (
                <strong className="text-emerald-400">v{version}</strong>
              )}
            </p>
            {notes && (
              <span className="text-[11px] text-zinc-500 italic truncate max-w-xs" title={notes}>
                — {notes}
              </span>
            )}
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="relative p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Windows */}
          <div className="relative group bg-white/[0.02] border border-emerald-500/30 rounded-3xl p-6 flex flex-col hover:bg-white/[0.04] transition-colors overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <AppWindow size={28} color="white" />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-zinc-300">
                <MonitorSmartphone size={12} /> DESKTOP
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Windows</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">
              Compatível com Windows 10 e 11 (64-bit).<br />
              Download directo do servidor VukaPay.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleDownload('windows')}
                disabled={downloading === 'windows' || loadingVer}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:opacity-70 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {downloading === 'windows' ? (
                  <><RefreshCw size={16} className="animate-spin" /> A preparar...</>
                ) : (
                  <><Download size={16} /> Instalador (.exe)</>
                )}
              </button>
              <div className="flex items-center gap-1.5 justify-center pt-1">
                <ShieldCheck size={11} className="text-emerald-500/70" />
                <span className="text-[10px] text-zinc-600">Assinado digitalmente · Firebase CDN</span>
              </div>
            </div>
          </div>

          {/* macOS */}
          <div className="relative group bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col hover:bg-white/[0.04] transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Apple size={28} color="white" />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-zinc-300">
                <MonitorSmartphone size={12} /> DESKTOP
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">macOS</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">Requer macOS 11 Big Sur ou superior.</p>

            <div className="space-y-2">
              <button disabled className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 border border-white/5 text-zinc-500 font-bold rounded-xl text-sm cursor-not-allowed">
                <Download size={16} /> Em Breve
              </button>
              <span className="block text-center text-[10px] text-zinc-700 pt-1">Versão macOS a caminho</span>
            </div>
          </div>

          {/* Linux */}
          <div className="relative group bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col hover:bg-white/[0.04] transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <AppWindow size={28} color="white" />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-zinc-300">
                <MonitorSmartphone size={12} /> DESKTOP
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Linux</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">Testado no Ubuntu, Mint, Fedora e Debian.</p>

            <div className="space-y-2">
              <button disabled className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 border border-white/5 text-zinc-500 font-bold rounded-xl text-sm cursor-not-allowed">
                <Download size={16} /> Em Breve
              </button>
              <span className="block text-center text-[10px] text-zinc-700 pt-1">Versão Linux a caminho</span>
            </div>
          </div>

          {/* Android */}
          <div className="relative group bg-white/[0.02] border border-green-500/20 rounded-3xl p-6 flex flex-col hover:bg-white/[0.04] transition-colors overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Smartphone size={28} color="white" />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-zinc-300">
                <Smartphone size={12} /> MOBILE
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Android</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">
              Requer Android 8.0 ou superior.<br />
              Ativa "Instalar de fontes desconhecidas" nas definições.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleDownload('android')}
                disabled={downloading === 'android' || loadingVer}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:opacity-70 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] shadow-lg shadow-green-600/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {downloading === 'android' ? (
                  <><RefreshCw size={16} className="animate-spin" /> A preparar...</>
                ) : (
                  <><Download size={16} /> Instalar Pacote (.apk)</>
                )}
              </button>
              <div className="flex items-center gap-1.5 justify-center pt-1">
                <ShieldCheck size={11} className="text-green-500/70" />
                <span className="text-[10px] text-zinc-600">APK Assinado · Firebase CDN</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Todos os pacotes são encriptados e assinados digitalmente. Distribuídos via Firebase.</span>
          </div>
          <a
            href="https://controle-financeiro-pess-45a60.web.app/updater.json"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            Ver informação de versão <ArrowRight size={12} />
          </a>
        </div>

      </div>
    </div>
  );
}
