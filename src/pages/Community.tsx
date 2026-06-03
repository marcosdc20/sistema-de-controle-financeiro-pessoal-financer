import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';
import {
  Megaphone, Bell, BookOpen, TrendingUp, Users, MessageSquare,
  Plus, X, Edit2, Trash2, Star, Lightbulb, AlertCircle,
  CheckCircle2, Info, Newspaper, Pin, ChevronRight, Search,
  Heart, Share2, ThumbsUp, ArrowRight, ExternalLink
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';

interface TipItem {
  id: string;
  category: string;
  title: string;
  content: string;
  source?: string;
  icon: React.ElementType;
  color: string;
}

const FINANCIAL_TIPS: TipItem[] = [
  {
    id: '1',
    category: 'Poupança',
    title: 'Regra dos 50/30/20',
    content: 'Aplique 50% das receitas nas necessidades básicas, 30% em desejos pessoais e 20% em poupança e investimentos. Uma forma equilibrada de gerir o seu dinheiro.',
    icon: TrendingUp,
    color: 'bg-emerald-500',
  },
  {
    id: '2',
    category: 'Kixikila',
    title: 'O poder da Kixikila',
    content: 'A Kixikila é uma tradição angolana de poupança coletiva. Junte-se a um grupo de confiança, contribua mensalmente e receba o fundo no seu mês. Uma forma eficaz e cultural de poupar.',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    id: '3',
    category: 'Multicaixa',
    title: 'Use o Multicaixa Express',
    content: 'Utilize o Multicaixa Express para transferências rápidas e seguras. Defina limites de transação e ative as notificações SMS para acompanhar cada movimento.',
    icon: Bell,
    color: 'bg-blue-500',
  },
  {
    id: '4',
    category: 'Inflação',
    title: 'Proteja-se da inflação',
    content: 'Em Angola, a inflação pode corroer o poder de compra. Considere diversificar as suas poupanças em USD ou EUR, além de manter reservas em Kwanza para despesas correntes.',
    icon: AlertCircle,
    color: 'bg-amber-500',
  },
  {
    id: '5',
    category: 'Negócios',
    title: 'Fundo de emergência',
    content: 'Mantenha sempre 3 a 6 meses de despesas num fundo de emergência acessível. Isso garante estabilidade mesmo em períodos de dificuldade económica.',
    icon: Star,
    color: 'bg-indigo-500',
  },
  {
    id: '6',
    category: 'Crédito',
    title: 'Use o crédito com cautela',
    content: 'Antes de contrair um empréstimo, compare as taxas de juro entre os bancos angolanos. O BAI, BFA e BIC têm condições diferentes. Sempre leia o contrato antes de assinar.',
    icon: CheckCircle2,
    color: 'bg-rose-500',
  },
  {
    id: '7',
    category: 'Investimento',
    title: 'Investir na sua educação',
    content: 'O melhor investimento é em si mesmo. Cursos técnicos, especializações e formação contínua aumentam o seu valor no mercado de trabalho e criam novas fontes de rendimento.',
    icon: BookOpen,
    color: 'bg-teal-500',
  },
  {
    id: '8',
    category: 'Impostos',
    title: 'Declare os seus impostos',
    content: 'Como empreendedor angolano, mantenha-se em dia com o IRT (Imposto sobre o Rendimento do Trabalho) e o IVA. Use um contabilista ou o portal da AGT para gerir as suas obrigações fiscais.',
    icon: Newspaper,
    color: 'bg-orange-500',
  },
];

const NEWS_FEED = [
  {
    id: '1',
    title: 'BNA ajusta taxa de juro de referência',
    date: '2025-06-01',
    source: 'Banco Nacional de Angola',
    excerpt: 'O Banco Nacional de Angola ajustou a taxa BNA para controlar a inflação e estabilizar o Kwanza nos mercados cambiais.',
    tag: 'Economia',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: '2',
    title: 'Multicaixa Express atinge 5 milhões de utilizadores',
    date: '2025-05-28',
    source: 'EMIS Angola',
    excerpt: 'O sistema de pagamentos Multicaixa Express registou crescimento significativo, consolidando-se como a principal plataforma de pagamentos móveis em Angola.',
    tag: 'Tecnologia',
    tagColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: '3',
    title: 'Inflação em Angola: O que os angolanos devem saber',
    date: '2025-05-25',
    source: 'INE Angola',
    excerpt: 'O Índice de Preços ao Consumidor revela as categorias mais afetadas pela inflação e as estratégias para proteger o seu poder de compra.',
    tag: 'Inflação',
    tagColor: 'bg-amber-100 text-amber-700',
  },
];

export default function Community() {
  const { profile, formatDate } = useFinance();
  const [activeTipCategory, setActiveTipCategory] = useState('Todos');
  const [likedTips, setLikedTips] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedTipId, setPinnedTipId] = useState<string | null>('1');

  const categories = ['Todos', ...Array.from(new Set(FINANCIAL_TIPS.map(t => t.category)))];

  const filteredTips = useMemo(() => {
    return FINANCIAL_TIPS.filter(t => {
      const matchCat = activeTipCategory === 'Todos' || t.category === activeTipCategory;
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeTipCategory, searchQuery]);

  const toggleLike = (id: string) => {
    setLikedTips(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const cardClass = "bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5";

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </span>
            Comunidade VukaPay
          </h1>
          <p className="text-gray-500 mt-1">Dicas financeiras, notícias e conselhos para o contexto angolano.</p>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium mb-1">Bem-vindo(a) à comunidade 👋</p>
          <h2 className="text-2xl font-bold mb-2">
            {profile?.full_name?.split(' ')[0] || 'Utilizador'}!
          </h2>
          <p className="text-indigo-100 text-sm max-w-md">
            Aqui encontra dicas financeiras adaptadas à realidade angolana, notícias do mercado e conselhos práticos para fazer crescer o seu dinheiro.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tips Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Dicas Financeiras
            </h2>
          </div>

          {/* Search + Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar dicas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTipCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  activeTipCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredTips.map((tip) => {
              const Icon = tip.icon;
              const isLiked = likedTips.has(tip.id);
              const isPinned = pinnedTipId === tip.id;

              return (
                <div key={tip.id} className={cn(cardClass, "relative")}>
                  {isPinned && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      <Pin className="w-3 h-3" /> Fixado
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", tip.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          {tip.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 pr-16">{tip.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{tip.content}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <button
                          onClick={() => toggleLike(tip.id)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-bold transition-all",
                            isLiked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"
                          )}
                        >
                          <Heart className={cn("w-4 h-4 transition-all", isLiked && "fill-current")} />
                          {isLiked ? 'Gostei' : 'Gostar'}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-indigo-500 transition-all">
                          <Share2 className="w-4 h-4" />
                          Partilhar
                        </button>
                        <button
                          onClick={() => setPinnedTipId(isPinned ? null : tip.id)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-bold transition-all",
                            isPinned ? "text-amber-500" : "text-gray-400 hover:text-amber-500"
                          )}
                        >
                          <Pin className="w-4 h-4" />
                          {isPinned ? 'Fixado' : 'Fixar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* News Feed + Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className={cardClass}>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Sabia que...?
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700 font-medium">
                  🏦 Angola tem mais de 20 bancos comerciais operacionais, incluindo BAI, BFA, BIC, SOL e Millennium Angola.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-700 font-medium">
                  📱 O Multicaixa Express permite transferências até 300.000 AOA por dia entre contas pessoais.
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">
                  💰 A Kixikila é reconhecida como um instrumento informal de inclusão financeira em Angola.
                </p>
              </div>
            </div>
          </div>

          {/* News Feed */}
          <div className={cardClass}>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-gray-600" />
              Notícias do Mercado
            </h3>
            <div className="space-y-4">
              {NEWS_FEED.map((news) => (
                <div key={news.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", news.tagColor)}>
                      {news.tag}
                    </span>
                    <span className="text-[10px] text-gray-400">{news.date}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1 leading-snug">{news.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{news.excerpt}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Fonte: {news.source}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
            <Megaphone className="w-8 h-8 text-indigo-200 mb-3" />
            <h3 className="font-bold text-lg mb-1">Precisa de Ajuda?</h3>
            <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
              A equipa VukaPay está disponível para ajudar com qualquer questão financeira ou técnica.
            </p>
            <a
              href="mailto:suporte.vukapay@gmail.com"
              className="flex items-center gap-2 text-sm font-bold text-white bg-white/20 border border-white/30 px-4 py-2.5 rounded-xl hover:bg-white/30 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              suporte.vukapay@gmail.com
            </a>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
