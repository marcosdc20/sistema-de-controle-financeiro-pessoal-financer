import React, { useState, useMemo } from 'react';
import { useFinance, Subscription, BillingCycle, SubscriptionStatus } from '@/context/FinanceContext';
import { CURRENCIES } from '@/lib/utils';
import { Repeat, Plus, MoreVertical, Calendar, AlertCircle, Activity, X, Edit2, Trash2, MonitorPlay, GraduationCap, Code, HeartPulse, CreditCard, Wallet, Smartphone, ShieldCheck, PieChart, Sparkles, Wand2 } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { ActionMenu } from '@/components/ActionMenu';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Subscriptions() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, accounts, categories, loading, getRate } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<SubscriptionStatus | 'all'>('all');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Form State - must be declared before any early return (Rules of Hooks)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Entretenimento');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('AOA');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRenew, setAutoRenew] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');



  const openEditModal = (sub: Subscription) => {
    setEditingSubId(sub.id);
    setName(sub.name);
    setCategory(sub.category);
    setAmount(sub.amount.toString());
    setCurrency(sub.currency);
    setCycle(sub.cycle);
    setStartDate(sub.startDate.split('T')[0]);
    setNextBillingDate(sub.nextBillingDate.split('T')[0]);
    setAutoRenew(sub.autoRenew);
    setStatus(sub.status);
    setAccountId(sub.accountId || '');
    setNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingSubId(null);
    setName('');
    setCategory('Entretenimento');
    setAmount('');
    setCurrency('AOA');
    setCycle('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNextBillingDate(new Date().toISOString().split('T')[0]);
    setAutoRenew(true);
    setStatus('active');
    setAccountId('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subData = {
      name,
      category,
      amount: Number(amount),
      currency: currency as keyof typeof CURRENCIES,
      cycle,
      start_date: new Date(startDate).toISOString(),
      next_billing_date: new Date(nextBillingDate).toISOString(),
      auto_renew: autoRenew,
      status,
      account_id: accountId || undefined,
      notes,
      color: getCategoryColor(category),
    };

    if (editingSubId) {
      await updateSubscription(editingSubId, subData);
    } else {
      await addSubscription(subData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta assinatura?')) {
      deleteSubscription(id);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Entretenimento': return <MonitorPlay className="w-6 h-6" />;
      case 'Educação': return <GraduationCap className="w-6 h-6" />;
      case 'Software': return <Code className="w-6 h-6" />;
      case 'Saúde': return <HeartPulse className="w-6 h-6" />;
      case 'Internet': return <Smartphone className="w-6 h-6" />;
      case 'Seguros': return <ShieldCheck className="w-6 h-6" />;
      default: return <CreditCard className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Entretenimento': return 'bg-red-500';
      case 'Educação': return 'bg-blue-500';
      case 'Software': return 'bg-purple-500';
      case 'Saúde': return 'bg-emerald-500';
      case 'Internet': return 'bg-cyan-500';
      case 'Seguros': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getCycleLabel = (cycle: BillingCycle) => {
    switch (cycle) {
      case 'monthly': return 'Mensal';
      case 'annual': return 'Anual';
      case 'weekly': return 'Semanal';
      case 'custom': return 'Personalizado';
    }
  };

  const getStatusLabel = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'cancelled': return 'Cancelada';
      case 'trial': return 'Em Teste';
      case 'expired': return 'Expirada';
    }
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => filterStatus === 'all' || s.status === filterStatus);
  }, [subscriptions, filterStatus]);

  const aiInsights = useMemo(() => {
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const categoriesCount = activeSubs.reduce((acc, sub) => {
      if (!acc[sub.category]) acc[sub.category] = [];
      acc[sub.category].push(sub);
      return acc;
    }, {} as Record<string, Subscription[]>);

    const overlappingCategories = Object.entries(categoriesCount)
      .filter(([_, subs]) => subs.length > 1)
      .map(([cat, subs]) => ({ category: cat, subs }));

    let insightMessage = null;
    let potentialSavings = 0;

    if (overlappingCategories.length > 0) {
      const target = overlappingCategories[0];
      const lowestSub = target.subs.sort((a, b) => a.amount - b.amount)[0];
      const rate = getRate(lowestSub.currency);
      const monthlyEquivalent = lowestSub.cycle === 'annual' ? (lowestSub.amount * rate) / 12 : (lowestSub.amount * rate);

      potentialSavings = monthlyEquivalent;
      insightMessage = `IA: Notámos ${target.subs.length} assinaturas de ${target.category}. Cancelar "${lowestSub.name}" pouparia ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(monthlyEquivalent)}/mês.`;
    }

    return { insightMessage, potentialSavings };
  }, [subscriptions, getRate]);

  const dashboardStats = useMemo(() => {
    let totalMonthly = 0;
    let totalAnnual = 0;
    let mostExpensive: Subscription | null = null;
    let mostExpensiveValue = 0;
    let upcomingRenewals = 0;

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const categoryData: Record<string, number> = {};

    subscriptions.forEach(sub => {
      if (sub.status !== 'active' && sub.status !== 'trial') return;

      const rate = getRate(sub.currency);
      const amountInBase = sub.amount * rate;

      // Calculate monthly and annual equivalents
      let monthlyEq = 0;
      let annualEq = 0;

      if (sub.cycle === 'monthly') {
        monthlyEq = amountInBase;
        annualEq = amountInBase * 12;
      } else if (sub.cycle === 'annual') {
        monthlyEq = amountInBase / 12;
        annualEq = amountInBase;
      } else if (sub.cycle === 'weekly') {
        monthlyEq = amountInBase * 4.33;
        annualEq = amountInBase * 52;
      }

      totalMonthly += monthlyEq;
      totalAnnual += annualEq;

      if (monthlyEq > mostExpensiveValue) {
        mostExpensiveValue = monthlyEq;
        mostExpensive = sub;
      }

      // Check for upcoming renewals (within 7 days)
      const nextBilling = new Date(sub.nextBillingDate);
      if (nextBilling >= today && nextBilling <= nextWeek) {
        upcomingRenewals++;
      }

      // Aggregate for chart
      categoryData[sub.category] = (categoryData[sub.category] || 0) + monthlyEq;
    });

    const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    return { totalMonthly, totalAnnual, mostExpensive, upcomingRenewals, chartData };
  }, [subscriptions]);

  const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0_0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0_0,0.04)] transition-all duration-300";
  const COLORS = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#f59e0b', '#64748b'];

  return (
    <PageTransition className="space-y-6">
      {loading ? (
        <div key="loading-subscriptions" className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Assinaturas</h1>
              <p className="text-gray-500 mt-1">Controle seus serviços e pagamentos recorrentes.</p>
            </div>
            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Assinatura
            </button>
          </div>

          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cn(cardClass, "lg:col-span-2 flex flex-col justify-between")}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Custo Recorrente</h2>
                  </div>
                  {dashboardStats.upcomingRenewals > 0 && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {dashboardStats.upcomingRenewals} cobranças em breve
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <h3 className="text-4xl font-semibold text-gray-900 tracking-tight">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalMonthly)}
                  </h3>
                  <span className="text-lg text-gray-400 font-medium">/ mês</span>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Custo anual estimado: <strong className="text-gray-900">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalAnnual)}</strong>
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Assinatura mais cara</p>
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {dashboardStats.mostExpensive ? dashboardStats.mostExpensive.name : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Total de Assinaturas</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscriptions.filter(s => s.status === 'active' || s.status === 'trial').length} ativas
                  </p>
                </div>
              </div>
            </div>

            <div className={cn(cardClass, "flex flex-col")}>
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Por Categoria</h2>
              </div>
              <div className="flex-1 min-h-[200px]">
                {dashboardStats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={dashboardStats.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dashboardStats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value)}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Sem dados de assinaturas
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights Optimizer Banner */}
          {aiInsights.insightMessage && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
              <div className="p-2 bg-white rounded-xl shadow-sm mt-0.5">
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  Optimizador Inteligente
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] uppercase tracking-wider font-bold">VukaPay AI</span>
                </h4>
                <p className="text-sm text-indigo-800 mt-1">{aiInsights.insightMessage}</p>
              </div>
              <button className="px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg shadow-sm border border-indigo-100 hover:bg-gray-50 transition-colors">
                Rever Assinaturas
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as SubscriptionStatus | 'all')}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativas</option>
              <option value="paused">Pausadas</option>
              <option value="trial">Em Teste</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          {/* Subscription List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map((sub) => {
              const isUpcoming = new Date(sub.nextBillingDate) <= new Date(new Date().setDate(new Date().getDate() + 7)) && sub.status === 'active';

              return (
                <div key={sub.id} className={cn(cardClass, sub.status !== 'active' && sub.status !== 'trial' && 'opacity-60')}>
                  <div className="flex items-start justify-between mb-8 relative">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300", sub.color || 'bg-gray-800')}>
                      {getCategoryIcon(sub.category)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold uppercase border",
                        sub.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          sub.status === 'trial' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            sub.status === 'paused' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-gray-50 text-gray-600 border-gray-200"
                      )}>
                        {getStatusLabel(sub.status)}
                      </span>
                      <ActionMenu
                        triggerIcon={<MoreVertical className="w-5 h-5" />}
                        items={[
                          {
                            label: 'Editar',
                            icon: <Edit2 className="w-4 h-4" />,
                            onClick: () => openEditModal(sub),
                          },
                          {
                            label: 'Excluir',
                            icon: <Trash2 className="w-4 h-4" />,
                            danger: true,
                            onClick: () => handleDelete(sub.id),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">{sub.name}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-semibold text-gray-900 tracking-tight">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: sub.currency, maximumFractionDigits: 0 }).format(sub.amount)}
                      </h3>
                      <span className="text-sm text-gray-400 font-medium">
                        / {getCycleLabel(sub.cycle).toLowerCase()}
                      </span>
                    </div>
                    {sub.currency !== 'AOA' && (
                      <p className="text-xs text-gray-400 mt-1 font-medium italic">
                        Estimado: ~{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(sub.amount * getRate(sub.currency))}
                      </p>
                    )}
                  </div>

                  <div className={cn(
                    "mt-8 pt-5 border-t flex items-center gap-2 text-sm",
                    isUpcoming ? "border-amber-100 text-amber-600" : "border-gray-100/50 text-gray-500"
                  )}>
                    <Calendar className="w-4 h-4" />
                    <span>Próxima cobrança: <strong className={cn("font-medium", isUpcoming ? "text-amber-700" : "text-gray-900")}>
                      {new Date(sub.nextBillingDate).toLocaleDateString('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong></span>
                  </div>
                </div>
              );
            })}

            {/* Add New Subscription Card */}
            <button
              onClick={openNewModal}
              className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-all min-h-[260px] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-100/50">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
              <span className="font-medium">Adicionar assinatura</span>
            </button>
          </div>

          {/* Add/Edit Subscription Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative my-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">{editingSubId ? 'Editar Assinatura' : 'Nova Assinatura'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Serviço</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: Netflix, Spotify"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <select
                          required
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          {categories.expense.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                          <input
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Moeda</label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          >
                            {Object.keys(CURRENCIES).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ciclo de Cobrança</label>
                        <select
                          value={cycle}
                          onChange={(e) => setCycle(e.target.value as BillingCycle)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="monthly">Mensal</option>
                          <option value="annual">Anual</option>
                          <option value="weekly">Semanal</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="active">Ativa</option>
                          <option value="paused">Pausada</option>
                          <option value="trial">Em Teste</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Data de Início</label>
                          <input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Próxima Cobrança</label>
                          <input
                            type="date"
                            required
                            value={nextBillingDate}
                            onChange={(e) => setNextBillingDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Conta Vinculada (Opcional)</label>
                        <select
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="">Nenhuma conta específica</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoRenew}
                            onChange={(e) => setAutoRenew(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-sm font-medium text-gray-700">Renovação automática</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      {editingSubId ? 'Salvar Alterações' : 'Criar Assinatura'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
