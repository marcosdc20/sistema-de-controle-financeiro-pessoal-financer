import React, { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { ShoppingBag, Search, Plus, Filter, MapPin, Star, Tag, ChevronRight, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const CATEGORIES = ['Todos', 'Imóveis', 'Veículos', 'Serviços', 'Eletrónica', 'Moda', 'Outros'];

  const PRODUCTS = [
    {
      id: 1,
      title: 'Consultoria Financeira Pessoal',
      price: 25000,
      category: 'Serviços',
      location: 'Luanda, Angola',
      rating: 4.9,
      reviews: 124,
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      seller: 'João Silva',
      verified: true
    },
    {
      id: 2,
      title: 'MacBook Pro M2 (2023)',
      price: 1200000,
      category: 'Eletrónica',
      location: 'Luanda Sul',
      rating: 4.5,
      reviews: 12,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400',
      seller: 'Tech Store Lda',
      verified: true
    },
    {
      id: 3,
      title: 'Apartamento T3 - Talatona',
      price: 45000000,
      category: 'Imóveis',
      location: 'Talatona, Luanda',
      rating: 5.0,
      reviews: 3,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400',
      seller: 'Imobiliária Vuka',
      verified: false
    },
    {
      id: 4,
      title: 'Aulas Particulares de Inglês',
      price: 15000,
      category: 'Serviços',
      location: 'Online / Presencial',
      rating: 4.8,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400',
      seller: 'Maria Educação',
      verified: true
    }
  ];

  const filteredProducts = activeCategory === 'Todos' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <PageTransition className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-wide uppercase text-gray-200">Vuka Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              Negócios locais com a confiança da Comunidade
            </h1>
            <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed">
              Compre, venda e anuncie serviços e produtos diretamente para utilizadores verificados do VukaPay. Economia circular e segura.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                <Plus className="w-5 h-5" />
                Criar Anúncio
              </button>
            </div>
          </div>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4 hidden md:block">
          <ShoppingBag className="w-96 h-96" />
        </div>
        <div className="absolute top-0 right-[20%] w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar anúncios..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium shadow-sm"
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
              "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col">
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur text-xs font-black rounded-lg text-gray-900 shadow-sm">
                {product.category}
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {product.title}
                </h3>
              </div>
              
              <div className="text-xl font-black text-emerald-600 mb-4">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}
              </div>
              
              <div className="mt-auto space-y-2.5 pt-4 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <span className="truncate">{product.location}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {product.seller.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">
                      {product.seller}
                    </span>
                    {product.verified && (
                      <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white ml-1 shadow-sm" title="Vendedor Verificado">
                        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs font-bold text-yellow-500">
                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                    {product.rating}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-2 pt-0">
              <button className="w-full py-3 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2 group/btn">
                <Phone className="w-3.5 h-3.5" />
                Contactar Vendedor
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform opacity-50" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
