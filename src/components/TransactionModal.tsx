import React, { useState, useEffect } from 'react';
import { X, Camera, Sparkles, Loader2 } from 'lucide-react';
import { useFinance, TransactionType, TransactionStatus } from '@/context/FinanceContext';
import { CURRENCIES, cn } from '@/lib/utils';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTransaction?: any;
}

export default function TransactionModal({ isOpen, onClose, editingTransaction }: TransactionModalProps) {
    const {
        addTransaction, updateTransaction, accounts, categories
    } = useFinance();

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>('expense');
    const [category, setCategory] = useState('');
    const [currency, setCurrency] = useState('AOA');
    const [accountId, setAccountId] = useState('');
    const [destinationAccountId, setDestinationAccountId] = useState('');
    const [status, setStatus] = useState<TransactionStatus>('paid');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // AI Scanner State
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (editingTransaction) {
            setDescription(editingTransaction.description || '');
            setAmount(editingTransaction.amount.toString());
            setType(editingTransaction.type);
            setCategory(editingTransaction.category);
            setCurrency(editingTransaction.currency);
            setAccountId(editingTransaction.accountId);
            setDestinationAccountId(editingTransaction.destinationAccountId || '');
            setStatus(editingTransaction.status);
            setDate(editingTransaction.date.split('T')[0]);
        } else {
            setDescription('');
            setAmount('');
            setType('expense');
            setCategory('');
            setCurrency('AOA');
            if (accounts.length > 0) setAccountId(accounts[0].id);
            setDestinationAccountId('');
            setStatus('paid');
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [editingTransaction, isOpen, accounts]);

    const handleSimulateAI = () => {
        setIsScanning(true);
        // Simulate an OCR & AI Categorization network request
        setTimeout(() => {
            setType('expense');
            setDescription('Supermercado Kero - Nova Vida');
            setAmount('68500.00');
            setCurrency('AOA');
            setStatus('paid');
            // Try to match category, otherwise pick the first expense category
            const expenseCat = categories.expense.includes('Alimentação') ? 'Alimentação' : categories.expense[0] || '';
            setCategory(expenseCat);
            setDate(new Date().toISOString().split('T')[0]);
            setIsScanning(false);
        }, 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const transactionData = {
            description,
            amount: Number(amount),
            type,
            category: type === 'transfer' ? 'Transferência' : type === 'adjustment' ? 'Ajuste' : category,
            currency: currency as any,
            account_id: accountId,
            destination_account_id: type === 'transfer' ? destinationAccountId : undefined,
            date: new Date(date).toISOString(),
            status
        };

        if (editingTransaction?.id) {
            await updateTransaction(editingTransaction.id, transactionData);
        } else {
            await addTransaction(transactionData);
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                        {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                    </h2>

                    {!editingTransaction && (
                        <button
                            type="button"
                            onClick={handleSimulateAI}
                            disabled={isScanning}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all mr-8",
                                isScanning
                                    ? "bg-indigo-50 text-indigo-400 cursor-not-allowed border border-indigo-100"
                                    : "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100/50 shadow-sm"
                            )}
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span>Lendo Fatura...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-4 h-4 text-indigo-600" />
                                    <span>Extração com IA</span>
                                    <Sparkles className="w-3 h-3 text-purple-500" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div>
                        <div className="flex gap-2 p-1 bg-gray-100/90 rounded-xl overflow-x-auto">
                            {(['expense', 'income', 'transfer', 'adjustment'] as TransactionType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={cn(
                                        "flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-medium transition-all capitalize",
                                        type === t
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {t === 'expense' ? 'Despesa' : t === 'income' ? 'Receita' : t === 'transfer' ? 'Transferência' : 'Ajuste'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={description}
                                    disabled={isScanning}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={cn(
                                        "w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-gray-900",
                                        isScanning ? "border-indigo-200 bg-indigo-50/30 animate-pulse" : "border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    )}
                                    placeholder="Ex: Supermercado"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        disabled={isScanning}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={cn(
                                            "w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-gray-900",
                                            isScanning ? "border-indigo-200 bg-indigo-50/30 animate-pulse" : "border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        )}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Moeda</label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                    >
                                        {Object.keys(CURRENCIES).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            {type !== 'transfer' && type !== 'adjustment' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {(categories[type as 'income' | 'expense'] ?? []).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {type === 'transfer' ? 'Conta de Origem' : 'Conta'}
                                </label>
                                <select
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                >
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                                    ))}
                                </select>
                            </div>

                            {type === 'transfer' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Conta de Destino</label>
                                    <select
                                        value={destinationAccountId}
                                        onChange={(e) => setDestinationAccountId(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                        required
                                    >
                                        <option value="">Selecione o destino...</option>
                                        {accounts.filter(a => a.id !== accountId).map((a) => (
                                            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                >
                                    <option value="paid">Pago</option>
                                    <option value="pending">Pendente</option>
                                    <option value="scheduled">Agendado</option>
                                    <option value="overdue">Atrasado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            {editingTransaction ? 'Salvar Alterações' : 'Salvar Transação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
