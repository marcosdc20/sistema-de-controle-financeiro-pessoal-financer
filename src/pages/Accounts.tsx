import React, { useState, useMemo } from 'react';
import { useFinance, Account, AccountCategory, AccountStatus } from '@/context/FinanceContext';
import { CURRENCIES, cn } from '@/lib/utils';
import { Plus, CreditCard, Wallet, Smartphone, Building2, MoreVertical, TrendingUp, TrendingDown, PieChart, Activity, X, CheckCircle2, AlertCircle, Archive, Lock, Edit2, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Settings2, Download } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { ActionMenu } from '@/components/ActionMenu';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Accounts() {
  const {
    accounts, addAccount, updateAccount, deleteAccount,
    transactions, totalBalanceInBaseCurrency, loading,
    getRate, formatCurrency, formatDate, preferences,
    addTransaction
  } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<Account | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedAccountForAdjustment, setSelectedAccountForAdjustment] = useState<Account | null>(null);
  const [newBalanceValue, setNewBalanceValue] = useState('');

  // Form State - must be declared before any conditional returns (React Hooks rules)
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState<AccountCategory>('bank');
  const [currency, setCurrency] = useState('AOA');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('bg-blue-500');
  const [isMain, setIsMain] = useState(false);
  const [hideFromTotal, setHideFromTotal] = useState(false);
  const [institution, setInstitution] = useState('');



  const openEditModal = (account: Account) => {
    setEditingAccountId(account.id);
    setName(account.name);
    setType(account.type);
    setCategory(account.category);
    setCurrency(account.currency);
    setBalance(account.balance.toString());
    setColor(account.color || 'bg-blue-500');
    setIsMain(account.isMain || false);
    setHideFromTotal(account.hideFromTotal || false);
    setInstitution(account.institution || '');
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingAccountId(null);
    setName('');
    setType('');
    setCategory('bank');
    setBalance('');
    setIsMain(false);
    setHideFromTotal(false);
    setInstitution('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccountId) {
      await updateAccount(editingAccountId, {
        name,
        type,
        category,
        currency: currency as keyof typeof CURRENCIES,
        balance: Number(balance),
        color,
        is_main: isMain,
        hide_from_total: hideFromTotal,
        institution
      });
    } else {
      await addAccount({
        name,
        type,
        category,
        currency: currency as keyof typeof CURRENCIES,
        balance: Number(balance),
        status: 'active',
        color,
        is_main: isMain,
        hide_from_total: hideFromTotal,
        created_at: new Date().toISOString(),
        institution
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta? Todas as transações associadas também serão excluídas.')) {
      deleteAccount(id);
    }
  };

  const openAdjustBalanceModal = (account: Account) => {
    setSelectedAccountForAdjustment(account);
    setNewBalanceValue(account.balance.toString());
    setIsAdjustModalOpen(true);
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForAdjustment) return;

    const currentBalance = selectedAccountForAdjustment.balance;
    const targetBalance = Number(newBalanceValue);
    const difference = targetBalance - currentBalance;

    if (difference === 0) {
      setIsAdjustModalOpen(false);
      return;
    }

    await addTransaction({
      description: 'Ajuste manual de saldo',
      amount: difference,
      type: 'adjustment',
      category: 'Ajuste',
      currency: selectedAccountForAdjustment.currency,
      account_id: selectedAccountForAdjustment.id,
      date: new Date().toISOString(),
      status: 'paid'
    });

    setIsAdjustModalOpen(false);
  };

  const handleViewStatement = (account: Account) => {
    setSelectedAccountForStatement(account);
    setIsStatementOpen(true);
  };

  const accountTransactions = useMemo(() => {
    if (!selectedAccountForStatement) return [];
    return transactions
      .filter(t => t.accountId === selectedAccountForStatement.id || t.destinationAccountId === selectedAccountForStatement.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountForStatement]);

  const getIcon = (category: string) => {
    switch (category) {
      case 'bank': return <Building2 className="w-6 h-6 text-white" />;
      case 'digital': return <Smartphone className="w-6 h-6 text-white" />;
      case 'physical': return <Wallet className="w-6 h-6 text-white" />;
      case 'investment': return <TrendingUp className="w-6 h-6 text-white" />;
      default: return <CreditCard className="w-6 h-6 text-white" />;
    }
  };

  const getStatusIcon = (status: AccountStatus) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'inactive': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-400" />;
      case 'blocked': return <Lock className="w-4 h-4 text-red-500" />;
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const matchCurrency = filterCurrency === 'all' || a.currency === filterCurrency;
      const matchCategory = filterCategory === 'all' || a.category === filterCategory;
      return matchCurrency && matchCategory;
    });
  }, [accounts, filterCurrency, filterCategory]);

  const dashboardStats = useMemo(() => {
    return accounts.reduce((acc, account) => {
      const rate = getRate(account.currency);
      acc.totalBalance += account.balance * rate;
      return acc;
    }, { totalBalance: 0 });
  }, [accounts, getRate]);

  const stats = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    let highest = accounts[0];
    let lowest = accounts[0];

    accounts.forEach(a => {
      if (!a.hideFromTotal) {
        byCurrency[a.currency] = (byCurrency[a.currency] || 0) + a.balance;
      }

      const rateA = getRate(a.currency);
      const rateHighest = highest ? getRate(highest.currency) : 1;
      const rateLowest = lowest ? getRate(lowest.currency) : 1;

      if (!highest || (a.balance * rateA) > (highest.balance * rateHighest)) highest = a;
      if (!lowest || (a.balance * rateA) < (lowest.balance * rateLowest)) lowest = a;
    });

    const distributionData = accounts.filter(a => !a.hideFromTotal).map(a => ({
      name: a.name,
      value: a.balance * getRate(a.currency),
      color: a.color?.replace('bg-', '') || 'blue-500' // Simplified color mapping for chart
    }));

    return { byCurrency, highest, lowest, distributionData };
  }, [accounts, getRate]);

  const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300";
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <PageTransition className="space-y-6">
      {loading ? (
        <div key="loading-state" className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Contas e Carteiras</h1>
              <p className="text-gray-500 mt-1">Visão geral do seu patrimônio e distribuição por contas.</p>
            </div>
            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </button>
          </div>

          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cn(cardClass, "lg:col-span-2 flex flex-col justify-between")}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Saldo Consolidado</h2>
                </div>
                <h3 className="text-4xl font-semibold text-gray-900 tracking-tight">
                  {formatCurrency(totalBalanceInBaseCurrency)}
                </h3>
                <p className="text-sm text-gray-400 mt-2">Convertido para moeda base ({preferences?.base_currency || 'AOA'})</p>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-6">
                {Object.entries(stats.byCurrency).map(([curr, amount]) => (
                  <div key={curr}>
                    <p className="text-xs text-gray-500 font-medium mb-1">{curr}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(amount as number, curr)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(cardClass, "flex flex-col")}>
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Distribuição</h2>
              </div>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cn(cardClass, "flex items-center justify-between bg-emerald-50/50 border-emerald-100/50")}>
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Maior Saldo</p>
                <p className="text-xl font-semibold text-gray-900">{stats.highest?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-emerald-600 blur-amount">
                  {stats.highest && formatCurrency(stats.highest.balance, stats.highest.currency)}
                </p>
              </div>
            </div>
            <div className={cn(cardClass, "flex items-center justify-between bg-red-50/50 border-red-100/50")}>
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Menor Saldo</p>
                <p className="text-xl font-semibold text-gray-900">{stats.lowest?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-red-600 blur-amount">
                  {stats.lowest && formatCurrency(stats.lowest.balance, stats.lowest.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todas as Moedas</option>
              {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todas as Categorias</option>
              <option value="bank">Bancárias</option>
              <option value="digital">Digitais</option>
              <option value="physical">Físicas</option>
              <option value="investment">Investimentos</option>
            </select>
          </div>

          {/* Account List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
              <div key={account.id} className={cardClass}>
                <div className="flex items-start justify-between mb-8 relative">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300", account.color || 'bg-gray-800')}>
                    {getIcon(account.category)}
                  </div>
                  <div className="flex items-center gap-2">
                    {account.isMain && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Principal
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold uppercase border border-gray-100/50">
                      {account.currency}
                    </span>
                    <ActionMenu
                      triggerIcon={<MoreVertical className="w-5 h-5" />}
                      triggerClassName="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      items={[
                        {
                          label: 'Ajustar Saldo',
                          icon: <Settings2 className="w-4 h-4 text-indigo-600" />,
                          onClick: () => openAdjustBalanceModal(account),
                        },
                        {
                          label: 'Editar',
                          icon: <Edit2 className="w-4 h-4" />,
                          onClick: () => openEditModal(account),
                        },
                        {
                          label: 'Excluir',
                          icon: <Trash2 className="w-4 h-4" />,
                          danger: true,
                          onClick: () => handleDelete(account.id),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-gray-500 font-medium">{account.name}</p>
                    {getStatusIcon(account.status)}
                  </div>
                  {account.institution && (
                    <span className="inline-block text-[10px] bg-indigo-50 text-indigo-750 font-bold px-2 py-0.5 rounded-md mb-2">
                      {account.institution}
                    </span>
                  )}
                  <h3 className="text-3xl font-semibold text-gray-900 tracking-tight blur-amount">
                    {formatCurrency(account.balance, account.currency)}
                  </h3>
                </div>

                <div className="mt-8 pt-5 border-t border-gray-100/50 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-400 capitalize">{account.type}</span>
                  <button
                    onClick={() => handleViewStatement(account)}
                    className="text-sm text-gray-900 font-medium hover:underline underline-offset-4"
                  >
                    Ver extrato
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Card Placeholder */}
            <button
              onClick={openNewModal}
              className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-all min-h-[220px] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-100/50">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
              <span className="font-medium">Adicionar nova conta</span>
            </button>
          </div>

          {/* Add/Edit Account Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative my-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">{editingAccountId ? 'Editar Conta' : 'Nova Conta'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Conta</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: Conta Corrente BAI"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['bank', 'digital', 'physical', 'investment'] as AccountCategory[]).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCategory(c)}
                              className={cn(
                                "py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize border",
                                category === c
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              {c === 'bank' ? 'Bancária' : c === 'digital' ? 'Digital' : c === 'physical' ? 'Física' : 'Investimento'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Específico</label>
                        <input
                          type="text"
                          required
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: Poupança, Corrente, Cofre..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instituição / Banco</label>
                        <select
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900 text-sm"
                        >
                          <option value="">Nenhuma / Outra</option>
                          <optgroup label="Bancos de Angola">
                            <option value="BAI">BAI (Banco Angolano de Investimentos)</option>
                            <option value="BFA">BFA (Banco de Fomento Angola)</option>
                            <option value="BIC">BIC (Banco BIC)</option>
                            <option value="SOL">SOL (Banco Sol)</option>
                            <option value="BMA">BMA (Banco Millennium Angola)</option>
                          </optgroup>
                          <optgroup label="Carteiras Digitais / Outros">
                            <option value="Multicaixa Express">Multicaixa Express</option>
                            <option value="Unitel Money">Unitel Money</option>
                            <option value="PayPay">PayPay</option>
                            <option value="Dinheiro Físico">Dinheiro Físico</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Inicial</label>
                          <input
                            type="number"
                            required
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cor da Conta</label>
                        <div className="flex gap-2">
                          {['bg-blue-600', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-800'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setColor(c)}
                              className={cn(
                                "w-8 h-8 rounded-full transition-transform",
                                c,
                                color === c ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-110"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isMain}
                            onChange={(e) => setIsMain(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-sm font-medium text-gray-700">Definir como conta principal</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hideFromTotal}
                            onChange={(e) => setHideFromTotal(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-sm font-medium text-gray-700">Ocultar do saldo consolidado</span>
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
                      {editingAccountId ? 'Salvar Alterações' : 'Criar Conta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Adjust Balance Modal */}
          {isAdjustModalOpen && selectedAccountForAdjustment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-950 mb-2 tracking-tight">Ajustar Saldo</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Insira o saldo atualizado da conta <span className="font-semibold">{selectedAccountForAdjustment.name}</span>. O sistema gerará uma transação de ajuste automaticamente.
                </p>

                <form onSubmit={handleAdjustBalance} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Novo Saldo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium">{selectedAccountForAdjustment.currency}</span>
                      </div>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={newBalanceValue}
                        onChange={(e) => setNewBalanceValue(e.target.value)}
                        className="w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 font-medium"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Saldo atual registrado: {formatCurrency(selectedAccountForAdjustment.balance, selectedAccountForAdjustment.currency)}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAdjustModalOpen(false)}
                      className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Statement Modal */}
          {isStatementOpen && selectedAccountForStatement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-3xl p-8 shadow-2xl relative my-8">
                <button
                  onClick={() => setIsStatementOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-8 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Extrato da Conta</h2>
                    <p className="text-gray-500 mt-1">{selectedAccountForStatement.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      const csvContent = [
                        ['Data', 'Descrição', 'Tipo', 'Valor'].join(','),
                        ...accountTransactions.map(t => {
                          const isOutgoing = t.type === 'expense' || (t.type === 'transfer' && t.accountId === selectedAccountForStatement.id);
                          const isIncoming = t.type === 'income' || (t.type === 'transfer' && t.destinationAccountId === selectedAccountForStatement.id);
                          const amountLabel = `${isIncoming ? '+' : isOutgoing ? '-' : ''}${t.amount}`;
                          return [formatDate(t.date), `"${t.description}"`, t.type, amountLabel].join(',');
                        })
                      ].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `extrato_${selectedAccountForStatement.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
                      link.click();
                    }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100/50 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-100 transition-colors text-sm shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-xl">Data</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 text-right rounded-tr-xl">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {accountTransactions.length > 0 ? (
                        accountTransactions.map((t) => {
                          const isOutgoing = t.type === 'expense' || (t.type === 'transfer' && t.accountId === selectedAccountForStatement.id) || (t.type === 'adjustment' && t.amount < 0);
                          const isIncoming = t.type === 'income' || (t.type === 'transfer' && t.destinationAccountId === selectedAccountForStatement.id) || (t.type === 'adjustment' && t.amount >= 0);

                          return (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 text-gray-500">
                                {formatDate(t.date)}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">{t.description}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isIncoming ? <ArrowDownRight className="w-4 h-4 text-emerald-500" /> :
                                    isOutgoing ? <ArrowUpRight className="w-4 h-4 text-red-500" /> :
                                      <Settings2 className="w-4 h-4 text-gray-400" />}
                                  <span className="text-gray-500 capitalize">{t.type === 'transfer' ? 'Transferência' : t.type === 'adjustment' ? 'Ajuste' : t.type === 'income' ? 'Receita' : 'Despesa'}</span>
                                </div>
                              </td>
                              <td className={cn(
                                "px-4 py-3 text-right font-semibold",
                                isIncoming ? "text-emerald-600" : isOutgoing ? "text-gray-900" : "text-gray-600"
                              )}>
                                {isIncoming ? '+' : isOutgoing ? '-' : ''}
                                {formatCurrency(t.amount, t.currency)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            Nenhuma transação encontrada para esta conta.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
