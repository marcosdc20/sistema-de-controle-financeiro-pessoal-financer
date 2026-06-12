import React from 'react';
import PageTransition from '@/components/PageTransition';

export default function Feed() {
  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Feed Section (Col 1-8) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Welcome Hero / Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 text-indigo-50 shadow-sm">
            <div className="relative z-10">
              <h1 className="font-display text-3xl font-bold mb-3 text-white">Bem-vindo à Comunidade VukaPay</h1>
              <p className="font-body-md opacity-90 max-w-xl text-indigo-100">Onde o conhecimento financeiro encontra a colaboração. Compartilhe estratégias, aprenda com especialistas e cresça seu patrimônio com segurança.</p>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-[160px] translate-x-12 translate-y-8" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
            </div>
          </section>

          {/* Discussion Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Discussões Recentes</h2>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 bg-gray-200 dark:bg-slate-800 rounded-full text-xs font-bold text-gray-800 dark:text-gray-200">Populares</button>
                <button className="px-4 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-xs font-medium transition-colors">Novas</button>
              </div>
            </div>

            {/* Card 1 */}
            <article className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-indigo-500 transition-colors cursor-pointer shadow-sm group">
              <div className="flex items-start gap-3 mb-4">
                <img alt="User" className="w-10 h-10 rounded-full object-cover" src="https://ui-avatars.com/api/?name=Ricardo+Invest&background=c7d2fe&color=3730a3" />
                <div>
                  <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">Estratégias de Dividendos para 2026: O que esperar?</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">Investimentos</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">Postado por <span className="font-bold">@RicardInvesth</span> • 2h atrás</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-6 leading-relaxed">
                Com a recente mudança na taxa Selic/BNA, muitos investidores estão migrando para fundos imobiliários e ações focadas em renda passiva. Aqui está minha análise dos setores mais promissores para o próximo semestre...
              </p>
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                    <span className="text-sm font-medium">124</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">forum</span>
                    <span className="text-sm font-medium">42 comentários</span>
                  </div>
                </div>
                <button className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">
                  Ler mais <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </article>

            {/* Card 2 */}
            <article className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-indigo-500 transition-colors cursor-pointer shadow-sm group">
              <div className="flex items-start gap-3 mb-4">
                <img alt="User" className="w-10 h-10 rounded-full object-cover" src="https://ui-avatars.com/api/?name=Ana+Poupança&background=bbf7d0&color=166534" />
                <div>
                  <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">Como quitei meu financiamento imobiliário em 5 anos</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">Sucesso</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">Postado por <span className="font-bold">@AnaPoupança</span> • 5h atrás</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-6 leading-relaxed">
                A estratégia foi simples: amortização constante e uso inteligente de fundos de rendimento. Vou detalhar a planilha que usei para priorizar os pagamentos mensais sem comprometer a qualidade de vida.
              </p>
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                    <span className="text-sm font-medium">382</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">forum</span>
                    <span className="text-sm font-medium">156 comentários</span>
                  </div>
                </div>
                <button className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">
                  Ler mais <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </article>
          </div>
        </div>

        {/* Sidebar Widgets (Col 9-12) */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Trending Tips Widget */}
          <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-display text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Dicas Financeiras do Dia
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-400 mb-1">Regra dos 50/30/20</h4>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-500/80">Ideal para quem está começando a organizar o orçamento mensal.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-indigo-500 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-400 mb-1">Reserva de Emergência</h4>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-500/80">Garanta pelo menos 6 meses de custo fixo em liquidez diária.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Top Members Widget */}
          <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold mb-5 text-gray-900 dark:text-white">Membros em Destaque</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img alt="Member" className="w-8 h-8 rounded-full object-cover" src="https://ui-avatars.com/api/?name=Dr.+Carlos&background=random" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Dr. Carlos Invest</p>
                    <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Expert Verificado</span>
                  </div>
                </div>
                <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline">Seguir</button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img alt="Member" className="w-8 h-8 rounded-full object-cover" src="https://ui-avatars.com/api/?name=Mariana+Finanças&background=random" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Mariana Finanças</p>
                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Power Saver</span>
                  </div>
                </div>
                <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline">Seguir</button>
              </div>
            </div>
          </section>

          {/* Community Challenge Card */}
          <section className="bg-gray-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <span className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Desafio Ativo</span>
              <h3 className="font-display text-xl font-bold mb-2">30 Dias Sem Gastos Supérfluos</h3>
              <p className="text-sm text-gray-300 mb-6">1.240 membros participando atualmente.</p>
              <button className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 active:scale-95 transition-all shadow-sm">
                Participar Agora
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            </div>
          </section>
        </aside>
      </div>
    </PageTransition>
  );
}
