import React, { useState, useMemo } from 'react';
import { useFinance, Loan, LoanType, LoanCategory, InterestType, PaymentFrequency } from '@/context/FinanceContext';
import { CURRENCIES } from '@/lib/utils';
import { Plus, MoreVertical, X, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Calendar, User, Building2, AlertCircle, CheckCircle2, Clock, Banknote } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { ActionMenu } from '@/components/ActionMenu';

export default function Loans() {
  const { loans, addLoan, updateLoan, deleteLoan, addLoanPayment, accounts, loading, getRate, transactions } = useFinance();
  const [activeTab, setActiveTab] = useState<'received' | 'granted' | 'simulador'>('received');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Form State (must be BEFORE any early return - Rules of Hooks)
  const [type, setType] = useState<LoanType>('received');
  const [counterparty, setCounterparty] = useState('');
  const [institution, setInstitution] = useState('');
  const [category, setCategory] = useState<LoanCategory>('personal');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [currency, setCurrency] = useState('AOA');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('simple');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Simulator States
  const [simPrincipal, setSimPrincipal] = useState('');
  const [simInterestRate, setSimInterestRate] = useState('');
  const [simTerm, setSimTerm] = useState('');

  const simulatorResult = useMemo(() => {
    const principal = Number(simPrincipal) || 0;
    const annualRate = Number(simInterestRate) || 0;
    const term = Number(simTerm) || 0;

    if (principal <= 0 || annualRate <= 0 || term <= 0) {
      return { pmt: 0, totalInterest: 0, totalPayable: 0, weight: 0, avgIncome: 0 };
    }

    const r = (annualRate / 100) / 12; // taxa mensal
    const n = term;

    // PMT formula
    const pmt = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = pmt * n;
    const totalInterest = totalPayable - principal;

    const incomeTx = transactions.filter(t => t.type === 'income');
    let avgIncome = 0;
    if (incomeTx.length > 0) {
      const months = new Set(incomeTx.map(t => t.date.substring(0, 7)));
      const totalIncome = incomeTx.reduce((sum, t) => sum + (t.amount * getRate(t.currency)), 0);
      avgIncome = months.size > 0 ? totalIncome / months.size : totalIncome;
    }

    const weight = avgIncome > 0 ? (pmt / avgIncome) * 100 : 0;

    return { pmt, totalInterest, totalPayable, weight, avgIncome };
  }, [simPrincipal, simInterestRate, simTerm, transactions, getRate]);



  const openDetailsModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDetailsModalOpen(true);
    setOpenActionId(null);
  };

  const openNewModal = () => {
    setEditingLoanId(null);
    setType(activeTab === 'simulador' ? 'received' : activeTab);
    setCounterparty('');
    setInstitution('');
    setCategory('personal');
    setPrincipalAmount('');
    setCurrency('AOA');
    setInterestRate('');
    setInterestType('simple');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setFrequency('monthly');
    setDescription('');
    setAccountId('');
    setIsModalOpen(true);
  };

  const openEditModal = (loan: Loan) => {
    setEditingLoanId(loan.id);
    setType(loan.type);
    setCounterparty(loan.counterparty);
    setInstitution(loan.institution || '');
    setCategory(loan.category);
    setPrincipalAmount(loan.principalAmount.toString());
    setCurrency(loan.currency);
    setInterestRate(loan.interestRate.toString());
    setInterestType(loan.interestType);
    setStartDate(loan.startDate.split('T')[0]);
    setDueDate(loan.dueDate ? loan.dueDate.split('T')[0] : '');
    setFrequency(loan.frequency);
    setDescription(loan.description || '');
    setAccountId(loan.accountId || '');
    setIsModalOpen(true);
    setOpenActionId(null);
  };

  const openPaymentModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentAccountId(loan.accountId || '');
    setPaymentNote('');
    setIsPaymentModalOpen(true);
    setOpenActionId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loanData = {
      type,
      counterparty,
      institution: institution || undefined,
      category,
      principal_amount: Number(principalAmount),
      current_balance: editingLoanId ? (loans.find(l => l.id === editingLoanId)?.currentBalance || Number(principalAmount)) : Number(principalAmount),
      currency: currency as keyof typeof CURRENCIES,
      interest_rate: Number(interestRate),
      interest_type: interestType,
      start_date: new Date(startDate).toISOString(),
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      frequency,
      description: description || undefined,
      account_id: accountId || undefined,
      status: 'active' as const,
    };

    if (editingLoanId) {
      await updateLoan(editingLoanId, loanData);
    } else {
      await addLoan(loanData);
    }
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !paymentAccountId) return;

    addLoanPayment(
      selectedLoan.id,
      Number(paymentAmount),
      new Date(paymentDate).toISOString(),
      paymentAccountId,
      paymentNote
    );
    setIsPaymentModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este empréstimo?')) {
      deleteLoan(id);
    }
    setOpenActionId(null);
  };

  const stats = useMemo(() => {
    const activeLoans = loans.filter(l => l.type === activeTab && l.status !== 'cancelled');
    const totalPrincipal = activeLoans.reduce((acc, l) => {
      const rate = getRate(l.currency);
      return acc + (l.principalAmount * rate);
    }, 0);
    const totalBalance = activeLoans.reduce((acc, l) => {
      const rate = getRate(l.currency);
      return acc + (l.currentBalance * rate);
    }, 0);
    const paidAmount = totalPrincipal - totalBalance;
    const progress = totalPrincipal > 0 ? (paidAmount / totalPrincipal) * 100 : 0;

    const upcoming = activeLoans
      .filter(l => l.dueDate && new Date(l.dueDate) > new Date() && new Date(l.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 3);

    return { totalPrincipal, totalBalance, paidAmount, progress, count: activeLoans.length, upcoming };
  }, [loans, activeTab]);

  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      if (l.type !== activeTab) return false;
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      return true;
    });
  }, [loans, activeTab, filterStatus]);

  return (
    <PageTransition className="space-y-6">
      {loading ? (
        <div key="loading-loans" className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Empréstimos</h1>
              <p className="text-gray-500 mt-1">Gerencie seus empréstimos e dívidas.</p>
            </div>
            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Empréstimo
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('received')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'received' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Recebidos (Passivos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('granted')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'granted' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Concedidos (Ativos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulador')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'simulador' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Simulador de Financiamento
            </button>
          </div>

          {activeTab !== 'simulador' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 font-medium mb-1">Total {activeTab === 'received' ? 'a Pagar' : 'a Receber'}</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(stats.totalBalance)}
              </h3>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: `${stats.progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">{stats.progress.toFixed(1)}% pago</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 font-medium mb-1">Valor Original</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(stats.totalPrincipal)}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{stats.count} empréstimos ativos</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 font-medium mb-1">Já {activeTab === 'received' ? 'Pago' : 'Recebido'}</p>
              <h3 className="text-2xl font-bold text-emerald-600">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(stats.paidAmount)}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Próximos Vencimentos
              </p>
              <div className="space-y-3">
                {stats.upcoming.length > 0 ? (
                  stats.upcoming.map(loan => (
                    <div key={loan.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate max-w-[100px]">{loan.counterparty}</span>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: loan.currency }).format(loan.currentBalance)}
                        </p>
                        <p className="text-xs text-red-500">
                          {new Date(loan.dueDate!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Nenhum vencimento próximo</p>
                )}
              </div>
            </div>
          </div>

          {/* Loan List */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="paid">Pagos</option>
              <option value="overdue">Atrasados</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Identificação</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium text-right">Valor Original</th>
                    <th className="px-6 py-4 font-medium text-right">Saldo Restante</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                            {activeTab === 'received' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{loan.counterparty}</p>
                            <p className="text-xs text-gray-500">{loan.institution || 'Particular'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600 capitalize">
                          {loan.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-500">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: loan.currency }).format(loan.principalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: loan.currency }).format(loan.currentBalance)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-xs font-medium capitalize",
                          loan.status === 'active' ? "bg-blue-50 text-blue-600" :
                            loan.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                              loan.status === 'overdue' ? "bg-red-50 text-red-600" :
                                "bg-gray-100 text-gray-600"
                        )}>
                          {loan.status === 'active' ? 'Ativo' :
                            loan.status === 'paid' ? 'Pago' :
                              loan.status === 'overdue' ? 'Atrasado' : loan.status}
                        </span>
                      </td>
                      <ActionMenu
                        triggerIcon={<MoreVertical className="w-5 h-5" />}
                        items={[
                          ...(loan.status !== 'paid' ? [{
                            label: 'Registrar Pagamento',
                            icon: <Banknote className="w-4 h-4 text-emerald-600" />,
                            onClick: () => openPaymentModal(loan),
                          }] : []),
                          {
                            label: 'Ver Detalhes',
                            icon: <Calendar className="w-4 h-4" />,
                            onClick: () => openDetailsModal(loan),
                          },
                          {
                            label: 'Editar',
                            icon: <Edit2 className="w-4 h-4" />,
                            onClick: () => openEditModal(loan),
                          },
                          {
                            label: 'Excluir',
                            icon: <Trash2 className="w-4 h-4" />,
                            danger: true,
                            onClick: () => handleDelete(loan.id),
                          },
                        ]}
                      />
                    </tr>
                  ))}
                  {filteredLoans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhum empréstimo {activeTab === 'received' ? 'recebido' : 'concedido'} encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Form Input */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Simulador de Crédito</h2>
              <p className="text-sm text-gray-500">Simule taxas locais de Angola (ex: Crédito Habitação, Automóvel ou Pessoal).</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Montante do Crédito (Kz)</label>
                <input
                  type="number"
                  value={simPrincipal}
                  onChange={(e) => setSimPrincipal(e.target.value)}
                  placeholder="Ex: 5000000"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all text-gray-900 text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Taxa de Juro Anual (%)</label>
                <input
                  type="number"
                  step="any"
                  value={simInterestRate}
                  onChange={(e) => setSimInterestRate(e.target.value)}
                  placeholder="Ex: 18"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all text-gray-900 text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prazo de Amortização (Meses)</label>
                <input
                  type="number"
                  value={simTerm}
                  onChange={(e) => setSimTerm(e.target.value)}
                  placeholder="Ex: 60"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all text-gray-900 text-lg font-medium"
                />
              </div>
            </div>
          </div>

          {/* Simulation Result */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resultado da Simulação</h2>
                <p className="text-sm text-gray-500">Estimativas com base no sistema de amortização francês (Price/PMT).</p>
              </div>

              {simulatorResult.pmt > 0 ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Prestação Mensal Estimada</p>
                    <p className="text-3xl font-extrabold text-gray-900">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(simulatorResult.pmt)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Total de Juros</p>
                      <p className="text-lg font-bold text-gray-800">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(simulatorResult.totalInterest)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Total a Pagar</p>
                      <p className="text-lg font-bold text-gray-800">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(simulatorResult.totalPayable)}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Peso na Renda Mensal</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold",
                        simulatorResult.weight <= 30 ? "bg-emerald-100 text-emerald-800" :
                          simulatorResult.weight <= 50 ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                      )}>
                        {simulatorResult.weight.toFixed(1)}% Taxa de Esforço
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full rounded-full transition-all duration-500",
                        simulatorResult.weight <= 30 ? "bg-emerald-500" :
                          simulatorResult.weight <= 50 ? "bg-amber-500" :
                            "bg-red-500"
                      )} style={{ width: `${Math.min(simulatorResult.weight, 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                      Sua renda mensal média estimada pelo app é de <strong className="text-gray-900">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(simulatorResult.avgIncome)}</strong>.
                      {simulatorResult.weight <= 30
                        ? " Saudável. A prestação consome menos de 30% do seu rendimento."
                        : simulatorResult.weight <= 50
                          ? " Atenção. A taxa de esforço está elevada, o que pode comprometer outros gastos essenciais."
                          : " Risco Elevado! A prestação consome mais de 50% dos seus rendimentos, inviabilizando a contratação."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50">
                  <Banknote className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700">Preencha os campos ao lado</p>
                  <p className="text-xs text-gray-500 mt-1">Calcule instantaneamente a prestação e a taxa de esforço ideal do seu orçamento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

          {/* Details Modal */}
          {isDetailsModalOpen && selectedLoan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium capitalize mb-2 inline-block",
                    selectedLoan.status === 'active' ? "bg-blue-50 text-blue-600" :
                      selectedLoan.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                        selectedLoan.status === 'overdue' ? "bg-red-50 text-red-600" :
                          "bg-gray-100 text-gray-600"
                  )}>
                    {selectedLoan.status === 'active' ? 'Ativo' :
                      selectedLoan.status === 'paid' ? 'Pago' :
                        selectedLoan.status === 'overdue' ? 'Atrasado' : selectedLoan.status}
                  </span>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{selectedLoan.counterparty}</h2>
                  <p className="text-gray-500">{selectedLoan.institution || 'Particular'} • {selectedLoan.category}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Valor Original</p>
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedLoan.currency }).format(selectedLoan.principalAmount)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Saldo Restante</p>
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedLoan.currency }).format(selectedLoan.currentBalance)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Juros</p>
                    <p className="font-semibold text-gray-900">
                      {selectedLoan.interestRate}% ({selectedLoan.interestType === 'simple' ? 'Simples' : 'Compostos'})
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Vencimento</p>
                    <p className="font-semibold text-gray-900">
                      {selectedLoan.dueDate ? new Date(selectedLoan.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedLoan.description && (
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Observações</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">{selectedLoan.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center justify-between">
                    Histórico de Pagamentos
                    <span className="text-xs font-normal text-gray-500">{selectedLoan.payments.length} registros</span>
                  </h3>

                  <div className="space-y-3">
                    {selectedLoan.payments.length > 0 ? (
                      selectedLoan.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Pagamento</p>
                              <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedLoan.currency }).format(payment.amount)}
                            </p>
                            {payment.note && <p className="text-xs text-gray-400">{payment.note}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Nenhum pagamento registrado ainda.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">
                  {editingLoanId ? 'Editar Empréstimo' : 'Novo Empréstimo'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setType('received')}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                              type === 'received' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            Recebido (Passivo)
                          </button>
                          <button
                            type="button"
                            onClick={() => setType('granted')}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                              type === 'granted' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            Concedido (Ativo)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {type === 'received' ? 'Credor (Quem emprestou)' : 'Devedor (Quem recebeu)'}
                        </label>
                        <input
                          type="text"
                          required
                          value={counterparty}
                          onChange={(e) => setCounterparty(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Nome da pessoa ou empresa"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instituição (Opcional)</label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          placeholder="Ex: Banco BAI"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as LoanCategory)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="personal">Pessoal</option>
                          <option value="family">Familiar</option>
                          <option value="professional">Profissional</option>
                          <option value="business">Empresa</option>
                        </select>
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
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Principal</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={principalAmount}
                            onChange={(e) => setPrincipalAmount(e.target.value)}
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Juros (%)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                            placeholder="0%"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Juros</label>
                          <select
                            value={interestType}
                            onChange={(e) => setInterestType(e.target.value as InterestType)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          >
                            <option value="simple">Simples</option>
                            <option value="compound">Compostos</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                          <input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Vencimento</label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Frequência de Pagamento</label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                        >
                          <option value="one_time">Único</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900 min-h-[100px]"
                      placeholder="Detalhes adicionais sobre o empréstimo..."
                    />
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
                      {editingLoanId ? 'Salvar Alterações' : 'Criar Empréstimo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Payment Modal */}
          {isPaymentModalOpen && selectedLoan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">Registrar Pagamento</h2>
                <p className="text-gray-500 text-sm mb-6">
                  {selectedLoan.type === 'received' ? 'Pagamento para' : 'Recebimento de'} {selectedLoan.counterparty}
                </p>

                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium">{selectedLoan.currency}</span>
                      </div>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        max={selectedLoan.currentBalance}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900 font-medium"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Saldo restante: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedLoan.currency }).format(selectedLoan.currentBalance)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                    <select
                      required
                      value={paymentAccountId}
                      onChange={(e) => setPaymentAccountId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                    >
                      <option value="">Selecione uma conta</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nota (Opcional)</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-gray-900"
                      placeholder="Ex: Parcela 1/12"
                    />
                  </div>

                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
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
