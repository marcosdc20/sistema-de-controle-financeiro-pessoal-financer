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
    accounts, categories, loading, getRate, formatCurrency, formatDate, preferences
  } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

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

        return matchesSearch && matchesType;
      });
  }, [transactions, searchTerm, filterType]);

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
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button
                onClick={openNewModal}
                className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
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
              <h3 className="text-2xl font-semibold text-gray-900">
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
              <h3 className="text-2xl font-semibold text-gray-900">
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
              <h3 className={cn("text-2xl font-semibold", stats.net >= 0 ? "text-emerald-600" : "text-red-600")}>
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
                <button
                  onClick={() => { setSearchTerm(''); setFilterType('all'); }}
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
                          {formatDate(t.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(t.status)}
                            <span className="text-gray-600 font-medium">{getStatusLabel(t.status)}</span>
                          </div>
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-right font-semibold",
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
        </>
      )}
    </PageTransition>
  );
}
