import React from 'react';
import PageTransition from '@/components/PageTransition';
import { ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export default function SuccessStories() {
  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      
      {/* Featured Success Story (Large Split Card) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2rem] overflow-hidden flex flex-col lg:flex-row shadow-sm hover:border-indigo-400 transition-all text-left group">
        <div className="lg:w-1/2 relative min-h-[300px] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop" 
            alt="Mariana Costa" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent lg:hidden" />
          <span className="absolute top-6 left-6 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
            Destaque do Mês
          </span>
        </div>
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">História Verificada</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">De Dívidas a Investidora: A Jornada de Mariana</h2>
          <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed italic">
            "Nunca imaginei que em 24 meses eu sairia de um saldo negativo acumulado para construir um fundo de emergência robusto e diversificar em Kixiquilas familiares. O VukaPay ajudou-me a ver exatamento para onde o meu dinheiro desaparecia..."
          </p>
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between mt-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-bold">Mariana Costa, Luanda</span>
            <button className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Ler Relato Completo
            </button>
          </div>
        </div>
      </div>

      {/* Other Success Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Story Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col hover:border-indigo-400 transition-colors text-left group">
          <div className="h-48 rounded-2xl overflow-hidden mb-6 relative">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop" 
              alt="Ricardo Dividends" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 block">Aposentadoria Precoce</span>
            <h3 className="font-black text-xl text-gray-900 dark:text-white mb-3">Estratégias de Dividendos</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
              Como o Ricardo planeou as suas poupanças e controlou as ações da Bodiva para obter independência financeira aos 45 anos.
            </p>
            <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left">Ler história</button>
          </div>
        </div>

        {/* Story Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col hover:border-indigo-400 transition-colors text-left group">
          <div className="h-48 rounded-2xl overflow-hidden mb-6 relative bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop" 
              alt="João Business" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 block">Gestão de Pequenos Negócios</span>
            <h3 className="font-black text-xl text-gray-900 dark:text-white mb-3">Escalando com Caixa Positivo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
              Separar as contas pessoais das empresariais foi o segredo. João revela como estruturou o fluxo do seu negócio local.
            </p>
            <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left">Ler história</button>
          </div>
        </div>

        {/* Submit Story CTA (Matches Card Size) */}
        <div className="bg-indigo-50 dark:bg-slate-800/50 border border-dashed border-indigo-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center group hover:bg-indigo-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[400px]">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-black text-xl text-gray-900 dark:text-white mb-3">Tens uma História de Sucesso?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-[250px] mx-auto mb-8">
            Incentiva a comunidade partilhando a tua evolução financeira. Cada pequeno passo motiva novos membros.
          </p>
          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-sm transition-all active:scale-95">
            Partilhar o meu percurso
          </button>
        </div>

      </div>
    </PageTransition>
  );
}
