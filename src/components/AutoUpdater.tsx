import { useState, useEffect, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { RefreshCw, Download, AlertTriangle, X } from 'lucide-react';

// Comparador de versões semver simples
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number);
  const parts2 = v2.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export default function AutoUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [visible, setVisible] = useState(false);
  
  // Estados específicos para Android
  const [androidDownloadUrl, setAndroidDownloadUrl] = useState<string | null>(null);
  const [androidVersion, setAndroidVersion] = useState<string | null>(null);

  // Verifica se está rodando dentro do Tauri
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
  
  // Detecta se é Android
  const isAndroid = isTauri && navigator.userAgent.toLowerCase().includes('android');

  const handleDownloadAndInstall = useCallback(async (up: Update) => {
    try {
      setStatus('downloading');
      setProgress(0);
      setVisible(true);
      
      console.log('[AutoUpdater] Iniciando download e instalação automática...');
      
      let downloadedBytes = 0;
      let totalBytes = 0;

      await up.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            totalBytes = event.data.contentLength || 0;
            console.log(`[AutoUpdater] Download iniciado: ${totalBytes} bytes`);
            break;
          case 'Progress':
            downloadedBytes += event.data.chunkLength;
            if (totalBytes > 0) {
              const percent = Math.round((downloadedBytes / totalBytes) * 100);
              setProgress(percent);
            }
            break;
          case 'Finished':
            console.log('[AutoUpdater] Download concluído.');
            break;
        }
      });

      setStatus('installing');
      console.log('[AutoUpdater] Reiniciando aplicativo para aplicar atualização...');
      await relaunch();
    } catch (err) {
      console.error('[AutoUpdater] Erro ao atualizar automaticamente:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleAndroidDownload = async () => {
    if (!androidDownloadUrl) return;
    try {
      setStatus('downloading');
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(androidDownloadUrl);
      
      // Fecha a notificação após abrir o link no navegador
      setStatus('idle');
      setVisible(false);
    } catch (err) {
      console.error('[AutoUpdater] Erro ao abrir link de download no Android:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (!isTauri) return;

    const checkForUpdates = async () => {
      if (isAndroid) {
        // Fluxo de atualização personalizado para Android
        try {
          setStatus('checking');
          console.log('[AutoUpdater] [Android] Procurando atualizações...');
          
          const { getVersion } = await import('@tauri-apps/api/app');
          const currentVersion = await getVersion();
          
          const res = await fetch('https://raw.githubusercontent.com/marcosdc20/sistema-de-controle-financeiro-pessoal-financer/main/updater.json');
          if (!res.ok) throw new Error('Não foi possível ler as informações de atualização.');
          
          const data = await res.json();
          const remoteVersion = data.version;
          
          console.log(`[AutoUpdater] [Android] Versão local: ${currentVersion}, remota: ${remoteVersion}`);
          
          if (compareVersions(remoteVersion, currentVersion) > 0) {
            // Verifica o link para Android no updater.json
            const androidPlatform = data.platforms?.['android-aarch64'] || data.platforms?.['android'] || data.platforms?.['android-universal'];
            if (androidPlatform && androidPlatform.url) {
              console.log(`[AutoUpdater] [Android] Nova versão encontrada: v${remoteVersion}`);
              setAndroidVersion(remoteVersion);
              setAndroidDownloadUrl(androidPlatform.url);
              setStatus('available');
              setVisible(true);
            }
          } else {
            console.log('[AutoUpdater] [Android] Você está na versão mais recente.');
            setStatus('idle');
          }
        } catch (err) {
          console.error('[AutoUpdater] [Android] Erro ao verificar atualizações:', err);
          setStatus('idle');
        }
      } else {
        // Fluxo padrão para Desktop
        try {
          setStatus('checking');
          console.log('[AutoUpdater] Procurando atualizações...');
          const updateResult = await check();
          
          if (updateResult) {
            console.log(`[AutoUpdater] Nova versão encontrada: ${updateResult.version}. Iniciando atualização automática.`);
            setUpdate(updateResult);
            await handleDownloadAndInstall(updateResult);
          } else {
            console.log('[AutoUpdater] Nenhuma atualização pendente. Você está na versão mais recente.');
            setStatus('idle');
          }
        } catch (err) {
          console.error('[AutoUpdater] Erro ao procurar atualizações:', err);
          setStatus('idle');
        }
      }
    };

    // Pequeno delay na inicialização para não competir com outros carregamentos
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isTauri, isAndroid, handleDownloadAndInstall]);

  const handleManualRetry = () => {
    if (isAndroid) {
      handleAndroidDownload();
    } else if (update) {
      handleDownloadAndInstall(update);
    }
  };

  if (!isTauri || !visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full bg-[#111827]/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-5 shadow-2xl text-gray-200 animate-in slide-in-from-bottom duration-300">
      {/* Botão Fechar apenas em caso de erro ou versão disponível para Android */}
      {(status === 'error' || (isAndroid && status === 'available')) && (
        <button 
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
            {status === 'downloading' || status === 'installing' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : status === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            {status === 'checking' && 'A procurar actualizações...'}
            {status === 'available' && 'Atualização Disponível'}
            {status === 'downloading' && (isAndroid ? 'A descarregar...' : 'Atualização em Segundo Plano')}
            {status === 'installing' && 'Instalando Atualização...'}
            {status === 'error' && 'Erro na Atualização'}
          </h4>

          {isAndroid && status === 'available' && androidVersion && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-3">
                Uma nova versão <span className="font-semibold text-white">v{androidVersion}</span> está disponível para Android.
              </p>
              <button
                onClick={handleAndroidDownload}
                className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <Download className="w-4 h-4" /> Descarregar APK
              </button>
            </div>
          )}

          {!isAndroid && status === 'downloading' && update && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-2">
                Uma nova versão <span className="font-semibold text-white">v{update.version}</span> está a ser descarregada automaticamente.
              </p>
              <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-1">
                <span>Progresso do Download</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 italic">
                O VukaPay reiniciará automaticamente para aplicar a atualização.
              </p>
            </div>
          )}

          {isAndroid && status === 'downloading' && (
            <p className="text-xs text-gray-400 mt-1">
              A abrir o navegador padrão para iniciar o download do pacote APK...
            </p>
          )}

          {status === 'installing' && (
            <p className="text-xs text-gray-400 mt-1">
              Quase pronto! O VukaPay reiniciará automaticamente para concluir a instalação...
            </p>
          )}

          {status === 'error' && (
            <div className="mt-1">
              <p className="text-xs text-red-400 leading-relaxed">
                {errorMessage || 'Ocorreu um erro ao processar a nova versão.'}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleManualRetry}
                  className="px-3 py-1.5 bg-red-900/30 border border-red-500/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => setVisible(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
