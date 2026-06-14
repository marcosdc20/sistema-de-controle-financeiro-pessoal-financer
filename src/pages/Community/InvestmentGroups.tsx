import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { TrendingUp, Users, Star, ShieldCheck, Target } from 'lucide-react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface InvestmentGroup {
  id: string;
  title: string;
  description: string;
  category?: string;
  members: string[];
  memberCount: number;
  returnEstimate?: string;
  riskProfile?: string;
  primaryAsset?: string;
  sentiment?: string;
  progressPercentage?: number;
}

export default function InvestmentGroups() {
  const { user } = useAuth();
  
  // States
  const [groups, setGroups] = useState<InvestmentGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const activeUserId = user?.id || 'local-user';

  // 1. Escutar grupos do Firestore em tempo real
  useEffect(() => {
    const groupsCol = collection(db, 'community_groups');
    
    const unsubscribe = onSnapshot(groupsCol, async (snapshot) => {
      if (snapshot.empty) {
        await seedInitialGroups();
      } else {
        const fetchedGroups: InvestmentGroup[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as InvestmentGroup));
        setGroups(fetchedGroups);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Semeador de grupos
  const seedInitialGroups = async () => {
    try {
      const initialGroupsData = [
        {
          id: 'imobiliario',
          title: "Imobiliário de Luxo & REITs",
          description: "Discussões profundas sobre fundos imobiliários locais, incorporação, rendas prediais urbanas e cálculo de taxas de rentabilidade de ativos de alto padrão.",
          category: "Destaque Oficial",
          members: [],
          memberCount: 0,
          returnEstimate: "8.5% a.a.",
          riskProfile: "Moderado"
        },
        {
          id: 'cripto',
          title: "Cripto & Web3",
          description: "Análise fundamentalista de ativos de Web3, custódia fria (cold wallets) e estratégias avançadas de DeFi.",
          members: [],
          memberCount: 0,
          primaryAsset: "BTC / ETH",
          sentiment: "Otimista"
        },
        {
          id: 'stocks',
          title: "Mercado de Capitais",
          description: "Análise de ações locais na BODIVA, ações globais de alto rendimento de dividendos e fundos mútuos.",
          members: [],
          memberCount: 0
        },
        {
          id: 'fire',
          title: "Aposentadoria Precoce (FIRE)",
          description: "Estratégias de reservas a longo prazo e contas poupança de juros compostos para independência financeira.",
          members: [],
          memberCount: 0,
          progressPercentage: 67
        }
      ];

      for (const group of initialGroupsData) {
        await setDoc(doc(db, 'community_groups', group.id), group);
      }
    } catch (e) {
      console.error('Falha ao semear grupos iniciais:', e);
    }
  };

  // Aderir / Sair do grupo
  const handleToggleGroup = async (groupId: string) => {
    const groupRef = doc(db, 'community_groups', groupId);
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    const isMember = targetGroup.members?.includes(activeUserId);

    try {
      if (isMember) {
        await updateDoc(groupRef, {
          members: arrayRemove(activeUserId),
          memberCount: increment(-1)
        });
      } else {
        await updateDoc(groupRef, {
          members: arrayUnion(activeUserId),
          memberCount: increment(1)
        });

        // Adicionar 30 XP pela participação no grupo de investimento
        const userRef = doc(db, 'community_users', activeUserId);
        await updateDoc(userRef, {
          xp: increment(30)
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Erro ao alternar participação no grupo:', error);
    }
  };

  const getGroupById = (id: string) => groups.find(g => g.id === id);

  // Mapeia para variáveis locais para preservar exatamente o visual
  const imobiliario = getGroupById('imobiliario');
  const cripto = getGroupById('cripto');
  const stocks = getGroupById('stocks');
  const fire = getGroupById('fire');

  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="relative z-10 max-w-2xl text-left">
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3 tracking-tight">Círculos de Investimento Coletivo</h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
            Junte-se a círculos de mentoria financeira focados, compartilhe estratégias sobre mercados e controle as suas carteiras locais em colaboração com outros membros VIP.
          </p>
        </div>
        <div className="w-16 h-16 bg-brand-100 border border-brand-200 rounded-2xl flex items-center justify-center text-brand-600 shrink-0 shadow-sm">
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <span className="animate-pulse">Carregando círculos de investimento em tempo real...</span>
        </div>
      ) : (
        /* Groups Grid */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Featured Group - Real Estate (8 Cols) */}
          {imobiliario && (
            <div className="md:col-span-8 bg-white border border-gray-100 rounded-3xl p-8 flex flex-col justify-between min-h-[380px] shadow-sm relative overflow-hidden group hover:border-brand-200 transition-colors">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop" 
                  alt="Real Estate Building" 
                  className="w-full h-full object-cover opacity-5 scale-105 group-hover:scale-100 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="relative z-10 text-left">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    {imobiliario.category || 'Destaque Oficial'}
                  </span>
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {imobiliario.memberCount} membros ativos
                  </span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{imobiliario.title}</h3>
                <p className="text-sm text-gray-600 max-w-xl mb-8 leading-relaxed">
                  {imobiliario.description}
                </p>

                <div className="flex gap-10">
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Retorno Médio Estimado</span>
                    <p className="text-xl font-black text-emerald-600 mt-1">{imobiliario.returnEstimate}</p>
                  </div>
                  <div className="w-[1px] bg-gray-200" />
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Perfil de Risco</span>
                    <p className="text-xl font-black text-brand-600 mt-1">{imobiliario.riskProfile}</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <div className="flex -space-x-3 overflow-hidden">
                  {['LC', 'AS', 'RM', '+2k'].map((initial, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-brand-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {initial}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleToggleGroup(imobiliario.id)}
                  className={cn(
                    "px-6 py-3 text-sm font-black rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95",
                    imobiliario.members?.includes(activeUserId)
                      ? "bg-gray-50 text-gray-600 border-gray-200"
                      : "bg-brand-500 hover:bg-brand-600 text-white border-transparent hover:shadow-brand-500/20"
                  )}
                >
                  {imobiliario.members?.includes(activeUserId) ? 'Já é Membro (Sair)' : 'Aderir ao Grupo'}
                </button>
              </div>
            </div>
          )}

          {/* Crypto & Web3 (4 Cols) */}
          {cripto && (
            <div className="md:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-200 transition-colors text-left">
              <div>
                <div className="w-12 h-12 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center text-brand-600 mb-5 shadow-sm">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg text-gray-900 mb-2">{cripto.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
                  {cripto.description}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Ativo Principal</span>
                  <span className="font-bold text-gray-900">{cripto.primaryAsset}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Sentimento</span>
                  <span className="font-extrabold text-emerald-600">{cripto.sentiment}</span>
                </div>
                <button 
                  onClick={() => handleToggleGroup(cripto.id)}
                  className={cn(
                    "w-full py-3 mt-4 text-sm font-black rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm",
                    cripto.members?.includes(activeUserId) 
                      ? "border-brand-200 bg-brand-50 text-brand-700" 
                      : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100"
                  )}
                >
                  {cripto.members?.includes(activeUserId) ? '✓ Membro (Sair)' : 'Participar (' + cripto.memberCount + ')'}
                </button>
              </div>
            </div>
          )}

          {/* Stocks & Shares (4 Cols) */}
          {stocks && (
            <div className="md:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-200 transition-colors text-left">
              <div>
                <div className="w-12 h-12 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center text-brand-600 mb-5 shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg text-gray-900 mb-2">{stocks.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
                  {stocks.description}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="bg-brand-50 border border-brand-100 p-3 rounded-xl mb-4 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
                  <span className="text-xs font-bold text-brand-800 leading-tight">Supervisionado por Mentores Seniores</span>
                </div>
                <button 
                  onClick={() => handleToggleGroup(stocks.id)}
                  className={cn(
                    "w-full py-3 text-sm font-black rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm",
                    stocks.members?.includes(activeUserId) 
                      ? "border-brand-200 bg-brand-50 text-brand-700" 
                      : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100"
                  )}
                >
                  {stocks.members?.includes(activeUserId) ? '✓ Membro (Sair)' : 'Participar (' + stocks.memberCount + ')'}
                </button>
              </div>
            </div>
          )}

          {/* Long-Term Savings (4 Cols) */}
          {fire && (
            <div className="md:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-200 transition-colors text-left">
              <div>
                <div className="w-12 h-12 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center text-brand-600 mb-5 shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg text-gray-900 mb-2">{fire.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
                  {fire.description}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${fire.progressPercentage || 67}%` }} />
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-500">Meta do Grupo</span>
                  <span className="text-brand-600">{fire.progressPercentage || 67}% Alcançada</span>
                </div>
                <button 
                  onClick={() => handleToggleGroup(fire.id)}
                  className={cn(
                    "w-full py-3 mt-2 text-sm font-black rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm",
                    fire.members?.includes(activeUserId) 
                      ? "border-brand-200 bg-brand-50 text-brand-700" 
                      : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100"
                  )}
                >
                  {fire.members?.includes(activeUserId) ? '✓ Membro (Sair)' : 'Participar (' + fire.memberCount + ')'}
                </button>
              </div>
            </div>
          )}

          {/* Educational Mentorship Widget (4 Cols) */}
          <div className="md:col-span-4 bg-emerald-50 border-l-[6px] border-l-emerald-600 border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Star className="w-5 h-5 fill-current" />
                <h4 className="font-black text-sm uppercase tracking-wider">Visão Académica Diária</h4>
              </div>
              <p className="text-sm text-emerald-900/80 leading-relaxed italic font-medium">
                "Diversificar os investimentos entre títulos de curto prazo e reservas físicas é a melhor blindagem contra a depreciação e flutuações da moeda local."
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-emerald-200">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">MS</div>
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Por Mentor Sénior VukaPay</span>
            </div>
          </div>

        </div>
      )}
    </PageTransition>
  );
}
