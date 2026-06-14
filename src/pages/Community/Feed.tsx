import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  arrayUnion, 
  arrayRemove, 
  increment,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { X, Send, Plus, MessageSquare, Heart, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: number;
  likes: string[];
  likesCount: number;
  commentsCount: number;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: number;
}

interface CommunityUser {
  id: string;
  name: string;
  xp: number;
  badge: string;
  avatar: string;
}

interface Challenge {
  title: string;
  participants: string[];
  participantCount: number;
}

export default function Feed() {
  const { user } = useAuth();
  
  // States
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [topUsers, setTopUsers] = useState<CommunityUser[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  
  // Modais
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Investimentos');
  const [newPostContent, setNewPostContent] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'Investimentos' | 'Sucesso' | 'Dicas' | 'Kixiquila'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // Identificação do utilizador atual
  const activeUserId = user?.id || 'local-user';
  const activeUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizador VukaPay';
  const activeUserAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUserName)}&background=random`;

  // 1. Escutar posts em tempo real
  useEffect(() => {
    const postsCol = collection(db, 'community_posts');
    const q = query(postsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: Post[] = snapshot.docs.map(d => {
        const data = d.data();
        const rawLikes = data.likes;
        const likesArray = Array.isArray(rawLikes) ? rawLikes : (data.likedBy && Array.isArray(data.likedBy) ? data.likedBy : []);
        return {
          id: d.id,
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'Geral',
          authorId: data.authorId || 'admin',
          authorName: data.authorName || data.author || 'VukaPay Suporte',
          authorAvatar: data.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.authorName || data.author || 'VukaPay')}&background=059669&color=fff`,
          createdAt: data.createdAt || data.created_at || Date.now(),
          likes: likesArray,
          likesCount: typeof rawLikes === 'number' ? rawLikes : (data.likesCount ?? likesArray.length),
          commentsCount: data.commentsCount || 0
        } as Post;
      });
      setPosts(fetchedPosts);
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Registar utilizador ativo e buscar top utilizadores
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'community_users', activeUserId);
    getDoc(userRef).then(snap => {
      if (!snap.exists()) {
        setDoc(userRef, {
          name: activeUserName,
          xp: 100,
          badge: '🎯 Guardião',
          avatar: activeUserAvatar
        });
      }
    });
  }, [user, activeUserId]);

  // Escutar utilizadores por XP
  useEffect(() => {
    const usersCol = collection(db, 'community_users');
    const q = query(usersCol, orderBy('xp', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: CommunityUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CommunityUser));
      setTopUsers(users);
    });

    return () => unsubscribe();
  }, []);

  // 3. Escutar desafio ativo ("superfluos") + Seeding
  useEffect(() => {
    const challengeRef = doc(db, 'community_challenges', 'superfluos');
    const unsubscribe = onSnapshot(challengeRef, (snap) => {
      if (snap.exists()) {
        setActiveChallenge(snap.data() as Challenge);
      } else {
        setDoc(challengeRef, {
          title: "30 Dias Sem Gastos Supérfluos",
          participants: [],
          participantCount: 0
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Escutar comentários do post selecionado
  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }

    const commentsCol = collection(db, `community_posts/${selectedPost.id}/comments`);
    const q = query(commentsCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments: Comment[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Comment));
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [selectedPost]);



  // Enviar novo post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      const newPost = {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
        authorId: activeUserId,
        authorName: activeUserName,
        authorAvatar: activeUserAvatar,
        createdAt: Date.now(),
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        
        // Alinhamento para compatibilidade com VukaPay Admin
        author: activeUserName,
        created_at: Date.now(),
        likedBy: [],
        isAdmin: false
      };

      await addDoc(collection(db, 'community_posts'), newPost);
      
      // Incrementar 50 XP ao utilizador por participar nas discussões
      const userRef = doc(db, 'community_users', activeUserId);
      await updateDoc(userRef, {
        xp: increment(50)
      }).catch(() => {});

      // Limpar campos e fechar
      setNewPostTitle('');
      setNewPostContent('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar post:', error);
    }
  };

  // Toggling Like
  const handleToggleLike = async (post: Post, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir modal de leitura
    
    const postRef = doc(db, 'community_posts', post.id);
    const hasLiked = post.likes?.includes(activeUserId);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(activeUserId),
          likesCount: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(activeUserId),
          likesCount: increment(1)
        });
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  // Enviar comentário
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedPost) return;

    try {
      const commentsCol = collection(db, `community_posts/${selectedPost.id}/comments`);
      await addDoc(commentsCol, {
        content: newCommentText.trim(),
        authorId: activeUserId,
        authorName: activeUserName,
        authorAvatar: activeUserAvatar,
        createdAt: Date.now()
      });

      // Incrementar o contador de comentários do Post
      const postRef = doc(db, 'community_posts', selectedPost.id);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      // Incrementar 10 XP ao utilizador
      const userRef = doc(db, 'community_users', activeUserId);
      await updateDoc(userRef, {
        xp: increment(10)
      }).catch(() => {});

      setNewCommentText('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  // Participar no Desafio Ativo
  const handleJoinActiveChallenge = async () => {
    if (!activeChallenge) return;
    const challengeRef = doc(db, 'community_challenges', 'superfluos');
    const isJoined = activeChallenge.participants?.includes(activeUserId);

    try {
      if (isJoined) {
        await updateDoc(challengeRef, {
          participants: arrayRemove(activeUserId),
          participantCount: increment(-1)
        });
      } else {
        await updateDoc(challengeRef, {
          participants: arrayUnion(activeUserId),
          participantCount: increment(1)
        });
        
        // Ganhar 150 XP pela adesão ao desafio
        const userRef = doc(db, 'community_users', activeUserId);
        await updateDoc(userRef, {
          xp: increment(150),
          badge: '🎯 Guardião Pro'
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Erro ao participar no desafio:', e);
    }
  };

  // Filtros de Categoria e Ordenação
  const filteredPosts = posts
    .filter(post => activeFilter === 'all' || post.category === activeFilter)
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount);
      }
      return b.createdAt - a.createdAt;
    });

  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Feed Section (Col 1-8) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Welcome Hero / Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-white p-8 border border-gray-100 shadow-sm">
            <div className="relative z-10 max-w-xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs uppercase tracking-wider mb-4 border border-brand-100">
                <MessageSquare className="w-3.5 h-3.5" />
                Fórum Oficial
              </div>
              <h1 className="font-display text-3xl font-black mb-3 text-gray-900 tracking-tight">Bem-vindo à Comunidade VukaPay</h1>
              <p className="font-body-md text-gray-500 mb-6 leading-relaxed font-medium">
                Onde o conhecimento financeiro encontra a colaboração. Compartilhe estratégias, aprenda com especialistas e cresça seu patrimônio com segurança.
              </p>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3.5 bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all font-bold text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Criar Nova Discussão
              </button>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[160px] translate-x-12 translate-y-8 text-brand-500" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
            </div>
          </section>

          {/* Discussion Feed */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight text-left">Discussões Recentes</h2>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSortBy('popular')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                    sortBy === 'popular'
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  Populares
                </button>
                <button 
                  onClick={() => setSortBy('recent')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                    sortBy === 'recent'
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  Novas
                </button>
              </div>
            </div>

            {/* Categorias Pill Filters */}
            <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-gray-100">
              {(['all', 'Investimentos', 'Sucesso', 'Dicas', 'Kixiquila'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all",
                    activeFilter === cat
                      ? "bg-gray-900 text-white"
                      : "bg-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  {cat === 'all' ? 'Tudo' : cat}
                </button>
              ))}
            </div>

            {loadingPosts ? (
              <div className="py-20 text-center text-gray-400">
                <span className="animate-pulse font-medium">Carregando discussões...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100 p-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">Nenhuma discussão encontrada nesta categoria.</p>
                <p className="text-sm text-gray-400 mt-1">Seja o primeiro a criar um tópico!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const hasLiked = post.likes?.includes(activeUserId);
                  return (
                    <article 
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl hover:border-brand-100 transition-all cursor-pointer group text-left relative overflow-hidden"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <img 
                          alt={post.authorName} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-100 bg-gray-50" 
                          src={post.authorAvatar} 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="font-display text-lg font-black text-gray-900 group-hover:text-brand-600 transition-colors leading-tight mb-1">
                            {post.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                              post.category === 'Investimentos' && "bg-brand-50 text-brand-700 border-brand-100",
                              post.category === 'Sucesso' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                              post.category === 'Dicas' && "bg-amber-50 text-amber-700 border-amber-100",
                              post.category === 'Kixiquila' && "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
                            )}>
                              {post.category}
                            </span>
                            <span className="text-gray-400 text-xs font-medium">
                              Postado por <span className="font-bold text-gray-600">@{post.authorName}</span> • {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-6 leading-relaxed font-medium">
                        {post.content}
                      </p>
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={(e) => handleToggleLike(post, e)}
                            className={cn(
                              "flex items-center gap-2 transition-colors cursor-pointer group/like",
                              hasLiked 
                                ? "text-rose-500" 
                                : "text-gray-400 hover:text-rose-500"
                            )}
                          >
                            <Heart className={cn("w-5 h-5", hasLiked && "fill-current")} />
                            <span className="text-sm font-bold">{post.likesCount || 0}</span>
                          </button>
                          <div className="flex items-center gap-2 text-gray-400 group-hover:text-brand-600 transition-colors">
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-bold">{post.commentsCount || 0} comentários</span>
                          </div>
                        </div>
                        <span className="text-brand-600 font-black text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Ler mais <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (Col 9-12) */}
        <aside className="lg:col-span-4 space-y-8 text-left">
          {/* Trending Tips Widget */}
          <section className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-display text-sm font-black flex items-center gap-2 text-gray-900 uppercase tracking-wider">
                <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Dicas Financeiras do Dia
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-black text-sm text-emerald-900 mb-1">Regra dos 50/30/20</h4>
                  <p className="text-xs text-emerald-800/80 font-medium leading-relaxed">Ideal para começar a organizar as economias locais mensalmente em Angola.</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-black text-sm text-brand-900 mb-1">Reserva de Emergência</h4>
                  <p className="text-xs text-brand-800/80 font-medium leading-relaxed">Garanta pelo menos 6 meses de custo fixo com liquidez diária imediata.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Top Members Widget */}
          <section className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h3 className="font-display text-sm font-black mb-5 text-gray-900 uppercase tracking-wider">Membros em Destaque</h3>
            <div className="space-y-4">
              {topUsers.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium">Nenhum perfil registado.</p>
              ) : (
                topUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img alt={item.name} className="w-8 h-8 rounded-full object-cover border border-gray-100 bg-gray-50" src={item.avatar} />
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-900 leading-tight">@{item.name}</p>
                        <span className="bg-brand-50 text-brand-700 border border-brand-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-0.5 inline-block">
                          {item.badge}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600">{item.xp} XP</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Community Challenge Card */}
          <section className="bg-gray-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-gray-800">
            <div className="relative z-10">
              <span className="text-[10px] font-black bg-brand-500 text-white px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Desafio Ativo</span>
              <h3 className="font-display text-xl font-black mb-2 leading-tight">30 Dias Sem Gastos Supérfluos</h3>
              <p className="text-sm text-gray-300 mb-6 font-medium">
                {activeChallenge ? activeChallenge.participantCount : '1.240'} membros participando.
              </p>
              <button 
                onClick={handleJoinActiveChallenge}
                className={cn(
                  "w-full py-3 font-black rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer text-sm",
                  activeChallenge?.participants?.includes(activeUserId)
                    ? "bg-gray-800 border border-gray-700 text-emerald-400 flex items-center justify-center gap-2"
                    : "bg-brand-500 text-white hover:bg-brand-600"
                )}
              >
                {activeChallenge?.participants?.includes(activeUserId) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Inscrito no Desafio
                  </>
                ) : 'Participar Agora'}
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            </div>
          </section>
        </aside>
      </div>

      {/* ─── MODAL: CRIAR DISCUSSÃO ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-left tracking-tight">Criar Nova Discussão</h2>
            <form onSubmit={handleCreatePost} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
                <select 
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="Investimentos">Investimentos</option>
                  <option value="Sucesso">Sucesso</option>
                  <option value="Dicas">Dicas</option>
                  <option value="Kixiquila">Kixiquila</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Título</label>
                <input 
                  type="text" 
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Ex: Como diversificar carteira na BODIVA"
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Conteúdo</label>
                <textarea 
                  rows={5}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Escreva a sua dúvida, partilha ou análise..."
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
                  required
                />
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
                  <Sparkles className="w-4 h-4" />
                  Publicar Discussão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DETALHES DO POST E COMENTÁRIOS ─── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Post */}
            <div className="text-left mb-4 shrink-0 pr-8">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border mb-2 inline-block",
                selectedPost.category === 'Investimentos' && "bg-brand-50 text-brand-700 border-brand-100",
                selectedPost.category === 'Sucesso' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                selectedPost.category === 'Dicas' && "bg-amber-50 text-amber-700 border-amber-100",
                selectedPost.category === 'Kixiquila' && "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
              )}>
                {selectedPost.category}
              </span>
              <h2 className="text-2xl font-black text-gray-900 leading-tight tracking-tight mb-2">
                {selectedPost.title}
              </h2>
              <div className="flex items-center gap-3">
                <img className="w-8 h-8 rounded-full border border-gray-100 bg-gray-50" src={selectedPost.authorAvatar} alt="" />
                <span className="text-xs text-gray-500 font-bold">
                  Postado por @{selectedPost.authorName} • {new Date(selectedPost.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Conteúdo do Post (Scrollable) */}
            <div className="overflow-y-auto flex-1 space-y-6 pr-2 mb-4 scrollbar-thin text-left border-y border-gray-100 py-4">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {selectedPost.content}
              </p>

              {/* Seção de comentários */}
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Comentários</h4>
                {comments.length === 0 ? (
                  <p className="text-xs text-gray-400 font-medium">Nenhum comentário ainda. Escreva o primeiro!</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-start gap-3">
                        <img className="w-7 h-7 rounded-full border border-gray-200 bg-white shrink-0" src={comment.authorAvatar} alt="" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-gray-800">@{comment.authorName}</span>
                            <span className="text-[10px] font-bold text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-600 text-xs leading-relaxed font-medium">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input para Comentar (Shrink-0) */}
            <form onSubmit={handleAddComment} className="shrink-0 pt-2 flex gap-3 text-left">
              <input 
                type="text" 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva um comentário construtivo..."
                className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 placeholder:text-gray-400"
                required
              />
              <button 
                type="submit" 
                className="px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm rounded-xl cursor-pointer active:scale-95 flex items-center justify-center transition-all shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
