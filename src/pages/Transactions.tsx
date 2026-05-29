import React, { useState, useMemo, useEffect } from 'react';
import { useFinance, TransactionType, TransactionStatus } from '@/context/FinanceContext';
import { CURRENCIES } from '@/lib/utils';
import { Plus, Filter, Download, X, Search, ArrowUpRight, ArrowDownRight, MoreHorizontal, ArrowRightLeft, Settings2, Calendar, CheckCircle2, Clock, AlertCircle, XCircle, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import { ActionMenu } from '@/components/ActionMenu';
import TransactionModal from '@/components/TransactionModal';

export default function Transactions() {
  const {
    transactions, addTransaction, updateTransaction, deleteTransaction,
    accounts, categories, loading, getRate, formatCurrency, formatDate, preferences,
    addLoan
  } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | 'Express' | 'Cash' | 'Transferência'>('all');
  
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitAmount, setSplitAmount] = useState('');
  const [splitDescription, setSplitDescription] = useState('');
  const [splitAccountId, setSplitAccountId] = useState('');
  const [splitCategory, setSplitCategory] = useState('Alimentação');
  const [splitFriendName, setSplitFriendName] = useState('');
  const [splitFriends, setSplitFriends] = useState<string[]>([]);

  useEffect(() => {
    if (accounts.length > 0 && !splitAccountId) {
      setSplitAccountId(accounts[0].id);
    }
  }, [accounts, splitAccountId]);

  const handleAddFriend = () => {
    if (splitFriendName.trim() && !splitFriends.includes(splitFriendName.trim())) {
      setSplitFriends([...splitFriends, splitFriendName.trim()]);
      setSplitFriendName('');
    }
  };

  const handleRemoveFriend = (name: string) => {
    setSplitFriends(splitFriends.filter(f => f !== name));
  };

  const handleSplitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(splitAmount);
    if (!total || total <= 0) return;
    if (splitFriends.length === 0) {
      alert('Adicione pelo menos um participante para dividir a conta.');
      return;
    }

    const divisor = splitFriends.length + 1;
    const share = total / divisor;

    // 1. Criar transação de Despesa total na conta de origem
    await addTransaction({
      description: `Split: ${splitDescription || 'Despesa Dividida'} (Total)`,
      amount: total,
      type: 'expense',
      category: splitCategory,
      currency: 'AOA',
      account_id: splitAccountId || (accounts[0]?.id || ''),
      date: new Date().toISOString(),
      status: 'paid',
      payment_method: 'Express'
    });

    // 2. Criar empréstimos a receber (granted) para cada amigo
    for (const friend of splitFriends) {
      await addLoan({
        type: 'granted',
        counterparty: friend,
        category: 'personal',
        principal_amount: share,
        current_balance: share,
        currency: 'AOA',
        start_date: new Date().toISOString(),
        status: 'active',
        description: `Split: ${splitDescription || 'Despesa Dividida'}`,
        account_id: splitAccountId || (accounts[0]?.id || '')
      });
    }

    // Reset and close
    setSplitAmount('');
    setSplitDescription('');
    setSplitFriends([]);
    setIsSplitModalOpen(false);
    alert(`Conta dividida com sucesso! Foi registada uma despesa de ${formatCurrency(total)} e criados ${splitFriends.length} empréstimos de ${formatCurrency(share)} cada.`);
  };

  const openEditModal = (t: any) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Status', 'Valor', 'Moeda'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        const accountName = accounts.find(a => a.id === t.accountId)?.name || '';
        const destAccountName = t.destinationAccountId ? accounts.find(a => a.id === t.destinationAccountId)?.name || '' : '';
        const accountStr = t.type === 'transfer' ? `${accountName} -> ${destAccountName}` : accountName;
        return [
          new Date(t.date).toLocaleDateString('pt-AO'),
          t.type,
          `"${t.description}"`,
          `"${t.category}"`,
          `"${accountStr}"`,
          t.status,
          t.amount,
          t.currency
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        const matchesSearch = desc.includes(search) || cat.includes(search);

        // Use clean types from context
        const normalizedType = t.type;
        const matchesType = filterType === 'all' || normalizedType === filterType;

        const matchesPaymentMethod = filterPaymentMethod === 'all' || (t.paymentMethod || 'Express') === filterPaymentMethod;

        return matchesSearch && matchesType && matchesPaymentMethod;
      });
  }, [transactions, searchTerm, filterType, filterPaymentMethod]);

  const stats = useMemo(() => {
    // Show stats for the FILTERED list of transactions 
    // so the numbers reflect the user's current view.
    const { income, expense } = filteredTransactions.reduce((acc, t) => {
      if (t.status === 'paid') {
        const rate = getRate(t.currency);
        const amountInBase = t.amount * rate;
        if (t.type === 'income') acc.income += amountInBase;
        else if (t.type === 'expense') acc.expense += amountInBase;
      }
      return acc;
    }, { income: 0, expense: 0 });
    return { income, expense, net: income - expense };
  }, [filteredTransactions, getRate]);

  const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)]";

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      case 'cancelled': return 'Cancelado';
      case 'scheduled': return 'Agendado';
    }
  };

  return (
    <PageTransition className="space-y-6">
      {loading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Transações</h1>
              <p className="text-gray-500 mt-1">Gerencie todas as suas entradas, saídas e transferências.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button
                onClick={() => setIsSplitModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium flex items-center hover:bg-indigo-700 transition-colors shadow-sm text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dividir Conta
              </button>
              <button
                onClick={openNewModal}
                className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </button>
            </div>
          </div>

          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cn(cardClass, "p-6")}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Entradas (Período)</p>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 blur-amount">
                {formatCurrency(stats.income)}
              </h3>
            </div>
            <div className={cn(cardClass, "p-6")}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Saídas (Período)</p>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 blur-amount">
                {formatCurrency(stats.expense)}
              </h3>
            </div>
            <div className={cn(cardClass, "p-6")}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Saldo Líquido</p>
              </div>
              <h3 className={cn("text-2xl font-semibold blur-amount", stats.net >= 0 ? "text-emerald-600" : "text-red-600")}>
                {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
              </h3>
            </div>
          </div>

          <div className={cn(cardClass, "overflow-hidden flex flex-col")}>
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/30">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="flex bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto">
                  {(['all', 'income', 'expense', 'transfer'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterType(f === 'all' ? 'all' : f as TransactionType)}
                      className={cn(
                        "flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                        filterType === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : f === 'expense' ? 'Despesas' : 'Transf.'}
                    </button>
                  ))}
                </div>

                <select
                  value={filterPaymentMethod}
                  onChange={(e: any) => setFilterPaymentMethod(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="all">Todas as Formas</option>
                  <option value="Express">Multicaixa Express</option>
                  <option value="Cash">Dinheiro Físico (Cash)</option>
                  <option value="Transferência">Transferência Bancária</option>
                </select>

                <button
                  onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterPaymentMethod('all'); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  title="Limpar Filtros"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-400 font-medium border-b border-gray-100/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Transação</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium">Conta</th>
                    <th className="px-6 py-4 font-medium">Forma</th>
                    <th className="px-6 py-4 font-medium">Data</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                    <th className="px-6 py-4 font-medium text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer bg-white">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                              t.type === 'income' ? "bg-emerald-50 text-emerald-600" :
                                t.type === 'expense' ? "bg-red-50 text-red-600" :
                                  t.type === 'transfer' ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                            )}>
                              {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> :
                                t.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> :
                                  t.type === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{t.description}</p>
                              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                                {t.type === 'transfer' ? 'Transferência' : t.type === 'adjustment' ? 'Ajuste' : t.type === 'income' ? 'Receita' : 'Despesa'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 group-hover:bg-white border border-transparent group-hover:border-gray-200 transition-colors">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {t.type === 'transfer' ? (
                            <div className="flex items-center gap-1">
                              <span>{accounts.find(a => a.id === t.accountId)?.name}</span>
                              <ArrowRightLeft className="w-3 h-3 text-gray-400 mx-1" />
                              <span>{accounts.find(a => a.id === t.destinationAccountId)?.name}</span>
                            </div>
                          ) : (
                            accounts.find(a => a.id === t.accountId)?.name || 'Conta desconhecida'
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            t.paymentMethod === 'Express' ? "bg-blue-50 text-blue-700 border-blue-100" :
                            t.paymentMethod === 'Cash' ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-purple-50 text-purple-700 border-purple-100"
                          )}>
                            {t.paymentMethod || 'Express'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(t.status)}
                            <span className="text-gray-600 font-medium">{getStatusLabel(t.status)}</span>
                          </div>
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-right font-semibold blur-amount",
                          t.type === 'income' ? "text-emerald-600" :
                            t.type === 'expense' ? "text-gray-900" :
                              t.type === 'adjustment' ? (t.amount >= 0 ? "text-emerald-600" : "text-red-600") : "text-blue-600"
                        )}>
                          {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.type === 'adjustment' ? (t.amount >= 0 ? '+' : '') : ''}
                          {formatCurrency(t.amount, t.currency)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ActionMenu
                              triggerIcon={<MoreHorizontal className="w-5 h-5" />}
                              items={[
                                {
                                  label: 'Editar',
                                  icon: <Edit2 className="w-4 h-4" />,
                                  onClick: () => openEditModal(t),
                                },
                                {
                                  label: 'Excluir',
                                  icon: <Trash2 className="w-4 h-4" />,
                                  danger: true,
                                  onClick: () => deleteTransaction(t.id),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="font-medium text-gray-900 mb-1">Nenhuma transação encontrada</p>
                          <p className="text-sm">Tente ajustar os filtros ou a sua busca.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Transaction Modal */}
          {/* Transaction Modal */}
          <TransactionModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingTransaction(null);
            }}
            editingTransaction={editingTransaction}
          />

          {/* Split Bill Modal */}
          {isSplitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setIsSplitModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-950 mb-2">Dividir Conta</h2>
                <p className="text-gray-500 text-xs mb-6">
                  Insira o valor pago, selecione a conta e adicione os contatos participantes para gerar os empréstimos correspondentes.
                </p>

                <form onSubmit={handleSplitSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Valor Total da Conta</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-bold">Kz</span>
                      </div>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={splitAmount}
                        onChange={(e) => setSplitAmount(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-gray-950 text-sm font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descrição</label>
                    <input
                      type="text"
                      required
                      value={splitDescription}
                      onChange={(e) => setSplitDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-gray-950 text-sm"
                      placeholder="Ex: Jantar no Restaurante"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Conta de Origem</label>
                      <select
                        value={splitAccountId}
                        onChange={(e) => setSplitAccountId(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-gray-950 text-sm"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Categoria</label>
                      <select
                        value={splitCategory}
                        onChange={(e) => setSplitCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-gray-950 text-sm"
                      >
                        {categories.expense.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Add Friends Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Participantes (Amigos)</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={splitFriendName}
                        onChange={(e) => setSplitFriendName(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-gray-950 text-sm"
                        placeholder="Nome do Amigo"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFriend(); } }}
                      />
                      <button
                        type="button"
                        onClick={handleAddFriend}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Adicionar
                      </button>
                    </div>

                    {/* Friend list display */}
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {splitFriends.map(f => (
                        <div key={f} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                          <span>{f}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFriend(f)} 
                            className="p-0.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {splitFriends.length === 0 && (
                        <p className="text-[10px] text-gray-400 italic">Nenhum participante adicionado (a conta será dividida com você).</p>
                      )}
                    </div>
                  </div>

                  {/* Split Calculation Summary */}
                  {splitAmount && splitFriends.length > 0 && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1.5">
                      <p className="text-xs text-indigo-900 font-semibold">Divisão Estimada (AOA):</p>
                      <div className="flex justify-between text-[11px] text-indigo-700">
                        <span>Você ({1} parte):</span>
                        <span className="font-bold">{formatCurrency(Number(splitAmount) / (splitFriends.length + 1))}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-indigo-750 font-medium">
                        <span>Outros ({splitFriends.length} partes de):</span>
                        <span className="font-bold">{formatCurrency(Number(splitAmount) / (splitFriends.length + 1))} cada</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 mt-4"
                  >
                    Confirmar Divisão
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
