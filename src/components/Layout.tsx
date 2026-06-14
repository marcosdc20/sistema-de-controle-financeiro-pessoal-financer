import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  Target,
  GraduationCap,
  Settings,
  Menu,
  X,
  CreditCard,
  TrendingUp,
  Bell,
  Calculator,
  Repeat,
  Handshake,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  HelpCircle,
  LogOut,
  User,
  PiggyBank,
  Eye,
  EyeOff,
  FolderKanban,
  Users,
  Briefcase,
  MessageSquare,
  Globe,
  ExternalLink,
  Heart,
  ArrowUpDown,
  ShoppingBag,
  Store,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import TransactionModal from '@/components/TransactionModal';
import HelpModal from '@/components/HelpModal';
import CommandBar from '@/components/CommandBar';
import BackupSyncManager from '@/components/BackupSyncManager';
import AutoUpdater from '@/components/AutoUpdater';
import { SetLocalPasswordModal } from '@/components/auth/SetLocalPasswordModal';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user, requireLocalPasswordSetup, setRequireLocalPasswordSetup } = useAuth();
  const { 
    profile, 
    setIsTransactionModalOpen, 
    isTransactionModalOpen, 
    notifications, 
    markNotificationAsRead, 
    togglePrivacyMode, 
    isPrivacyMode,
    addTask,
    projects
  } = useFinance();
  
  // Quick Task Capture State
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [quickProjId, setQuickProjId] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');

  const handleQuickCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    try {
      await addTask({
        title: quickTitle.trim(),
        description: 'Criado via Captura Rápida.',
        priority: quickPriority,
        status: 'todo',
        projectId: quickProjId || undefined,
        dueDate: quickDueDate || undefined,
        subtasks: [],
        tags: [],
        toolsCost: []
      });
      setQuickTitle('');
      setQuickPriority('medium');
      setQuickProjId('');
      setQuickDueDate('');
      setIsQuickCaptureOpen(false);
      
      // Notify
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('VukaPay - Tarefa Capturada!', {
          body: `Tarefa "${quickTitle.trim()}" salva com sucesso no SQLite.`,
          icon: '/logo.png'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Wallet, label: 'Transações', path: '/transactions' },
    { icon: CreditCard, label: 'Contas', path: '/accounts' },
    { icon: Calculator, label: 'Orçamentos', path: '/budgets' },
    { icon: Repeat, label: 'Assinaturas', path: '/subscriptions' },
    { icon: PiggyBank, label: 'Poupança', path: '/savings' },
    { icon: Target, label: 'Metas', path: '/goals' },
    { icon: TrendingUp, label: 'Investimentos', path: '/investments' },
    { icon: Handshake, label: 'Empréstimos', path: '/loans' },
    { icon: FolderKanban, label: 'Projetos & Tarefas', path: '/projects' },
    { icon: Sparkles, label: 'Assistente IA', path: '/ai-assistant' },
    { icon: GraduationCap, label: 'Educação', path: '/education' },
    { icon: PieChart, label: 'Relatórios', path: '/reports' },
    { icon: ArrowUpDown, label: 'Candonga', path: '/candonga' },
    { icon: Heart, label: 'Mesada Familiar', path: '/mesada-familiar' },
  ];

  const communityNavItems = [
    { icon: Users, label: 'Contatos', path: '/contacts' },
    { icon: MessageSquare, label: 'Comunidade', path: '/community' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: Store, label: 'VukaStore', path: '/vuka-store' },
    { icon: Wallet, label: 'Carteira VukaCoin', path: '/vukacoins' },
  ];

  const bottomNavItems = [
    { icon: Settings, label: 'Definições', path: '/settings' },
  ];

  const allNavItems = [...navItems, ...communityNavItems, ...bottomNavItems];
  const currentPathLabel = allNavItems.find(item => item.path === location.pathname)?.label || 'Finanças';

  const handleVisitWebsite = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = "https://marcosdc20.github.io/vukapay-docs/";
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined) {
      try {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(url);
      } catch (err) {
        console.error('Failed to open URL in Tauri:', err);
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ALT + T Quick Capture Task (Trigger even if typing in input)
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsQuickCaptureOpen(prev => !prev);
        return;
      }

      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(prev => !prev);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsHelpOpen(false);
        setIsWalletOpen(false);
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        togglePrivacyMode();
      }

      // Single key shortcuts
      if (e.key === 'n') {
        e.preventDefault();
        setIsTransactionModalOpen(true);
      }
      if (e.key === 'g') {
        e.preventDefault();
        navigate('/');
      }
      if (e.key === 't') {
        e.preventDefault();
        navigate('/transactions');
      }
      if (e.key === '?') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, togglePrivacyMode]);

  // Pedir permissão de notificações no Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-[#111827] text-gray-300 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col shadow-2xl",
          "lg:static",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn("h-20 flex items-center px-6 border-b border-gray-800 relative", isCollapsed ? "justify-center px-0" : "justify-between")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="VukaPay" className="w-full h-full object-contain rounded-xl" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                VukaPay
              </span>
            )}
          </div>

          {/* Collapse Toggle (Desktop Only) - Positioned more prominently */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:flex absolute -right-3 top-7 w-6 h-6 bg-indigo-600 text-white rounded-full items-center justify-center shadow-lg hover:bg-indigo-500 transition-all z-[60]",
              isCollapsed && "right-7"
            )}
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className={cn(
          "flex-1 py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-indigo-600/50 scrollbar-track-transparent hover:scrollbar-thumb-indigo-600 transition-all",
          isCollapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
        )}>
          {!isCollapsed && (
            <div className="px-3 mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Menu Principal
            </div>
          )}

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "text-white bg-indigo-600 shadow-lg shadow-indigo-900/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                  isCollapsed && "justify-center px-0 w-full"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shrink-0", !isCollapsed && "mr-3", isActive ? "text-white" : "text-gray-400 group-hover:text-white", isCollapsed && "scale-110")} />
                {!isCollapsed && <span className="truncate transition-opacity duration-300">{item.label}</span>}

                {/* Personalized Tooltip for Collapsed State */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-[100] shadow-[0_10px_25px_rgba(79,70,229,0.4)] border border-indigo-400/30 translate-x-[-10px] group-hover:translate-x-0 pointer-events-none">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-indigo-600" />
                  </div>
                )}

                {/* Active Indicator for Collapsed State */}
                {isCollapsed && isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
              </NavLink>
            );
          })}

          {/* Community Section */}
          {!isCollapsed && (
            <div className="px-3 mt-4 mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
              Comunidade VukaPay
            </div>
          )}
          {isCollapsed && <div className="my-2 border-t border-gray-800 mx-2" />}

          {communityNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "text-white bg-indigo-600 shadow-lg shadow-indigo-900/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                  isCollapsed && "justify-center px-0 w-full"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-all shrink-0", !isCollapsed && "mr-3", isActive ? "text-white" : "text-gray-400 group-hover:text-white", isCollapsed && "scale-110")} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-[100] shadow-[0_10px_25px_rgba(79,70,229,0.4)] border border-indigo-400/30 translate-x-[-10px] group-hover:translate-x-0 pointer-events-none">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-indigo-600" />
                  </div>
                )}
                {isCollapsed && isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 space-y-1 border-t border-gray-800 bg-[#0f1523] shrink-0">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "text-white bg-indigo-600 shadow-lg shadow-indigo-900/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", !isCollapsed && "mr-3", isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                {!isCollapsed && <span>{item.label}</span>}

                {/* Personalized Tooltip for Collapsed State */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-[100] shadow-[0_10px_25px_rgba(79,70,229,0.4)] border border-indigo-400/30 translate-x-[-10px] group-hover:translate-x-0">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-indigo-600" />
                  </div>
                )}
              </NavLink>
            );
          })}

          <button
            onClick={handleVisitWebsite}
            className={cn(
              "flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800 group relative w-full text-left border-none cursor-pointer",
              isCollapsed && "justify-center px-0 w-full"
            )}
          >
            <Globe className={cn("w-5 h-5 transition-colors shrink-0", !isCollapsed && "mr-3", "text-gray-400 group-hover:text-white")} />
            {!isCollapsed && <span className="truncate flex-1 text-left">Visitar Website</span>}
            {!isCollapsed && <ExternalLink className="w-3.5 h-3.5 opacity-55 group-hover:opacity-100 shrink-0 ml-1" />}

            {/* Tooltip for Collapsed State */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-[100] shadow-[0_10px_25px_rgba(79,70,229,0.4)] border border-indigo-400/30 translate-x-[-10px] group-hover:translate-x-0 pointer-events-none">
                Visitar Website
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-indigo-600" />
              </div>
            )}
          </button>



          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) text-red-400 hover:text-red-300 hover:bg-red-900/20 group relative",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className={cn("w-5 h-5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shrink-0", !isCollapsed && "mr-3", isCollapsed && "scale-110")} />
            {!isCollapsed && <span className="truncate transition-opacity duration-300">Sair</span>}

            {/* Personalized Tooltip for Collapsed State */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-[100] shadow-[0_10px_25px_rgba(220,38,38,0.4)] border border-red-400/30 translate-x-[-10px] group-hover:translate-x-0">
                Sair
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-red-600" />
              </div>
            )}
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-55 dark:bg-gray-950 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title (Desktop) */}
            <div className="hidden xl:block mr-8">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{currentPathLabel}</h1>
            </div>

            {/* Search Bar */}
            <div className={cn(
              "flex-1 max-w-md relative transition-all duration-300",
              isMobileSearchOpen ? "fixed inset-x-0 top-0 h-20 bg-white dark:bg-slate-900 z-50 px-4 flex items-center lg:static lg:h-auto lg:p-0" : "hidden md:flex"
            )}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar (⌘ + K)"
                  readOnly
                  onClick={() => setIsCommandBarOpen(true)}
                  className="w-full pl-10 pr-12 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all cursor-pointer"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-[10px] font-bold text-gray-400 shadow-sm">
                  <span className="text-[8px]">⌘</span>K
                </div>
              </div>
              {isMobileSearchOpen && (
                <button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsCommandBarOpen(true)}
              className="md:hidden p-2.5 text-gray-500 hover:bg-gray-105 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Quick Actions */}
            <button
              onClick={() => setIsTransactionModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Transação</span>
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            {/* Privacy Mode Toggle */}
            <button
              onClick={togglePrivacyMode}
              className={cn(
                "p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-350 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all relative group",
                isPrivacyMode && "text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:text-indigo-400"
              )}
              title={isPrivacyMode ? "Desativar Modo Olhar Indiscreto" : "Ativar Modo Olhar Indiscreto (Ctrl+H)"}
            >
              {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                  setIsHelpOpen(false);
                  setIsWalletOpen(false);
                }}
                className={cn(
                  "p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all relative group",
                  isNotificationsOpen && "bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                )}
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
                      <button
                        onClick={() => notifications.forEach(n => markNotificationAsRead(n.id))}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationAsRead(n.id)}
                            className={cn(
                              "p-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer border-b border-gray-100 dark:border-slate-850 last:border-0",
                              !n.read && "bg-indigo-50/30 dark:bg-indigo-950/10"
                            )}
                          >
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-2 h-2 mt-1.5 rounded-full shrink-0",
                                !n.read ? (n.type === 'error' ? "bg-red-500" : n.type === 'warning' ? "bg-amber-500" : "bg-indigo-500") : "bg-gray-200 dark:bg-slate-700"
                              )} />
                              <div>
                                <p className={cn("text-sm font-bold text-gray-900 dark:text-white", !n.read && "text-indigo-900 dark:text-indigo-200")}>{n.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.desc}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">
                                  {new Date(n.date).toLocaleDateString('pt-AO')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-gray-400 dark:text-gray-550">
                          <p className="text-sm">Sem novas notificações.</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-950/60 text-center">
                      <button className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Ver todas as notificações</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Wallet Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsWalletOpen(!isWalletOpen);
                  setIsNotificationsOpen(false);
                  setIsProfileOpen(false);
                  setIsHelpOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 p-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-gray-200 dark:border-slate-700 font-bold",
                  isWalletOpen && "bg-gray-100 dark:bg-slate-800 border-amber-300 dark:border-amber-600 shadow-sm"
                )}
              >
                <span className="text-lg">🪙</span>
                <span>{profile?.vuka_coins || 0}</span>
              </button>

              {isWalletOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsWalletOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Wallet className="w-24 h-24 text-amber-500" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 relative z-10">A Minha Carteira</h3>
                      <div className="text-4xl font-black text-amber-600 dark:text-amber-400 my-3 relative z-10 flex items-center justify-center gap-2">
                        {profile?.vuka_coins || 0} <span className="text-xl">VC</span>
                      </div>
                      <p className="text-xs font-semibold text-amber-700/70 dark:text-amber-500/70 relative z-10">
                        VukaCoins Disponíveis
                      </p>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <NavLink
                        to="/vuka-store"
                        onClick={() => setIsWalletOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-all text-left"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Gastar na VukaStore
                      </NavLink>
                      <button
                        onClick={() => { setIsWalletOpen(false); navigate('/vukacoins'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        Transferir VukaCoins
                      </button>
                      <button
                        onClick={() => { setIsWalletOpen(false); navigate('/buy-vukacoins'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-left"
                      >
                        <Plus className="w-4 h-4" />
                        Comprar VukaCoins
                      </button>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-100 dark:border-slate-800 text-center">
                      <NavLink 
                        to="/vukacoins"
                        onClick={() => setIsWalletOpen(false)}
                        className="text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                      >
                        Ver Histórico de Transações
                      </NavLink>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsHelpOpen(!isHelpOpen);
                  setIsNotificationsOpen(false);
                  setIsProfileOpen(false);
                  setIsWalletOpen(false);
                }}
                className={cn(
                  "p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all hidden sm:block",
                  isHelpOpen && "bg-gray-100 text-indigo-600"
                )}
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {isHelpOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsHelpOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                      <h3 className="font-bold text-gray-900 dark:text-white">Centro de Ajuda</h3>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setIsHelpOpen(false); /* Documentation logic here */ }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left"
                      >
                        Documentação
                      </button>
                      <button
                        onClick={() => { setIsHelpOpen(true); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left"
                      >
                        Atalhos de Teclado
                      </button>
                      <button
                        onClick={() => { setIsHelpOpen(false); /* Support logic here */ }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left"
                      >
                        Suporte via Chat
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                  setIsHelpOpen(false);
                  setIsWalletOpen(false);
                }}
                className={cn(
                  "p-1 rounded-full border-2 transition-all",
                  isProfileOpen ? "border-indigo-600 scale-105" : "border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                )}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Foto de perfil"
                    className="w-9 h-9 rounded-full object-cover shadow-sm border border-indigo-500/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                    {profile?.full_name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'JD'}
                  </div>
                )}
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-55/50 dark:bg-slate-950/50">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile?.full_name || user?.user_metadata?.full_name || 'Usuário'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <NavLink
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                      >
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        Definições
                      </NavLink>
                    </div>
                    <div className="p-2 border-t border-gray-100 dark:border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto p-4 lg:p-8 scroll-smooth scrollbar-thin scrollbar-thumb-indigo-600/50 scrollbar-track-transparent">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>

        {/* Global Modals */}
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
        />
        
        {/* Quick Task Capture Modal Overlay */}
        {isQuickCaptureOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 text-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-305 flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-indigo-400" />
                  Captura Rápida de Tarefa
                </h3>
                <button
                  onClick={() => setIsQuickCaptureOpen(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickCaptureSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">O que precisa ser feito?</label>
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="Título da tarefa..."
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-655 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Prioridade</label>
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs focus:outline-none text-gray-300 font-semibold"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vencimento</label>
                    <input
                      type="date"
                      value={quickDueDate}
                      onChange={(e) => setQuickDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs focus:outline-none text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Iniciativa Relacionada</label>
                  <select
                    value={quickProjId}
                    onChange={(e) => setQuickProjId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs focus:outline-none text-gray-300 font-semibold"
                  >
                    <option value="">Tarefa Geral (Sem Projeto)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-xl text-xs"
                  >
                    Capturar e Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQuickCaptureOpen(false)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-750 transition-colors text-gray-300 font-semibold rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <CommandBar 
          isOpen={isCommandBarOpen} 
          onClose={() => setIsCommandBarOpen(false)} 
          navigationItems={allNavItems}
        />
        <BackupSyncManager />
        <AutoUpdater />
        
        {requireLocalPasswordSetup && (
          <SetLocalPasswordModal 
            onSuccess={() => setRequireLocalPasswordSetup(false)} 
            userEmail={user?.email} 
            isGuest={user?.isLocal} 
          />
        )}
      </main>
    </div>
  );
}
