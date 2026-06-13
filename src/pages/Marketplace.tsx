import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { ShoppingBag, Search, Plus, Filter, MapPin, Star, Tag, ChevronRight, Phone, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  seller: string;
  sellerId: string;
  verified: boolean;
  phone?: string;
  createdAt: number;
}

export default function Marketplace() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Serviços');
  const [newLocation, setNewLocation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newImage, setNewImage] = useState('');

  const CATEGORIES = ['Todos', 'Imóveis', 'Veículos', 'Serviços', 'Eletrónica', 'Moda', 'Outros'];

  // Identificação do utilizador
  const activeUserId = user?.id || 'local-user';
  const activeUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizador VukaPay';

  useEffect(() => {
    const productsCol = collection(db, 'marketplace_listings');
    const q = query(productsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        await seedInitialProducts();
      } else {
        const fetched: Product[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Product));
        setProducts(fetched);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const seedInitialProducts = async () => {
    try {
      const seedData = [
        {
          title: 'Consultoria Financeira Pessoal',
          price: 25000,
          category: 'Serviços',
          location: 'Luanda, Angola',
          rating: 4.9,
          reviews: 124,
          image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
          seller: 'João Silva',
          sellerId: 'user-joao',
          verified: true,
          phone: '+244900000000',
          createdAt: Date.now() - 10000
        },
        {
          title: 'MacBook Pro M2 (2023)',
          price: 1200000,
          category: 'Eletrónica',
          location: 'Luanda Sul',
          rating: 4.5,
          reviews: 12,
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400',
          seller: 'Tech Store Lda',
          sellerId: 'user-tech',
          verified: true,
          phone: '+244900000001',
          createdAt: Date.now() - 20000
        }
      ];

      for (const prod of seedData) {
        await addDoc(collection(db, 'marketplace_listings'), prod);
      }
    } catch (e) {
      console.error('Falha ao semear marketplace inicial:', e);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice || !newLocation.trim()) return;

    try {
      const isVerifiedUser = false; // Mockado: Idealmente vem do perfil
      
      const newAd = {
        title: newTitle.trim(),
        price: Number(newPrice),
        category: newCategory,
        location: newLocation.trim(),
        rating: 5.0,
        reviews: 0,
        image: newImage.trim() || 'https://images.unsplash.com/photo-1513530176992-0cf73e0c8601?auto=format&fit=crop&q=80&w=400',
        seller: activeUserName,
        sellerId: activeUserId,
        verified: isVerifiedUser,
        phone: newPhone.trim(),
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'marketplace_listings'), newAd);
      
      setNewTitle('');
      setNewPrice('');
      setNewLocation('');
      setNewPhone('');
      setNewImage('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar anúncio:', error);
    }
  };

  const handleContactSeller = (product: Product) => {
    if (product.phone) {
      window.open(`https://wa.me/${product.phone.replace(/[^0-9]/g, '')}?text=Olá, vi o seu anúncio "${product.title}" no VukaPay e gostaria de saber mais informações.`, '_blank');
    } else {
      alert(`O utilizador ${product.seller} não disponibilizou um número de contacto direto. Pode tentar encontrá-lo na secção da Comunidade.`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition className="space-y-8 max-w-7xl mx-auto px-4 lg:px-8">
      {/* Hero Section Redesigned */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs uppercase tracking-wider mb-4 border border-brand-100">
            <ShoppingBag className="w-3.5 h-3.5" />
            Marketplace VukaPay
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 tracking-tight leading-tight">
            Negócios locais com a <span className="text-brand-500">confiança</span> da Comunidade
          </h1>
          <p className="text-gray-500 text-base md:text-lg mb-8 leading-relaxed font-medium">
            Compre, venda e anuncie serviços e produtos diretamente para utilizadores verificados do VukaPay. Economia circular e segura em Angola.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Criar Anúncio
          </button>
        </div>
        
        {/* Visual Decoration */}
        <div className="hidden md:flex relative shrink-0 justify-center items-center w-64 h-64 bg-gray-50 rounded-full border border-gray-100">
          <div className="absolute inset-0 bg-brand-500/5 blur-3xl rounded-full" />
          <ShoppingBag className="w-24 h-24 text-brand-400 opacity-80" />
          <Tag className="w-12 h-12 text-emerald-400 absolute top-12 right-10 drop-shadow-md" />
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar anúncios, locais..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium shadow-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full md:w-auto shadow-sm">
          <Filter className="w-4 h-4" />
          Filtros Avançados
        </button>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm cursor-pointer",
              activeCategory === category 
                ? "bg-gray-900 text-white" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-medium">A carregar anúncios...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100 p-8">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-bold text-lg">Nenhum anúncio encontrado.</p>
          <p className="text-gray-400 text-sm mt-1">Seja o primeiro a vender nesta categoria!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513530176992-0cf73e0c8601?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur text-[10px] uppercase tracking-wider font-black rounded-lg text-gray-900 shadow-sm">
                  {product.category}
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 leading-tight group-hover:text-brand-600 transition-colors line-clamp-2 mb-2">
                  {product.title}
                </h3>
                
                <div className="text-xl font-black text-brand-600 mb-4">
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}
                </div>
                
                <div className="mt-auto space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span className="truncate">{product.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                        {product.seller.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[100px]">
                        {product.seller}
                      </span>
                      {product.verified && (
                        <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white ml-0.5 shadow-sm" title="Vendedor Verificado">
                          <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current mr-1" />
                      {product.rating}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 pt-0">
                <button 
                  onClick={() => handleContactSeller(product)}
                  className="w-full py-3 bg-gray-50 hover:bg-brand-50 border border-transparent hover:border-brand-100 text-gray-700 hover:text-brand-700 text-sm font-black rounded-[1.25rem] transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Contactar
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform opacity-50" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar Anúncio */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-left tracking-tight">Criar Novo Anúncio</h2>
            <form onSubmit={handleCreateAd} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Título do Anúncio</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Consultoria Financeira, MacBook Pro..."
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Preço (Kz)</label>
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500"
                  >
                    {CATEGORIES.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Localização</label>
                <input 
                  type="text" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ex: Luanda Sul, Talatona..."
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Contacto (+244)</label>
                <input 
                  type="text" 
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ex: +244900000000"
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">URL da Imagem (Opcional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="url" 
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageTransition>
  );
}
