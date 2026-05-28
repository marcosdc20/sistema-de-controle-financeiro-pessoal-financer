import { useState, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { RefreshCw, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function AutoUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [visible, setVisible] = useState(false);

  // Verifica se está rodando dentro do Tauri
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

  useEffect(() => {
    if (!isTauri) return;

    const checkForUpdates = async () => {
      try {
        setStatus('checking');
        console.log('[AutoUpdater] Procurando atualizações...');
        const updateResult = await check();
        
        if (updateResult) {
          console.log(`[AutoUpdater] Nova versão encontrada: ${updateResult.version}`);
          setUpdate(updateResult);
          setStatus('available');
          setVisible(true);
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
  }, [isTauri]);

  const handleDownloadAndInstall = async () => {
    if (!update) return;

    try {
      setStatus('downloading');
      setProgress(0);
      
      console.log('[AutoUpdater] Iniciando download e instalação...');
      
      let downloadedBytes = 0;
      let totalBytes = 0;

      await update.downloadAndInstall((event) => {
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
    } catch (err) {
      console.error('[AutoUpdater] Erro ao atualizar:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  if (!isTauri || !visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full bg-[#111827]/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-5 shadow-2xl text-gray-200 animate-in slide-in-from-bottom duration-300">
      {/* Botão Fechar */}
      {status !== 'downloading' && status !== 'installing' && (
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
            {status === 'downloading' && 'Baixando Atualização...'}
            {status === 'installing' && 'Instalando...'}
            {status === 'error' && 'Erro na Atualização'}
            {status === 'available' && 'Atualização Disponível!'}
          </h4>

          {status === 'available' && update && (
            <div className="mt-1">
              <p className="text-xs text-gray-400">
                Uma nova versão <span className="font-semibold text-white">v{update.version}</span> está pronta para download.
              </p>
              {update.body && (
                <div className="mt-2 p-2 bg-gray-800/50 rounded-lg max-h-20 overflow-y-auto text-[10px] text-gray-400 leading-normal scrollbar-none">
                  {update.body}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleDownloadAndInstall}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Atualizar Agora
                </button>
                <button
                  onClick={() => setVisible(false)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Mais tarde
                </button>
              </div>
            </div>
          )}

          {status === 'downloading' && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-1">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5 italic">
                O VukaPay reiniciará automaticamente após a conclusão.
              </p>
            </div>
          )}

          {status === 'installing' && (
            <p className="text-xs text-gray-400 mt-1">
              Finalizando a instalação. O aplicativo será fechado para aplicar a atualização...
            </p>
          )}

          {status === 'error' && (
            <div className="mt-1">
              <p className="text-xs text-red-400 leading-relaxed">
                {errorMessage || 'Ocorreu um erro ao baixar os arquivos da nova versão.'}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleDownloadAndInstall}
                  className="px-3 py-1.5 bg-red-900/30 border border-red-500/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold rounded-xl transition-all"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => setVisible(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
