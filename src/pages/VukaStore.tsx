import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { Award, Lock, Crown, Zap, ChevronRight, CheckCircle2, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function VukaStore() {
  const { profile, spendVukaCoins } = useFinance();
  const { user } = useAuth();
  const vukaCoins = profile?.vuka_coins || 0;
  
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const activeUserId = user?.id || 'local-user';

  const PRODUCTS = [
    {
      id: 'course_premium_1',
      title: 'Mastering Personal Finance',
      description: 'Curso Premium avançado com especialistas do mercado angolano.',
      price: 500,
      icon: Crown,
      color: 'text-amber-500 bg-amber-50 border-amber-200'
    },
    {
      id: 'feature_reports',
      title: 'Relatórios IA Avançados',
      description: 'Desbloqueie relatórios de Inteligência Artificial para os próximos 3 meses.',
      price: 300,
      icon: Zap,
      color: 'text-fuchsia-500 bg-fuchsia-50 border-fuchsia-200'
    },
    {
      id: 'badge_vip',
      title: 'Selo Vuka VIP',
      description: 'Destaque-se na Comunidade e Marketplace com o selo dourado VIP.',
      price: 150,
      icon: Award,
      color: 'text-brand-500 bg-brand-50 border-brand-200'
    }
  ];

  useEffect(() => {
    if (!user) return;
    const fetchUserInventory = async () => {
      const userRef = doc(db, 'community_users', activeUserId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.purchased_items) {
          setPurchasedItems(data.purchased_items);
        }
      }
    };
    fetchUserInventory();
  }, [user, activeUserId]);

  const handlePurchase = async (product: typeof PRODUCTS[0]) => {
    if (purchasedItems.includes(product.id) || loading) return;
    
    const canAfford = vukaCoins >= product.price;
    if (!canAfford) return;

    setLoading(true);
    try {
      // 1. Descontar moedas (através do Contexto que atualiza o Firebase no Finance)
      const success = await spendVukaCoins(product.price, `Compra na VukaStore: ${product.title}`);
      
      if (success) {
        // 2. Adicionar ao inventário do utilizador na Comunidade
        const userRef = doc(db, 'community_users', activeUserId);
        
        const updates: any = {
          purchased_items: arrayUnion(product.id)
        };
        
        // Se for o badge VIP, aplica imediatamente
        if (product.id === 'badge_vip') {
          updates.badge = '👑 Vuka VIP';
        }
        
        await updateDoc(userRef, updates);
        setPurchasedItems(prev => [...prev, product.id]);
        
        alert(`Compra de "${product.title}" efetuada com sucesso!`);
      }
    } catch (err) {
      console.error('Erro ao comprar item:', err);
      alert('Não foi possível processar a compra. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto px-4 lg:px-8">
      {/* Hero Section Redesigned */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs uppercase tracking-wider mb-4 border border-brand-100">
            <ShoppingBag className="w-3.5 h-3.5" />
            VukaStore Oficial
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-gray-900">
            VukaStore<span className="text-brand-500">.</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl mb-10 leading-relaxed font-medium">
            O ecossistema exclusivo onde as suas conquistas financeiras tornam-se recompensas reais.
          </p>
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-2xl drop-shadow-sm">🪙</span>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-bold mb-1 uppercase tracking-wider">O Seu Saldo</div>
              <div className="text-3xl font-black text-gray-900">{vukaCoins} <span className="text-amber-500 text-xl">VC</span></div>
            </div>
          </div>
        </div>
        
        {/* Visual Decoration */}
        <div className="hidden md:flex relative shrink-0 justify-center items-center w-64 h-64 bg-gray-50 rounded-full border border-gray-100">
          <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full" />
          <span className="text-[100px] drop-shadow-xl z-10">🪙</span>
          <Crown className="w-12 h-12 text-amber-400 absolute top-10 right-10 drop-shadow-md z-20 transform rotate-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRODUCTS.map(product => {
          const Icon = product.icon;
          const isPurchased = purchasedItems.includes(product.id);
          const canAfford = vukaCoins >= product.price;
          
          return (
            <div key={product.id} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-100 flex flex-col relative overflow-hidden group transition-all duration-300">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border relative z-10 group-hover:scale-110 transition-transform",
                product.color
              )}>
                <Icon className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-3 relative z-10 leading-tight">{product.title}</h3>
              <p className="text-gray-500 mb-8 font-medium leading-relaxed flex-1 relative z-10 text-sm">
                {product.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl drop-shadow-sm">🪙</span>
                  <span className="text-2xl font-black text-gray-900 tracking-tight">{product.price}</span>
                </div>
                
                <button
                  onClick={() => handlePurchase(product)}
                  disabled={isPurchased || !canAfford || loading}
                  className={cn(
                    "px-5 py-3 rounded-[1.25rem] font-black text-sm flex items-center gap-2 transition-all",
                    isPurchased
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : canAfford
                        ? "bg-gray-900 text-white hover:bg-brand-600 active:scale-95 shadow-sm cursor-pointer"
                        : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                  )}
                >
                  {isPurchased ? (
                    <>Adquirido <CheckCircle2 className="w-4 h-4" /></>
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
