import React, { useState, useEffect } from 'react';
import { User, Bell, Moon, Globe, Shield, LogOut, Save, Download, Trash2, List, Plus, X, Lock, Smartphone, Key, Check } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { CURRENCIES, cn } from '@/lib/utils';

type SettingsTab = 'general' | 'categories' | 'notifications' | 'security' | 'data';

export default function Settings() {
  const {
    transactions, accounts, budgets, goals, investments, loans,
    categories, addCategory, deleteCategory, profile: dbProfile, updateProfile,
    preferences: dbPrefs, updatePreferences
  } = useFinance();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const sectionClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500";

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    name: dbProfile?.full_name || '',
    email: user?.email || '',
    avatar: dbProfile?.full_name?.substring(0, 2).toUpperCase() || '??',
    avatarUrl: dbProfile?.avatar_url || ''
  });

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
    billReminders: dbPrefs?.notifications?.billReminders ?? true,
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

  const [newCategory, setNewCategory] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');

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

  useEffect(() => {
    if (dbProfile) {
      setRecQuestion(dbProfile.security_question || 'Qual é o nome da sua primeira escola?');
      setRecAnswer(dbProfile.security_answer || '');
      setRecEmail(dbProfile.recovery_email || '');
    }
  }, [dbProfile]);

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
        setPinSuccess('PIN desativado com sucesso.');
      } catch (err) {
        console.error(err);
        setPinError('Erro ao desativar o PIN.');
      }
    }
  };

  // Cofre Automático state
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

  const handleSaveCofre = (updated: typeof cofreConfig) => {
    setCofreConfig(updated);
    if (user) {
      localStorage.setItem(`vukapay_cofre_${user.id}`, JSON.stringify(updated));
    }
  };

  // -- Handlers --

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
    await updateProfile({
      full_name: tempProfile.name,
      avatar_url: tempProfile.avatarUrl
    });
    setIsEditingProfile(false);
  };

  const handlePreferenceChange = async (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    const dbKey = key === 'currency' ? 'base_currency' : key === 'dateFormat' ? 'date_format' : key;
    await updatePreferences({ [dbKey]: value });
  };

  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    await updatePreferences({ notifications: updated });
  };

  const handleSecurityToggle = async (key: keyof typeof security) => {
    const updated = { ...security, [key]: !security[key] };
    setSecurity(updated);
    await updatePreferences({ security: updated });
  };



  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(categoryType, newCategory.trim());
      setNewCategory('');
    }
  };

  const handleExportData = () => {
    const data = {
      transactions,
      accounts,
      budgets,
      goals,
      investments,
      loans,
      categories,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_financeiro_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearData = () => {
    if (confirm('Tem certeza? Esta ação apagará todos os seus registros de forma permanente da sua conta.')) {
      alert('Pendente: Implementação de remoção total de segurança. Por enquanto, limpe manualmente os registros.');
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      await signOut();
      window.location.href = '/login';
    }
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: User },
    { id: 'categories', label: 'Categorias', icon: List },
    { id: 'notifications', label: 'Notificação', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'data', label: 'Dados', icon: Save },
  ];

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Definições</h1>
        <p className="text-gray-500 mt-1">Gerencie suas preferências, conta e segurança.</p>
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
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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

          {/* GENERAL TAB */}
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

              {/* Cofre Automático */}
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 border border-emerald-100/50">
                    <Save className="w-4 h-4 text-emerald-600 animate-pulse" />
                  </div>
                  Cofre Automático (Arredondamento de Troco)
                </h2>

                <div className="space-y-6">
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

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                    <List className="w-4 h-4 text-gray-600" />
                  </div>
                  Gerenciar Categorias
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setCategoryType('expense')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                      categoryType === 'expense' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Despesas
                  </button>
                  <button
                    onClick={() => setCategoryType('income')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                      categoryType === 'income' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Receitas
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={`Nova categoria de ${categoryType === 'income' ? 'receita' : 'despesa'}...`}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories[categoryType].map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-gray-200 transition-colors">
                    <span className="text-gray-700 font-medium">{cat}</span>
                    <button
                      onClick={() => deleteCategory(categoryType, cat)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remover categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                  <Bell className="w-4 h-4 text-gray-600" />
                </div>
                Preferências de Notificação
              </h2>

              <div className="space-y-6">
                {[
                  { key: 'balanceAlert', label: 'Alertas de Saldo', desc: 'Receber aviso quando saldo estiver baixo' },
                  { key: 'weeklyReport', label: 'Relatório Semanal', desc: 'Receber resumo financeiro toda segunda-feira' },
                  { key: 'billReminders', label: 'Lembrete de Contas', desc: 'Avisar 3 dias antes do vencimento' },
                  { key: 'goalAchievements', label: 'Conquista de Metas', desc: 'Celebrar quando atingir uma meta' },
                  { key: 'pushNotifications', label: 'Notificações Push', desc: 'Receber notificações no dispositivo' },
                  { key: 'emailNotifications', label: 'Notificações por Email', desc: 'Receber atualizações importantes por email' },
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
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                  <Shield className="w-4 h-4 text-gray-600" />
                </div>
                Segurança e Acesso
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Autenticação de Dois Fatores (2FA)</p>
                    <p className="text-sm text-gray-500 mt-1">Adicionar camada extra de segurança via SMS ou App</p>
                  </div>
                  <button
                    onClick={() => handleSecurityToggle('twoFactor')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${security.twoFactor ? 'bg-gray-900' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${security.twoFactor ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Bloqueio do App</p>
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
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900"
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

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Sessões Ativas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
                          <Smartphone className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">iPhone 13 Pro</p>
                          <p className="text-xs text-gray-500">Luanda, Angola • Agora mesmo</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Atual</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
                          <Globe className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Chrome no Windows</p>
                          <p className="text-xs text-gray-500">Luanda, Angola • Há 2 horas</p>
                        </div>
                      </div>
                      <button className="text-xs font-medium text-red-600 hover:text-red-700">Revogar</button>
                    </div>
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

          {/* DATA TAB */}
          {activeTab === 'data' && (
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 border border-gray-100/50">
                  <Save className="w-4 h-4 text-gray-600" />
                </div>
                Gestão de Dados
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Exportar Dados</p>
                    <p className="text-sm text-gray-500 mt-1">Baixar cópia completa dos seus dados (JSON)</p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100/50">
                  <div>
                    <p className="font-medium text-gray-900">Importar Dados</p>
                    <p className="text-sm text-gray-500 mt-1">Restaurar backup de arquivo JSON</p>
                  </div>
                  <button
                    onClick={() => document.getElementById('import-file')?.click()}
                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-100/50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 rotate-180" />
                    Importar
                  </button>
                  <input type="file" id="import-file" className="hidden" accept=".json" onChange={() => alert('Importação simulada com sucesso!')} />
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                  <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Backup Automático
                  </h3>
                  <p className="text-sm text-blue-700">
                    Seus dados são salvos automaticamente no armazenamento local do navegador.
                    Recomendamos fazer exportações regulares para garantir a segurança das suas informações.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="font-medium text-red-600">Apagar Dados</p>
                    <p className="text-sm text-gray-500 mt-1">Remover todos os dados locais permanentemente</p>
                  </div>
                  <button
                    onClick={handleClearData}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Apagar Tudo
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
