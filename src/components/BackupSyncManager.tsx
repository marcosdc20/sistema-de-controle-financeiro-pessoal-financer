import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { exportDatabaseToJson, importDatabaseFromJson, initDatabase } from '@/database/db';
import { uploadBackupToDrive, downloadBackupFromDrive } from '@/services/googleDrive';
import { Cloud, CloudLightning, CloudOff, RefreshCw, X, CheckCircle, Wifi, AlertTriangle } from 'lucide-react';

export default function BackupSyncManager() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('vukapay_last_backup')
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Se estiver logado com o Google (não local), pergunta se quer sincronizar
      if (user && !user.isLocal) {
        setShowPrompt(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const handleBackup = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      // 1. Exporta o banco local para JSON
      const jsonStr = await exportDatabaseToJson();

      // 2. Faz o upload para o Google Drive
      const success = await uploadBackupToDrive(jsonStr);

      if (success) {
        const nowStr = new Date().toLocaleString('pt-AO');
        localStorage.setItem('vukapay_last_backup', nowStr);
        setLastBackup(nowStr);
        setSyncStatus('success');
        setTimeout(() => {
          setShowPrompt(false);
          setSyncStatus('idle');
        }, 1500);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Erro na sincronização de backup:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('Atenção: Restaurar o backup substituirá todos os seus dados locais atuais. Deseja continuar?')) {
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const backupJson = await downloadBackupFromDrive();
      if (backupJson) {
        await importDatabaseFromJson(backupJson);
        // Recarrega os dados reiniciando a instância de conexão se necessário
        alert('Backup restaurado com sucesso! A aplicação será atualizada.');
        window.location.reload();
      } else {
        alert('Nenhum backup encontrado no Google Drive.');
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      alert('Ocorreu um erro ao restaurar o backup do Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Se o usuário estiver no modo offline/convidado, exibe apenas indicador local
  if (!user) return null;

  return (
    <>
      {/* Indicador de Status da Nuvem na Barra de Navegação/Layout */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-gray-900/90 hover:bg-gray-900 border border-gray-800 rounded-full text-xs font-semibold text-gray-300 shadow-2xl backdrop-blur-md transition-all">
        {isOnline ? (
          user.isLocal ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-amber-500" />
              <span>Modo Local (Sem Backup)</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nuvem Conectada</span>
              {lastBackup && (
                <span className="text-gray-500 font-normal">
                  (Último: {lastBackup.split(' ')[0]})
                </span>
              )}
            </>
          )
        ) : (
          <>
            <CloudOff className="w-3.5 h-3.5 text-red-400" />
            <span>Sistema Offline (Apenas Local)</span>
          </>
        )}

        {/* Botão de backup/restauro manual rápido se for usuário Google */}
        {!user.isLocal && isOnline && (
          <div className="flex items-center gap-1 border-l border-gray-800 pl-2 ml-1">
            <button
              onClick={handleBackup}
              disabled={isSyncing}
              title="Fazer Backup Agora"
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
            >
              {isSyncing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <CloudLightning className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-300" />
              )}
            </button>
            <button
              onClick={handleRestore}
              disabled={isSyncing}
              title="Restaurar do Drive"
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-emerald-500" />
            </button>
          </div>
        )}
      </div>

      {/* Modal/Prompt de Detecção de Conexão Online */}
      {showPrompt && !user.isLocal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
            
            <button
              onClick={() => setShowPrompt(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mt-2">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Wifi className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Conexão Restabelecida!</h3>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                  Você está online. Deseja realizar a sincronização e salvar o backup atualizado das suas finanças locais no seu Google Drive?
                </p>
              </div>
            </div>

            {/* Status indicators */}
            {syncStatus === 'success' && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Backup realizado com sucesso no Google Drive!</span>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Ocorreu um erro ao enviar para o Drive. Verifique a conta.</span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleBackup}
                disabled={isSyncing}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Fazer Backup Agora</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowPrompt(false)}
                disabled={isSyncing}
                className="py-3 px-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-2xl text-xs font-bold transition-all active:scale-95"
              >
                Agora Não
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
