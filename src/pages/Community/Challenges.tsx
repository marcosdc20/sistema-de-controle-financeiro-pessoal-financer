import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { Trophy, Target } from 'lucide-react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
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

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  participants: string[];
  participantCount: number;
  duration: string;
  progressPercentage?: number;
  imageUrl?: string;
  xpReward: number;
}

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  badge: string;
}

export default function Challenges() {
  const { user } = useAuth();
  
  // States
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number>(12);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(4);
  const [currentUserXP, setCurrentUserXP] = useState<number>(100);
  const [currentUserBadge, setCurrentUserBadge] = useState<string>('🎯 Guardião');

  const activeUserId = user?.id || 'local-user';

  // 1. Escutar desafios do Firestore em tempo real
  useEffect(() => {
    const challengesCol = collection(db, 'community_challenges');
    
    const unsubscribe = onSnapshot(challengesCol, async (snapshot) => {
      if (snapshot.empty) {
        await seedInitialChallenges();
      } else {
        const fetchedChallenges: Challenge[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Challenge));
        setChallenges(fetchedChallenges);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Escutar ranking de utilizadores e calcular posição atual
  useEffect(() => {
    const usersCol = collection(db, 'community_users');
    const q = query(usersCol, orderBy('xp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers: LeaderboardUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LeaderboardUser));

      setLeaderboard(allUsers.slice(0, 10)); // Exibe top 10
      setTotalUsersCount(allUsers.length);

      // Calcular o rank do utilizador atual
      const curIndex = allUsers.findIndex(u => u.id === activeUserId);
      if (curIndex !== -1) {
        setUserRank(curIndex + 1);
        setCurrentUserXP(allUsers[curIndex].xp);
        setCurrentUserBadge(allUsers[curIndex].badge || '🎯 Guardião');
      }
    });

    return () => unsubscribe();
  }, [activeUserId]);

  // Semeador de desafios
  const seedInitialChallenges = async () => {
    try {
      const initialChallengesData = [
        {
          id: 'superfluos',
          title: "30 Dias Sem Gastos Supérfluos",
          description: "Economizar 50.000 Kz em entretenimento e saídas supérfluas neste ciclo.",
          category: "Urgente",
          participants: ['seed-user-1', 'seed-user-2'],
          participantCount: 1240,
          duration: "9 dias",
          progressPercentage: 70,
          xpReward: 150
        },
        {
          id: 'reserva',
          title: "Reserva de Emergência",
          description: "Meta: 500.000 Kz aplicados em conta poupança líquida até ao fim do ano.",
          category: "Em progresso",
          participants: ['seed-user-1'],
          participantCount: 852,
          duration: "Meta Anual",
          progressPercentage: 30,
          xpReward: 250
        },
        {
          id: 'mestre',
          title: "Mestre dos Dividendos",
          description: "Alcance os seus primeiros 10.000 Kz em dividendos e retornos de investimentos este mês na BODIVA.",
          category: "Renda Passiva",
          participants: [],
          participantCount: 1210,
          duration: "Mensal",
          xpReward: 300,
          imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop"
        },
        {
          id: 'divida',
          title: "Eliminador de Dívidas",
          description: "Quite uma despesa antiga ou empréstimo pendente local este mês para recuperar fôlego financeiro real.",
          category: "Dívida Zero",
          participants: [],
          participantCount: 850,
          duration: "Mensal",
          xpReward: 200,
          imageUrl: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=400&auto=format&fit=crop"
        }
      ];

      for (const ch of initialChallengesData) {
        await setDoc(doc(db, 'community_challenges', ch.id), ch);
      }
    } catch (e) {
      console.error('Falha ao semear desafios iniciais:', e);
    }
  };

  // Participar / Sair do desafio
  const handleToggleChallenge = async (challengeId: string, xpReward: number) => {
    const challengeRef = doc(db, 'community_challenges', challengeId);
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge) return;

    const isJoined = targetChallenge.participants?.includes(activeUserId);

    try {
      if (isJoined) {
        await updateDoc(challengeRef, {
          participants: arrayRemove(activeUserId),
          participantCount: increment(-1)
        });
        
        // Deduzir o XP ganho
        const userRef = doc(db, 'community_users', activeUserId);
        await updateDoc(userRef, {
          xp: increment(-xpReward)
        }).catch(() => {});
      } else {
        await updateDoc(challengeRef, {
          participants: arrayUnion(activeUserId),
          participantCount: increment(1)
        });

        // Adicionar XP e atualizar medalha
        const userRef = doc(db, 'community_users', activeUserId);
        const newXP = currentUserXP + xpReward;
        
        let newBadge = '🎯 Guardião';
        if (newXP >= 1000) newBadge = '🥇 Expert';
        else if (newXP >= 500) newBadge = '🥈 Pro';
        else if (newXP >= 250) newBadge = '🥉 Ativo';

        await updateDoc(userRef, {
          xp: newXP,
          badge: newBadge
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Erro ao alternar participação no desafio:', error);
    }
  };

  const activeChallenges = challenges.filter(c => c.progressPercentage !== undefined);
  const recommendedChallenges = challenges.filter(c => c.progressPercentage === undefined);

  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      
      {/* Header Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm text-left relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Desafios de Poupança Colaborativa</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
              Transforme os seus hábitos financeiros num jogo saudável. Participe nas metas financeiras coletivas, acumule reputação XP e ganhe insígnias decorativas para o seu perfil VukaPay.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-8 relative z-10">
            <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              Desafios Ativos Deste Mês
            </span>
          </div>
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-4 -translate-y-4">
             <Target className="w-48 h-48" />
          </div>
        </div>

        {/* Rank HUD */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden text-left">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
          <div className="flex justify-between items-start z-10 mb-6">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200">
              O seu Rank VukaPay
            </span>
          </div>
          <div className="z-10 mt-auto">
            <div className="text-5xl font-black tracking-tighter mb-1">#{userRank}</div>
            <div className="text-xs text-gray-400 font-medium">Entre {totalUsersCount} poupadores na rede</div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs z-10">
            <span className="text-gray-400 font-medium">Status: {currentUserBadge}</span>
            <span className="font-black text-amber-400">{currentUserXP} XP</span>
          </div>
        </div>
      </div>

      {/* Active Challenges Progress Row */}
      <div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-5 text-left flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" /> Os Seus Desafios Ativos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {activeChallenges.map((ch) => {
            const isJoined = ch.participants?.includes(activeUserId);
            const dashoffset = 251.2 - (251.2 * (ch.progressPercentage || 0)) / 100;
            return (
              <div 
                key={ch.id}
                onClick={() => handleToggleChallenge(ch.id, ch.xpReward)}
                className={cn(
                  "bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-6 group hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left cursor-pointer",
                  isJoined && "border-indigo-600/30 bg-indigo-50/10 dark:bg-indigo-950/5"
                )}
              >
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-gray-100 dark:stroke-slate-800 fill-none" strokeWidth="8" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      className={cn("fill-none transition-all duration-1000", isJoined ? "stroke-indigo-600" : "stroke-gray-300 dark:stroke-slate-700")} 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={dashoffset} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute text-lg font-black text-gray-900 dark:text-white">{ch.progressPercentage}%</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider",
                      ch.category === 'Urgente' 
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" 
                        : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                    )}>
                      {ch.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">{ch.duration}</span>
                  </div>
                  <h4 className="font-black text-base text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {ch.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{ch.description}</p>
                  <span className={cn(
                    "text-xs font-black",
                    isJoined ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
                  )}>
                    {isJoined ? '✓ Inscrito (+'+ch.xpReward+' XP)' : 'Clique para Aderir'}
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Leaderboard and Explore Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Weekly Leaderboard (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center">
            <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-widest text-left">Ranking da Rede</h4>
            <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-850">
            {leaderboard.map((item, idx) => {
              const isCurrentUser = item.id === activeUserId;
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors", 
                    isCurrentUser ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : ''
                  )}
                >
                  <div className="flex items-center gap-4 text-left">
                    <span className={cn("w-6 text-sm font-black", isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400')}>
                      {idx + 1}º
                    </span>
                    <div className={cn(
                      "w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center border", 
                      isCurrentUser 
                        ? "bg-indigo-600 text-white border-indigo-500" 
                        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700"
                    )}>
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className={cn("text-sm font-black", isCurrentUser ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white')}>
                        {item.name} {isCurrentUser && '(Você)'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">{item.badge || '🎯 Guardião'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{item.xp} XP</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Challenges to join (8 Cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {recommendedChallenges.map((ch) => {
            const isJoined = ch.participants?.includes(activeUserId);
            return (
              <div 
                key={ch.id}
                className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between group text-left"
              >
                <div className="h-32 relative bg-gray-200 dark:bg-slate-800 overflow-hidden">
                  <img 
                    src={ch.imageUrl} 
                    alt={ch.title} 
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute bottom-4 left-4 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded uppercase tracking-widest">
                    {ch.category}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="font-black text-lg text-gray-900 dark:text-white mb-2">{ch.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{ch.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-xs text-gray-450 dark:text-gray-500 font-bold">
                      {ch.participantCount} poupadores
                    </span>
                    <button 
                      onClick={() => handleToggleChallenge(ch.id, ch.xpReward)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all active:scale-95 shadow-sm",
                        isJoined
                          ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-850 dark:text-gray-300 dark:border-slate-700"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                      )}
                    >
                      {isJoined ? 'Inscrito ✓' : 'Aderir (+'+ch.xpReward+' XP)'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </PageTransition>
  );
}
