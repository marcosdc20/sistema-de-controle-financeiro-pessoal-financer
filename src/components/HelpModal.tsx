import React from 'react';
import { X, Book, Command, MessageCircle, HelpCircle, ExternalLink, ChevronRight } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    if (!isOpen) return null;

    const sections = [
        {
            title: 'Guia de Início Rápido',
            icon: <Book className="w-5 h-5 text-indigo-600" />,
            desc: 'Aprenda o básico sobre como gerenciar suas finanças.',
            link: '#'
        },
        {
            title: 'Atalhos de Teclado',
            icon: <Command className="w-5 h-5 text-emerald-600" />,
            desc: 'Use o teclado para navegar mais rápido pelo sistema.',
            shortcuts: [
                { key: '⌘ + K', desc: 'Ativar Pesquisa Global' },
                { key: 'N', desc: 'Nova Transação' },
                { key: 'G', desc: 'Ir para Dashboard' },
                { key: 'T', desc: 'Ir para Transações' },
            ]
        },
        {
            title: 'Suporte via Chat',
            icon: <MessageCircle className="w-5 h-5 text-amber-600" />,
            desc: 'Fale com nossa equipe de suporte em tempo real.',
            link: '#'
        }
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Como podemos ajudar?</h2>
                        <p className="text-sm text-gray-500">Explore guias, suporte e atalhos.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {sections.map((section, idx) => (
                        <div
                            key={idx}
                            className="p-5 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="mt-1 p-2 rounded-xl bg-white shadow-sm border border-gray-100">
                                        {section.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{section.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{section.desc}</p>

                                        {section.shortcuts && (
                                            <div className="mt-4 grid grid-cols-1 gap-2">
                                                {section.shortcuts.map((s, si) => (
                                                    <div key={si} className="flex justify-between items-center text-[10px] font-medium bg-white px-2 py-1.5 rounded-lg border border-gray-50 uppercase tracking-wider">
                                                        <span className="text-gray-400">{s.desc}</span>
                                                        <span className="text-gray-900 bg-gray-50 px-1.5 rounded border border-gray-200">{s.key}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {section.link && (
                                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        VukaPay v1.0.5 • <button className="hover:text-indigo-600 font-medium">Notas da Versão</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
