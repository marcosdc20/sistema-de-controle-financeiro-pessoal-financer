import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { CURRENCIES, CATEGORIES, cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  MoreHorizontal,
  Target,
  PiggyBank,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Zap,
  Landmark,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import AIAdvisor from '@/components/AIAdvisor';
import PageTransition from '@/components/PageTransition';
import { LinkGoogleBanner } from '@/components/auth/LinkGoogleBanner';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    transactions,
    accounts,
    totalBalanceInBaseCurrency,
    budgets,
    goals,
    investments,
    loans,
    subscriptions,
    getRate,
    formatCurrency,
    formatDate,
    preferences,
    loading,
    profile
  } = useFinance();

  const [isFinHealthOpen, setIsFinHealthOpen] = React.useState(false);

  // --- All hooks MUST be before any conditional returns (React Rules of Hooks) ---

  // 1. Totals (Income/Expense)
  const { totalIncome, totalExpense } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return transactions.reduce((acc, t) => {
      const tDate = new Date(t.date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        const rate = getRate(t.currency);
        const amountInBase = t.amount * rate;
        if (t.type === 'income') acc.totalIncome += amountInBase;
        if (t.type === 'expense') acc.totalExpense += amountInBase;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });
  }, [transactions, getRate]);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // 2. Cash Flow Chart Data (Last 6 months)
  const cashFlowData = useMemo(() => {
    const data: Record<string, { name: string; income: number; expense: number }> = {};
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleDateString(preferences?.language || 'pt-AO', { month: 'short' });
      data[monthName] = { name: monthName, income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate >= new Date(today.getFullYear(), today.getMonth() - 5, 1)) {
        const monthName = tDate.toLocaleDateString(preferences?.language || 'pt-AO', { month: 'short' });
        if (data[monthName]) {
          const rate = getRate(t.currency);
          const amountInBase = t.amount * rate;
          if (t.type === 'income') data[monthName].income += amountInBase;
          if (t.type === 'expense') data[monthName].expense += amountInBase;
        }
      }
    });

    return Object.values(data);
  }, [transactions, getRate, preferences?.language]);

  // 3. Expense by Category (Pie Chart)
  const expenseByCategoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const rate = getRate(t.currency);
      const amountInBase = t.amount * rate;
      data[t.category] = (data[t.category] || 0) + amountInBase;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions, getRate]);

  // 4. Goals Progress
  const goalsData = useMemo(() => {
    return goals.map(g => {
      const rate = getRate(g.currency);
      return {
        name: g.name,
        current: g.currentAmount * rate,
        target: g.targetAmount * rate,
        progress: (g.currentAmount / g.targetAmount) * 100
      };
    }).slice(0, 3);
  }, [goals, getRate]);

  // 5. Investments Distribution
  const investmentsData = useMemo(() => {
    const data: Record<string, number> = {};
    investments.forEach(i => {
      const rate = getRate(i.currency);
      const amountInBase = i.currentValue * rate;
      data[i.type] = (data[i.type] || 0) + amountInBase;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [investments, getRate]);

  // 6. Upcoming Subscriptions
  const upcomingSubscriptions = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return subscriptions
      .filter(s => s.status === 'active')
      .filter(s => {
        const nextBilling = new Date(s.nextBillingDate);
        return nextBilling >= today && nextBilling <= nextWeek;
      })
      .slice(0, 3);
  }, [subscriptions]);

  // 7. Dynamic FinHealth Score
  const finHealthScore = useMemo(() => {
    let score = 500; // Base score

    // Evaluate savings rate
    if (savingsRate >= 20) score += 200;
    else if (savingsRate >= 10) score += 100;
    else if (savingsRate > 0) score += 50;
    else if (savingsRate < 0) score -= 50;

    // Evaluate balance health
    if (totalBalanceInBaseCurrency > 500000) score += 150;
    else if (totalBalanceInBaseCurrency > 10000) score += 100;
    else if (totalBalanceInBaseCurrency > 0) score += 50;
    else if (totalBalanceInBaseCurrency < 0) score -= 150;

    // Evaluate debts
    const activeLoans = loans.filter(l => l.status === 'active' && l.type === 'received');
    if (activeLoans.length === 0) score += 150;
    else score -= (activeLoans.length * 30);

    // Active goal progress bonus
    const activeGoals = goals.filter(g => g.status === 'active');
    if (activeGoals.length > 0) score += 50;

    return Math.min(Math.max(Math.floor(score), 300), 1000);
  }, [savingsRate, totalBalanceInBaseCurrency, loans, goals]);

  // 8. Spending Projection for current month
  const spendingProjection = useMemo(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();

    const monthExpenses = transactions.reduce((sum, t) => {
      const tDate = new Date(t.date);
      if (
        t.type === 'expense' &&
        tDate.getMonth() === today.getMonth() &&
        tDate.getFullYear() === today.getFullYear()
      ) {
        return sum + t.amount * getRate(t.currency);
      }
      return sum;
    }, 0);

    const dailyAvg = dayOfMonth > 0 ? monthExpenses / dayOfMonth : 0;
    const projected = dailyAvg * daysInMonth;
    const daysRemaining = daysInMonth - dayOfMonth;
    const vsIncome = totalIncome > 0 ? (projected / totalIncome) * 100 : 0;
    const progressPct = projected > 0 ? (monthExpenses / projected) * 100 : 0;

    return {
      current: monthExpenses,
      projected,
      dailyAvg,
      daysRemaining,
      progressPct: Math.min(progressPct, 100),
      vsIncome,
      isOverIncome: projected > totalIncome && totalIncome > 0
    };
  }, [transactions, getRate, totalIncome]);

  // 9. Budget Alerts (sophisticated — ordered by urgency)
  const budgetAlerts = useMemo(() => {
    const today = new Date();
    return budgets
      .filter(b => b.status === 'active')
      .map(budget => {
        const spent = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return (
              t.type === 'expense' &&
              t.category === budget.category &&
              tDate.getMonth() === today.getMonth() &&
              tDate.getFullYear() === today.getFullYear()
            );
          })
          .reduce((sum, t) => sum + t.amount * getRate(t.currency), 0);

        const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const level: 'critical' | 'warning' | 'ok' =
          pct >= 100 ? 'critical' : pct >= 70 ? 'warning' : 'ok';

        return { ...budget, spent, pct, level };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions, getRate]);

  // 10. Net Worth Trend (Contas + Investimentos - Dívidas ativas nos últimos 6 meses)
  const netWorthData = useMemo(() => {
    const currentNetWorth = totalBalanceInBaseCurrency +
      investments.reduce((sum, i) => sum + i.currentValue * getRate(i.currency), 0) -
      loans.filter(l => l.status === 'active' && l.type === 'received').reduce((sum, l) => sum + l.currentBalance * getRate(l.currency), 0);

    // Reconstruct historical net worth backward
    const history = [...cashFlowData].reverse(); // from current month back to 5 months ago
    let runningNetWorth = currentNetWorth;
    
    const result = history.map((item) => {
      const currentVal = runningNetWorth;
      const netChange = item.income - item.expense;
      runningNetWorth -= netChange;
      return {
        name: item.name,
        patrimonio: currentVal
      };
    });
    
    return result.reverse(); // back to chronological order
  }, [cashFlowData, totalBalanceInBaseCurrency, investments, loans, getRate]);

  // 11. Asset Allocation (Banco vs Investimentos vs Poupanças/Metas)
  const assetAllocationData = useMemo(() => {
    let bankVal = 0;
    let physicalVal = 0;
    let investmentVal = 0;
    let goalsVal = 0;

    accounts.forEach(acc => {
      const valInBase = acc.balance * getRate(acc.currency);
      if (acc.category === 'bank' || acc.category === 'digital') {
        bankVal += valInBase;
      } else if (acc.category === 'physical') {
        physicalVal += valInBase;
      } else if (acc.category === 'investment') {
        investmentVal += valInBase;
      }
    });

    investments.forEach(inv => {
      investmentVal += inv.currentValue * getRate(inv.currency);
    });

    goals.forEach(g => {
      goalsVal += g.currentAmount * getRate(g.currency);
    });

    const data = [
      { name: 'Contas Bancárias', value: bankVal },
      { name: 'Dinheiro Vivo', value: physicalVal },
      { name: 'Investimentos', value: investmentVal },
      { name: 'Metas / Poupança', value: goalsVal }
    ].filter(item => item.value > 0);

    return data.length > 0 ? data : [
      { name: 'Contas Bancárias', value: 10000 },
      { name: 'Dinheiro Vivo', value: 2000 },
      { name: 'Investimentos', value: 5000 },
      { name: 'Metas / Poupança', value: 3000 }
    ];
  }, [accounts, investments, goals, getRate]);

  // --- Render constants (safe after hooks) ---
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const cardClass = "bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300";

  return (
    <PageTransition className="space-y-8 pb-8">
      {loading ? (
        <div key="loading-dashboard" className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <LinkGoogleBanner />
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-gray-500 mt-1">Visão geral completa das suas finanças.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date().toLocaleDateString(preferences?.language || 'pt-AO', { month: 'long', year: 'numeric' })}</span>
              </div>
              <button
                onClick={() => setIsFinHealthOpen(true)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer",
                  finHealthScore >= 800 ? "bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                    finHealthScore >= 600 ? "bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100" :
                      "bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100"
                )}
              >
                <Activity className="w-4 h-4" />
                <span>FinHealth: {finHealthScore}</span>
              </button>
            </div>
          </div>



          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Balance */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Wallet className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Total</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Saldo Total</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 blur-amount">
                {formatCurrency(totalBalanceInBaseCurrency)}
              </h3>
            </div>

            {/* Income */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12%</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Receitas (Mês)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 blur-amount">
                {formatCurrency(totalIncome)}
              </h3>
            </div>

            {/* Expenses */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <ArrowDownRight className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">-5%</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Despesas (Mês)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 blur-amount">
                {formatCurrency(totalExpense)}
              </h3>
            </div>

            {/* Savings Rate */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <PiggyBank className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Taxa</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Economia</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {savingsRate.toFixed(1)}%
              </h3>
            </div>
          </div>

          {/* New Row: Spending Projection + Budget Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Spending Projection Card */}
            <div className={cardClass}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                      <Zap className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Projeção de Gastos</h3>
                  </div>
                  <p className="text-xs text-gray-400 pl-10">Estimativa para o final do mês</p>
                </div>
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full",
                  spendingProjection.isOverIncome
                    ? "bg-red-50 text-red-600"
                    : spendingProjection.vsIncome >= 80
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                )}>
                  {spendingProjection.vsIncome.toFixed(0)}% da receita
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Gasto atual</p>
                    <p className="text-xl font-bold text-gray-900 blur-amount">{formatCurrency(spendingProjection.current)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Projeção total</p>
                    <p className={cn(
                      "text-xl font-bold blur-amount",
                      spendingProjection.isOverIncome ? "text-red-600" : "text-gray-700"
                    )}>{formatCurrency(spendingProjection.projected)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                    {/* Current spend */}
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        spendingProjection.isOverIncome ? "bg-red-500" :
                        spendingProjection.vsIncome >= 80 ? "bg-amber-400" : "bg-indigo-500"
                      )}
                      style={{ width: `${spendingProjection.progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                      Gasto ({spendingProjection.progressPct.toFixed(0)}%)
                    </span>
                    <span>{spendingProjection.daysRemaining} dias restantes</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-gray-50">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Média diária</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{formatCurrency(spendingProjection.dailyAvg)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Receita do mês</p>
                    <p className="text-sm font-semibold text-emerald-700 mt-0.5">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Saldo projetado</p>
                    <p className={cn(
                      "text-sm font-semibold mt-0.5",
                      totalIncome - spendingProjection.projected >= 0 ? "text-emerald-700" : "text-red-600"
                    )}>
                      {formatCurrency(totalIncome - spendingProjection.projected)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Alerts Card */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Alertas de Orçamento</h3>
                  <p className="text-xs text-gray-400">Mês atual</p>
                </div>
              </div>

              {budgetAlerts.length > 0 ? (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {budgetAlerts.map((b) => (
                    <div key={b.id} className={cn(
                      "p-3 rounded-2xl border transition-all",
                      b.level === 'critical' ? "bg-red-50 border-red-100" :
                      b.level === 'warning' ? "bg-amber-50 border-amber-100" :
                      "bg-gray-50 border-gray-100"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {b.level === 'critical' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          ) : b.level === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-gray-800 truncate">{b.category || b.name}</span>
                        </div>
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                          b.level === 'critical' ? "bg-red-100 text-red-700" :
                          b.level === 'warning' ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {b.pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            b.level === 'critical' ? "bg-red-500" :
                            b.level === 'warning' ? "bg-amber-400" :
                            "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(b.pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(b.spent)}</span>
                        <span>de {formatCurrency(b.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum orçamento ativo</p>
                  <p className="text-xs mt-1">Configure orçamentos em "Orçamentos"</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Charts Section */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cash Flow Chart */}
            <div className={cn(cardClass, "lg:col-span-2")}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Fluxo de Caixa</h3>
                <div className="flex gap-2">
                  <span className="flex items-center text-xs text-gray-500">
                    <span className="w-3 h-3 rounded-full bg-indigo-600 mr-1"></span> Receitas
                  </span>
                  <span className="flex items-center text-xs text-gray-500">
                    <span className="w-3 h-3 rounded-full bg-gray-300 mr-1"></span> Despesas
                  </span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D1D5DB" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#D1D5DB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="income" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Receitas" />
                    <Area type="monotone" dataKey="expense" stroke="#D1D5DB" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Despesas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expenses by Category */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Despesas por Categoria</h3>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium">Total</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Row: Net Worth Trend + Asset Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Net Worth Trend Chart */}
            <div className={cn(cardClass, "lg:col-span-2")}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Evolução do Patrimônio Líquido</h3>
                  <p className="text-xs text-gray-400">Total consolidado nos últimos 6 meses</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  Patrimônio Líquido
                </span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="patrimonio" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" name="Patrimônio" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Allocation Chart */}
            <div className={cardClass}>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Distribuição de Ativos</h3>
                <p className="text-xs text-gray-400 mb-6">Alocação por categoria de ativo</p>
              </div>
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {assetAllocationData.map((entry, index) => (
                        <Cell key={`cell-asset-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium">Patrimônio</p>
                    <p className="text-base font-bold text-gray-950">
                      {formatCurrency(assetAllocationData.reduce((sum, item) => sum + item.value, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Section: Goals & Investments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Goals Progress */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Metas Financeiras
                </h3>
                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Ver todas</button>
              </div>
              <div className="space-y-6">
                {goalsData.length > 0 ? goalsData.map((goal, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">{goal.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-1" title="Recompensa VukaCoin ao concluir">+50 🪙</span>
                        <span className="font-semibold text-gray-900">{goal.progress.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(goal.progress, 100)}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatCurrency(goal.current)}</span>
                      <span>{formatCurrency(goal.target)}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhuma meta definida</p>
                  </div>
                )}
              </div>
            </div>

            {/* Investment Allocation */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Investimentos
                </h3>
                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Detalhes</button>
              </div>
              {investmentsData.length > 0 ? (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={investmentsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} width={100} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {investmentsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Sem investimentos registrados</p>
                </div>
              )}
            </div>
          </div>

          {/* Third Row: Subscriptions & Loans & Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming Subscriptions */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Assinaturas (7 dias)
              </h3>
              <div className="space-y-4">
                {upcomingSubscriptions.length > 0 ? upcomingSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shadow-sm">
                        {sub.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{sub.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(sub.nextBillingDate)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {formatCurrency(sub.amount, sub.currency)}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <p>Nenhuma cobrança próxima</p>
                  </div>
                )}
              </div>
            </div>

            {/* Loans Summary */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-500" />
                Empréstimos Ativos
              </h3>
              <div className="space-y-4">
                {loans.filter(l => l.status === 'active').slice(0, 3).map((loan) => (
                  <div key={loan.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 text-sm">{loan.counterparty}</span>
                      <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg font-medium">
                        {loan.interestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Restante:</span>
                      <span className="font-semibold text-gray-900 blur-amount">
                        {formatCurrency(loan.currentBalance, loan.currency)}
                      </span>
                    </div>
                  </div>
                ))}
                {loans.filter(l => l.status === 'active').length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <p>Sem empréstimos ativos</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Advisor Teaser */}
            <div className="h-full">
              <AIAdvisor />
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className={cn(cardClass, "p-0 overflow-hidden")}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <h3 className="text-lg font-bold text-gray-900">Transações Recentes</h3>
              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Descrição</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium">Data</th>
                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                          )}>
                            {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <span className="font-medium text-gray-900">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {new Date(t.date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-bold blur-amount",
                        t.type === 'income' ? "text-emerald-600" :
                          t.type === 'adjustment' ? (t.amount >= 0 ? "text-emerald-600" : "text-red-600") : "text-gray-900"
                      )}>
                        {t.type === 'income' ? '+' : t.type === 'adjustment' ? (t.amount >= 0 ? '+' : '') : '-'}
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: t.currency }).format(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FinHealth Breakdown Modal */}
      {isFinHealthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600" />
            
            <button
              onClick={() => setIsFinHealthOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md mb-3",
                finHealthScore >= 800 ? "bg-emerald-100 text-emerald-600" :
                  finHealthScore >= 600 ? "bg-indigo-100 text-indigo-600" :
                    "bg-amber-100 text-amber-600"
              )}>
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Score FinHealth</h3>
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{finHealthScore} <span className="text-sm font-normal text-gray-400">/ 1000</span></div>
              <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
                Este indicador mede a sua saúde financeira com base no seu comportamento de poupança, patrimônio e compromissos locais.
              </p>
            </div>

            <div className="space-y-4">
              {/* Poupança */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Taxa de Poupança</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Economizado: {savingsRate.toFixed(1)}% das receitas</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600">
                  +{savingsRate >= 20 ? 200 : savingsRate >= 10 ? 100 : savingsRate > 0 ? 50 : 0} pts
                </span>
              </div>

              {/* Saldo Total */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Saldo Consolidado</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 blur-amount">Patrimônio local: {formatCurrency(totalBalanceInBaseCurrency)}</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-indigo-600">
                  +{totalBalanceInBaseCurrency > 500000 ? 150 : totalBalanceInBaseCurrency > 10000 ? 100 : totalBalanceInBaseCurrency > 0 ? 50 : 0} pts
                </span>
              </div>

              {/* Empréstimos */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl text-center">
                    <ArrowDownRight className="w-4 h-4 mx-auto" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Dívidas e Empréstimos</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {loans.filter(l => l.status === 'active' && l.type === 'received').length} empréstimos recebidos ativos
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-extrabold",
                  loans.filter(l => l.status === 'active' && l.type === 'received').length === 0 ? "text-indigo-600" : "text-red-500"
                )}>
                  {loans.filter(l => l.status === 'active' && l.type === 'received').length === 0 ? '+150 pts' : `-${loans.filter(l => l.status === 'active' && l.type === 'received').length * 30} pts`}
                </span>
              </div>

              {/* Metas Ativas */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Metas Ativas</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Possui metas de poupança em progresso</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-600">
                  +{goals.filter(g => g.status === 'active').length > 0 ? 50 : 0} pts
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsFinHealthOpen(false)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
