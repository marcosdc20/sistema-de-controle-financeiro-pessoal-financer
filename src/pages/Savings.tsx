import React, { useState, useMemo, useEffect } from 'react';
import { useFinance, Saving, Kixiquila } from '@/context/FinanceContext';
import { CURRENCIES, cn } from '@/lib/utils';
import { PiggyBank, Plus, MoreVertical, X, Edit2, Trash2, Info, Landmark, Calendar, TrendingUp, Users, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { ActionMenu } from '@/components/ActionMenu';

export default function Savings() {
    const {
        savings, addSaving, updateSaving, deleteSaving,
        kixiquilas, addKixiquila, updateKixiquila, deleteKixiquila,
        loading, getRate, formatCurrency, formatDate
    } = useFinance();

    const [activeTab, setActiveTab] = useState<'savings' | 'kixiquila'>('savings');

    // Savings Form State
    const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);
    const [editingSavingId, setEditingSavingId] = useState<string | null>(null);
    const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
    const [isSavingDetailsOpen, setIsSavingDetailsOpen] = useState(false);
    const [savingName, setSavingName] = useState('');
    const [savingDesc, setSavingDesc] = useState('');
    const [savingAmount, setSavingAmount] = useState('');
    const [savingCurrency, setSavingCurrency] = useState('AOA');
    const [savingInterest, setSavingInterest] = useState('0');
    const [savingTarget, setSavingTarget] = useState('');
    const [savingDate, setSavingDate] = useState(new Date().toISOString().split('T')[0]);

    // Kixiquila Form State
    const [isKixModalOpen, setIsKixModalOpen] = useState(false);
    const [editingKixId, setEditingKixId] = useState<string | null>(null);
    const [selectedKix, setSelectedKix] = useState<Kixiquila | null>(null);
    const [kixName, setKixName] = useState('');
    const [kixContribution, setKixContribution] = useState('');
    const [kixMembersCount, setKixMembersCount] = useState('10');
    const [kixMyTurnMonth, setKixMyTurnMonth] = useState('1');
    const [kixStartDate, setKixStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [kixMembersInput, setKixMembersInput] = useState('');
    const [kixMembersList, setKixMembersList] = useState<string[]>([]);

    // Notify user if it is their turn in active Kixiquilas
    useEffect(() => {
        const curMonth = new Date().getMonth() + 1; // 1-indexed
        kixiquilas.forEach(k => {
            if (Number(k.myTurnMonth) === curMonth && k.status === 'active') {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Ronda da Kixiquila', {
                        body: `Atenção! É o seu mês de receber o pote acumulado da Kixiquila "${k.name}"! Valor total: ${formatCurrency(k.contribution * k.membersCount, 'AOA')}`,
                        icon: '/logo.png'
                    });
                }
            }
        });
    }, [kixiquilas, formatCurrency]);

    // Savings Handlers
    const openNewSavingModal = () => {
        setEditingSavingId(null);
        setSavingName('');
        setSavingDesc('');
        setSavingAmount('');
        setSavingCurrency('AOA');
        setSavingInterest('0');
        setSavingTarget('');
        setSavingDate(new Date().toISOString().split('T')[0]);
        setIsSavingModalOpen(true);
    };

    const openEditSavingModal = (s: Saving) => {
        setEditingSavingId(s.id);
        setSavingName(s.name);
        setSavingDesc(s.description || '');
        setSavingAmount(s.amount.toString());
        setSavingCurrency(s.currency);
        setSavingInterest(s.interestRate.toString());
        setSavingTarget(s.targetAmount?.toString() || '');
        setSavingDate(s.startDate ? s.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
        setIsSavingModalOpen(true);
    };

    const handleSavingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            name: savingName,
            description: savingDesc,
            amount: Number(savingAmount),
            currency: savingCurrency as keyof typeof CURRENCIES,
            interest_rate: Number(savingInterest),
            target_amount: savingTarget ? Number(savingTarget) : null,
            start_date: new Date(savingDate).toISOString(),
        };

        if (editingSavingId) {
            await updateSaving(editingSavingId, data);
        } else {
            await addSaving(data);
        }
        setIsSavingModalOpen(false);
    };

    // Kixiquila Handlers
    const openNewKixModal = () => {
        setEditingKixId(null);
        setKixName('');
        setKixContribution('');
        setKixMembersCount('10');
        setKixMyTurnMonth('1');
        setKixStartDate(new Date().toISOString().split('T')[0]);
        setKixMembersList([]);
        setIsKixModalOpen(true);
    };

    const handleAddMember = () => {
        if (kixMembersInput.trim() && !kixMembersList.includes(kixMembersInput.trim())) {
            setKixMembersList([...kixMembersList, kixMembersInput.trim()]);
            setKixMembersInput('');
        }
    };

    const handleRemoveMember = (name: string) => {
        setKixMembersList(kixMembersList.filter(m => m !== name));
    };

    const handleKixSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalMembers = [...kixMembersList];
        // Auto fill missing members names up to count
        const expectedCount = Number(kixMembersCount);
        while (finalMembers.length < expectedCount - 1) {
            finalMembers.push(`Participante ${finalMembers.length + 2}`);
        }

        const data = {
            name: kixName,
            contribution: Number(kixContribution),
            membersCount: expectedCount,
            myTurnMonth: Number(kixMyTurnMonth),
            startDate: new Date(kixStartDate).toISOString(),
            status: 'active',
            membersList: JSON.stringify(finalMembers)
        };

        if (editingKixId) {
            await updateKixiquila(editingKixId, data);
        } else {
            await addKixiquila(data);
        }
        setIsKixModalOpen(false);
    };

    // Calculations
    const savingsStats = useMemo(() => {
        let totalSaved = 0;
        let totalTarget = 0;
        savings.forEach(s => {
            const rate = getRate(s.currency);
            totalSaved += s.amount * rate;
            if (s.targetAmount) totalTarget += s.targetAmount * rate;
        });
        return {
            totalSaved,
            totalTarget,
            progress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
        };
    }, [savings, getRate]);

    const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300";

    return (
        <PageTransition className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Poupanças & Kixiquilas</h1>
                    <p className="text-gray-500 mt-1">Gerencie as suas economias pessoais e as rotações da Kixiquila comunitária.</p>
                </div>
                {activeTab === 'savings' ? (
                    <button
                        onClick={openNewSavingModal}
                        className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Poupança
                    </button>
                ) : (
                    <button
                        onClick={openNewKixModal}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium flex items-center hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Kixiquila
                    </button>
                )}
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('savings')}
                    className={cn(
                        "py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer",
                        activeTab === 'savings'
                            ? "border-black text-black"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Minhas Poupanças
                </button>
                <button
                    onClick={() => setActiveTab('kixiquila')}
                    className={cn(
                        "py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer",
                        activeTab === 'kixiquila'
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Kixiquila Comunitária
                </button>
            </div>

            {loading ? (
                <div className="h-[50vh] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'savings' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className={cn(cardClass, "bg-black text-white border-none shadow-black/10")}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                            <Landmark className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Total Poupado</h2>
                                    </div>
                                    <h3 className="text-3xl font-semibold tracking-tight blur-amount">
                                        {formatCurrency(savingsStats.totalSaved)}
                                    </h3>
                                    <p className="text-white/40 text-xs mt-2 font-medium">Equivalente na moeda base</p>
                                </div>

                                <div className={cardClass}>
                                    <div className="flex items-center gap-2 mb-4 text-gray-400">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-sm font-medium uppercase tracking-wider">Metas de Poupança</h2>
                                    </div>
                                    <h3 className="text-3xl font-semibold text-gray-900 tracking-tight">
                                        {savingsStats.progress.toFixed(1)}%
                                    </h3>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(savingsStats.progress, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className={cardClass}>
                                    <div className="flex items-center gap-2 mb-4 text-gray-400">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-sm font-medium uppercase tracking-wider">Contas de Poupança</h2>
                                    </div>
                                    <h3 className="text-3xl font-semibold text-gray-900 tracking-tight">
                                        {savings.length}
                                    </h3>
                                    <p className="text-gray-400 text-xs mt-2 font-medium">Registros locais ativos</p>
                                </div>
                            </div>

                            {/* Savings List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {savings.map((s) => (
                                    <div key={s.id} className={cardClass}>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                                <PiggyBank className="w-6 h-6" />
                                            </div>
                                            <ActionMenu
                                                triggerIcon={<MoreVertical className="w-5 h-5 text-gray-400" />}
                                                items={[
                                                    {
                                                        label: 'Editar',
                                                        icon: <Edit2 className="w-4 h-4" />,
                                                        onClick: () => openEditSavingModal(s),
                                                    },
                                                    {
                                                        label: 'Detalhes',
                                                        icon: <Info className="w-4 h-4" />,
                                                        onClick: () => { setSelectedSaving(s); setIsSavingDetailsOpen(true); },
                                                    },
                                                    {
                                                        label: 'Excluir',
                                                        icon: <Trash2 className="w-4 h-4" />,
                                                        danger: true,
                                                        onClick: () => deleteSaving(s.id),
                                                    },
                                                ]}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                                                <p className="text-xs text-gray-500 line-clamp-1">{s.description || 'Sem descrição'}</p>
                                            </div>

                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-gray-900 tracking-tight blur-amount">
                                                    {formatCurrency(s.amount, s.currency)}
                                                </span>
                                            </div>

                                            {s.targetAmount && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-medium">
                                                        <span className="text-gray-400">Progresso</span>
                                                        <span className="text-gray-900">{((s.amount / s.targetAmount) * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-black rounded-full transition-all duration-1000"
                                                            style={{ width: `${Math.min((s.amount / s.targetAmount) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 text-right">
                                                        Meta: <span className="blur-amount">{formatCurrency(s.targetAmount, s.currency)}</span>
                                                    </p>
                                                </div>
                                            )}

                                            <div className="pt-4 border-t border-gray-100/60 grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Rendimento</span>
                                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                                                        <TrendingUp className="w-3 h-3" />
                                                        {s.interestRate}% aa
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Início</span>
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {s.startDate ? new Date(s.startDate).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' }) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={openNewSavingModal}
                                    className="border-2 border-dashed border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-all min-h-[260px] group cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-50 shadow-sm">
                                        <Plus className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className="font-semibold text-sm">Criar nova poupança</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'kixiquila' && (
                        <div className="space-y-6">
                            {/* Kixiquila List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {kixiquilas.map((k) => {
                                    const parsedMembers = k.membersList ? JSON.parse(k.membersList) : [];
                                    const pote = k.contribution * k.membersCount;
                                    const curMonth = new Date().getMonth() + 1;
                                    const isMyTurn = Number(k.myTurnMonth) === curMonth;

                                    return (
                                        <div key={k.id} className={cn(cardClass, isMyTurn && "border-indigo-200 bg-indigo-50/10")}>
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-100/50 flex items-center justify-center text-indigo-700 shadow-sm">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <ActionMenu
                                                    triggerIcon={<MoreVertical className="w-5 h-5 text-gray-400" />}
                                                    items={[
                                                        {
                                                            label: 'Excluir',
                                                            icon: <Trash2 className="w-4 h-4" />,
                                                            danger: true,
                                                            onClick: () => deleteKixiquila(k.id),
                                                        },
                                                    ]}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold text-gray-950">{k.name}</h3>
                                                        {isMyTurn && (
                                                            <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider rounded-md animate-pulse">
                                                                Ronda de Recebimento
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">Rotação ativa com {k.membersCount} participantes</p>
                                                </div>

                                                <div className="flex justify-between border-y border-gray-100 py-3 text-xs">
                                                    <div>
                                                        <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Lance Mensal</span>
                                                        <span className="font-extrabold text-gray-900 blur-amount">{formatCurrency(k.contribution, 'AOA')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Pote Acumulado</span>
                                                        <span className="font-extrabold text-indigo-600 blur-amount">{formatCurrency(pote, 'AOA')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Mês de Receber</span>
                                                        <span className="font-extrabold text-gray-900">Mês {k.myTurnMonth}</span>
                                                    </div>
                                                </div>

                                                {/* Calendar Breakdown */}
                                                <div className="space-y-2">
                                                    <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold">Calendário de Rondas</span>
                                                    <div className="grid grid-cols-5 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                                                        {Array.from({ length: k.membersCount }).map((_, idx) => {
                                                            const roundMonthNum = idx + 1;
                                                            const isUserRound = Number(k.myTurnMonth) === roundMonthNum;
                                                            const memberName = isUserRound ? "Você" : (parsedMembers[idx] || parsedMembers[idx - 1] || `Participante ${roundMonthNum}`);
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx} 
                                                                    className={cn(
                                                                        "p-2 rounded-xl text-center border text-[10px] flex flex-col items-center justify-center",
                                                                        isUserRound 
                                                                            ? "bg-amber-500 text-white border-amber-500 font-bold" 
                                                                            : curMonth > roundMonthNum 
                                                                            ? "bg-gray-100 text-gray-400 border-gray-150" 
                                                                            : "bg-white text-gray-700 border-gray-200"
                                                                    )}
                                                                    title={`Ronda ${roundMonthNum}: ${memberName}`}
                                                                >
                                                                    <span className="block font-bold">M{roundMonthNum}</span>
                                                                    <span className="text-[7px] truncate max-w-[50px]">{memberName}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={openNewKixModal}
                                    className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-450 hover:border-indigo-400 hover:bg-indigo-50/5 hover:text-indigo-600 transition-all min-h-[260px] group cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-indigo-100">
                                        <Plus className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="font-semibold text-sm">Criar nova Kixiquila</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Savings Modal */}
            {isSavingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl p-8 shadow-2xl relative">
                        <button
                            onClick={() => setIsSavingModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            {editingSavingId ? 'Editar Poupança' : 'Nova Poupança'}
                        </h2>

                        <form onSubmit={handleSavingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Conta de Poupança</label>
                                <input
                                    type="text"
                                    required
                                    value={savingName}
                                    onChange={(e) => setSavingName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Ex: Fundo de Emergência"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                                <input
                                    type="text"
                                    value={savingDesc}
                                    onChange={(e) => setSavingDesc(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Ex: Reservado para imprevistos domésticos"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor Atual</label>
                                    <input
                                        type="number"
                                        required
                                        value={savingAmount}
                                        onChange={(e) => setSavingAmount(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Moeda</label>
                                    <select
                                        value={savingCurrency}
                                        onChange={(e) => setSavingCurrency(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                                    >
                                        {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Estimada (Opcional)</label>
                                    <input
                                        type="number"
                                        value={savingTarget}
                                        onChange={(e) => setSavingTarget(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Taxa de Rendimento (% aa)</label>
                                    <input
                                        type="number"
                                        value={savingInterest}
                                        onChange={(e) => setSavingInterest(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Início</label>
                                <input
                                    type="date"
                                    value={savingDate}
                                    onChange={(e) => setSavingDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-black text-white font-bold rounded-2xl text-xs hover:bg-gray-800 transition-all mt-4"
                            >
                                Salvar Conta de Poupança
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Kixiquila Modal */}
            {isKixModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl p-8 shadow-2xl relative">
                        <button
                            onClick={() => setIsKixModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            Nova Rotação de Kixiquila
                        </h2>

                        <form onSubmit={handleKixSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Grupo Kixiquila</label>
                                <input
                                    type="text"
                                    required
                                    value={kixName}
                                    onChange={(e) => setKixName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ex: Kixiquila dos Colegas de Trabalho"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lance Mensal (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        value={kixContribution}
                                        onChange={(e) => setKixContribution(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: 50000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mês da Sua Ronda (1 a N)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={Number(kixMembersCount)}
                                        required
                                        value={kixMyTurnMonth}
                                        onChange={(e) => setKixMyTurnMonth(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: 4"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Total de Participantes</label>
                                    <input
                                        type="number"
                                        min={2}
                                        required
                                        value={kixMembersCount}
                                        onChange={(e) => setKixMembersCount(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Início</label>
                                    <input
                                        type="date"
                                        value={kixStartDate}
                                        onChange={(e) => setKixStartDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Add Members Section */}
                            <div className="border-t border-gray-100 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome dos Participantes (Rondas do Pote)</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={kixMembersInput}
                                        onChange={(e) => setKixMembersInput(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: Maria Manuel"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember(); } }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddMember}
                                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                        Adicionar
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                    {kixMembersList.map(m => (
                                        <div key={m} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                                            <span>{m}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveMember(m)} 
                                                className="p-0.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 mt-4"
                            >
                                Salvar Kixiquila
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
