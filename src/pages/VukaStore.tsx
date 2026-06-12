import React from 'react';
import PageTransition from '@/components/PageTransition';
import { useFinance } from '@/context/FinanceContext';
import { Award, Lock, Crown, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VukaStore() {
  const { profile, spendVukaCoins } = useFinance();
  const vukaCoins = profile?.vuka_coins || 0;

  const PRODUCTS = [
    {
      id: 'course_premium_1',
      title: 'Mastering Personal Finance',
      description: 'Curso Premium avançado com especialistas do mercado angolano.',
      price: 500,
      icon: Crown,
      color: 'from-amber-400 to-orange-500',
      purchased: false
    },
    {
      id: 'feature_reports',
      title: 'Relatórios IA Avançados',
      description: 'Desbloqueie relatórios de Inteligência Artificial para os próximos 3 meses.',
      price: 300,
      icon: Zap,
      color: 'from-fuchsia-500 to-purple-600',
      purchased: false
    },
    {
      id: 'badge_vip',
      title: 'Selo Vuka VIP',
      description: 'Destaque-se na Comunidade e Marketplace com o selo dourado VIP.',
      price: 150,
      icon: Award,
      color: 'from-emerald-400 to-teal-500',
      purchased: true
    }
  ];

  const handlePurchase = async (product: typeof PRODUCTS[0]) => {
    if (product.purchased) return;
    const success = await spendVukaCoins(product.price, `Compra na VukaStore: ${product.title}`);
    if (success) {
      // In a real app, update the user's purchased items list in DB
      console.log(`Successfully purchased ${product.id}`);
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-none">
              VukaStore<span className="text-amber-500">.</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mb-10 leading-relaxed font-medium">
              O ecossistema exclusivo onde as suas conquistas financeiras tornam-se recompensas reais.
            </p>
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-2xl">🪙</span>
              </div>
              <div>
                <div className="text-sm text-gray-400 font-bold mb-1 uppercase tracking-wider">O Seu Saldo</div>
                <div className="text-3xl font-black text-white">{vukaCoins} <span className="text-amber-500 text-xl">VC</span></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRODUCTS.map(product => {
          const Icon = product.icon;
          const canAfford = vukaCoins >= product.price;
          
          return (
            <div key={product.id} className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8 border border-gray-800 shadow-2xl flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r", product.color)} />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors pointer-events-none" />
              
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br shadow-lg relative z-10",
                product.color
              )}>
                <Icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-black text-white mb-3 relative z-10">{product.title}</h3>
              <p className="text-gray-400 mb-8 font-medium leading-relaxed flex-1 relative z-10">
                {product.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-800 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl drop-shadow-md">🪙</span>
                  <span className="text-2xl font-black text-white tracking-tight">{product.price}</span>
                </div>
                
                <button
                  onClick={() => handlePurchase(product)}
                  disabled={product.purchased || !canAfford}
                  className={cn(
                    "px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg backdrop-blur-md",
                    product.purchased
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : canAfford
                        ? "bg-white text-black hover:bg-gray-200 active:scale-95"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  )}
                >
                  {product.purchased ? (
                    <>Comprado <CheckCircle2 className="w-4 h-4" /></>
                  ) : !canAfford ? (
                    <>Bloqueado <Lock className="w-4 h-4" /></>
                  ) : (
                    <>Resgatar <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
