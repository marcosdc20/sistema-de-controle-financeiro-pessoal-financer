import React, { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Challenges() {
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(['mestre']);

  const handleToggleChallenge = (challengeId: string) => {
    setJoinedChallenges(prev => 
      prev.includes(challengeId) ? prev.filter(c => c !== challengeId) : [...prev, challengeId]
    );
  };

  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      
      {/* Header Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm text-left relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Desafios de Poupança Colaborativa</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
              Transforme os seus hábitos financeiros num jogo saudável. Participe nas metas financeiras coletivas, acumule reputação XP e ganhe insígnias decorativas para o seu perfil VukaPay.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-8 relative z-10">
            <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">Desafios Deste Mês</span>
          </div>
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-4 -translate-y-4">
             <Target className="w-48 h-48" />
          </div>
        </div>

        {/* Rank HUD */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
          <div className="flex justify-between items-start z-10 mb-6">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200">O seu Rank</span>
          </div>
          <div className="z-10 mt-auto">
            <div className="text-5xl font-black tracking-tighter mb-1">#12</div>
            <div className="text-xs text-gray-400 font-medium">Entre 2.4k poupadores</div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs z-10">
            <span className="text-gray-400 font-medium">Próxima: Guardião Pro</span>
            <span className="font-black text-amber-400">850 XP</span>
          </div>
        </div>
      </div>

      {/* Active Challenges Progress Row */}
      <div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-5 text-left flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" /> Os Seus Desafios Ativos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Challenge 1 */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-6 group hover:border-indigo-400 transition-colors">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" className="stroke-gray-100 dark:stroke-slate-800 fill-none" strokeWidth="8" />
                <circle cx="48" cy="48" r="40" className="stroke-indigo-600 fill-none" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="75.36" strokeLinecap="round" />
              </svg>
              <span className="absolute text-lg font-black text-gray-900 dark:text-white">70%</span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Urgente</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">Faltam 9 dias</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">30 Dias Sem Gastos Supérfluos</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Meta: Economizar 50.000 Kz em entretenimento e saídas neste ciclo.</p>
            </div>
          </div>

          {/* Challenge 2 */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-6 group hover:border-emerald-400 transition-colors">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" className="stroke-gray-100 dark:stroke-slate-800 fill-none" strokeWidth="8" />
                <circle cx="48" cy="48" r="40" className="stroke-emerald-500 fill-none" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="175.84" strokeLinecap="round" />
              </svg>
              <span className="absolute text-lg font-black text-gray-900 dark:text-white">30%</span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Em progresso</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">Meta Anual</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors">Reserva de Emergência</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Meta: 500.000 Kz aplicados em conta poupança líquida até ao fim do ano.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Leaderboard and Explore Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Weekly Leaderboard (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
            <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-widest">Ranking Semanal</h4>
            <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {[
              { name: 'Carlos Mendes', xp: '2.840 XP', rank: '1º', badge: '🥇 Expert' },
              { name: 'Ana Júlia', xp: '2.710 XP', rank: '2º', badge: '🥈 Pro' },
              { name: 'Roberto Silva', xp: '2.450 XP', rank: '3º', badge: '🥉 Ativo' },
              { name: 'Você', xp: '1.200 XP', rank: '12º', badge: '🎯 Guardião' }
            ].map((item, idx) => (
              <div key={idx} className={cn("p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors", item.name === 'Você' ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : '')}>
                <div className="flex items-center gap-4">
                  <span className={cn("w-6 text-sm font-black", item.name === 'Você' ? 'text-indigo-600' : 'text-gray-400')}>{item.rank}</span>
                  <div className={cn("w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center", item.name === 'Você' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300')}>
                    {item.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className={cn("text-sm font-black", item.name === 'Você' ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white')}>{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">{item.xp} • {item.badge}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Challenges to join (8 Cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Challenge Card 1 */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:border-indigo-400 transition-colors flex flex-col justify-between group">
            <div className="h-32 relative bg-gray-200 dark:bg-slate-800 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop" 
                alt="Dividend Wealth" 
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute bottom-4 left-4 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded uppercase tracking-widest">Renda Passiva</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="text-left mb-6">
                <h4 className="font-black text-lg text-gray-900 dark:text-white mb-2">Mestre dos Dividendos</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Alcance os seus primeiros 10.000 Kz em dividendos e retornos de investimentos este mês letivo.</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">1.2k poupadores</span>
                <button 
                  onClick={() => handleToggleChallenge('mestre')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all active:scale-95 shadow-sm",
                    joinedChallenges.includes('mestre')
                      ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                  )}
                >
                  {joinedChallenges.includes('mestre') ? 'Inscrito' : 'Participar Agora'}
                </button>
              </div>
            </div>
          </div>

          {/* Challenge Card 2 */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:border-indigo-400 transition-colors flex flex-col justify-between group">
            <div className="h-32 relative bg-gray-200 dark:bg-slate-800 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=400&auto=format&fit=crop" 
                alt="Zero Debt Freedom" 
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute bottom-4 left-4 px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black rounded uppercase tracking-widest">Dívida Zero</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="text-left mb-6">
                <h4 className="font-black text-lg text-gray-900 dark:text-white mb-2">Eliminador de Dívidas</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Quite uma despesa antiga ou empréstimo pendente local este mês para recuperar fôlego financeiro real.</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">850 poupadores</span>
                <button 
                  onClick={() => handleToggleChallenge('divida')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all active:scale-95 shadow-sm",
                    joinedChallenges.includes('divida')
                      ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                  )}
                >
                  {joinedChallenges.includes('divida') ? 'Inscrito' : 'Participar Agora'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
