import React, { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { TrendingUp, Users, Star, ShieldCheck, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InvestmentGroups() {
  const [joinedGroups, setJoinedGroups] = useState<string[]>(['Imobiliário']);

  const handleToggleGroup = (groupName: string) => {
    setJoinedGroups(prev => 
      prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
    );
  };

  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="relative z-10 max-w-2xl text-left">
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Círculos de Investimento Coletivo</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
            Junte-se a círculos de mentoria financeira focados, compartilhe estratégias sobre mercados e controle as suas carteiras locais em colaboração com outros membros VIP.
          </p>
        </div>
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Featured Group - Real Estate (8 Cols) */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between min-h-[380px] shadow-sm relative overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop" 
              alt="Real Estate Building" 
              className="w-full h-full object-cover opacity-5 dark:opacity-10 scale-105 group-hover:scale-100 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg">Destaque Oficial</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 2.4k membros ativos
              </span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Imobiliário de Luxo & REITs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mb-8 leading-relaxed">
              Discussões profundas sobre fundos imobiliários locais, incorporação, rendas prediais urbanas e cálculo de taxas de rentabilidade de ativos de alto padrão.
            </p>

            <div className="flex gap-10">
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Retorno Médio Estimado</span>
                <p className="text-xl font-black text-emerald-600 mt-1">8.5% a.a.</p>
              </div>
              <div className="w-[1px] bg-gray-200 dark:bg-slate-800" />
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Perfil de Risco</span>
                <p className="text-xl font-black text-indigo-600 mt-1">Moderado</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
            <div className="flex -space-x-3 overflow-hidden">
              {['LC', 'AS', 'RM', '+2k'].map((initial, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {initial}
                </div>
              ))}
            </div>
            <button 
              onClick={() => handleToggleGroup('Imobiliário')}
              className={cn(
                "px-6 py-3 text-sm font-black rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95",
                joinedGroups.includes('Imobiliário')
                  ? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent hover:shadow-indigo-500/20"
              )}
            >
              {joinedGroups.includes('Imobiliário') ? 'Já é Membro (Sair)' : 'Aderir ao Grupo'}
            </button>
          </div>
        </div>

        {/* Crypto & Web3 (4 Cols) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
          <div>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 shadow-sm">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-gray-900 dark:text-white mb-2">Cripto & Web3</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Análise fundamentalista de ativos de Web3, custódia fria (cold wallets) e estratégias avançadas de DeFi.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Ativo Principal</span>
              <span className="font-bold text-gray-900 dark:text-white">BTC / ETH</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Sentimento</span>
              <span className="font-extrabold text-emerald-600">Otimista</span>
            </div>
            <button 
              onClick={() => handleToggleGroup('Cripto')}
              className={cn(
                "w-full py-3 mt-4 text-sm font-black rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm",
                joinedGroups.includes('Cripto') 
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300" 
                  : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              )}
            >
              {joinedGroups.includes('Cripto') ? '✓ Aderido' : 'Participar'}
            </button>
          </div>
        </div>

        {/* Stocks & Shares (4 Cols) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
          <div>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 shadow-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-gray-900 dark:text-white mb-2">Mercado de Capitais</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Análise de ações locais na BODIVA, ações globais de alto rendimento de dividendos e fundos mútuos.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-3 rounded-xl mb-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 leading-tight">Supervisionado por Mentores Seniores</span>
            </div>
            <button 
              onClick={() => handleToggleGroup('Stocks')}
              className={cn(
                "w-full py-3 text-sm font-black rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm",
                joinedGroups.includes('Stocks') 
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300" 
                  : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              )}
            >
              {joinedGroups.includes('Stocks') ? '✓ Aderido' : 'Participar'}
            </button>
          </div>
        </div>

        {/* Long-Term Savings (4 Cols) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
          <div>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 shadow-sm">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-gray-900 dark:text-white mb-2">Aposentadoria Precoce (FIRE)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Estratégias de reservas a longo prazo e contas poupança de juros compostos para independência financeira.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-800">
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '67%' }} />
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-500 dark:text-gray-400">Meta do Grupo</span>
              <span className="text-indigo-600 dark:text-indigo-400">67% Alcançada</span>
            </div>
            <button 
              onClick={() => handleToggleGroup('FIRE')}
              className={cn(
                "w-full py-3 mt-2 text-sm font-black rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm",
                joinedGroups.includes('FIRE') 
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300" 
                  : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              )}
            >
              {joinedGroups.includes('FIRE') ? '✓ Aderido' : 'Participar'}
            </button>
          </div>
        </div>

        {/* Educational Mentorship Widget (4 Cols) */}
        <div className="md:col-span-4 bg-emerald-50 dark:bg-emerald-900/10 border-l-[6px] border-l-emerald-600 border border-emerald-100 dark:border-emerald-800/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Star className="w-5 h-5 fill-current" />
              <h4 className="font-black text-sm uppercase tracking-wider">Visão Académica Diária</h4>
            </div>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/70 leading-relaxed italic font-medium">
              "Diversificar os investimentos entre títulos de curto prazo e reservas físicas é a melhor blindagem contra a depreciação e flutuações da moeda local."
            </p>
          </div>
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-emerald-200/50 dark:border-emerald-800/30">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">MS</div>
            <span className="text-xs text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">Por Mentor Sénior VukaPay</span>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
