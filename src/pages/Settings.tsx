import React, { useState, useEffect, useMemo } from 'react';
import { useLicense } from '@/context/LicenseContext';

import { 
  User, 
  Bell, 
  Globe, 
  Shield, 
  LogOut, 
  Save, 
  Download, 
  Trash2, 
  List, 
  Plus, 
  X, 
  Lock, 
  Smartphone, 
  Key, 
  Check, 
  ShieldAlert, 
  Edit2, 
  Cpu, 
  Keyboard, 
  Sliders, 
  FileSpreadsheet, 
  Layers, 
  FolderLock,
  BadgeCheck,
  Copy,
  RefreshCw,
  Loader2,
} from 'lucide-react';


import PageTransition from '@/components/PageTransition';
import { useFinance, DbCategory, AutoRule } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { CURRENCIES, cn } from '@/lib/utils';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type SettingsTab = 'general' | 'categories' | 'notifications' | 'security' | 'data' | 'license';

// ─── Sub-componente: Aba de Licença ─────────────────────────────────────────
function LicenseSettingsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { licenseState, clearLicense, refreshLicense } = useLicense();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showChangeKey, setShowChangeKey] = React.useState(false);
  const { activateLicenseKey } = useLicense();
  const [newKey, setNewKey] = React.useState('');
  const [isActivating, setIsActivating] = React.useState(false);

  const planLabels: Record<string, string> = {
    free_trial: 'Avaliação Gratuita (7 dias)',
    monthly:    'Mensal',
    annual:     'Anual',
    lifetime:   'Vitalício',
  };

  const planColors: Record<string, string> = {
    free_trial: 'text-amber-600 bg-amber-50 border-amber-100',
    monthly:    'text-blue-600 bg-blue-50 border-blue-100',
    annual:     'text-violet-600 bg-violet-50 border-violet-100',
    lifetime:   'text-indigo-600 bg-indigo-50 border-indigo-100',
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshLicense();
      showToast('Estado da licença atualizado!');
    } catch {
      showToast('Erro ao verificar licença.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleChangeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = newKey.trim();
    if (!trimmedKey) return;

    // Valida o formato antes de tentar ativar
    if (!trimmedKey.match(/^VUKA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      showToast('Formato inválido. Use o padrão VUKA-XXXX-XXXX-XXXX-XXXX', 'error');
      return;
    }

    setIsActivating(true);
    try {
      // Tenta ativar ANTES de limpar a licença atual,
      // para não perder o acesso caso a nova chave seja inválida
      const result = await activateLicenseKey(trimmedKey);
      if (result.success) {
        showToast('Nova chave ativada com sucesso!');
        setShowChangeKey(false);
        setNewKey('');
      } else {
        showToast(result.message || 'Falha ao ativar nova chave.', 'error');
      }
    } catch {
      showToast('Erro ao trocar a chave. Verifique a sua ligação à internet.', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const sectionClass = "bg-white rounded-3xl border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.015)] p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500";

  return (
    <div className="space-y-6">
      <div className={sectionClass}>
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Minha Licença VukaPay</h3>
              <p className="text-xs text-gray-500 mt-0.5">Detalhes e gestão da sua licença</p>
            </div>
          </div>
          <button
            id="refresh-license-status-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Verificar
          </button>
        </div>

        {/* Plano */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Plano Ativo</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${planColors[licenseState.planType ?? 'free_trial'] || 'text-gray-600 bg-gray-50 border-gray-100'}`}>
              {planLabels[licenseState.planType ?? 'free_trial'] || licenseState.planType}
            </span>
          </div>

          {/* E-mail vinculado */}
          {licenseState.clientEmail && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">E-mail Vinculado</span>
              </div>
              <span className="text-sm text-gray-700">{licenseState.clientEmail}</span>
            </div>
          )}

          {/* Chave de Licença */}
          {licenseState.licenseKey && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">Chave de Licença</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                  {licenseState.licenseKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(licenseState.licenseKey!);
                    showToast('Chave copiada!');
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Hardware ID */}
          {licenseState.hardwareId && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 font-medium">ID do Dispositivo</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Identificador único desta máquina</p>
                </div>
              </div>
              <code className="text-[10px] text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg max-w-[180px] truncate">
                {licenseState.hardwareId.substring(0, 24)}...
              </code>
            </div>
          )}

          {/* Última Verificação */}
          {licenseState.lastVerifiedAt && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">Última Verificação</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(licenseState.lastVerifiedAt).toLocaleString('pt-PT')}
              </span>
            </div>
          )}

          {/* Trial: dias restantes */}
          {licenseState.planType === 'free_trial' && licenseState.trialDaysRemaining !== null && (
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-700 font-medium">
                  Dias restantes de avaliação: <strong>{licenseState.trialDaysRemaining}</strong>
                </span>
              </div>
              <a
                href={import.meta.env.VITE_LICENSE_PURCHASE_URL || 'https://vukapay.com/adquirir'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-700 underline hover:text-amber-900"
              >
                Adquirir Licença →
              </a>
            </div>
          )}
        </div>

        {/* Botão de troca de chave */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          {!showChangeKey ? (
            <button
              id="change-license-key-btn"
              onClick={() => setShowChangeKey(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-sm font-semibold transition-colors border border-indigo-100"
            >
              <Key className="w-4 h-4" />
              Atualizar / Trocar Chave de Licença
            </button>
          ) : (
            <form onSubmit={handleChangeKey} className="space-y-3">
              <p className="text-xs text-gray-500 mb-3">
                Introduza a nova chave. A licença atual será substituída.
              </p>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="new-license-key-input"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  placeholder="VUKA-XXXX-XXXX-XXXX-XXXX"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono tracking-widest focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isActivating || !newKey.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Ativar Nova Chave
                </button>
                <button
                  type="button"
                  onClick={() => { setShowChangeKey(false); setNewKey(''); }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}




export default function Settings() {
  const {
    transactions, 
    accounts, 
    budgets, 
    goals, 
    investments, 
    loans,
    categories, 
    addCategory, 
    deleteCategory, 
    profile: dbProfile, 
    updateProfile,
    preferences: dbPrefs, 
    updatePreferences, 
    exchangeRates, 
    updateExchangeRate,
    exportDatabase, 
    importDatabase, 
    clearAllFinancialData,
    dbCategories,
    autoRules,
    addDbCategory,
    updateDbCategory,
    deleteDbCategory,
    addAutoRule,
    deleteAutoRule,
    optimizeDatabaseVacuum
  } = useFinance();
  
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // local toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const handleCheckUpdates = async () => {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
    if (!isTauri) {
      showToast('A verificação de atualizações só está disponível no aplicativo Desktop.', 'error');
      return;
    }
    setCheckingUpdate(true);
    setUpdateMessage('A procurar atualizações...');
    try {
      const update = await check();
      if (update) {
        setUpdateMessage(`Nova versão v${update.version} encontrada! A descarregar...`);
        await update.downloadAndInstall();
        setUpdateMessage('Atualização instalada. A reiniciar...');
        await relaunch();
      } else {
        setUpdateMessage('Você está a utilizar a versão mais recente.');
        showToast('Nenhuma atualização disponível.');
      }
    } catch (err) {
      console.error(err);
      setUpdateMessage('Erro ao verificar atualizações.');
      showToast('Erro ao verificar atualizações.', 'error');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const sectionClass = "bg-white rounded-3xl border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.015)] p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500";

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    name: dbProfile?.full_name || '',
    email: user?.email || '',
    avatar: dbProfile?.full_name?.substring(0, 2).toUpperCase() || '??',
    avatarUrl: dbProfile?.avatar_url || ''
  });

  // Default Account Selector State
  const [defaultAccountId, setDefaultAccountId] = useState(() => {
    return localStorage.getItem('vukapay_default_account_id') || '';
  });

  const handleDefaultAccountChange = (id: string) => {
    setDefaultAccountId(id);
    localStorage.setItem('vukapay_default_account_id', id);
    showToast('Conta padrão para transações atualizada!');
  };

  // Performance Mode (CSS Injection)
  const [performanceMode, setPerformanceMode] = useState(() => {
    return localStorage.getItem('vukapay_perf_mode') === 'true';
  });

  const handleTogglePerformanceMode = (val: boolean) => {
    setPerformanceMode(val);
    localStorage.setItem('vukapay_perf_mode', String(val));
    
    let styleEl = document.getElementById('perf-mode-style');
    if (val) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'perf-mode-style';
        styleEl.innerHTML = `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
      showToast('Modo Desempenho Ativado (Animações desativadas)');
    } else {
      styleEl?.remove();
      showToast('Modo Desempenho Desativado (Animações ativadas)');
    }
  };

  // Sync state with localstorage on mount
  useEffect(() => {
    const isPerf = localStorage.getItem('vukapay_perf_mode') === 'true';
    if (isPerf) {
      let styleEl = document.getElementById('perf-mode-style');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'perf-mode-style';
        styleEl.innerHTML = `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
  }, []);

  // Keyboard Shortcuts Config List
  const [keyboardShortcuts, setKeyboardShortcuts] = useState([
    { key: 'n', action: 'Abrir Nova Transação' },
    { key: 'Alt + T', action: 'Captura Rápida de Tarefa (Overlay)' },
    { key: 'g', action: 'Ir para Dashboard' },
    { key: 't', action: 'Ir para Transações' },
    { key: 'Ctrl + H', action: 'Alternar Modo Olhar Indiscreto' },
    { key: '?', action: 'Abrir Centro de Ajuda' }
  ]);

  // Update tempProfile when DB profile loads
  useEffect(() => {
    if (dbProfile) {
      setTempProfile({
        name: dbProfile.full_name || '',
        email: user?.email || '',
        avatar: dbProfile.full_name?.substring(0, 2).toUpperCase() || '??',
        avatarUrl: dbProfile.avatar_url || ''
      });
    }
  }, [dbProfile, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({
          ...prev,
          avatarUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [preferences, setPreferences] = useState({
    currency: dbPrefs?.base_currency || 'AOA',
    language: dbPrefs?.language || 'pt-AO',
    theme: dbPrefs?.theme || 'light',
    dateFormat: dbPrefs?.date_format || 'DD/MM/YYYY',
    startOfWeek: 'monday'
  });

  const [notifications, setNotifications] = useState({
    balanceAlert: dbPrefs?.notifications?.balanceAlert ?? true,
    weeklyReport: dbPrefs?.notifications?.weeklyReport ?? false,
    billReminders: dbPrefs?.notifications?.weeklyReport ?? true,
    goalAchievements: dbPrefs?.notifications?.goalAchievements ?? true,
    pushNotifications: dbPrefs?.notifications?.pushNotifications ?? true,
    emailNotifications: dbPrefs?.notifications?.emailNotifications ?? false
  });

  const [security, setSecurity] = useState({
    twoFactor: dbPrefs?.security?.twoFactor ?? false,
    appLock: dbPrefs?.security?.appLock ?? false,
    biometrics: dbPrefs?.security?.biometrics ?? false
  });

  // Update states when DB preferences load
  useEffect(() => {
    if (dbPrefs) {
      setPreferences({
        currency: dbPrefs.base_currency,
        language: dbPrefs.language,
        theme: dbPrefs.theme,
        dateFormat: dbPrefs.date_format,
        startOfWeek: 'monday'
      });
      setNotifications({
        balanceAlert: dbPrefs.notifications.balanceAlert,
        weeklyReport: dbPrefs.notifications.weeklyReport,
        billReminders: dbPrefs.notifications.billReminders,
        goalAchievements: dbPrefs.notifications.goalAchievements,
        pushNotifications: dbPrefs.notifications.pushNotifications,
        emailNotifications: dbPrefs.notifications.emailNotifications
      });
      setSecurity({
        twoFactor: dbPrefs.security.twoFactor,
        appLock: dbPrefs.security.appLock,
        biometrics: dbPrefs.security.biometrics
      });
    }
  }, [dbPrefs]);

  // Tab 2: Categorias detailed states
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newSubParentId, setNewSubParentId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [editingLimitCatId, setEditingLimitCatId] = useState<string | null>(null);
  const [tempLimitVal, setTempLimitVal] = useState('');

  // Auto rules states
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCat, setNewRuleCat] = useState('');

  // Tab 3: Notifications detailed states
  const [alertThreshold, setAlertThreshold] = useState(() => {
    return Number(localStorage.getItem('vukapay_budget_threshold') || '80');
  });

  const [dueReminderDays, setDueReminderDays] = useState(() => {
    return Number(localStorage.getItem('vukapay_due_reminder_days') || '3');
  });

  const [weeklySilentSummary, setWeeklySilentSummary] = useState(() => {
    return localStorage.getItem('vukapay_weekly_silent_summary') === 'true';
  });

  const handleSaveThreshold = (val: number) => {
    setAlertThreshold(val);
    localStorage.setItem('vukapay_budget_threshold', String(val));
  };

  const handleSaveDueReminder = (val: number) => {
    setDueReminderDays(val);
    localStorage.setItem('vukapay_due_reminder_days', String(val));
  };

  const handleSaveWeeklySilent = (val: boolean) => {
    setWeeklySilentSummary(val);
    localStorage.setItem('vukapay_weekly_silent_summary', String(val));
    showToast('Weekly Summary preference updated!');
  };

  // Tab 4: Segurança states
  const [autoLockTimeout, setAutoLockTimeout] = useState(() => {
    return localStorage.getItem('vukapay_auto_lock_timeout') || '5';
  });

  const [windowsHelloBiometrics, setWindowsHelloBiometrics] = useState(() => {
    return localStorage.getItem('vukapay_windows_hello_simulated') === 'true';
  });

  const [olharIndiscretoMode, setOlharIndiscretoMode] = useState(() => {
    return localStorage.getItem('vukapay_privacy_level') || 'all'; // 'all' or 'balances'
  });

  const handleSaveAutoLock = (val: string) => {
    setAutoLockTimeout(val);
    localStorage.setItem('vukapay_auto_lock_timeout', val);
    showToast('Tempo de bloqueio automático atualizado!');
  };

  const handleSavePrivacyLevel = (val: string) => {
    setOlharIndiscretoMode(val);
    localStorage.setItem('vukapay_privacy_level', val);
    showToast('Configurações de privacidade salvas!');
  };

  const handleToggleWindowsHello = (val: boolean) => {
    setWindowsHelloBiometrics(val);
    localStorage.setItem('vukapay_windows_hello_simulated', String(val));
    if (val) {
      showToast('Windows Hello (Biometria) simulado com sucesso!');
    } else {
      showToast('Desbloqueio biométrico desativado.');
    }
  };

  // Tab 5: Dados states
  const [autoBackupInterval, setAutoBackupInterval] = useState(() => {
    return localStorage.getItem('vukapay_auto_backup_schedule') || '7'; // days
  });

  const handleSaveAutoBackup = (val: string) => {
    setAutoBackupInterval(val);
    localStorage.setItem('vukapay_auto_backup_schedule', val);
    showToast('Agendamento de backup atualizado.');
  };

  const handleSQLiteVacuum = async () => {
    try {
      await optimizeDatabaseVacuum();
      showToast('Base de dados SQLite otimizada com sucesso! (VACUUM concluído)');
    } catch (e) {
      console.error(e);
      showToast('Erro ao otimizar base de dados.', 'error');
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Data', 'Tipo', 'Descricao', 'Valor', 'Moeda', 'Categoria', 'Conta', 'Status', 'Metodo de Pagamento'];
      const rows = transactions.map(t => {
        const accName = accounts.find(a => a.id === t.accountId)?.name || t.accountId;
        return [
          t.id,
          t.date,
          t.type === 'expense' ? 'Despesa' : t.type === 'income' ? 'Receita' : t.type === 'transfer' ? 'Transferencia' : 'Ajuste',
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount,
          t.currency,
          t.category,
          `"${accName.replace(/"/g, '""')}"`,
          t.status,
          t.paymentMethod || 'Express'
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      // add UTF-8 BOM for Excel support
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Dados de transações exportados em CSV!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar CSV.', 'error');
    }
  };

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // PIN states
  const [pinSetupMode, setPinSetupMode] = useState(false);
  const [newPinCode, setNewPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Recovery Option states
  const [recQuestion, setRecQuestion] = useState('Qual é o nome da sua primeira escola?');
  const [recAnswer, setRecAnswer] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recError, setRecError] = useState<string | null>(null);
  const [recSuccess, setRecSuccess] = useState<string | null>(null);

  // Exchange Rates States
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateValues, setRateValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (exchangeRates && exchangeRates.length > 0) {
      const vals: Record<string, number> = {};
      exchangeRates.forEach(r => {
        vals[`${r.from}-${r.to}`] = r.rate;
      });
      setRateValues(vals);
    }
  }, [exchangeRates]);

  // Active Sessions States
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  const loadSessions = async () => {
    try {
      const { getDatabase } = await import('@/database/db');
      const db = await getDatabase();
      const rows = await db.select<any[]>('SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY last_active DESC', [user?.id]);
      setActiveSessions(rows || []);
    } catch (e) {
      console.error('Erro ao carregar sessões de login:', e);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'security') {
      loadSessions();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (dbProfile) {
      setRecQuestion(dbProfile.security_question || 'Qual é o nome da sua primeira escola?');
      setRecAnswer(dbProfile.security_answer || '');
      setRecEmail(dbProfile.recovery_email || '');
    }
  }, [dbProfile]);

  // Cofre Automático Config state
  const [cofreConfig, setCofreConfig] = useState({
    active: false,
    rule: 100,
    goalId: ''
  });

  useEffect(() => {
    if (user) {
      const cofreConfigStr = localStorage.getItem(`vukapay_cofre_${user.id}`);
      if (cofreConfigStr) {
        try {
          setCofreConfig(JSON.parse(cofreConfigStr));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  // Calculate total saved by the Auto Vault (Cofre)
  const cofreTotalSaved = useMemo(() => {
    return transactions
      .filter(t => t.description.startsWith('Contribuição para meta:') && t.category === 'Investimento')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const handleSaveCofre = (updated: typeof cofreConfig) => {
    setCofreConfig(updated);
    if (user) {
      localStorage.setItem(`vukapay_cofre_${user.id}`, JSON.stringify(updated));
      showToast('Configurações do cofre salvas com sucesso!');
    }
  };

  const handleUpdateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecError(null);
    setRecSuccess(null);

    if (!recAnswer.trim()) {
      setRecError('A resposta de segurança não pode estar vazia.');
      return;
    }
    if (!recEmail.trim()) {
      setRecError('O e-mail de recuperação não pode estar vazio.');
      return;
    }

    try {
      await updateProfile({
        security_question: recQuestion,
        security_answer: recAnswer.trim().toLowerCase(),
        recovery_email: recEmail.trim()
      });
      setRecSuccess('Opções de recuperação atualizadas com sucesso!');
      showToast('Opções de recuperação atualizadas!');
    } catch (err) {
      console.error(err);
      setRecError('Erro ao salvar as opções de recuperação.');
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!/^\d{4,6}$/.test(newPinCode)) {
      setPinError('O PIN deve conter de 4 a 6 dígitos numéricos.');
      return;
    }

    if (newPinCode !== confirmPinCode) {
      setPinError('Os códigos PIN não coincidem.');
      return;
    }

    try {
      await updateProfile({ pin_code: newPinCode });
      setPinSuccess('Código PIN configurado com sucesso!');
      showToast('PIN de acesso configurado!');
      setNewPinCode('');
      setConfirmPinCode('');
      setPinSetupMode(false);
    } catch (err) {
      console.error(err);
      setPinError('Erro ao configurar o PIN.');
    }
  };

  const handleRemovePin = async () => {
    if (confirm('Tem a certeza que deseja desativar o acesso por PIN?')) {
      try {
        await updateProfile({ pin_code: '' });
        showToast('PIN de acesso desativado.');
      } catch (err) {
        console.error(err);
        showToast('Erro ao desativar o PIN.', 'error');
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (dbProfile?.password && currentPassword !== dbProfile.password) {
      setPasswordError('A senha atual está incorreta.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('A nova senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('As novas senhas não coincidem.');
      return;
    }

    try {
      await updateProfile({ password: newPassword });
      setPasswordSuccess('Senha de acesso atualizada com sucesso!');
      showToast('Senha de acesso atualizada!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setPasswordError('Ocorreu um erro ao atualizar a senha.');
    }
  };

  const handleSaveProfile = async () => {
    if (!tempProfile.name.trim()) {
      showToast('O nome não pode estar vazio.', 'error');
      return;
    }
    await updateProfile({
      full_name: tempProfile.name,
      avatar_url: tempProfile.avatarUrl
    });
    setIsEditingProfile(false);
    showToast('Perfil atualizado com sucesso!');
  };

  const handlePreferenceChange = async (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    const dbKey = key === 'currency' ? 'base_currency' : key === 'dateFormat' ? 'date_format' : key;
    await updatePreferences({ [dbKey]: value });
    showToast('Preferências atualizadas!');
  };

  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    await updatePreferences({ notifications: updated });
    showToast('Notificações atualizadas!');
  };

  const handleSecurityToggle = async (key: keyof typeof security) => {
    const updated = { ...security, [key]: !security[key] };
    setSecurity(updated);
    await updatePreferences({ security: updated });
    showToast('Configurações de segurança atualizadas!');
  };

  // Category CRUD logic (Rich and subcategories)
  const parentCategories = useMemo(() => {
    return dbCategories.filter(c => !c.parentId && c.type === newCatType);
  }, [dbCategories, newCatType]);

  const handleAddRichCategory = async () => {
    if (!newCatName.trim()) return;
    await addDbCategory({
      name: newCatName.trim(),
      type: newCatType,
      limitAmount: undefined
    });
    setNewCatName('');
    showToast('Categoria principal adicionada!');
  };

  const handleAddSubcategory = async () => {
    if (!newSubName.trim() || !newSubParentId) return;
    await addDbCategory({
      name: newSubName.trim(),
      type: newCatType,
      parentId: newSubParentId,
      limitAmount: undefined
    });
    setNewSubName('');
    showToast('Subcategoria adicionada com sucesso!');
  };

  const handleSaveCategoryLimit = async (id: string) => {
    if (!tempLimitVal) return;
    await updateDbCategory(id, {
      limitAmount: Number(tempLimitVal)
    });
    setEditingLimitCatId(null);
    setTempLimitVal('');
    showToast('Teto financeiro de categoria atualizado!');
  };

  // Rules CRUD
  const handleAddAutoRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleKeyword.trim() || !newRuleCat) return;
    await addAutoRule({
      keyword: newRuleKeyword.trim(),
      categoryName: newRuleCat
    });
    setNewRuleKeyword('');
    setNewRuleCat('');
    showToast('Regra de auto-categorização criada!');
  };

  // Real SQLite JSON Export Handler
  const handleExportDataReal = async () => {
    try {
      const jsonStr = await exportDatabase();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_vukapay_${new Date().toISOString().split('T')[0]}_sqlite.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Backup do banco de dados exportado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar base de dados.', 'error');
    }
  };

  // Real SQLite JSON Import Handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.profiles || !parsed.accounts || !parsed.transactions) {
          throw new Error('Formato de arquivo inválido. As tabelas básicas de controle financeiro estão ausentes.');
        }

        if (confirm('ATENÇÃO: A importação irá SOBRESCREVER permanentemente todos os registros atuais. Deseja prosseguir com a restauração?')) {
          await importDatabase(content);
          showToast('Base de dados restaurada! Reiniciando aplicação...');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (err: any) {
        console.error(err);
        showToast(`Erro na importação: ${err.message || 'Arquivo JSON inválido.'}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  // Wipe Financial Data Modal Safety states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleWipeData = async () => {
    if (deleteConfirmText !== 'APAGAR') {
      showToast('Por favor, digite a palavra chave "APAGAR" para prosseguir.', 'error');
      return;
    }
    try {
      await clearAllFinancialData();
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      showToast('Todos os seus dados financeiros foram redefinidos localmente!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast('Falha ao redefinir a base de dados.', 'error');
    }
  };

  // Revoke active sessions
  const handleRevokeSession = async (sessionId: string) => {
    if (confirm('Deseja realmente revogar o acesso deste dispositivo? O login será finalizado lá.')) {
      try {
        const { getDatabase } = await import('@/database/db');
        const db = await getDatabase();
        await db.execute('DELETE FROM user_sessions WHERE id = $1', [sessionId]);
        await loadSessions();
        showToast('Dispositivo revogado com sucesso.');
      } catch (e) {
        console.error(e);
        showToast('Falha ao revogar sessão.', 'error');
      }
    }
  };

  // Save exchange rate modifications
  const handleSaveRate = async (from: string, to: string) => {
    const rateKey = `${from}-${to}`;
    const rateVal = rateValues[rateKey];
    if (rateVal && rateVal > 0) {
      try {
        await updateExchangeRate(from, to, rateVal);
        setEditingRate(null);
        showToast(`Taxa de câmbio ${from}/${to} atualizada!`);
      } catch (e) {
        console.error(e);
        showToast('Erro ao atualizar taxa de câmbio.', 'error');
      }
    } else {
      showToast('Insira um valor válido maior que zero.', 'error');
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      sessionStorage.removeItem('vukapay_session_unlocked');
      await signOut();
      window.location.href = '/login';
    }
  };

  const tabs = [
    { id: 'general',       label: 'Geral',       icon: User },
    { id: 'categories',    label: 'Categorias',  icon: List },
    { id: 'notifications', label: 'Notificação', icon: Bell },
    { id: 'security',      label: 'Segurança',   icon: Shield },
    { id: 'data',          label: 'Dados',        icon: Save },
    { id: 'license',       label: 'Licença',      icon: BadgeCheck },
  ];


  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto pb-20 relative">
      {/* Toast HUD */}
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300",
          toast.type === 'success' 
            ? "bg-emerald-500/90 border-emerald-400 text-white shadow-emerald-500/10" 
            : "bg-red-500/90 border-red-400 text-white shadow-red-500/10"
        )}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Safety Wipe Modal Confirmation Screen */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 text-red-600 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Limpeza de Dados</h3>
                <p className="text-xs text-gray-500">Esta ação é irreversível.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Você está prestes a excluir **todas** as contas, transações, metas, orçamentos, projetos, tarefas e registros financeiros salvos. Suas credenciais de login não serão apagadas.
            </p>

            <div className="space-y-4 mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Digite a palavra <span className="text-red-600 font-bold">"APAGAR"</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Escreva aqui..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 text-gray-900 font-semibold"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleWipeData}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs"
              >
                Sim, Apagar Tudo
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-semibold rounded-2xl text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Definições</h1>
        <p className="text-gray-500 mt-1">Gerencie suas preferências, conta e segurança local.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-650 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">

          {/* -------------------- TAB 1: GENERAL -------------------- */}
          {activeTab === 'general' && (
            <>
              {/* Profile Section */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    Perfil
                  </h2>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => {
                        setTempProfile({
                          name: dbProfile?.full_name || '',
                          email: user?.email || '',
                          avatar: dbProfile?.full_name?.substring(0, 2).toUpperCase() || '??',
                          avatarUrl: dbProfile?.avatar_url || ''
                        });
                        setIsEditingProfile(true);
                      }}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50"
                    >
                      Editar Perfil
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-2xl font-semibold shadow-sm overflow-hidden border border-gray-100">
                      {tempProfile.avatarUrl ? (
                        <img src={tempProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        tempProfile.avatar
                      )}
                    </div>
                    {isEditingProfile && (
                      <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white text-xs font-medium cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Alterar</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                  <div className="flex-1">
                    {isEditingProfile ? (
                      <div className="space-y-3 max-w-md">
                        <input
                          type="text"
                          value={tempProfile.name}
                          onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                          placeholder="Nome"
                        />
                        <input
                          type="email"
                          disabled
                          value={tempProfile.email}
                          className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-gray-900">{dbProfile?.full_name || 'Usuário'}</h3>
                        <p className="text-gray-500 mt-1">{user?.email}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Default Account Selector */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                    <Sliders className="w-4 h-4 text-gray-600" />
                  </div>
                  Configurações Operacionais
                </h2>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-semibold text-gray-950">Conta Padrão</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qual conta vem selecionada por defeito ao abrir "Nova Transação"</p>
                  </div>
                  <select
                    value={defaultAccountId}
                    onChange={(e) => handleDefaultAccountChange(e.target.value)}
                    className="px-4 py-2 bg-gray-50 border border-gray-100/50 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-gray-200"
                  >
                    <option value="">Selecione...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-semibold text-gray-955 flex items-center gap-1.5">
                      Modo de Desempenho <Cpu className="w-4 h-4 text-indigo-500" />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Desativa animações e transições CSS para poupar bateria e processamento local</p>
                  </div>
                  <button
                    onClick={() => handleTogglePerformanceMode(!performanceMode)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors border",
                      performanceMode ? "bg-gray-900 border-gray-800" : "bg-gray-200 border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-transform duration-250",
                      performanceMode ? "left-7" : "left-1"
                    )}></div>
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                    <Globe className="w-4 h-4 text-gray-600" />
                  </div>
                  Preferências Regionais
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                    <div>
                      <p className="font-medium text-gray-900">Moeda Base</p>
                      <p className="text-sm text-gray-500 mt-1">Moeda principal para relatórios</p>
                    </div>
                    <select
                      value={preferences.currency}
                      onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                    >
                      {Object.keys(CURRENCIES).map(curr => (
                        <option key={curr} value={curr}>{CURRENCIES[curr as keyof typeof CURRENCIES].name} ({curr})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                    <div>
                      <p className="font-medium text-gray-900">Idioma</p>
                      <p className="text-sm text-gray-500 mt-1">Idioma da interface</p>
                    </div>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                    >
                      <option value="pt-AO">Português (Angola)</option>
                      <option value="en">English</option>
                      <option value="umb">Umbundu (Angola)</option>
                      <option value="kmb">Kimbundu (Angola)</option>
                      <option value="kg">Kikongo (Angola)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                    <div>
                      <p className="font-medium text-gray-900">Formato de Data</p>
                      <p className="text-sm text-gray-500 mt-1">Como as datas são exibidas</p>
                    </div>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                    >
                      <option value="DD/MM/YYYY">DD/MM/AAAA (24/02/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/AAAA (02/24/2026)</option>
                      <option value="YYYY-MM-DD">AAAA-MM-DD (2026-02-24)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Tema Escuro</p>
                      <p className="text-sm text-gray-500 mt-1">Alternar entre claro e escuro</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('theme', preferences.theme === 'light' ? 'dark' : 'light')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${preferences.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${preferences.theme === 'dark' ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* App Version & Manual Update */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                    <Cpu className="w-4 h-4 text-gray-600" />
                  </div>
                  Informação do Sistema & Atualizações
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                    <div>
                      <p className="font-medium text-gray-900">Versão do VukaPay</p>
                      <p className="text-sm text-gray-500 mt-1">Número de compilação ativo</p>
                    </div>
                    <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold font-mono">
                      v1.0.8
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                    <div>
                      <p className="font-medium text-gray-900">Verificar Atualizações</p>
                      <p className="text-sm text-gray-500 mt-1">{updateMessage || 'Procurar novas versões disponíveis'}</p>
                    </div>
                    <button
                      onClick={handleCheckUpdates}
                      disabled={checkingUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {checkingUpdate ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>A verificar...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Verificar Atualizações</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Suporte Técnico</p>
                      <p className="text-sm text-gray-500 mt-1">E-mail oficial para contato corporativo</p>
                    </div>
                    <a href="mailto:suporte.vukapay@gmail.com" className="text-sm font-semibold text-indigo-600 hover:underline">
                      suporte.vukapay@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Exchange Rates Management */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3 border border-indigo-100/50">
                    <Globe className="w-4 h-4 text-indigo-600" />
                  </div>
                  Taxas de Câmbio de Referência (AOA)
                </h2>
                
                <p className="text-xs text-gray-500 mb-6">Configure o valor manual em Kwanzas (AOA) correspondente a 1 unidade das moedas estrangeiras utilizadas no app.</p>

                <div className="overflow-hidden border border-gray-150 rounded-2xl bg-gray-50/50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-xs font-semibold text-gray-600 border-b border-gray-150">
                        <th className="p-4">Câmbio</th>
                        <th className="p-4">Taxa Equivalente (AOA)</th>
                        <th className="p-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-sm">
                      {exchangeRates.filter(r => r.from !== 'AOA').map(rate => {
                        const rateKey = `${rate.from}-${rate.to}`;
                        const isEditing = editingRate === rateKey;
                        return (
                          <tr key={rateKey} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-semibold text-gray-800">1 {rate.from} ({CURRENCIES[rate.from as keyof typeof CURRENCIES]?.name || rate.from})</td>
                            <td className="p-4">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={rateValues[rateKey] || ''}
                                  onChange={(e) => setRateValues({ ...rateValues, [rateKey]: Number(e.target.value) })}
                                  className="w-32 px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                />
                              ) : (
                                <span className="font-mono text-gray-700 font-bold">{rate.rate.toFixed(2)} Kz</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {isEditing ? (
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleSaveRate(rate.from, rate.to)}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-100"
                                    title="Salvar"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingRate(null);
                                      setRateValues({ ...rateValues, [rateKey]: rate.rate });
                                    }}
                                    className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-250 rounded-lg"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingRate(rateKey)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1.5"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span className="text-xs font-semibold">Editar</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Keyboard Shortcuts List */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                    <Keyboard className="w-4 h-4 text-gray-600" />
                  </div>
                  Atalhos de Teclado do Sistema
                </h2>
                
                <div className="space-y-3">
                  {keyboardShortcuts.map((sc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                      <span className="font-semibold text-gray-600">{sc.action}</span>
                      <kbd className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-mono font-bold shadow-sm">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cofre Automático */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 border border-emerald-100/50">
                    <Save className="w-4 h-4 text-emerald-600 animate-pulse" />
                  </div>
                  Cofre Automático (Arredondamento de Troco)
                </h2>

                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-emerald-950 to-emerald-900 text-white rounded-3xl flex items-center justify-between shadow-lg shadow-emerald-900/10">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Total Poupado no Cofre</span>
                      <h4 className="text-2xl font-black mt-1 tracking-tight">
                        {new Intl.NumberFormat(preferences.language, { style: 'currency', currency: 'AOA' }).format(cofreTotalSaved)}
                      </h4>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                      <Save className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                    <div>
                      <p className="font-medium text-gray-900">Ativar Arredondamento</p>
                      <p className="text-sm text-gray-500 mt-1">Arredondar transações manuais (Express/Cash) e poupar o troco</p>
                    </div>
                    <button
                      onClick={() => handleSaveCofre({ ...cofreConfig, active: !cofreConfig.active })}
                      className={`w-12 h-6 rounded-full relative transition-colors ${cofreConfig.active ? 'bg-gray-900' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${cofreConfig.active ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {cofreConfig.active && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Regra de Arredondamento</label>
                        <select
                          value={cofreConfig.rule}
                          onChange={(e) => handleSaveCofre({ ...cofreConfig, rule: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                        >
                          <option value="100">Próximos 100 Kz (Ex: 120 Kz para 200 Kz, poupa 80 Kz)</option>
                          <option value="500">Próximos 500 Kz (Ex: 1200 Kz para 1500 Kz, poupa 300 Kz)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meta de Poupança de Destino</label>
                        <select
                          value={cofreConfig.goalId}
                          onChange={(e) => handleSaveCofre({ ...cofreConfig, goalId: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                        >
                          <option value="">Selecione uma Meta...</option>
                          {goals.filter(g => g.status === 'active').map(goal => (
                            <option key={goal.id} value={goal.id}>{goal.name} ({goal.currency})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* -------------------- TAB 2: CATEGORIES -------------------- */}
          {activeTab === 'categories' && (
            <>
              {/* Categories Subcategories CRUD */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                      <List className="w-4 h-4 text-gray-600" />
                    </div>
                    Gerenciar Categorias & Subcategorias
                  </h2>
                  <div className="flex bg-gray-150 p-1 rounded-xl">
                    <button
                      onClick={() => setNewCatType('expense')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        newCatType === 'expense' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      Despesas
                    </button>
                    <button
                      onClick={() => setNewCatType('income')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        newCatType === 'income' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      Receitas
                    </button>
                  </div>
                </div>

                {/* CRUD additions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Parent Category Add */}
                  <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Nova Categoria Principal</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nome (Ex: Lazer)"
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      />
                      <button
                        onClick={handleAddRichCategory}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
                      >
                        Criar
                      </button>
                    </div>
                  </div>

                  {/* Subcategory Add */}
                  <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Nova Subcategoria</h4>
                    <div className="space-y-2">
                      <select
                        value={newSubParentId}
                        onChange={(e) => setNewSubParentId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                      >
                        <option value="">Categoria Pai...</option>
                        {parentCategories.map(pc => (
                          <option key={pc.id} value={pc.id}>{pc.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          placeholder="Nome (Ex: Cinema)"
                          className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                        />
                        <button
                          onClick={handleAddSubcategory}
                          className="px-4 py-2 bg-gray-950 text-white rounded-xl text-xs font-bold"
                        >
                          Criar Sub
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* List and Limits */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lista de Categorias e Limites de Teto</h4>
                  {parentCategories.map(pc => {
                    const subs = dbCategories.filter(c => c.parentId === pc.id);
                    const isEditingLimit = editingLimitCatId === pc.id;

                    return (
                      <div key={pc.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-900 text-sm">{pc.name}</span>
                            {pc.limitAmount && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 font-bold ml-2">
                                Teto: {pc.limitAmount.toLocaleString()} Kz
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isEditingLimit ? (
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  value={tempLimitVal}
                                  onChange={(e) => setTempLimitVal(e.target.value)}
                                  placeholder="Kz limite"
                                  className="w-24 px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                                />
                                <button
                                  onClick={() => handleSaveCategoryLimit(pc.id)}
                                  className="p-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 text-xs"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => { setEditingLimitCatId(null); setTempLimitVal(''); }}
                                  className="p-1 bg-gray-150 text-gray-600 rounded text-xs"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingLimitCatId(pc.id); setTempLimitVal(pc.limitAmount ? pc.limitAmount.toString() : ''); }}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-colors"
                              >
                                {pc.limitAmount ? 'Alterar Teto' : 'Definir Teto'}
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (confirm(`Excluir categoria "${pc.name}"?`)) {
                                  await deleteDbCategory(pc.id);
                                  showToast('Categoria principal excluída.');
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Rendering subcategories */}
                        {subs.length > 0 && (
                          <div className="pl-6 border-l-2 border-indigo-100 space-y-1.5">
                            {subs.map(sub => (
                              <div key={sub.id} className="flex justify-between items-center text-xs text-gray-650 p-1 hover:bg-gray-100 rounded-lg">
                                <span>&bull; {sub.name}</span>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Excluir subcategoria "${sub.name}"?`)) {
                                      await deleteDbCategory(sub.id);
                                      showToast('Subcategoria excluída.');
                                    }
                                  }}
                                  className="p-0.5 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Auto categorization rules */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                    <Sliders className="w-4 h-4 text-gray-600" />
                  </div>
                  Regras de Auto-Categorização de Despesas
                </h2>

                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  Se você criar uma transação com uma palavra-chave registrada (ex: "Pequeno Almoço" ou "Gasolina"), o sistema irá classificá-la e categorizá-la automaticamente com a categoria desejada.
                </p>

                <form onSubmit={handleAddAutoRule} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Palavra-chave</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gasolina"
                      value={newRuleKeyword}
                      onChange={(e) => setNewRuleKeyword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Categoria Alvo</label>
                    <select
                      value={newRuleCat}
                      onChange={(e) => setNewRuleCat(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none font-medium text-gray-700"
                    >
                      <option value="">Selecione...</option>
                      {categories.expense.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl"
                  >
                    Adicionar Regra
                  </button>
                </form>

                {/* Rules List */}
                <div className="space-y-2">
                  {autoRules.map(rule => (
                    <div key={rule.id} className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                      <div>
                        Se a descrição contiver <strong className="text-gray-800">"{rule.keyword}"</strong> &rarr; Categoria: <strong className="text-indigo-600">"{rule.categoryName}"</strong>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteAutoRule(rule.id);
                          showToast('Regra excluída.');
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {autoRules.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhuma regra de auto-categorização registrada.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* -------------------- TAB 3: NOTIFICATIONS -------------------- */}
          {activeTab === 'notifications' && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                  <Bell className="w-4 h-4 text-gray-600" />
                </div>
                Configurações de Alertas e Notificações Nativas
              </h2>

              <div className="space-y-8">
                {/* Threshold slider */}
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                    <span>Limiar de Alerta de Orçamento</span>
                    <span className="font-mono bg-white px-2 py-0.5 border border-gray-200 rounded text-indigo-600 font-bold">{alertThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={alertThreshold}
                    onChange={(e) => handleSaveThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[10px] text-gray-450 leading-relaxed">
                    Você receberá um pop-up de notificação do Windows quando um orçamento ou categoria de custo operacional atingir este limiar configurado.
                  </p>
                </div>

                {/* Due Reminders Slider */}
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                    <span>Aviso Antecipado de Vencimentos</span>
                    <span className="font-mono bg-white px-2 py-0.5 border border-gray-200 rounded text-indigo-600 font-bold">{dueReminderDays} dias</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={dueReminderDays}
                    onChange={(e) => handleSaveDueReminder(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[10px] text-gray-450 leading-relaxed">
                    Notificações nativas serão disparadas com essa antecedência para faturas de assinaturas, prazos de tarefas críticas ou empréstimos ativos.
                  </p>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Resumo Semanal Silencioso</p>
                    <p className="text-sm text-gray-500 mt-1">Disparar pop-up agregado nativo toda sexta-feira à tarde com o balanço geral</p>
                  </div>
                  <button
                    onClick={() => handleSaveWeeklySilent(!weeklySilentSummary)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${weeklySilentSummary ? 'bg-gray-900' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${weeklySilentSummary ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="space-y-6 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outros Alertas do Sistema</h4>
                  {[
                    { key: 'balanceAlert', label: 'Alertas de Saldo Baixo', desc: 'Receber aviso quando saldo estiver abaixo do recomendado' },
                    { key: 'goalAchievements', label: 'Celebrar Metas', desc: 'Alertar quando atingir uma poupança ou marco importante' },
                    { key: 'pushNotifications', label: 'Notificações no Desktop', desc: 'Habilitar pop-ups via central Tauri nativa' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between pb-6 border-b border-gray-100/50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(item.key as keyof typeof notifications)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-gray-900' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -------------------- TAB 4: SECURITY -------------------- */}
          {activeTab === 'security' && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                  <Shield className="w-4 h-4 text-gray-600" />
                </div>
                Segurança e Acesso Local
              </h2>

              <div className="space-y-8">
                {/* Lock Auto Timeout Select */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-semibold text-gray-900">Bloqueio Automático por Inatividade</p>
                    <p className="text-xs text-gray-500 mt-0.5">Trancar aplicação caso fique ociosa no computador</p>
                  </div>
                  <select
                    value={autoLockTimeout}
                    onChange={(e) => handleSaveAutoLock(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-xs font-semibold text-gray-950 focus:outline-none"
                  >
                    <option value="1">1 Minuto</option>
                    <option value="2">2 Minutos</option>
                    <option value="5">5 Minutos</option>
                    <option value="10">10 Minutos</option>
                    <option value="never">Nunca Bloquear</option>
                  </select>
                </div>

                {/* Olhar Indiscreto customization */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-semibold text-gray-900">Sensibilidade do Modo Olhar Indiscreto</p>
                    <p className="text-xs text-gray-500 mt-0.5">O que desfocar ao acionar a proteção contra bisbilhoteiros</p>
                  </div>
                  <select
                    value={olharIndiscretoMode}
                    onChange={(e) => handleSavePrivacyLevel(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-xs font-semibold text-gray-950 focus:outline-none"
                  >
                    <option value="balances">Borrar Apenas Saldos de Caixa</option>
                    <option value="all">Borrar Saldos + Gráficos de Fluxo</option>
                  </select>
                </div>

                {/* Simulated Windows Hello Biometrics */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      Desbloqueio Biométrico (Windows Hello) <FolderLock className="w-4.5 h-4.5 text-indigo-600" />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Permitir impressão digital ou reconhecimento facial do Windows Hello</p>
                  </div>
                  <button
                    onClick={() => handleToggleWindowsHello(!windowsHelloBiometrics)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors border",
                      windowsHelloBiometrics ? "bg-gray-900 border-gray-800" : "bg-gray-200 border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-transform",
                      windowsHelloBiometrics ? "left-7" : "left-1"
                    )}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Exigir Senha ao Inicializar</p>
                    <p className="text-sm text-gray-500 mt-1">Exigir senha ou biometria ao abrir o app</p>
                  </div>
                  <button
                    onClick={() => handleSecurityToggle('appLock')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${security.appLock ? 'bg-gray-900' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${security.appLock ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="pb-6 border-b border-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Código PIN de Acesso</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {dbProfile?.pin_code 
                          ? `Código PIN numérico ativado para login rápido`
                          : "Configure um PIN numérico para acesso rápido"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {dbProfile?.pin_code ? (
                        <button
                          onClick={handleRemovePin}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors border border-red-100"
                        >
                          Desativar PIN
                        </button>
                      ) : (
                        !pinSetupMode && (
                          <button
                            onClick={() => {
                              setPinSetupMode(true);
                              setNewPinCode('');
                              setConfirmPinCode('');
                              setPinError(null);
                              setPinSuccess(null);
                            }}
                            className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50"
                          >
                            Configurar PIN
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {pinSetupMode && (
                    <form onSubmit={handleSetupPin} className="mt-4 p-5 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4 max-w-md animate-in fade-in slide-in-from-top-2 duration-200">
                      {pinError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">{pinError}</div>}
                      {pinSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium border border-emerald-100">{pinSuccess}</div>}
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Novo PIN (4-6 dígitos)</label>
                        <input
                          type="password"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={newPinCode}
                          onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Digite apenas números"
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirmar Novo PIN</label>
                        <input
                          type="password"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={confirmPinCode}
                          onChange={(e) => setConfirmPinCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Confirme seu PIN"
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                          Salvar PIN
                        </button>
                        <button type="button" onClick={() => setPinSetupMode(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="pb-6 border-b border-gray-100/50">
                  <h3 className="font-medium text-gray-900 mb-4">Opções de Recuperação de Acesso</h3>
                  <form onSubmit={handleUpdateRecovery} className="space-y-4 max-w-md">
                    {recError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">{recError}</div>}
                    {recSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium border border-emerald-100">{recSuccess}</div>}
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pergunta Secreta (Recuperação Local)</label>
                      <select
                        value={recQuestion}
                        onChange={(e) => setRecQuestion(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                      >
                        <option value="Qual é o nome da sua primeira escola?">Qual é o nome da sua primeira escola?</option>
                        <option value="Qual era o nome do seu primeiro animal de estimação?">Qual era o nome do seu primeiro animal de estimação?</option>
                        <option value="Em que cidade os seus pais se conheceram?">Em que cidade os seus pais se conheceram?</option>
                        <option value="Qual é a sua comida favorita de infância?">Qual é a sua comida favorita de infância?</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Resposta Secreta</label>
                      <input
                        type="text"
                        required
                        value={recAnswer}
                        onChange={(e) => setRecAnswer(e.target.value)}
                        placeholder="Sua resposta secreta"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">E-mail de Recuperação</label>
                      <input
                        type="email"
                        required
                        value={recEmail}
                        onChange={(e) => setRecEmail(e.target.value)}
                        placeholder="Ex: seu-email@dominio.com"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                      />
                    </div>

                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                      <Save className="w-4 h-4" /> Salvar Opções de Recuperação
                    </button>
                  </form>
                </div>

                <div className="pb-6 border-b border-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Alterar Senha</p>
                      <p className="text-sm text-gray-500 mt-1">Atualizar sua senha de acesso</p>
                    </div>
                    {!isChangingPassword && (
                      <button
                        onClick={() => {
                          setIsChangingPassword(true);
                          setPasswordError(null);
                          setPasswordSuccess(null);
                        }}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50 flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Alterar
                      </button>
                    )}
                  </div>

                  {isChangingPassword && (
                    <form onSubmit={handleChangePassword} className="mt-4 p-5 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4 max-w-md animate-in fade-in slide-in-from-top-2 duration-200">
                      {passwordError && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium border border-emerald-100">
                          {passwordSuccess}
                        </div>
                      )}

                      {dbProfile?.password && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Senha Atual</label>
                          <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Sua senha atual"
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nova Senha</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 4 caracteres"
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                          Salvar Senha
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPassword(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                            setPasswordError(null);
                            setPasswordSuccess(null);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Active Sessions History */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-905 text-xs uppercase tracking-widest mb-4">Histórico de Acesso e Sessões Ativas</h3>
                  <div className="space-y-4">
                    {activeSessions.length === 0 ? (
                      <p className="text-xs text-gray-500">Nenhum registro de acesso recente encontrado.</p>
                    ) : (
                      activeSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
                              {session.device_name.includes('Windows') || session.device_name.includes('macOS') || session.device_name.includes('Linux') ? (
                                <Globe className="w-5 h-5 text-gray-500" />
                              ) : (
                                <Smartphone className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{session.device_name}</p>
                              <p className="text-[10px] text-gray-500">
                                Tipo: **{session.login_type}** • Visto em: {new Date(session.last_active).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {session.is_current === 1 ? (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Atual</span>
                          ) : (
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                            >
                              Revogar
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="font-medium text-red-600">Terminar Sessão</p>
                    <p className="text-sm text-gray-500 mt-1">Sair da sua conta em todos os dispositivos</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- TAB 5: DATA -------------------- */}
          {activeTab === 'data' && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                  <Save className="w-4 h-4 text-gray-600" />
                </div>
                Gestão de Dados & Otimização do SQLite
              </h2>

              <div className="space-y-6">
                {/* Auto backup scheduler */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-semibold text-gray-905">Automação de Backups Locais</p>
                    <p className="text-xs text-gray-500 mt-0.5">Programar cópias de segurança automáticas e silenciosas na pasta Documentos</p>
                  </div>
                  <select
                    value={autoBackupInterval}
                    onChange={(e) => handleSaveAutoBackup(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-100/50 rounded-xl text-xs font-semibold text-gray-950 focus:outline-none"
                  >
                    <option value="1">A cada 24 Horas</option>
                    <option value="7">A cada 7 Dias (Recomendado)</option>
                    <option value="30">A cada 30 Dias</option>
                    <option value="disabled">Desativar Backup Automático</option>
                  </select>
                </div>

                {/* SQLite Vacuum Button */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-semibold text-gray-905">Otimizar Base de Dados (Vacuum)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Executar limpeza interna do SQLite limpando espaço livre e acelerando pesquisas</p>
                  </div>
                  <button
                    onClick={handleSQLiteVacuum}
                    className="px-4 py-2.5 bg-indigo-55 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100/50 transition-colors border border-indigo-100 flex items-center gap-1.5"
                  >
                    Otimizar Agora (VACUUM)
                  </button>
                </div>

                {/* Export CSV Data */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-semibold text-gray-905">Exportar Dados Brutos (CSV / Excel)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Baixar todas as transações financeiras em formato .csv para análise avançada no Excel</p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100/50 transition-colors border border-emerald-100 flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Exportar Backup Completo (.JSON)</p>
                    <p className="text-sm text-gray-500 mt-1">Baixar cópia completa em JSON de todas as tabelas locais</p>
                  </div>
                  <button
                    onClick={handleExportDataReal}
                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Backup
                  </button>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Importar Banco de Dados</p>
                    <p className="text-sm text-gray-500 mt-1">Restaurar base de dados local a partir de backup JSON</p>
                  </div>
                  <button
                    onClick={() => document.getElementById('import-file-real')?.click()}
                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 rotate-180" />
                    Importar Backup
                  </button>
                  <input
                    type="file"
                    id="import-file-real"
                    className="hidden"
                    accept=".json"
                    onChange={handleImportFile}
                  />
                </div>

                  <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="font-medium text-red-600">Redefinir Base de Dados (Destruição Total)</p>
                    <p className="text-sm text-gray-500 mt-1">Apagar todos os dados financeiros locais sob confirmação de chave</p>
                  </div>
                  <button
                    onClick={() => {
                      setDeleteConfirmText('');
                      setShowDeleteModal(true);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset de Fábrica
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab: Licença VukaPay ─────────────────────────────────────────── */}
          {activeTab === 'license' && <LicenseSettingsTab showToast={showToast} />}

        </div>
      </div>
    </PageTransition>
  );

}
