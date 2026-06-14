import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import * as LucideIcons from 'lucide-react';
import { Crown, Zap, Award, Palette, Download, ImageIcon, HeadphonesIcon, ShoppingBag, CheckCircle2, Lock, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { collection, getDocs, setDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const defaultProducts = [
  {
    id: 'course_premium_1',
    title: 'Mastering Personal Finance',
    description: 'Curso Premium avançado com especialistas do mercado angolano.',
    price: 500,
    icon: 'Crown',
    color: 'text-amber-500 bg-amber-50 border-amber-200'
  },
  {
    id: 'feature_reports',
    title: 'Relatórios IA Avançados',
    description: 'Desbloqueie relatórios de Inteligência Artificial para os próximos 3 meses.',
    price: 300,
    icon: 'Zap',
    color: 'text-fuchsia-500 bg-fuchsia-50 border-fuchsia-200'
  },
  {
    id: 'badge_vip',
    title: 'Selo Vuka VIP',
    description: 'Destaque-se na Comunidade e Marketplace com o selo dourado VIP.',
    price: 150,
    icon: 'Award',
    color: 'text-brand-500 bg-brand-50 border-brand-200'
  },
  {
    id: 'theme_dark_premium',
    title: 'Tema Escuro Premium',
    description: 'Desbloqueie a interface em Modo Escuro Absoluto (AMOLED) exclusiva.',
    price: 200,
    icon: 'Palette',
    color: 'text-indigo-500 bg-indigo-50 border-indigo-200'
  },
  {
    id: 'feature_export_pro',
    title: 'Exportação Pro (PDF/Excel)',
    description: 'Permite exportar todos os relatórios em formato PDF e Excel para contabilidade.',
    price: 250,
    icon: 'Download',
    color: 'text-emerald-500 bg-emerald-50 border-emerald-200'
  },
  {
    id: 'icon_pack_premium',
    title: 'Ícones Premium',
    description: 'Mais de 100 ícones extras e animados para categorizar as suas finanças.',
    price: 100,
    icon: 'ImageIcon',
    color: 'text-rose-500 bg-rose-50 border-rose-200'
  },
  {
    id: 'consulting_session',
    title: 'Consultoria Financeira',
    description: 'Ticket de agendamento de 30min com um dos nossos consultores certificados.',
    price: 1000,
    icon: 'Headphones',
    color: 'text-blue-500 bg-blue-50 border-blue-200'
  }
];

export default function VukaStore() {
  const { profile, spendVukaCoins, addVukaCoins } = useFinance();
  const { user } = useAuth();
  const vukaCoins = profile?.vuka_coins || 0;
  
  const [products, setProducts] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const activeUserId = user?.id || 'local-user';

  // Carregar produtos da VukaStore (Firestore) ou seed se vazio
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'vukastore_products'));
        let productsList: any[] = [];
        querySnapshot.forEach((doc) => {
          productsList.push({ id: doc.id, ...doc.data() });
        });

        if (productsList.length === 0) {
          console.log('[VukaStore] Coleção vukastore_products vazia. Executando seed inicial...');
          for (const prod of defaultProducts) {
            await setDoc(doc(db, 'vukastore_products', prod.id), prod);
          }
          productsList = defaultProducts;
        }
        
        // Ordena por preço
        productsList.sort((a, b) => a.price - b.price);
        setProducts(productsList);
      } catch (err) {
        console.error('Erro ao buscar produtos da VukaStore no Firestore:', err);
        // Fallback offline
        setProducts(defaultProducts);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Carregar inventário do usuário
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

  const handlePurchase = async (product: any) => {
    if (purchasedItems.includes(product.id) || loading) return;
    
    const canAfford = vukaCoins >= product.price;
    if (!canAfford) return;

    setLoading(true);
    let coinsSpent = false;
    try {
      // 1. Descontar moedas (através do Contexto que atualiza o Firebase no Finance)
      const success = await spendVukaCoins(product.price, `Compra na VukaStore: ${product.title}`);
      
      if (success) {
        coinsSpent = true;
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
      if (coinsSpent) {
        // ROLLBACK: devolve as moedas
        await addVukaCoins(product.price, `Estorno: Falha na compra de ${product.title}`);
      }
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

      {loadingProducts ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-sm text-gray-500 font-bold">A carregar catálogo de recompensas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(product => {
            // Mapeia o ícone dinamicamente a partir das strings conhecidas ou usa ShoppingBag
            const Icon = (LucideIcons as any)[product.icon] || ShoppingBag;
            const isPurchased = purchasedItems.includes(product.id);
            const canAfford = vukaCoins >= product.price;
            
            return (
              <div key={product.id} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-100 flex flex-col relative overflow-hidden group transition-all duration-300">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border relative z-10 group-hover:scale-110 transition-transform",
                  product.color || "text-brand-500 bg-brand-50 border-brand-200"
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
      )}
    </PageTransition>
  );
}
