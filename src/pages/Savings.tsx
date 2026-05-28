import React, { useState, useMemo } from 'react';
import { useFinance, Saving } from '@/context/FinanceContext';
import { CURRENCIES } from '@/lib/utils';
import { PiggyBank, Plus, MoreVertical, X, Edit2, Trash2, Info, Landmark, Calendar, TrendingUp, Activity } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { ActionMenu } from '@/components/ActionMenu';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Savings() {
    const { savings, addSaving, updateSaving, deleteSaving, loading, getRate, formatCurrency, formatDate } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSavingId, setEditingSavingId] = useState<string | null>(null);
    const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('AOA');
    const [interestRate, setInterestRate] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const openNewModal = () => {
        setEditingSavingId(null);
        setName('');
        setDescription('');
        setAmount('');
        setCurrency('AOA');
        setInterestRate('0');
        setTargetAmount('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const openEditModal = (saving: Saving) => {
        setEditingSavingId(saving.id);
        setName(saving.name);
        setDescription(saving.description || '');
        setAmount(saving.amount.toString());
        setCurrency(saving.currency);
        setInterestRate(saving.interestRate.toString());
        setTargetAmount(saving.targetAmount?.toString() || '');
        setStartDate(saving.startDate ? saving.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const openDetailsModal = (saving: Saving) => {
        setSelectedSaving(saving);
        setIsDetailsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const savingData = {
            name,
            description,
            amount: Number(amount),
            currency: currency as keyof typeof CURRENCIES,
            interest_rate: Number(interestRate),
            target_amount: targetAmount ? Number(targetAmount) : null,
            start_date: new Date(startDate).toISOString(),
        };

        if (editingSavingId) {
            await updateSaving(editingSavingId, savingData);
        } else {
            await addSaving(savingData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta poupança?')) {
            deleteSaving(id);
        }
    };

    const dashboardStats = useMemo(() => {
        let totalSaved = 0;
        let totalTarget = 0;

        savings.forEach(s => {
            const rate = getRate(s.currency);
            totalSaved += s.amount * rate;
            if (s.targetAmount) {
                totalTarget += s.targetAmount * rate;
            }
        });

        const progress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

        return { totalSaved, totalTarget, progress };
    }, [savings, getRate]);

    const cardClass = "bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300";

    return (
        <PageTransition className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Poupança</h1>
                    <p className="text-gray-500 mt-1">Gerencie suas economias e acompanhe o rendimento.</p>
                </div>
                <button
                    onClick={openNewModal}
                    className="px-4 py-2.5 bg-black text-white rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Poupança
                </button>
            </div>

            {loading ? (
                <div className="h-[60vh] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={cn(cardClass, "bg-black text-white border-none shadow-black/10")}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 text-white">
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Total Poupado</h2>
                            </div>
                            <h3 className="text-3xl font-semibold tracking-tight">
                                {formatCurrency(dashboardStats.totalSaved)}
                            </h3>
                            <p className="text-white/40 text-xs mt-2 font-medium">Equivalente na moeda base</p>
                        </div>

                        <div className={cardClass}>
                            <div className="flex items-center gap-2 mb-4 text-gray-400">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-medium uppercase tracking-wider">Metas de Poupança</h2>
                            </div>
                            <h3 className="text-3xl font-semibold text-gray-900 tracking-tight">
                                {dashboardStats.progress.toFixed(1)}%
                            </h3>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(dashboardStats.progress, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className={cardClass}>
                            <div className="flex items-center gap-2 mb-4 text-gray-400">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-medium uppercase tracking-wider">Contas Ativas</h2>
                            </div>
                            <h3 className="text-3xl font-semibold text-gray-900 tracking-tight">
                                {savings.length}
                            </h3>
                            <p className="text-gray-400 text-xs mt-2 font-medium">Contas de poupança registradas</p>
                        </div>
                    </div>

                    {/* Savings List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savings.map((saving) => (
                            <div key={saving.id} className={cardClass}>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <PiggyBank className="w-6 h-6" />
                                    </div>
                                    <ActionMenu
                                        triggerIcon={<MoreVertical className="w-5 h-5 text-gray-400" />}
                                        items={[
                                            {
                                                label: 'Editar',
                                                icon: <Edit2 className="w-4 h-4" />,
                                                onClick: () => openEditModal(saving),
                                            },
                                            {
                                                label: 'Detalhes',
                                                icon: <Info className="w-4 h-4" />,
                                                onClick: () => openDetailsModal(saving),
                                            },
                                            {
                                                label: 'Excluir',
                                                icon: <Trash2 className="w-4 h-4" />,
                                                danger: true,
                                                onClick: () => handleDelete(saving.id),
                                            },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{saving.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1">{saving.description || 'Sem descrição'}</p>
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-gray-900 tracking-tight">
                                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: saving.currency }).format(saving.amount)}
                                        </span>
                                    </div>

                                    {saving.targetAmount && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-400">Progresso da Meta</span>
                                                <span className="text-gray-900">{((saving.amount / saving.targetAmount) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-black rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min((saving.amount / saving.targetAmount) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 text-right">
                                                Objetivo: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: saving.currency }).format(saving.targetAmount)}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Rendimento</span>
                                            <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                {saving.interestRate}% aa
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Início</span>
                                            <span className="text-sm font-semibold text-gray-700">
                                                {saving.startDate ? new Date(saving.startDate).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={openNewModal}
                            className="border-2 border-dashed border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-all min-h-[280px] group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-50 shadow-sm">
                                <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <span className="font-medium">Abrir nova poupança</span>
                        </button>
                    </div>

                    {/* Add/Edit Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                            <div className="bg-white rounded-[2rem] w-full max-w-xl p-8 shadow-2xl relative">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">
                                    {editingSavingId ? 'Editar Poupança' : 'Nova Conta de Poupança'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Conta</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                                placeholder="Ex: Fundo de Reserva, Viagem Suíça..."
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (Opcional)</label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all resize-none"
                                                rows={2}
                                                placeholder="Mais detalhes sobre esta poupança..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Valor Atual</label>
                                            <input
                                                type="number"
                                                required
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                                placeholder="0.00"
                                                step="0.01"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Moeda</label>
                                            <select
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                            >
                                                {Object.keys(CURRENCIES).map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Taxa de Juro (% ao ano)</label>
                                            <input
                                                type="number"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                                placeholder="0.00"
                                                step="0.01"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Final (Opcional)</label>
                                            <input
                                                type="number"
                                                value={targetAmount}
                                                onChange={(e) => setTargetAmount(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                                placeholder="0.00"
                                                step="0.01"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Data de Início</label>
                                            <input
                                                type="date"
                                                required
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6 border-t border-gray-100">
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
                                            {editingSavingId ? 'Salvar Alterações' : 'Criar Poupança'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Details Modal */}
                    {isDetailsModalOpen && selectedSaving && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative">
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                        <PiggyBank className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{selectedSaving.name}</h2>
                                        <p className="text-emerald-600 font-medium flex items-center gap-1 text-sm">
                                            <TrendingUp className="w-3 h-3" /> Rendimento: {selectedSaving.interestRate}% ao ano
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Saldo Atual</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedSaving.currency }).format(selectedSaving.amount)}
                                                </p>
                                            </div>
                                            <div>
                                                {selectedSaving.targetAmount && (
                                                    <>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Meta Total</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedSaving.currency }).format(selectedSaving.targetAmount)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {selectedSaving.targetAmount && (
                                            <div className="mt-6 space-y-2">
                                                <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                                                    <div
                                                        className="h-full bg-black rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min((selectedSaving.amount / selectedSaving.targetAmount) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-center text-gray-900 font-semibold italic">
                                                    Faltam {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: selectedSaving.currency }).format(Math.max(0, selectedSaving.targetAmount - selectedSaving.amount))} para o objetivo
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 px-2">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Data de Início</span>
                                            <span className="text-gray-900 font-semibold">{formatDate(selectedSaving.startDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Criada em</span>
                                            <span className="text-gray-900 font-semibold">{formatDate(selectedSaving.createdAt)}</span>
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Sobre esta poupança</p>
                                            <p className="text-sm text-gray-600 leading-relaxed font-medium italic">
                                                "{selectedSaving.description || 'Nenhuma descrição detalhada fornecida para esta conta.'}"
                                            </p>
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
