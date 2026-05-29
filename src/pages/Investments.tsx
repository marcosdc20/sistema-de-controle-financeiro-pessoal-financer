import React, { useState, useMemo } from 'react';
import { useFinance, Investment, InvestmentType, InvestmentRisk } from '@/context/FinanceContext';
import { CURRENCIES } from '@/lib/utils';
import { TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Plus, MoreVertical, X, Edit2, Trash2, Briefcase, Building2, Bitcoin, LineChart, ShieldCheck, Store, CircleDollarSign, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { ActionMenu } from '@/components/ActionMenu';

const getNextCouponDate = (purchaseDateStr: string, maturityDateStr: string | undefined, frequency: string | undefined) => {
  if (!maturityDateStr) return null;
  const purchase = new Date(purchaseDateStr);
  const maturity = new Date(maturityDateStr);
  const today = new Date();

  if (today > maturity) return null; // Já venceu

  let monthsStep = 6;
  if (frequency === 'anual') monthsStep = 12;
  if (frequency === 'mensal') monthsStep = 1;

  let nextCoupon = new Date(purchase);
  while (nextCoupon <= today) {
    nextCoupon.setMonth(nextCoupon.getMonth() + monthsStep);
  }

  if (nextCoupon > maturity) {
    return maturity;
  }
  return nextCoupon;
};

export default function Investments() {
  const { investments, addInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction, accounts, goals, transactions, loading, getRate } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Form State - Investment (must be BEFORE any early return - Rules of Hooks)
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('Ações');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [currency, setCurrency] = useState('AOA');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [fees, setFees] = useState('');
  const [accountId, setAccountId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [broker, setBroker] = useState('');
  const [risk, setRisk] = useState<InvestmentRisk>('Médio');

  // Coupon / Treasury states
  const [maturityDate, setMaturityDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState('semestral');

  // Form State - Transaction
  const [transactionType, setTransactionType] = useState<'aporte' | 'resgate' | 'dividendo'>('aporte');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionAccountId, setTransactionAccountId] = useState('');



  const openEditModal = (investment: Investment) => {
    setEditingInvestmentId(investment.id);
    setName(investment.name);
    setType(investment.type);
    setInvestedAmount(investment.investedAmount.toString());
    setCurrentValue(investment.currentValue.toString());
    setCurrency(investment.currency);
    setPurchaseDate(investment.purchaseDate.split('T')[0]);
    setQuantity(investment.quantity?.toString() || '');
    setUnitPrice(investment.unitPrice?.toString() || '');
    setFees(investment.fees.toString());
    setAccountId(investment.accountId || '');
    setGoalId(investment.goalId || '');
    setBroker(investment.broker || '');
    setRisk(investment.risk);
    setMaturityDate(investment.maturityDate ? investment.maturityDate.split('T')[0] : '');
    setInterestRate(investment.interestRate?.toString() || '');
    setPaymentFrequency(investment.paymentFrequency || 'semestral');
    setIsModalOpen(true);
    setOpenActionId(null);
  };

  const openNewModal = () => {
    setEditingInvestmentId(null);
    setName('');
    setType('Ações');
    setInvestedAmount('');
    setCurrentValue('');
    setCurrency('AOA');
    setPurchaseDate('');
    setQuantity('');
    setUnitPrice('');
    setFees('');
    setAccountId('');
    setGoalId('');
    setBroker('');
    setRisk('Médio');
    setMaturityDate('');
    setInterestRate('');
    setPaymentFrequency('semestral');
    setIsModalOpen(true);
  };

  const openDetailsModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsDetailsModalOpen(true);
    setOpenActionId(null);
  };

  const openTransactionModal = (investment: Investment, type: 'aporte' | 'resgate' | 'dividendo') => {
    setSelectedInvestment(investment);
    setTransactionType(type);
    setTransactionAmount('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionAccountId(investment.accountId || '');
    setIsTransactionModalOpen(true);
    setOpenActionId(null);
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment || !transactionAccountId) return;

    addInvestmentTransaction(
      selectedInvestment.id,
      transactionType,
      Number(transactionAmount),
      transactionAccountId,
      new Date(transactionDate).toISOString()
    );

    setIsTransactionModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const investmentData = {
      name,
      type,
      invested_amount: Number(investedAmount),
      current_value: Number(currentValue) || Number(investedAmount), // Default to invested if not provided
      currency: currency as keyof typeof CURRENCIES,
      purchase_date: new Date(purchaseDate).toISOString(),
      quantity: quantity ? Number(quantity) : undefined,
      unit_price: unitPrice ? Number(unitPrice) : undefined,
      fees: Number(fees) || 0,
      account_id: accountId || undefined,
      goal_id: goalId || undefined,
      broker: broker || undefined,
      risk,
      maturity_date: type === 'Obrigações' && maturityDate ? new Date(maturityDate).toISOString() : undefined,
      interest_rate: type === 'Obrigações' && interestRate ? Number(interestRate) : undefined,
      payment_frequency: type === 'Obrigações' ? paymentFrequency : undefined,
    };

    if (editingInvestmentId) {
      await updateInvestment(editingInvestmentId, investmentData);
    } else {
      await addInvestment({
        ...investmentData,
        status: 'active',
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este investimento?')) {
      deleteInvestment(id);
    }
    setOpenActionId(null);
  };

  const getInvestmentIcon = (type: string) => {
    switch (type) {
      case 'Ações': return <LineChart className="w-5 h-5" />;
      case 'Fundos': return <PieChart className="w-5 h-5" />;
      case 'Obrigações': return <ShieldCheck className="w-5 h-5" />;
      case 'Depósito a prazo': return <Building2 className="w-5 h-5" />;
      case 'Criptomoeda': return <Bitcoin className="w-5 h-5" />;
      case 'Negócio próprio': return <Store className="w-5 h-5" />;
      default: return <CircleDollarSign className="w-5 h-5" />;
    }
  };

  const calculateROI = (invested: number, current: number) => {
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
  };

  const dashboardStats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    const categoryData: Record<string, number> = {};
    let bestAsset: { name: string; roi: number } | null = null;
    let worstAsset: { name: string; roi: number } | null = null;
    const concentrationAlerts: { name: string; percentage: number }[] = [];

    // Calculate totals first
    investments.forEach(inv => {
      if (inv.status !== 'active') return;
      const rate = getRate(inv.currency);
      totalCurrent += inv.currentValue * rate;
      totalInvested += inv.investedAmount * rate;
    });

    investments.forEach(inv => {
      if (inv.status !== 'active') return;

      const rate = getRate(inv.currency);
      const currentAOA = inv.currentValue * rate;

      categoryData[inv.type] = (categoryData[inv.type] || 0) + currentAOA;

      const roi = calculateROI(inv.investedAmount, inv.currentValue);

      if (!bestAsset || roi > bestAsset.roi) bestAsset = { name: inv.name, roi };
      if (!worstAsset || roi < worstAsset.roi) worstAsset = { name: inv.name, roi };

      // Concentration Check
      if (totalCurrent > 0) {
        const percentage = currentAOA / totalCurrent;
        if (percentage > 0.40) {
          concentrationAlerts.push({ name: inv.name, percentage });
        }
      }
    });

    const totalROI = calculateROI(totalInvested, totalCurrent);
    const totalProfit = totalCurrent - totalInvested;

    const chartData = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Calculate Dividends
    const totalDividends = transactions
      .filter(t => t.category === 'Investimento' && t.type === 'income')
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + (t.amount * rate);
      }, 0);

    return { totalInvested, totalCurrent, totalROI, totalProfit, chartData, bestAsset, worstAsset, totalDividends, concentrationAlerts };
  }, [investments, transactions]);

  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => {
      if (inv.status !== 'active') return false;
      if (filterType !== 'all' && inv.type !== filterType) return false;
      return true;
    });
  }, [investments, filterType]);

  // Mock performance data for the area chart
  const performanceData = [
    { month: 'Jan', value: dashboardStats.totalInvested * 0.9 },
    { month: 'Fev', value: dashboardStats.totalInvested * 0.95 },
    { month: 'Mar', value: dashboardStats.totalInvested * 0.98 },
    { month: 'Abr', value: dashboardStats.totalInvested * 1.02 },
    { month: 'Mai', value: dashboardStats.totalInvested * 1.05 },
    { month: 'Jun', value: dashboardStats.totalCurrent },
  ];

  const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden";
  const COLORS = ['#111827', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#F9FAFB'];

  return (
    <PageTransition className="space-y-6">
      {loading ? (
        <div key="loading-investments" className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Investimentos</h1>
              <p className="text-gray-500 mt-1">Acompanhe o crescimento do seu patrimônio.</p>
            </div>
            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Aporte
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className={`lg:col-span-2 ${cardClass}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Evolução Patrimonial</h3>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalCurrent)}
                    </h2>
                    <div className={cn(
                      "flex items-center text-sm font-medium px-2 py-0.5 rounded-lg",
                      dashboardStats.totalROI >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                    )}>
                      {dashboardStats.totalROI >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {Math.abs(dashboardStats.totalROI).toFixed(2)}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Lucro/Prejuízo: <span className={dashboardStats.totalProfit >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalProfit)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => new Intl.NumberFormat('pt-AO', { notation: 'compact', compactDisplay: 'short' }).format(value)}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      formatter={(value: number) => [new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value), 'Valor']}
                      labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#111827" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Allocation & Highlights */}
            <div className="space-y-6">
              <div className={cardClass}>
                <h3 className="text-sm font-medium text-gray-500 mb-6">Alocação de Ativos</h3>
                <div className="h-[220px] w-full relative">
                  {dashboardStats.chartData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={dashboardStats.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {dashboardStats.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value)}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      {/* Center Text */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 font-medium">Total</p>
                          <p className="font-semibold text-gray-900 text-lg">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: 'compact' }).format(dashboardStats.totalCurrent)}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      Sem investimentos
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-6">
                  {dashboardStats.chartData.slice(0, 4).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-gray-600 font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900 font-semibold">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: 'compact' }).format(item.value)}
                        </span>
                        <span className="text-gray-400 text-xs w-8 text-right">
                          {((item.value / dashboardStats.totalCurrent) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50">
                  <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Mais Rentável
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{dashboardStats.bestAsset?.name || '-'}</p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">
                    {dashboardStats.bestAsset ? `+${dashboardStats.bestAsset.roi.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100/50">
                  <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Pior Desempenho
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{dashboardStats.worstAsset?.name || '-'}</p>
                  <p className="text-lg font-bold text-red-700 mt-1">
                    {dashboardStats.worstAsset ? `${dashboardStats.worstAsset.roi.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="col-span-2 bg-blue-50 rounded-2xl p-4 border border-blue-100/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
                      <CircleDollarSign className="w-3 h-3" /> Total Dividendos
                    </p>
                    <p className="text-lg font-bold text-blue-700 mt-1">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dashboardStats.totalDividends)}
                    </p>
                  </div>
                </div>
              </div>

              {dashboardStats.concentrationAlerts.length > 0 && (
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100/50">
                  <p className="text-xs font-medium text-orange-600 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Alerta de Concentração
                  </p>
                  <div className="space-y-1">
                    {dashboardStats.concentrationAlerts.map((alert, index) => (
                      <p key={index} className="text-sm text-orange-800">
                        <span className="font-semibold">{alert.name}</span> representa {(alert.percentage * 100).toFixed(1)}% da carteira.
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asset List */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Meus Ativos</h3>
              <div className="flex items-center gap-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="Ações">Ações</option>
                  <option value="Fundos">Fundos</option>
                  <option value="Obrigações">Obrigações</option>
                  <option value="Depósito a prazo">Depósito a prazo</option>
                  <option value="Criptomoeda">Criptomoeda</option>
                  <option value="Negócio próprio">Negócio próprio</option>
                  <option value="Outro">Outros</option>
                </select>
                <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  {filteredInvestments.length} Ativos
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ativo</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium text-right">Investido</th>
                    <th className="px-4 py-3 font-medium text-right">Valor Atual</th>
                    <th className="px-4 py-3 font-medium text-right">Rentabilidade</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {filteredInvestments.map((inv) => {
                    const roi = calculateROI(inv.investedAmount, inv.currentValue);
                    const isPositive = roi >= 0;

                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                              {getInvestmentIcon(inv.type)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{inv.name}</p>
                              <div className="text-xs text-gray-500">
                                <span>{inv.broker || 'Sem corretora'}</span>
                                {inv.type === 'Obrigações' && inv.maturityDate && (
                                  (() => {
                                    const nextCoupon = getNextCouponDate(inv.purchaseDate, inv.maturityDate, inv.paymentFrequency);
                                    if (nextCoupon) {
                                      const daysLeft = Math.ceil((nextCoupon.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                      return (
                                        <span className="block mt-1 text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
                                          Próximo cupão: {nextCoupon.toLocaleDateString('pt-AO')} ({daysLeft} dias)
                                        </span>
                                      );
                                    }
                                    return <span className="block mt-1 text-[11px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md w-fit">Vencido</span>;
                                  })()
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500">{inv.type}</td>
                        <td className="px-4 py-4 text-right font-medium text-gray-500">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: inv.currency, maximumFractionDigits: 0 }).format(inv.investedAmount)}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: inv.currency, maximumFractionDigits: 0 }).format(inv.currentValue)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                            isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                          )}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {Math.abs(roi).toFixed(2)}%
                          </span>
                        </td>
                        <ActionMenu
                          triggerIcon={<MoreVertical className="w-5 h-5" />}
                          items={[
                            {
                              label: 'Detalhes',
                              icon: <PieChart className="w-4 h-4" />,
                              onClick: () => openDetailsModal(inv),
                            },
                            {
                              label: 'Novo Aporte',
                              icon: <ArrowUpRight className="w-4 h-4 text-emerald-600" />,
                              onClick: () => openTransactionModal(inv, 'aporte'),
                            },
                            {
                              label: 'Resgatar',
                              icon: <ArrowDownRight className="w-4 h-4 text-red-600" />,
                              onClick: () => openTransactionModal(inv, 'resgate'),
                            },
                            {
                              label: 'Dividendos',
                              icon: <CircleDollarSign className="w-4 h-4 text-blue-600" />,
                              onClick: () => openTransactionModal(inv, 'dividendo'),
                            },
                            {
                              label: 'Editar',
                              icon: <Edit2 className="w-4 h-4" />,
                              onClick: () => openEditModal(inv),
                            },
                            {
                              label: 'Excluir',
                              icon: <Trash2 className="w-4 h-4" />,
                              danger: true,
                              onClick: () => handleDelete(inv.id),
                            },
                          ]}
                        />
                      </tr>
                    );
                  })}
                  {investments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nenhum investimento cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative my-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">{editingInvestmentId ? 'Editar Investimento' : 'Novo Investimento'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Ativo</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: Ações BAI"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Investimento</label>
                        <select
                          required
                          value={type}
                          onChange={(e) => setType(e.target.value as InvestmentType)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="Ações">Ações</option>
                          <option value="Fundos">Fundos</option>
                          <option value="Obrigações">Obrigações (Títulos do Tesouro)</option>
                          <option value="Depósito a prazo">Depósito a prazo</option>
                          <option value="Criptomoeda">Criptomoeda</option>
                          <option value="Negócio próprio">Negócio próprio</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>

                      {type === 'Obrigações' && (
                        <div className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parâmetros de Título Público (OT/BT)</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Taxa de Cupão Anual (%)</label>
                              <input
                                type="number"
                                step="any"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                placeholder="Ex: 15"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Frequência do Juro</label>
                              <select
                                value={paymentFrequency}
                                onChange={(e) => setPaymentFrequency(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors text-gray-900"
                              >
                                <option value="semestral">Semestral</option>
                                <option value="anual">Anual</option>
                                <option value="mensal">Mensal</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Data de Vencimento (Maturidade)</label>
                            <input
                              type="date"
                              value={maturityDate}
                              onChange={(e) => setMaturityDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors text-gray-900"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Investido</label>
                          <input
                            type="number"
                            required
                            value={investedAmount}
                            onChange={(e) => setInvestedAmount(e.target.value)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valor Atual (Opcional)</label>
                        <input
                          type="number"
                          value={currentValue}
                          onChange={(e) => setCurrentValue(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Deixe em branco se igual ao investido"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data da Compra</label>
                        <input
                          type="date"
                          required
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                          <input
                            type="number"
                            step="any"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                            placeholder="Ex: 100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Preço Unitário</label>
                          <input
                            type="number"
                            step="any"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Taxas/Custos</label>
                        <input
                          type="number"
                          value={fees}
                          onChange={(e) => setFees(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Corretora / Instituição</label>
                        <input
                          type="text"
                          value={broker}
                          onChange={(e) => setBroker(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: BODIVA, Binance"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Risco</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Baixo', 'Médio', 'Alto'] as InvestmentRisk[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRisk(r)}
                              className={cn(
                                "py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize border",
                                risk === r
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Conta Vinculada</label>
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Financeira</label>
                        <select
                          value={goalId}
                          onChange={(e) => setGoalId(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="">Nenhuma meta vinculada</option>
                          {goals.filter(g => g.status !== 'completed').map((goal) => (
                            <option key={goal.id} value={goal.id}>{goal.name}</option>
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
                      {editingInvestmentId ? 'Salvar Alterações' : 'Adicionar Investimento'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {isDetailsModalOpen && selectedInvestment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-600 shadow-sm">
                    {getInvestmentIcon(selectedInvestment.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{selectedInvestment.name}</h2>
                    <p className="text-gray-500 text-sm">{selectedInvestment.type}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-xs text-gray-500 font-medium mb-1">Investido</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedInvestment.currency, maximumFractionDigits: 0 }).format(selectedInvestment.investedAmount)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-xs text-gray-500 font-medium mb-1">Valor Atual</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedInvestment.currency, maximumFractionDigits: 0 }).format(selectedInvestment.currentValue)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Rentabilidade</span>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1",
                        calculateROI(selectedInvestment.investedAmount, selectedInvestment.currentValue) >= 0
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {calculateROI(selectedInvestment.investedAmount, selectedInvestment.currentValue) >= 0
                          ? <ArrowUpRight className="w-3 h-3" />
                          : <ArrowDownRight className="w-3 h-3" />
                        }
                        {Math.abs(calculateROI(selectedInvestment.investedAmount, selectedInvestment.currentValue)).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Lucro/Prejuízo</span>
                      <span className={cn(
                        "font-medium",
                        (selectedInvestment.currentValue - selectedInvestment.investedAmount) >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedInvestment.currency, maximumFractionDigits: 0 }).format(selectedInvestment.currentValue - selectedInvestment.investedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Risco</span>
                      <span className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium",
                        selectedInvestment.risk === 'Baixo' ? "bg-blue-50 text-blue-600" :
                          selectedInvestment.risk === 'Médio' ? "bg-yellow-50 text-yellow-600" :
                            "bg-red-50 text-red-600"
                      )}>
                        {selectedInvestment.risk}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Corretora/Instituição</span>
                      <span className="text-gray-900 font-medium">{selectedInvestment.broker || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Data da Compra</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(selectedInvestment.purchaseDate).toLocaleDateString('pt-AO')}
                      </span>
                    </div>
                    {selectedInvestment.quantity && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500 text-sm">Quantidade</span>
                        <span className="text-gray-900 font-medium">{selectedInvestment.quantity}</span>
                      </div>
                    )}
                    {selectedInvestment.unitPrice && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500 text-sm">Preço Unitário</span>
                        <span className="text-gray-900 font-medium">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedInvestment.currency }).format(selectedInvestment.unitPrice)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-500 text-sm">Taxas/Custos</span>
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedInvestment.currency }).format(selectedInvestment.fees)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Transaction Modal */}
          {isTransactionModalOpen && selectedInvestment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative">
                <button
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
                  {transactionType === 'aporte' ? 'Novo Aporte' : transactionType === 'resgate' ? 'Resgate' : 'Dividendos'}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {selectedInvestment.name}
                </p>

                <form onSubmit={handleTransactionSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium">{selectedInvestment.currency}</span>
                      </div>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        className="w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900 font-medium"
                        placeholder="0.00"
                      />
                    </div>
                    {transactionType === 'resgate' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Valor atual disponível: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedInvestment.currency }).format(selectedInvestment.currentValue)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                    <input
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                    <select
                      required
                      value={transactionAccountId}
                      onChange={(e) => setTransactionAccountId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                    >
                      <option value="">Selecione uma conta</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      {transactionType === 'aporte'
                        ? 'O valor será debitado desta conta.'
                        : 'O valor será creditado nesta conta.'}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsTransactionModalOpen(false)}
                      className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={cn(
                        "flex-1 px-4 py-3.5 text-white rounded-xl font-medium transition-colors",
                        transactionType === 'aporte' ? "bg-black hover:bg-gray-800" :
                          transactionType === 'resgate' ? "bg-red-600 hover:bg-red-700" :
                            "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      Confirmar
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
