import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, User, Settings, LayoutDashboard, Wallet, CreditCard, Calculator, Repeat, PiggyBank, Target, TrendingUp, Handshake, Sparkles, GraduationCap, PieChart } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CommandBarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandBar({ isOpen, onClose }: CommandBarProps) {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { transactions, accounts, setIsTransactionModalOpen } = useFinance();

    const navItems = [
        { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', path: '/' },
        { icon: <Wallet className="w-4 h-4" />, label: 'Transações', path: '/transactions' },
        { icon: <CreditCard className="w-4 h-4" />, label: 'Contas', path: '/accounts' },
        { icon: <Calculator className="w-4 h-4" />, label: 'Orçamentos', path: '/budgets' },
        { icon: <Repeat className="w-4 h-4" />, label: 'Assinaturas', path: '/subscriptions' },
        { icon: <PiggyBank className="w-4 h-4" />, label: 'Poupança', path: '/savings' },
        { icon: <Target className="w-4 h-4" />, label: 'Metas', path: '/goals' },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'Investimentos', path: '/investments' },
        { icon: <Handshake className="w-4 h-4" />, label: 'Empréstimos', path: '/loans' },
        { icon: <PieChart className="w-4 h-4" />, label: 'Relatórios', path: '/reports' },
        { icon: <Settings className="w-4 h-4" />, label: 'Definições', path: '/settings' },
    ];

    const filteredItems = useMemo(() => {
        if (!query) return [];
        const q = query.toLowerCase();

        const results = [];

        // Navigation matches
        results.push(...navItems.filter(item => item.label.toLowerCase().includes(q)).map(item => ({
            ...item,
            type: 'Navigação',
            action: () => { navigate(item.path); onClose(); }
        })));

        // Account matches
        results.push(...accounts.filter(acc => acc.name.toLowerCase().includes(q)).map(acc => ({
            icon: <CreditCard className="w-4 h-4" />,
            label: acc.name,
            type: 'Contas',
            action: () => { navigate('/accounts'); onClose(); }
        })));

        // Actions
        if ('nova transação'.includes(q) || 'adicionar'.includes(q)) {
            results.push({
                icon: <Search className="w-4 h-4" />,
                label: 'Nova Transação',
                type: 'Ação',
                action: () => { setIsTransactionModalOpen(true); onClose(); }
            });
        }

        return results.slice(0, 10);
    }, [query, accounts]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onClose(); // Toggle logic
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <Search className="w-6 h-6 text-gray-400" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="O que você está procurando?"
                        className="flex-1 bg-transparent border-none outline-none text-xl text-gray-900 placeholder-gray-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {query && filteredItems.length > 0 ? (
                        <div className="p-3">
                            {filteredItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={item.action}
                                    className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 rounded-2xl group transition-all"
                                >
                                    <div className="flex items-center gap-4 text-gray-700 font-medium">
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {item.icon}
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-2 py-1 rounded-lg">
                                            {item.type}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="p-12 text-center text-gray-400">
                            <p>Nenhum resultado encontrado para "{query}"</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">Sugestões Rápidas</p>
                            <div className="grid grid-cols-2 gap-3">
                                {navItems.slice(0, 4).map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { navigate(item.path); onClose(); }}
                                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-700 transition-all font-medium text-gray-600 border border-transparent hover:border-indigo-100"
                                    >
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                            {item.icon}
                                        </div>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><span className="bg-white px-1 rounded shadow-sm border border-gray-200">ENTER</span> Selecionar</span>
                        <span className="flex items-center gap-1"><span className="bg-white px-1 rounded shadow-sm border border-gray-200">↑↓</span> Navegar</span>
                        <span className="flex items-center gap-1"><span className="bg-white px-1 rounded shadow-sm border border-gray-200">ESC</span> Sair</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
