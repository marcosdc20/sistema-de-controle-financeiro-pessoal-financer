import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDatabase, exportDatabaseToJson, importDatabaseFromJson } from '@/database/db';
import { uploadBackupToCloud, downloadBackupFromCloud } from '@/services/firebaseBackup';
import { Cloud, CloudLightning, CloudOff, RefreshCw, X, CheckCircle, Wifi, AlertTriangle, ShieldCheck, Lock, Download, Database } from 'lucide-react';

export default function BackupSyncManager() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cloudBackupContent, setCloudBackupContent] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('vukapay_last_backup')
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Se estiver logado (não local), pergunta se quer sincronizar
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

  // Efeito para detectar se a base de dados local está vazia e se existe backup na nuvem para restaurar
  useEffect(() => {
    const checkRestoreNeeded = async () => {
      if (!user || user.isLocal || !isOnline) return;

      // Verifica se o utilizador já decidiu ignorar ou começar do zero neste dispositivo
      const ignoreRestore = localStorage.getItem(`vukapay_ignore_restore_${user.id}`);
      if (ignoreRestore === 'true') return;

      try {
        const db = await getDatabase();
        // Verifica contas e transações para determinar se é uma instalação limpa
        const accounts = await db.select<any[]>('SELECT count(*) as count FROM accounts');
        const transactions = await db.select<any[]>('SELECT count(*) as count FROM transactions');
        const accCount = accounts[0]?.count || 0;
        const txCount = transactions[0]?.count || 0;

        if (accCount === 0 && txCount === 0) {
          console.log('[BackupSyncManager] Instalação vazia detectada. Procurando backup na nuvem...');
          const backupJson = await downloadBackupFromCloud();
          if (backupJson) {
            console.log('[BackupSyncManager] Backup encontrado na nuvem!');
            setCloudBackupContent(backupJson);
            setShowRestorePrompt(true);
          }
        }
      } catch (err) {
        console.error('[BackupSyncManager] Erro ao verificar estado do banco local:', err);
      }
    };

    checkRestoreNeeded();
  }, [user, isOnline]);

  const handleBackup = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      // 1. Exporta o banco local para JSON
      const jsonStr = await exportDatabaseToJson();

      // 2. Faz o upload para a Cloud (Firebase Storage)
      const success = await uploadBackupToCloud(jsonStr);

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
      const backupJson = await downloadBackupFromCloud();
      if (backupJson) {
        await importDatabaseFromJson(backupJson);
        alert('Backup restaurado com sucesso! A aplicação será atualizada.');
        window.location.reload();
      } else {
        alert('Nenhum backup encontrado na Nuvem.');
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      alert('Ocorreu um erro ao restaurar o backup da Nuvem.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromPrompt = async () => {
    if (!cloudBackupContent) return;
    setIsSyncing(true);
    try {
      await importDatabaseFromJson(cloudBackupContent);
      alert('Sincronização concluída! Os seus dados financeiros foram restaurados com sucesso.');
      setShowRestorePrompt(false);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao aplicar backup da nuvem:', error);
      alert('Erro ao restaurar dados. Tente fazer o restauro manual.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleIgnoreRestore = () => {
    if (user) {
      localStorage.setItem(`vukapay_ignore_restore_${user.id}`, 'true');
    }
    setShowRestorePrompt(false);
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Modo Offline Seguro</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Base de Dados Local Protegida (Backup Nuvem)</span>
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
                  Você está online. Deseja realizar a sincronização e salvar o backup atualizado das suas finanças locais na sua Nuvem privada?
                </p>
              </div>
            </div>

            {/* Status indicators */}
            {syncStatus === 'success' && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Backup realizado com sucesso na Nuvem!</span>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-2 text-red-400 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Ocorreu um erro ao enviar para a Nuvem. Verifique a sua ligação.</span>
                </div>
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

      {/* Modal de Restauro de Backup para Nova Instalação */}
      {showRestorePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 animate-pulse" />
            
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Database className="w-8 h-8 text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Restaurar os seus Dados da Nuvem?</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Detectamos que esta é uma nova instalação limpa no seu dispositivo, mas você possui um backup com histórico financeiro salvo na sua conta Google / VukaPay. Deseja sincronizar e restaurar os seus dados agora?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRestoreFromPrompt}
                disabled={isSyncing}
                className="flex-1 py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30 active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A Restaurar...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Restaurar Dados da Nuvem</span>
                  </>
                )}
              </button>

              <button
                onClick={handleIgnoreRestore}
                disabled={isSyncing}
                className="py-3.5 px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                Começar do Zero
              </button>
            </div>

            <p className="text-[10px] text-gray-500 mt-4">
              Nota: Pode efetuar o restauro ou backup manualmente a qualquer momento através do indicador de nuvem.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
