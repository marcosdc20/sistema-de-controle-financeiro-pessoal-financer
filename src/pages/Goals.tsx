import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useFinance, Goal, GoalPriority, GoalType, GoalStatus } from '@/context/FinanceContext';
import { CURRENCIES } from '@/lib/utils';
import { Target, Car, Home, ShieldAlert, Plus, MoreVertical, Plane, GraduationCap, Briefcase, Heart, X, Edit2, Trash2, ArrowUpRight, Activity, AlertCircle, CheckCircle2, PieChart } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { ActionMenu } from '@/components/ActionMenu';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, addGoalContribution, accounts, loading, getRate } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State - Goal (must be declared BEFORE any early return - Rules of Hooks)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Emergência');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState('AOA');
  const [deadline, setDeadline] = useState('');
  const [accountId, setAccountId] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [type, setType] = useState<GoalType>('deadline');

  // Form State - Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccountId, setDepositAccountId] = useState('');



  const openEditModal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setName(goal.name);
    setCategory(goal.category);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setCurrency(goal.currency);
    setDeadline(goal.deadline ? goal.deadline.split('T')[0] : '');
    setAccountId(goal.accountId || '');
    setPriority(goal.priority);
    setType(goal.type);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingGoalId(null);
    setName('');
    setCategory('Emergência');
    setTargetAmount('');
    setCurrentAmount('');
    setCurrency('AOA');
    setDeadline('');
    setAccountId('');
    setPriority('medium');
    setType('deadline');
    setIsModalOpen(true);
  };

  const openDepositModal = (goal: Goal) => {
    setSelectedGoalForDeposit(goal);
    setDepositAmount('');
    setDepositAccountId('');
    setIsDepositModalOpen(true);
  };

  const openDetailsModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDetailsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goalData = {
      name,
      category,
      target_amount: Number(targetAmount),
      current_amount: Number(currentAmount) || 0,
      currency: currency as keyof typeof CURRENCIES,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      account_id: accountId || undefined,
      priority,
      type,
      status: (Number(currentAmount) || 0) >= Number(targetAmount) ? 'completed' : 'active' as const,
      color: getCategoryColor(category),
    };

    if (editingGoalId) {
      await updateGoal(editingGoalId, goalData);
    } else {
      await addGoal(goalData);
    }
    setIsModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoalForDeposit && depositAmount && depositAccountId) {
      addGoalContribution(selectedGoalForDeposit.id, Number(depositAmount), depositAccountId);

      // Check if goal is completed
      const newAmount = selectedGoalForDeposit.currentAmount + Number(depositAmount);
      if (newAmount >= selectedGoalForDeposit.targetAmount) {
        updateGoal(selectedGoalForDeposit.id, { status: 'completed' });

        // Trigger celebration!
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }

      setIsDepositModalOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteGoal(id);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Veículo': return <Car className="w-6 h-6" />;
      case 'Casa': return <Home className="w-6 h-6" />;
      case 'Viagem': return <Plane className="w-6 h-6" />;
      case 'Educação': return <GraduationCap className="w-6 h-6" />;
      case 'Investimento': return <Briefcase className="w-6 h-6" />;
      case 'Saúde': return <Heart className="w-6 h-6" />;
      default: return <ShieldAlert className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Veículo': return 'bg-blue-500';
      case 'Casa': return 'bg-emerald-500';
      case 'Viagem': return 'bg-purple-500';
      case 'Educação': return 'bg-amber-500';
      case 'Investimento': return 'bg-indigo-500';
      case 'Saúde': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: GoalPriority) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
    }
  };

  const calculateGoalStats = (goal: Goal) => {
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

    let daysRemaining = 0;
    let monthlyRequired = 0;
    let isDelayed = false;

    if (goal.deadline && goal.type === 'deadline') {
      const today = new Date();
      const deadlineDate = new Date(goal.deadline);
      const timeDiff = deadlineDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysRemaining > 0) {
        const monthsRemaining = daysRemaining / 30;
        monthlyRequired = remaining / monthsRemaining;

        // Simple delay check: if required monthly is more than 30% of target, it's delayed
        if (monthlyRequired > (goal.targetAmount * 0.3)) {
          isDelayed = true;
        }
      } else if (remaining > 0) {
        isDelayed = true; // Deadline passed but not completed
      }
    }

    return { progress, remaining, daysRemaining, monthlyRequired, isDelayed };
  };

  const dashboardStats = useMemo(() => {
    let totalTarget = 0;
    let totalSaved = 0;
    let completedCount = 0;

    const categoryData: Record<string, number> = {};

    goals.forEach(goal => {
      const rate = getRate(goal.currency);
      totalTarget += goal.targetAmount * rate;
      totalSaved += goal.currentAmount * rate;

      if (goal.status === 'completed') {
        completedCount++;
      }

      categoryData[goal.category] = (categoryData[goal.category] || 0) + (goal.currentAmount * rate);
    });

    const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

    return { totalTarget, totalSaved, totalProgress, completedCount, chartData };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (filterStatus === 'active') return g.status !== 'completed';
      if (filterStatus === 'completed') return g.status === 'completed';
      return true;
    });
  }, [goals, filterStatus]);

  const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300";
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#6366f1', '#ef4444', '#64748b'];

  return (
    <PageTransition className="space-y-6">
      {loading ? (
        <div key="loading-goals" className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Metas Financeiras</h1>
              <p className="text-gray-500 mt-1">Defina objetivos e acompanhe seu progresso.</p>
            </div>
            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </button>
          </div>

          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cn(cardClass, "lg:col-span-2 flex flex-col justify-between")}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-400" />
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Progresso Global</h2>
                  </div>
                  {dashboardStats.completedCount > 0 && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {dashboardStats.completedCount} Metas Concluídas
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <h3 className="text-4xl font-semibold text-gray-900 tracking-tight">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalSaved)}
                  </h3>
                  <span className="text-lg text-gray-400 font-medium">
                    / {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalTarget)}
                  </span>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Acumulado</span>
                    <span className="font-semibold text-gray-900">
                      {dashboardStats.totalProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${Math.min(dashboardStats.totalProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Total de Metas</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {goals.length} ativas
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Falta Poupar</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalTarget - dashboardStats.totalSaved)}
                  </p>
                </div>
              </div>
            </div>

            <div className={cn(cardClass, "flex flex-col")}>
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Poupado por Categoria</h2>
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
                    Sem dados de poupança
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todas as Metas</option>
              <option value="active">Em Progresso</option>
              <option value="completed">Concluídas</option>
            </select>
          </div>

          {/* Goals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => {
              const stats = calculateGoalStats(goal);

              return (
                <div key={goal.id} className={cn(cardClass, goal.status === 'completed' && 'ring-2 ring-emerald-500/50')}>
                  <div className="flex items-start justify-between mb-8 relative">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300", goal.color || 'bg-gray-800')}>
                      {getCategoryIcon(goal.category)}
                    </div>
                    <div className="flex items-center gap-2">
                      {goal.status === 'completed' ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold uppercase border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Concluída
                        </span>
                      ) : (
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-xs font-semibold uppercase border",
                          goal.priority === 'high' ? "bg-red-50 text-red-600 border-red-100" :
                            goal.priority === 'medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                          {getPriorityLabel(goal.priority)}
                        </span>
                      )}

                      <ActionMenu
                        triggerIcon={<MoreVertical className="w-5 h-5" />}
                        items={[
                          {
                            label: 'Editar',
                            icon: <Edit2 className="w-4 h-4" />,
                            onClick: () => openEditModal(goal),
                          },
                          {
                            label: 'Excluir',
                            icon: <Trash2 className="w-4 h-4" />,
                            danger: true,
                            onClick: () => handleDelete(goal.id),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-500 font-medium">{goal.name}</p>
                      {stats.isDelayed && goal.status !== 'completed' && (
                        <div className="group relative">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Atraso detectado
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-semibold text-gray-900 tracking-tight">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: goal.currency, maximumFractionDigits: 0 }).format(goal.currentAmount)}
                      </h3>
                      <span className="text-sm text-gray-400 font-medium">
                        / {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: goal.currency, maximumFractionDigits: 0 }).format(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Progresso</span>
                      <span className="text-gray-900 font-semibold">{stats.progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-1000 ease-out rounded-full", goal.color?.replace('bg-', 'bg-') || 'bg-black')}
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>

                    {goal.status !== 'completed' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {goal.deadline && (
                          <div className="text-xs text-gray-500">
                            <span className="block font-medium mb-0.5">Faltam</span>
                            <span className={cn("font-semibold", stats.daysRemaining < 30 ? "text-red-600" : "text-gray-900")}>
                              {stats.daysRemaining > 0 ? `${stats.daysRemaining} dias` : 'Prazo esgotado'}
                            </span>
                          </div>
                        )}
                        {stats.monthlyRequired > 0 && (
                          <div className="text-xs text-gray-500">
                            <span className="block font-medium mb-0.5">Necessário/mês</span>
                            <span className="font-semibold text-gray-900">
                              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: goal.currency, maximumFractionDigits: 0 }).format(stats.monthlyRequired)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100/50 flex gap-3">
                    <button
                      onClick={() => openDetailsModal(goal)}
                      className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Detalhes
                    </button>
                    <button
                      onClick={() => openDepositModal(goal)}
                      disabled={goal.status === 'completed'}
                      className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Depositar
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add New Goal Card */}
            <button
              onClick={openNewModal}
              className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-all min-h-[320px] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-100/50">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
              <span className="font-medium">Criar nova meta</span>
            </button>
          </div>

          {/* Add/Edit Goal Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative my-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">{editingGoalId ? 'Editar Meta' : 'Nova Meta'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Meta</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: Comprar Carro"
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
                          <option value="Emergência">Fundo de Emergência</option>
                          <option value="Veículo">Veículo</option>
                          <option value="Casa">Casa/Imóvel</option>
                          <option value="Viagem">Viagem</option>
                          <option value="Educação">Educação</option>
                          <option value="Investimento">Investimento</option>
                          <option value="Saúde">Saúde</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Total</label>
                          <input
                            type="number"
                            required
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valor Inicial (Já guardado)</label>
                        <input
                          type="number"
                          value={currentAmount}
                          onChange={(e) => setCurrentAmount(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Meta</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as GoalType)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="deadline">Com prazo definido</option>
                          <option value="no_deadline">Sem prazo fixo</option>
                          <option value="recurring">Recorrente</option>
                        </select>
                      </div>

                      {type === 'deadline' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Data Limite</label>
                          <input
                            type="date"
                            required
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['high', 'medium', 'low'] as GoalPriority[]).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              className={cn(
                                "py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize border",
                                priority === p
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Conta Vinculada (Onde guardar)</label>
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
                      {editingGoalId ? 'Salvar Alterações' : 'Criar Meta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Deposit Modal */}
          {isDepositModalOpen && selectedGoalForDeposit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative">
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">Fazer Depósito</h2>
                <p className="text-gray-500 mb-6 text-sm">Adicionar fundos para: <strong className="text-gray-900">{selectedGoalForDeposit.name}</strong></p>

                <form onSubmit={handleDepositSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor ({selectedGoalForDeposit.currency})</label>
                    <input
                      type="number"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900 text-lg font-medium"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conta de Origem</label>
                    <select
                      required
                      value={depositAccountId}
                      onChange={(e) => setDepositAccountId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                    >
                      <option value="">Selecione a conta</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} - Saldo: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: acc.currency, maximumFractionDigits: 0 }).format(acc.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsDepositModalOpen(false)}
                      className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Confirmar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {isDetailsModalOpen && selectedGoal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-sm", selectedGoal.color || 'bg-gray-800')}>
                    {getCategoryIcon(selectedGoal.category)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{selectedGoal.name}</h2>
                    <p className="text-gray-500 text-sm">{selectedGoal.category}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-xs text-gray-500 font-medium mb-1">Acumulado</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedGoal.currency, maximumFractionDigits: 0 }).format(selectedGoal.currentAmount)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-xs text-gray-500 font-medium mb-1">Meta Total</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedGoal.currency, maximumFractionDigits: 0 }).format(selectedGoal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Status</span>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold uppercase border",
                        selectedGoal.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          selectedGoal.status === 'active' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            "bg-gray-50 text-gray-600 border-gray-100"
                      )}>
                        {selectedGoal.status === 'completed' ? 'Concluída' : selectedGoal.status === 'active' ? 'Ativa' : selectedGoal.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Prioridade</span>
                      <span className="text-gray-900 font-medium capitalize">{getPriorityLabel(selectedGoal.priority)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Tipo</span>
                      <span className="text-gray-900 font-medium">
                        {selectedGoal.type === 'deadline' ? 'Com prazo' : selectedGoal.type === 'no_deadline' ? 'Sem prazo' : 'Recorrente'}
                      </span>
                    </div>
                    {selectedGoal.deadline && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500 text-sm">Data Limite</span>
                        <span className="text-gray-900 font-medium">
                          {new Date(selectedGoal.deadline).toLocaleDateString('pt-AO')}
                        </span>
                      </div>
                    )}
                    {selectedGoal.accountId && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500 text-sm">Conta Vinculada</span>
                        <span className="text-gray-900 font-medium">
                          {accounts.find(a => a.id === selectedGoal.accountId)?.name || 'Desconhecida'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-500 text-sm">Criada em</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(selectedGoal.createdAt).toLocaleDateString('pt-AO')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
