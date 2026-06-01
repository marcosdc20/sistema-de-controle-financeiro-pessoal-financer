import { useState, useEffect, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { RefreshCw, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function AutoUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [visible, setVisible] = useState(false);

  // Verifica se está rodando dentro do Tauri
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

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

  useEffect(() => {
    if (!isTauri) return;

    const checkForUpdates = async () => {
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
        setStatus('idle'); // falha silenciosamente na busca inicial para não incomodar o usuário
      }
    };

    // Pequeno delay na inicialização para não competir com outros carregamentos
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isTauri, handleDownloadAndInstall]);

  const handleManualRetry = () => {
    if (update) {
      handleDownloadAndInstall(update);
    }
  };

  if (!isTauri || !visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full bg-[#111827]/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-5 shadow-2xl text-gray-200 animate-in slide-in-from-bottom duration-300">
      {/* Botão Fechar apenas em caso de erro */}
      {status === 'error' && (
        <button 
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
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
            {status === 'downloading' && 'Atualização em Segundo Plano'}
            {status === 'installing' && 'Instalando Atualização...'}
            {status === 'error' && 'Erro na Atualização'}
          </h4>

          {status === 'downloading' && update && (
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

          {status === 'installing' && (
            <p className="text-xs text-gray-400 mt-1">
              Quase pronto! O VukaPay reiniciará automaticamente para concluir a instalação...
            </p>
          )}

          {status === 'error' && (
            <div className="mt-1">
              <p className="text-xs text-red-400 leading-relaxed">
                {errorMessage || 'Ocorreu um erro ao baixar os arquivos da nova versão.'}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleManualRetry}
                  className="px-3 py-1.5 bg-red-900/30 border border-red-500/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold rounded-xl transition-all"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => setVisible(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-all"
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
