import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { ShieldCheck, Sparkles, X } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDoc,
  setDoc,
  increment,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorLocation: string;
  imageUrl: string;
  category: string;
  createdAt: number;
}

export default function SuccessStories() {
  const { user } = useAuth();
  
  // States
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  
  // Form Modais
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Poupança');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthorLocation, setNewAuthorLocation] = useState('Luanda');

  const activeUserId = user?.id || 'local-user';
  const activeUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizador VukaPay';

  // Escutar histórias do Firestore em tempo real
  useEffect(() => {
    const storiesCol = collection(db, 'community_stories');
    const q = query(storiesCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        await seedInitialStories();
      } else {
        const fetchedStories: Story[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Story));
        setStories(fetchedStories);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Semeador de Histórias
  const seedInitialStories = async () => {
    try {
      const seedStories = [
        {
          title: "De Dívidas a Investidora: A Jornada de Mariana",
          excerpt: "Como a Mariana eliminou as suas dívidas e passou a investir mensalmente.",
          content: "Nunca imaginei que em 24 meses eu sairia de um saldo negativo acumulado para construir um fundo de emergência robusto e diversificar em Kixiquilas familiares. O VukaPay ajudou-me a ver exatamente para onde o meu dinheiro desaparecia...\n\nComecei registrando rigorosamente todas as minhas saídas de caixa diárias. Em seguida, estabeleci limites rígidos para compras não-essenciais e criei uma regra de poupança automatizada assim que recebia o meu ordenado. Hoje, sinto-me 100% no controle da minha vida financeira.",
          authorName: "Mariana Costa",
          authorLocation: "Luanda",
          imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
          category: "Destaque do Mês",
          createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
        },
        {
          title: "Estratégias de Dividendos",
          excerpt: "Como o Ricardo estruturou a sua carteira de dividendos e ações locais.",
          content: "Como o Ricardo planeou as suas poupanças e controlou as ações da BODIVA para obter independência financeira real a longo prazo.\n\nA chave foi a constância: todos os meses, sem exceção, reservei 20% das minhas receitas para comprar ações e títulos locais de alto rendimento. Acompanhar os proventos na minha carteira de investimentos no VukaPay serviu de combustível para me manter disciplinado.",
          authorName: "Ricardo Dividends",
          authorLocation: "Benguela",
          imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
          category: "Aposentadoria Precoce",
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000 // 5 days ago
        },
        {
          title: "Escalando com Caixa Positivo",
          excerpt: "Como o João separou as contas pessoais das empresariais com sucesso.",
          content: "Separar as contas pessoais das empresariais foi o segredo. João revela como estruturou o fluxo do seu negócio local.\n\nDurante muito tempo, confundi o caixa da minha empresa com a minha conta pessoal, o que quase levou o negócio à falência. Ao usar o VukaPay para gerir as minhas despesas pessoais e definir um salário fixo (pró-labore), recuperei a previsibilidade e a liquidez necessárias para reinvestir na empresa.",
          authorName: "João Business",
          authorLocation: "Huambo",
          imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
          category: "Gestão de Negócios",
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
        }
      ];

      for (const story of seedStories) {
        await addDoc(collection(db, 'community_stories'), story);
      }
    } catch (e) {
      console.error('Falha ao semear histórias iniciais:', e);
    }
  };

  // Submeter história
  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newExcerpt.trim()) return;

    try {
      const unsplashImages = [
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop"
      ];
      // Imagem aleatória para a história
      const randomImage = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];

      const newStory = {
        title: newTitle.trim(),
        excerpt: newExcerpt.trim(),
        content: newContent.trim(),
        authorName: activeUserName,
        authorLocation: newAuthorLocation.trim(),
        imageUrl: randomImage,
        category: newCategory,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'community_stories'), newStory);

      // Incrementar 100 XP por partilhar história
      const userRef = doc(db, 'community_users', activeUserId);
      await updateDoc(userRef, {
        xp: increment(100)
      }).catch(() => {});

      // Limpar campos
      setNewTitle('');
      setNewExcerpt('');
      setNewContent('');
      setNewAuthorLocation('Luanda');
      setIsSubmitModalOpen(false);
    } catch (e) {
      console.error('Erro ao submeter história:', e);
    }
  };

  // Separa o destaque das outras histórias
  const featuredStory = stories.find(s => s.category === 'Destaque do Mês') || stories[0];
  const otherStories = stories.filter(s => s.id !== (featuredStory?.id || ''));

  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <span className="animate-pulse">Carregando histórias de sucesso em tempo real...</span>
        </div>
      ) : (
        <>
          {/* Featured Success Story (Large Split Card) */}
          {featuredStory && (
            <div 
              onClick={() => setSelectedStory(featuredStory)}
              className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden flex flex-col lg:flex-row shadow-sm hover:border-brand-200 transition-all text-left group cursor-pointer"
            >
              <div className="lg:w-1/2 relative min-h-[300px] overflow-hidden">
                <img 
                  src={featuredStory.imageUrl} 
                  alt={featuredStory.authorName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent lg:hidden" />
                <span className="absolute top-6 left-6 bg-brand-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  {featuredStory.category}
                </span>
              </div>
              <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-2 text-brand-600">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">História Verificada</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
                  {featuredStory.title}
                </h2>
                <p className="text-base text-gray-600 leading-relaxed italic line-clamp-4">
                  "{featuredStory.excerpt}"
                </p>
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
                  <span className="text-sm text-gray-500 font-bold">
                    {featuredStory.authorName}, {featuredStory.authorLocation}
                  </span>
                  <button className="text-xs font-black text-brand-600 hover:underline flex items-center gap-1 cursor-pointer">
                    Ler Relato Completo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other Success Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {otherStories.map((story) => (
              <div 
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col hover:border-brand-200 transition-colors text-left group cursor-pointer"
              >
                <div className="h-48 rounded-2xl overflow-hidden mb-6 relative">
                  <img 
                    src={story.imageUrl} 
                    alt={story.authorName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">
                    {story.category}
                  </span>
                  <h3 className="font-black text-xl text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1 line-clamp-3">
                    {story.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-bold">{story.authorName}, {story.authorLocation}</span>
                    <button className="text-sm font-bold text-brand-600 hover:underline text-left cursor-pointer">
                      Ler história
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Submit Story CTA (Matches Card Size) */}
            <div 
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-brand-50/50 border border-dashed border-brand-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center group hover:bg-brand-50 transition-colors cursor-pointer min-h-[400px]"
            >
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-gray-900 mb-3">Tens uma História de Sucesso?</h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-[250px] mx-auto mb-8 font-medium">
                Incentiva a comunidade partilhando a tua evolução financeira. Cada pequeno passo motiva novos membros.
              </p>
              <button className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer">
                Partilhar o meu percurso
              </button>
            </div>

          </div>
        </>
      )}

      {/* ─── MODAL: VER RELATO COMPLETO ─── */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <button 
              onClick={() => setSelectedStory(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto flex-1 pr-2 text-left space-y-6 scrollbar-thin">
              <div className="h-64 rounded-3xl overflow-hidden relative mb-6">
                <img 
                  src={selectedStory.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                <span className="absolute bottom-6 left-6 px-3 py-1 bg-brand-600 text-white text-xs font-black uppercase rounded-lg">
                  {selectedStory.category}
                </span>
              </div>

              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2 leading-tight">
                  {selectedStory.title}
                </h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">
                  Por {selectedStory.authorName} • {selectedStory.authorLocation} • {new Date(selectedStory.createdAt).toLocaleDateString()}
                </p>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap space-y-4">
                  {selectedStory.content}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-4 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedStory(null)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: FORMULÁRIO SUBMETER HISTÓRIA ─── */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-left tracking-tight">Partilhar Minha História</h2>
            <form onSubmit={handleSubmitStory} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Poupança">Poupança</option>
                    <option value="Investimentos">Investimentos</option>
                    <option value="Dívidas">Dívida Zero</option>
                    <option value="Negócios">Negócios Locais</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Província / Localização</label>
                  <input 
                    type="text" 
                    value={newAuthorLocation}
                    onChange={(e) => setNewAuthorLocation(e.target.value)}
                    placeholder="Ex: Luanda, Benguela"
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Título do Relato</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Como formei meu fundo de emergência"
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Resumo Rápido (Frase curta)</label>
                <input 
                  type="text" 
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Ex: Guardei meus primeiros 100.000 Kz em 6 meses organizando as despesas."
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">História Completa</label>
                <textarea 
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Conte em pormenor a sua estratégia, dificuldades e metas alcançadas..."
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
                  required
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Publicar Relato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
