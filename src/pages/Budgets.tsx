import React, { useState, useMemo } from 'react';
import { useFinance, Budget, BudgetPeriod, BudgetType, BudgetStatus } from '@/context/FinanceContext';
import { CURRENCIES } from '@/lib/utils';
import { Calculator, Plus, MoreVertical, AlertCircle, TrendingUp, TrendingDown, PieChart, Activity, X, CheckCircle2, Archive, Lock, Edit2, Trash2, Target, Folder, Calendar } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { ActionMenu } from '@/components/ActionMenu';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Budgets() {
  const { budgets, addBudget, updateBudget, deleteBudget, transactions, categories, loading, getRate } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  // Form State — must be declared before any early return (Rules of Hooks)
  const [name, setName] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [type, setType] = useState<BudgetType>('general');
  const [currency, setCurrency] = useState('AOA');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [notifyAt, setNotifyAt] = useState<number[]>([80, 100]);



  const openEditModal = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setName(budget.name);
    setPeriod(budget.period);
    setType(budget.type);
    setCurrency(budget.currency);
    setCategory(budget.category || '');
    setAmount(budget.amount.toString());
    setAutoRenew(budget.autoRenew);
    setNotifyAt(budget.notifyAt);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingBudgetId(null);
    setName('');
    setPeriod('monthly');
    setType('general');
    setCurrency('AOA');
    setCategory('');
    setAmount('');
    setAutoRenew(true);
    setNotifyAt([80, 100]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetData = {
      name,
      period,
      type,
      currency: currency as keyof typeof CURRENCIES,
      category: type === 'category' ? category : undefined,
      amount: Number(amount),
      auto_renew: autoRenew,
      notify_at: notifyAt,
    };

    if (editingBudgetId) {
      await updateBudget(editingBudgetId, budgetData);
    } else {
      await addBudget({
        ...budgetData,
        status: 'active',
        start_date: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      deleteBudget(id);
    }
  };

  const getIcon = (type: BudgetType) => {
    switch (type) {
      case 'category': return <Calculator className="w-6 h-6 text-blue-600" />;
      case 'goal': return <Target className="w-6 h-6 text-emerald-600" />;
      case 'project': return <Folder className="w-6 h-6 text-purple-600" />;
      default: return <Calendar className="w-6 h-6 text-gray-600" />;
    }
  };

  const getBgColor = (type: BudgetType) => {
    switch (type) {
      case 'category': return 'bg-blue-50 border-blue-100';
      case 'goal': return 'bg-emerald-50 border-emerald-100';
      case 'project': return 'bg-purple-50 border-purple-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Calculate spent amounts for each budget
  const budgetStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Weekly calculations setup
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    return budgets.map(budget => {
      let spent = 0;

      // Filter transactions based on budget type and period
      const relevantTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);

        let isWithinPeriod = false;
        if (budget.period === 'monthly') {
          isWithinPeriod = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        } else if (budget.period === 'yearly') {
          isWithinPeriod = tDate.getFullYear() === currentYear;
        } else if (budget.period === 'weekly') {
          isWithinPeriod = tDate >= currentWeekStart && tDate <= currentWeekEnd;
        } else {
          isWithinPeriod = true; // Fallback
        }

        if (!isWithinPeriod) return false;
        if (t.type !== 'expense') return false; // Budgets usually track expenses
        if (t.currency !== budget.currency) return false; // Basic currency match for now

        if (budget.type === 'category' && budget.category) {
          return t.category === budget.category;
        }

        // General budget tracks all expenses
        return budget.type === 'general';
      });

      spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = budget.amount - spent;
      const isOverBudget = percentage > 100;
      const isNearLimit = percentage >= 80 && percentage <= 100;

      return {
        ...budget,
        spent,
        percentage,
        remaining,
        isOverBudget,
        isNearLimit
      };
    });
  }, [budgets, transactions]);

  const filteredBudgets = useMemo(() => {
    return budgetStats.filter(b => {
      const matchPeriod = filterPeriod === 'all' || b.period === filterPeriod;
      const matchType = filterType === 'all' || b.type === filterType;
      const matchStatus = filterStatus === 'all' ||
        (filterStatus === 'over' && b.isOverBudget) ||
        (filterStatus === 'near' && b.isNearLimit && !b.isOverBudget) ||
        (filterStatus === 'healthy' && !b.isOverBudget && !b.isNearLimit);
      return matchPeriod && matchType && matchStatus;
    });
  }, [budgetStats, filterPeriod, filterType, filterStatus]);

  const dashboardStats = useMemo(() => {
    let totalPlanned = 0;
    let totalSpent = 0;

    // Calculate totals in base currency (AOA)
    budgetStats.forEach(b => {
      const rate = getRate(b.currency);
      totalPlanned += b.amount * rate;
      totalSpent += b.spent * rate;
    });

    const totalPercentage = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
    const criticalCount = budgetStats.filter(b => b.isOverBudget || b.isNearLimit).length;

    const distributionData = budgetStats.map(b => ({
      name: b.name,
      value: b.spent * getRate(b.currency),
      color: b.isOverBudget ? '#ef4444' : b.isNearLimit ? '#f59e0b' : '#10b981'
    })).filter(d => d.value > 0);

    return { totalPlanned, totalSpent, totalPercentage, criticalCount, distributionData };
  }, [budgetStats]);

  const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300";
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <PageTransition className="space-y-6">
      {loading ? (
        <div key="loading-budgets" className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Orçamentos</h1>
              <p className="text-gray-500 mt-1">Planeje e controle seus limites de gastos.</p>
            </div>
            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </button>
          </div>

          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cn(cardClass, "lg:col-span-2 flex flex-col justify-between")}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Visão Geral (Mês Atual)</h2>
                  </div>
                  {dashboardStats.criticalCount > 0 && (
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {dashboardStats.criticalCount} Alertas
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <h3 className="text-4xl font-semibold text-gray-900 tracking-tight">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalSpent)}
                  </h3>
                  <span className="text-lg text-gray-400 font-medium">
                    / {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalPlanned)}
                  </span>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Consumo Total</span>
                    <span className={cn("font-semibold", dashboardStats.totalPercentage > 100 ? "text-red-600" : "text-gray-900")}>
                      {dashboardStats.totalPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000 ease-out rounded-full", getProgressColor(dashboardStats.totalPercentage))}
                      style={{ width: `${Math.min(dashboardStats.totalPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Restante Previsto</p>
                  <p className={cn("text-lg font-semibold", dashboardStats.totalPlanned - dashboardStats.totalSpent < 0 ? "text-red-600" : "text-emerald-600")}>
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalPlanned - dashboardStats.totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Status Geral</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dashboardStats.totalPercentage > 100 ? 'Excedido' : dashboardStats.totalPercentage > 80 ? 'Atenção' : 'Saudável'}
                  </p>
                </div>
              </div>
            </div>

            <div className={cn(cardClass, "flex flex-col")}>
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Gastos por Orçamento</h2>
              </div>
              <div className="flex-1 min-h-[200px]">
                {dashboardStats.distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={dashboardStats.distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dashboardStats.distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value)}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Sem dados de gastos
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todos os Períodos</option>
              <option value="monthly">Mensal</option>
              <option value="weekly">Semanal</option>
              <option value="yearly">Anual</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todos os Tipos</option>
              <option value="general">Geral</option>
              <option value="category">Por Categoria</option>
              <option value="goal">Por Meta</option>
              <option value="project">Por Projeto</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todos os Status</option>
              <option value="healthy">Saudável</option>
              <option value="near">Atenção</option>
              <option value="over">Excedido</option>
            </select>
          </div>

          {/* Budget List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBudgets.map((budget) => (
              <div key={budget.id} className={cardClass}>
                <div className="flex items-start justify-between mb-8 relative">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-105 transition-transform duration-300", getBgColor(budget.type))}>
                    {getIcon(budget.type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold uppercase border border-gray-100/50">
                      {budget.period === 'monthly' ? 'Mensal' : budget.period === 'weekly' ? 'Semanal' : 'Anual'}
                    </span>
                    <ActionMenu
                      triggerIcon={<MoreVertical className="w-5 h-5" />}
                      items={[
                        {
                          label: 'Editar',
                          icon: <Edit2 className="w-4 h-4" />,
                          onClick: () => openEditModal(budget),
                        },
                        {
                          label: 'Excluir',
                          icon: <Trash2 className="w-4 h-4" />,
                          danger: true,
                          onClick: () => handleDelete(budget.id),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-gray-500 font-medium">{budget.name}</p>
                    {budget.isOverBudget && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {budget.isNearLimit && !budget.isOverBudget && <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className={cn("text-3xl font-semibold tracking-tight", budget.isOverBudget ? "text-red-600" : "text-gray-900")}>
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: budget.currency, maximumFractionDigits: 0 }).format(budget.spent)}
                    </h3>
                    <span className="text-sm text-gray-400 font-medium">
                      / {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: budget.currency, maximumFractionDigits: 0 }).format(budget.amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Progresso</span>
                    <span className={cn("font-semibold", budget.isOverBudget ? "text-red-600" : "text-gray-900")}>
                      {budget.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000 ease-out rounded-full", getProgressColor(budget.percentage))}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-medium pt-2">
                    {budget.isOverBudget
                      ? `Excedeu em ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: budget.currency, maximumFractionDigits: 0 }).format(budget.spent - budget.amount)}`
                      : `Restam ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: budget.currency, maximumFractionDigits: 0 }).format(budget.remaining)}`
                    }
                  </p>
                </div>
              </div>
            ))}

            {/* Add New Budget Card */}
            <button
              onClick={openNewModal}
              className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-all min-h-[320px] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-100/50">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
              <span className="font-medium">Criar novo orçamento</span>
            </button>
          </div>

          {/* Add/Edit Budget Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative my-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">{editingBudgetId ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Orçamento</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: Alimentação Mensal"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['general', 'category', 'goal', 'project'] as BudgetType[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setType(t)}
                              className={cn(
                                "py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize border",
                                type === t
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              {t === 'general' ? 'Geral' : t === 'category' ? 'Categoria' : t === 'goal' ? 'Meta' : 'Projeto'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {type === 'category' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                          <select
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          >
                            <option value="">Selecione uma categoria</option>
                            {categories.expense.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="monthly">Mensal</option>
                          <option value="weekly">Semanal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Limite</label>
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notificar em (%)</label>
                        <div className="flex gap-2">
                          {[50, 80, 90, 100].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                if (notifyAt.includes(val)) {
                                  setNotifyAt(notifyAt.filter(n => n !== val));
                                } else {
                                  setNotifyAt([...notifyAt, val].sort((a, b) => a - b));
                                }
                              }}
                              className={cn(
                                "py-1.5 px-3 rounded-lg text-sm font-medium transition-all border",
                                notifyAt.includes(val)
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
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
                      {editingBudgetId ? 'Salvar Alterações' : 'Criar Orçamento'}
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
