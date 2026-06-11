import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useTranslation } from '@/services/translationService';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Users,
  Trophy,
  Sparkles,
  Search,
  ThumbsUp,
  Share2,
  Send,
  Compass,
  ArrowRight,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  Lightbulb,
  DollarSign,
  Star,
  Quote,
  Activity,
  Plus,
  Database
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';

interface DiscussionPost {
  id: string;
  category: string;
  title: string;
  content: string;
  author: string;
  time: string;
  likes: number;
  commentsCount: number;
  liked?: boolean;
}

export default function Community() {
  const { profile } = useFinance();
  const { lang } = useTranslation();

  // Tabs: 'feed' (Feed), 'groups' (Grupos de Investimento), 'challenges' (Desafios), 'stories' (Histórias de Sucesso)
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'challenges' | 'stories'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated Interactive Feed State
  const [posts, setPosts] = useState<DiscussionPost[]>([
    {
      id: 'p1',
      category: 'Investimentos',
      title: 'Estratégias de Dividendos para 2026: O que esperar?',
      content: 'Com as recentes alterações nas taxas de juro de referência do BNA, muitos investidores estão a analisar a migração para obrigações do tesouro e carteiras de alto rendimento focadas em kwanza. Esta é a minha análise dos setores locais...',
      author: 'RicardInvesth',
      time: 'Há 2 horas',
      likes: 124,
      commentsCount: 42,
      liked: false
    },
    {
      id: 'p2',
      category: 'Sucesso',
      title: 'Como amortizei o meu crédito habitacional em 5 anos',
      content: 'A estratégia foi focada em poupar taxas extras, renegociar spreads e usar amortizações parciais todos os semestres. Criei um simulador robusto no VukaPay e mantive a disciplina. Deixo aqui a planilha que usei para priorizar...',
      author: 'AnaPoupança',
      time: 'Há 5 horas',
      likes: 382,
      commentsCount: 156,
      liked: true
    },
    {
      id: 'p3',
      category: 'Poupança',
      title: 'Regra dos 50/30/20 adaptada à realidade de Angola',
      content: 'Numa economia em flutuação, ter uma reserva de alta liquidez faz toda a diferença. Aplique 50% das receitas nas necessidades básicas (alimentação, propinas, renda), 30% em desejos pessoais e 20% em poupança ou kixiquila.',
      author: 'Aline Coelho',
      time: 'Há 1 dia',
      likes: 89,
      commentsCount: 12,
      liked: false
    },
    {
      id: 'p4',
      category: 'Segurança',
      title: 'Segurança e Práticas de Controle no Multicaixa Express',
      content: 'Dica de ouro para o mercado nacional: Nunca compartilhe coordenadas do seu cartão ou códigos SMS recebidos por terceiros. Configure no VukaPay o seu teto diário de transferências para ter controle analítico real das suas movimentações financeiras.',
      author: 'Cristina Oliveira',
      time: 'Há 3 dias',
      likes: 245,
      commentsCount: 33,
      liked: false
    }
  ]);

  // Create discussion state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newContent, setNewContent] = useState('');

  // Groups Join Simulation State
  const [joinedGroups, setJoinedGroups] = useState<string[]>(['Imobiliário']);

  // Challenges Joined Simulation State
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(['30dias']);

  // Handle post creation
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost: DiscussionPost = {
      id: `p-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      author: profile?.full_name || 'Utilizador VukaPay',
      time: 'Agora mesmo',
      likes: 0,
      commentsCount: 0,
      liked: false
    };

    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewContent('');
    setNewCategory('Geral');
    setShowCreateModal(false);
  };

  // Toggle Like
  const handleToggleLike = (id: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
          liked: !post.liked
        };
      }
      return post;
    }));
  };

  // Toggle Group Join
  const handleToggleGroup = (groupName: string) => {
    setJoinedGroups(prev => 
      prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
    );
  };

  // Toggle Challenge Join
  const handleToggleChallenge = (challengeId: string) => {
    setJoinedChallenges(prev => 
      prev.includes(challengeId) ? prev.filter(c => c !== challengeId) : [...prev, challengeId]
    );
  };

  // Filter discussions
  const filteredPosts = useMemo(() => {
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  return (
    <PageTransition className="space-y-6 max-w-7xl mx-auto px-1 text-gray-900 pb-16">
      
      {/* Community Top Header HUD */}
      <div className="bg-white border border-gray-150 rounded-3xl p-4 shadow-[0_4px_30px_rgba(0,0,0,0.01)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center text-brand-650 shadow-sm">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-black text-gray-950">
              <span>VukaPay Network</span>
              <span className="text-[10px] bg-brand-500/10 text-brand-700 px-2 py-0.5 rounded-full font-bold">Oficial</span>
            </div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Finanças Colaborativas & Mentoria</p>
          </div>
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-150 max-w-max overflow-x-auto scrollbar-none">
          {[
            { id: 'feed', label: 'Fórum & Feed', icon: MessageSquare },
            { id: 'groups', label: 'Grupos de Investimento', icon: TrendingUp },
            { id: 'challenges', label: 'Desafios Ativos', icon: Trophy },
            { id: 'stories', label: 'Histórias de Sucesso', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "bg-white text-brand-650 shadow-sm border border-gray-150"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Actions Button */}
        <div className="flex items-center gap-2 justify-end">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-650 text-white rounded-xl text-xs font-black hover:bg-brand-700 active:scale-95 transition-all shadow-sm shadow-brand-500/5 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Discussão</span>
          </button>
        </div>
      </div>

      {/* ────────────────── TABS 1: FEED & FÓRUM ────────────────── */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
          
          {/* Main Feed Section (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search HUD */}
            <div className="bg-white border border-gray-150 rounded-2xl p-3 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 ml-2" />
              <input
                type="text"
                placeholder="Pesquisar discussões, ideias ou dúvidas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm w-full focus:ring-0 focus:outline-none placeholder-gray-400 font-medium"
              />
            </div>

            {/* Discussions List */}
            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <article key={post.id} className="bg-white border border-gray-150 rounded-2xl p-5 hover:border-brand-300 transition-colors shadow-sm duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                          {post.author.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900">@{post.author}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{post.time} em <span className="text-brand-600 font-black">{post.category}</span></p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Discussão
                      </span>
                    </div>

                    <h3 className="text-base font-black text-gray-900 mb-2 hover:text-brand-650 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-650 leading-relaxed mb-4">
                      {post.content}
                    </p>

                    <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleToggleLike(post.id)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer border-none bg-transparent",
                            post.liked ? "text-brand-650" : "text-gray-400 hover:text-gray-650"
                          )}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{post.likes} gostos</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-650 cursor-pointer border-none bg-transparent">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentsCount} comentários</span>
                        </button>
                      </div>

                      <button className="text-[11px] font-bold text-brand-650 hover:underline flex items-center gap-0.5 cursor-pointer border-none bg-transparent">
                        <span>Ver discussão</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-gray-450">
                  <p className="text-sm">Nenhuma discussão encontrada para os termos procurados.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Widgets (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Daily Financial Tip */}
            <div className="bg-[#f0fdf4] border-l-4 border-brand-500 rounded-r-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-brand-700">
                <Lightbulb className="w-5 h-5 shrink-0" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider">Dica de Finanças do Dia</h4>
              </div>
              <p className="text-xs text-gray-750 leading-relaxed">
                "A poupança constante não depende de quanto ganha, mas do rigor com que corta despesas supérfluas. O VukaPay ajuda a monitorizar cada kwanza que sai do seu saldo."
              </p>
              <div className="pt-2 border-t border-brand-200/50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">AC</div>
                <span className="text-[10px] text-gray-500 font-bold">Por Aline Coelho, Expert Vuka</span>
              </div>
            </div>

            {/* Featured Members */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest">Membros em Destaque</h4>
              <div className="space-y-3">
                {[
                  { name: 'Dr. Carlos Invest', role: 'Expert Verificado', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', color: 'from-blue-500 to-indigo-600' },
                  { name: 'Mariana Finanças', role: 'Power Saver', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', color: 'from-emerald-500 to-brand-600' },
                  { name: 'Ricardo Mendonça', role: 'Líder Kixiquila', badge: 'bg-brand-50 text-brand-700 border-brand-100', color: 'from-teal-500 to-emerald-600' }
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between text-xs pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-8 h-8 rounded-full bg-gradient-to-tr flex items-center justify-center font-bold text-white text-[10px] shadow-sm", member.color)}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900">{member.name}</p>
                        <span className={cn("inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5", member.badge)}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold text-brand-650 hover:underline border-none bg-transparent cursor-pointer">Seguir</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline Local SQLite HUD */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Database className="w-5 h-5" />
                <h4 className="font-extrabold text-xs text-gray-800">Privacidade VukaPay</h4>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                As discussões são descarregadas e mantidas localmente. Qualquer publicação local que fizer é guardada no SQLite para garantir a máxima estabilidade offline do sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── TABS 2: GRUPOS DE INVESTIMENTO ────────────────── */}
      {activeTab === 'groups' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Banner */}
          <div className="bg-[#f8fafc] border border-gray-150 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative z-10 max-w-xl text-left">
              <h2 className="text-2xl font-black text-gray-950 mb-2">Círculos de Investimento Coletivo</h2>
              <p className="text-xs text-gray-650 leading-relaxed">
                Junte-se a círculos de mentoria financeira focados, compartilhe estratégias sobre mercados e controle as suas carteiras locais em colaboração com outros membros.
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center text-brand-650 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Featured Group - Real Estate (8 Cols) */}
            <div className="md:col-span-8 bg-white border border-gray-150 rounded-2xl p-6 flex flex-col justify-between min-h-[340px] shadow-sm relative overflow-hidden group hover:border-brand-300 transition-colors">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=600&auto=format&fit=crop" 
                  alt="Real Estate Building" 
                  className="w-full h-full object-cover opacity-5 scale-105 group-hover:scale-100 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-brand-500/10 text-brand-700 text-[10px] font-black uppercase tracking-wider rounded-md">Destaque</span>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> 2.4k membros ativos
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Imobiliário de Luxo & REITs</h3>
                <p className="text-xs text-gray-550 max-w-md mb-6 leading-relaxed">
                  Discussões profundas sobre fundos imobiliários locais, incorporação, rendas prediais urbanas e taxas de rentabilidade de ativos.
                </p>

                <div className="flex gap-8">
                  <div>
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Retorno Médio</span>
                    <p className="text-lg font-black text-emerald-600 mt-0.5">8.5% a.a.</p>
                  </div>
                  <div className="w-[1px] bg-gray-150" />
                  <div>
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Perfil de Risco</span>
                    <p className="text-lg font-black text-brand-650 mt-0.5">Moderado</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {['LC', 'AS', 'RM', '+2k'].map((initial, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {initial}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleToggleGroup('Imobiliário')}
                  className={cn(
                    "px-4 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer",
                    joinedGroups.includes('Imobiliário')
                      ? "bg-gray-100 text-gray-700 border-gray-200"
                      : "bg-brand-650 hover:bg-brand-700 text-white border-brand-500/30"
                  )}
                >
                  {joinedGroups.includes('Imobiliário') ? 'Membro (Sair)' : 'Aderir ao Grupo'}
                </button>
              </div>
            </div>

            {/* Crypto & Web3 (4 Cols) */}
            <div className="md:col-span-4 bg-white border border-gray-150 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-300 transition-colors">
              <div>
                <div className="w-10 h-10 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-brand-650 mb-4">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-gray-900 mb-1">Cripto & Web3</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                  Análise fundamentalista de ativos de Web3, custódia fria (cold wallets) e estratégias de DeFi para kwanza.
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Ativo Principal</span>
                  <span className="font-bold text-gray-800">BTC / ETH</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Sentimento</span>
                  <span className="font-extrabold text-emerald-600">Otimista</span>
                </div>
                <button 
                  onClick={() => handleToggleGroup('Cripto')}
                  className={cn(
                    "w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-850 text-xs font-black rounded-xl border transition-all cursor-pointer mt-2",
                    joinedGroups.includes('Cripto') ? "border-brand-200 bg-brand-50/20 text-brand-700" : "border-gray-200"
                  )}
                >
                  {joinedGroups.includes('Cripto') ? '✓ Aderido' : 'Participar'}
                </button>
              </div>
            </div>

            {/* Stocks & Shares (4 Cols) */}
            <div className="md:col-span-4 bg-white border border-gray-150 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-300 transition-colors">
              <div>
                <div className="w-10 h-10 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-brand-650 mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-gray-900 mb-1">Mercado de Capitais</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                  Análise de ações locais na BODIVA, ações globais de alto rendimento de dividendos e fundos mútuos.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="bg-brand-50/30 border border-brand-100 p-2.5 rounded-lg mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-650 shrink-0" />
                  <span className="text-[9px] font-bold text-brand-700 leading-normal">Supervisionado por Mentores Seniores</span>
                </div>
                <button 
                  onClick={() => handleToggleGroup('Stocks')}
                  className={cn(
                    "w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-850 text-xs font-black rounded-xl border transition-all cursor-pointer",
                    joinedGroups.includes('Stocks') ? "border-brand-200 bg-brand-50/20 text-brand-700" : "border-gray-200"
                  )}
                >
                  {joinedGroups.includes('Stocks') ? '✓ Aderido' : 'Participar'}
                </button>
              </div>
            </div>

            {/* Long-Term Savings (4 Cols) */}
            <div className="md:col-span-4 bg-white border border-gray-150 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-300 transition-colors">
              <div>
                <div className="w-10 h-10 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-brand-650 mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-gray-900 mb-1">Aposentadoria Precoce (FIRE)</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                  Estratégias de kixiquila a longo prazo e contas poupança de juros compostos para conquistar a independência.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: '67%' }} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-400">Meta do Grupo</span>
                  <span className="text-brand-750">67% Alcançada</span>
                </div>
                <button 
                  onClick={() => handleToggleGroup('FIRE')}
                  className={cn(
                    "w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-850 text-xs font-black rounded-xl border transition-all cursor-pointer",
                    joinedGroups.includes('FIRE') ? "border-brand-200 bg-brand-50/20 text-brand-700" : "border-gray-200"
                  )}
                >
                  {joinedGroups.includes('FIRE') ? '✓ Aderido' : 'Participar'}
                </button>
              </div>
            </div>

            {/* Educational Mentorship Widget (4 Cols) */}
            <div className="md:col-span-4 bg-[#f0fdf4] border border-brand-100 border-l-[4px] border-l-brand-600 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-brand-700">
                  <Lightbulb className="w-4.5 h-4.5" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">Visão Académica</h4>
                </div>
                <p className="text-[11px] text-gray-700 leading-relaxed italic">
                  "Diversificar os investimentos entre títulos de curto prazo e reservas físicas é a melhor blindagem contra a depreciação e inflação."
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">MS</div>
                <span className="text-[9px] text-gray-500 font-bold">Por Mentor Sénior VukaPay</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────── TABS 3: DESAFIOS DA COMUNIDADE ────────────────── */}
      {activeTab === 'challenges' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 bg-white border border-gray-150 rounded-2xl p-6 flex flex-col justify-between shadow-sm text-left">
              <div>
                <h2 className="text-xl font-black text-gray-950 mb-2">Desafios de Poupança Colaborativa</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Transforme os seus hábitos financeiros num jogo saudável. Participe nas metas financeiras coletivas, acumule reputação XP e ganhe insígnias decorativas para o seu perfil.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-[10px] bg-brand-500/10 text-brand-700 px-2 py-0.5 rounded-full font-bold">Desafios de Junho</span>
              </div>
            </div>

            {/* Rank HUD */}
            <div className="bg-brand-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl" />
              <div className="flex justify-between items-start z-10">
                <Trophy className="w-6 h-6 text-brand-400" />
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-brand-300">O seu Rank</span>
              </div>
              <div className="z-10 mt-2">
                <div className="text-3xl font-black">#12</div>
                <div className="text-[10px] text-gray-400 font-medium">Entre 2.4k poupadores angolanos</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] z-10">
                <span className="text-gray-300">Próxima Insígnia: Guardião Pro</span>
                <span className="font-bold text-brand-400">850 XP</span>
              </div>
            </div>
          </div>

          {/* Active Challenges Progress Row */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-4 text-left">Os Seus Desafios Ativos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Challenge 1 */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center gap-5">
                <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                  {/* SVG circular progress indicator */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="36" cy="36" r="30" className="stroke-gray-100 fill-none" strokeWidth="6" />
                    <circle cx="36" cy="36" r="30" className="stroke-brand-600 fill-none" strokeWidth="6" strokeDasharray="188.4" strokeDashoffset="56.5" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-xs font-black text-gray-800">70%</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="bg-red-50 text-red-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Urgente</span>
                    <span className="text-[10px] text-gray-400 font-bold">Faltam 9 dias</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 mb-1">30 Dias Sem Gastos Supérfluos</h4>
                  <p className="text-[11px] text-gray-500">Meta: Economizar 50.000 Kz em entretenimento e saídas.</p>
                </div>
              </div>

              {/* Challenge 2 */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center gap-5">
                <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="36" cy="36" r="30" className="stroke-gray-100 fill-none" strokeWidth="6" />
                    <circle cx="36" cy="36" r="30" className="stroke-emerald-500 fill-none" strokeWidth="6" strokeDasharray="188.4" strokeDashoffset="131.8" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-xs font-black text-gray-800">30%</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="bg-brand-50 text-brand-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Em progresso</span>
                    <span className="text-[10px] text-gray-400 font-bold">Meta Anual</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 mb-1">Reserva de Emergência Resiliente</h4>
                  <p className="text-[11px] text-gray-500">Meta: 500.000 Kz aplicados em conta poupança líquida.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Leaderboard and Explore Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Weekly Leaderboard (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-55 border-b border-gray-150 flex justify-between items-center">
                <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest">Ranking Semanal</h4>
                <Trophy className="w-4 h-4 text-brand-650" />
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { name: 'Carlos Mendes', xp: '2.840 XP', rank: '1º', badge: '🥇 Expert' },
                  { name: 'Ana Júlia', xp: '2.710 XP', rank: '2º', badge: '🥈 Pro' },
                  { name: 'Roberto Silva', xp: '2.450 XP', rank: '3º', badge: '🥉 Ativo' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs font-black text-brand-650">{item.rank}</span>
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-gray-900">{item.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{item.xp} • {item.badge}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Challenges to join (8 Cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Challenge Card 1 */}
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:border-brand-300 transition-colors flex flex-col justify-between">
                <div className="h-28 relative bg-gray-250">
                  <img 
                    src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop" 
                    alt="Dividend Wealth" 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded uppercase tracking-wider">Renda Passiva</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="text-left mb-4">
                    <h4 className="font-extrabold text-sm text-gray-900 mb-1">Mestre dos Dividendos</h4>
                    <p className="text-[11px] text-gray-500">Alcance os seus primeiros 10.000 Kz em dividendos e retornos de investimentos este mês.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400 font-bold">1.2k poupadores</span>
                    <button 
                      onClick={() => handleToggleChallenge('mestre')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer border transition-all",
                        joinedChallenges.includes('mestre')
                          ? "bg-gray-100 text-gray-600 border-gray-200"
                          : "bg-brand-650 text-white border-brand-500/30"
                      )}
                    >
                      {joinedChallenges.includes('mestre') ? 'Inscrito' : 'Participar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Challenge Card 2 */}
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:border-brand-300 transition-colors flex flex-col justify-between">
                <div className="h-28 relative bg-gray-250">
                  <img 
                    src="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=400&auto=format&fit=crop" 
                    alt="Zero Debt Freedom" 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-brand-650 text-white text-[9px] font-black rounded uppercase tracking-wider">Dívida Zero</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="text-left mb-4">
                    <h4 className="font-extrabold text-sm text-gray-900 mb-1">Eliminador de Dívidas</h4>
                    <p className="text-[11px] text-gray-500">Quite uma despesa antiga ou empréstimo pendente local este mês para recuperar fôlego financeiro.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400 font-bold">850 poupadores</span>
                    <button 
                      onClick={() => handleToggleChallenge('divida')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer border transition-all",
                        joinedChallenges.includes('divida')
                          ? "bg-gray-100 text-gray-600 border-gray-200"
                          : "bg-brand-650 text-white border-brand-500/30"
                      )}
                    >
                      {joinedChallenges.includes('divida') ? 'Inscrito' : 'Participar'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ────────────────── TABS 4: HISTÓRIAS DE SUCESSO ────────────────── */}
      {activeTab === 'stories' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Featured Success Story (Large Split Card) */}
          <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-sm hover:border-brand-300 transition-colors text-left">
            <div className="lg:w-1/2 relative min-h-[220px]">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" 
                alt="Mariana Costa" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-4 left-4 bg-brand-650 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                Destaque do Mês
              </span>
            </div>
            <div className="lg:w-1/2 p-8 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-1.5 text-brand-650">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider">História de Sucesso Confirmada</span>
              </div>
              <h2 className="text-xl font-black text-gray-950 leading-tight">De Dívidas a Investidora: A Jornada de Mariana</h2>
              <p className="text-xs text-gray-500 leading-relaxed italic">
                "Nunca imaginei que em 24 meses eu sairia de um saldo negativo acumulado para construir um fundo de emergência robusto e diversificar em Kixiquilas familiares. O VukaPay ajudou-me a ver onde o meu dinheiro desaparecia..."
              </p>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-extrabold">Mariana Costa, Luanda</span>
                <span className="text-[10px] font-black text-brand-600">Leitura Recomendada</span>
              </div>
            </div>
          </div>

          {/* Other Success Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Story Card 1 */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 hover:border-brand-300 transition-colors text-left">
              <div className="h-44 rounded-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop" 
                  alt="Ricardo Dividends" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Aposentadoria Precoce</span>
                <h3 className="font-black text-sm text-gray-950 mt-1 mb-2">Estratégias de Dividendos para o Longo Prazo</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Como o Ricardo planeou as suas poupanças anuais e controlou a Bodiva para obter independência financeira parcial aos 45 anos.
                </p>
              </div>
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-bold">
                <span>Há 2 dias</span>
                <span className="text-brand-650">Ver mais</span>
              </div>
            </div>

            {/* Story Card 2 */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 hover:border-brand-300 transition-colors text-left">
              <div className="h-44 rounded-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop" 
                  alt="Family Allowances Souza" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-[9px] font-black text-brand-650 uppercase tracking-wider">Educação Familiar</span>
                <h3 className="font-black text-sm text-gray-950 mt-1 mb-2">Ensinando Finanças para os Filhos com Mesadas</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  A família Souza aplicou o módulo "Contactos & Mesadas" do VukaPay para ensinar orçamento prático e disciplina de poupança aos filhos.
                </p>
              </div>
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-bold">
                <span>Há 1 semana</span>
                <span className="text-brand-650">Ver mais</span>
              </div>
            </div>

          </div>

          {/* Inspirational Member Quote */}
          <div className="bg-gray-55 border border-gray-150 rounded-2xl p-6 flex gap-4 text-left shadow-sm">
            <Quote className="w-8 h-8 text-brand-500/40 shrink-0" />
            <div className="space-y-3">
              <p className="text-xs text-gray-650 leading-relaxed italic">
                "O verdadeiro segredo da estabilidade financeira não reside em acumular tesouros rápidos, mas sim em analisar com precisão diária cada kwanza movimentado. Com a comunidade e o suporte do VukaPay, mantemos o controle total das nossas contas locais."
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">JP</div>
                <span className="text-[10px] text-gray-900 font-black">João Paulo, Membro Vuka VIP</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CREATE DISCUSSION MODAL OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-150 rounded-[2rem] p-6 max-w-lg w-full shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black text-gray-950 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-650" />
              <span>Criar Nova Discussão</span>
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título do Post</label>
                <input
                  type="text"
                  required
                  placeholder="Qual a sua dúvida ou ideia financeira?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Investimentos">Investimentos</option>
                    <option value="Poupança">Poupança</option>
                    <option value="Sucesso">Sucesso</option>
                    <option value="Kixiquila">Kixiquila</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Mensagem / Conteúdo</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva detalhadamente a sua questão, dica ou playbook..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-650 hover:bg-brand-700 text-white font-bold rounded-xl text-xs border-none cursor-pointer"
                >
                  Publicar Fórum
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs border-none cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageTransition>
  );
}
