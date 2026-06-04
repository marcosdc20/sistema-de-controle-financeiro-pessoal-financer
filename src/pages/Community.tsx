import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { useLicense } from '@/context/LicenseContext';
import { useTranslation } from '@/services/translationService';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Video, Users, Trophy, Search, Heart, Share2, Send,
  Mic, MicOff, Video as VideoIcon, VideoOff, Settings, BarChart2,
  LogOut, X, ChevronRight, Info, Newspaper, Sparkles, Plus,
  Award, ShieldAlert, CheckCircle2, Hand, HelpCircle, MapPin,
  Activity, Flame, User, Bell, PlaySquare, Compass, Play,
  ThumbsUp, Volume2, ShieldCheck, Target, ArrowUpRight, Star, PiggyBank
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';

// Firebase imports (used for publishing actual feed posts when online)
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';

interface FirestorePost {
  id: string;
  category: string;
  title: string;
  content: string;
  author: string;
  isAdmin: boolean;
  created_at: number;
  likes: number;
  likedBy?: string[];
}

// ─── Dicionários Multilíngues Estendidos para a Comunidade ────────────────────
const COMMUNITY_TRANSLATIONS: Record<string, Record<string, string>> = {
  'pt-AO': {
    title: 'Comunidade VukaPay',
    welcome: 'Bem-vindo à Comunidade VukaPay',
    welcomeDesc: 'Aprenda, compartilhe e cresça junto com outros empreendedores angolanos.',
    newPost: 'Novo post',
    createPost: 'Criar uma publicação',
    feed: 'Início',
    live: 'Eventos Ao Vivo',
    members: 'Membros da Rede',
    ranking: 'Ranking & Conquistas',
    searchPlaceholder: 'Pesquisar posts, dúvidas ou ideias...',
    spaceTitle: 'Hub de Espaços',
    allSpaces: 'Todos os Espaços',
    startHere: 'Comece Aqui',
    intro: 'Apresentações',
    updates: 'Atualizações e Novidades',
    playbooks: 'Playbooks de Finanças',
    discussions: 'Discussões Estratégicas',
    wins: 'Conquistas e Comemorações',
    replays: 'Replays de Eventos',
    liveStreamTitle: 'Sessão de Mentoria Financeira Ao Vivo',
    liveActiveSpeaker: 'Paula Moraes (Especialista em Gestão)',
    liveSpeaker2: 'Daniel Lacerda',
    liveSpeaker3: 'Roberto Santos',
    liveSpeaker4: 'Cristina Oliveira',
    liveChat: 'Chat do Evento',
    chatPlaceholder: 'Escreva um comentário...',
    pollQuestion: 'Qual ferramenta VukaPay mais agregou valor à sua empresa este mês?',
    pollVoted: 'Obrigado por votar!',
    audienceTitle: 'Gerenciar audiência',
    addMember: 'Adicionar membro',
    memberSearchPlaceholder: 'Pesquisar membros pelo nome ou email...',
    scoreLabel: 'Reputação',
    roleLabel: 'Função',
    entryDateLabel: 'Data de Entrada',
    bioLabel: 'Biografia',
    achievementsLabel: 'Medalhas & Conquistas',
    podiumTitle: 'Líderes de Contribuição do Mês',
    points: 'pontos',
    rankBronzeTitle: 'Poupador Bronze',
    rankBronzeDesc: 'Economizou mais de 100.000 Kz no app este mês.',
    rankKixikilaTitle: 'Líder Kixikila',
    rankKixikilaDesc: 'Organizou com sucesso um grupo local de Kixiquila.',
    rankEliteTitle: 'Criativo de Elite',
    rankEliteDesc: 'Partilhou as melhores planilhas financeiras da comunidade.',
    officialBadge: 'Oficial',
    likesCount: 'Gostos',
    shareLabel: 'Partilhar',
    postTitleLabel: 'Título da Publicação',
    postCategoryLabel: 'Categoria',
    postContentLabel: 'Mensagem',
    cancel: 'Cancelar',
    publish: 'Publicar',
    raisingHand: 'Mão Levantada',
    raiseHand: 'Pedir Palavra',
    screenShare: 'Partilhar Ecrã',
    leave: 'Sair',
    endRoom: 'Encerrar sala',
  },
  'en': {
    title: 'VukaPay Community',
    welcome: 'Welcome to VukaPay Community',
    welcomeDesc: 'Learn, share and grow together with other Angolan entrepreneurs.',
    newPost: 'New post',
    createPost: 'Create a publication',
    feed: 'Home Feed',
    live: 'Live Events',
    members: 'Network Members',
    ranking: 'Ranking & Achievements',
    searchPlaceholder: 'Search posts, questions or ideas...',
    spaceTitle: 'Spaces Hub',
    allSpaces: 'All Spaces',
    startHere: 'Start Here',
    intro: 'Introductions',
    updates: 'Updates & Announcements',
    playbooks: 'Financial Playbooks',
    discussions: 'Strategic Discussions',
    wins: 'Wins & Celebrations',
    replays: 'Event Replays',
    liveStreamTitle: 'Live Financial Mentorship Session',
    liveActiveSpeaker: 'Paula Moraes (Management Specialist)',
    liveSpeaker2: 'Daniel Lacerda',
    liveSpeaker3: 'Roberto Santos',
    liveSpeaker4: 'Cristina Oliveira',
    liveChat: 'Event Chat',
    chatPlaceholder: 'Write a comment...',
    pollQuestion: 'Which VukaPay tool added the most value to your business this month?',
    pollVoted: 'Thank you for voting!',
    audienceTitle: 'Manage audience',
    addMember: 'Add member',
    memberSearchPlaceholder: 'Search members by name or email...',
    scoreLabel: 'Reputation',
    roleLabel: 'Role',
    entryDateLabel: 'Entry Date',
    bioLabel: 'Biography',
    achievementsLabel: 'Badges & Achievements',
    podiumTitle: 'Contribution Leaders of the Month',
    points: 'points',
    rankBronzeTitle: 'Bronze Saver',
    rankBronzeDesc: 'Saved more than 100,000 Kz in the app this month.',
    rankKixikilaTitle: 'Kixikila Leader',
    rankKixikilaDesc: 'Successfully organized a local Kixikila group.',
    rankEliteTitle: 'Elite Creative',
    rankEliteDesc: 'Shared the best financial templates with the community.',
    officialBadge: 'Official',
    likesCount: 'Likes',
    shareLabel: 'Share',
    postTitleLabel: 'Publication Title',
    postCategoryLabel: 'Category',
    postContentLabel: 'Message',
    cancel: 'Cancel',
    publish: 'Publish',
    raisingHand: 'Hand Raised',
    raiseHand: 'Raise Hand',
    screenShare: 'Share Screen',
    leave: 'Leave',
    endRoom: 'End Room',
  },
  'kmb': {
    title: 'Muiji VukaPay',
    welcome: 'Wiza kiambote mu Kikalakalo',
    welcomeDesc: 'Kulongesa ni kukuatekesa makamba moxi ya VukaPay.',
    newPost: 'Kikalakalo kya bhe-bhe',
    createPost: 'Bhange kikalakalo',
    feed: 'Jindolo',
    events: 'Yenda Kithangana',
    members: 'Makamba',
    ranking: 'Kibangu ni Medallas',
    searchPlaceholder: 'Sota o kikalakalo...',
    spaceTitle: 'Kididi kia Jindolo',
    allSpaces: 'Jindolo Joso',
    startHere: 'Mata mu Kididi',
    intro: 'Kujia Makamba',
    updates: 'Imbamba ya Bhe-bhe',
    playbooks: 'Kulongesa Mbongo',
    discussions: 'Nzangela ia Mbote',
    wins: 'Kisangela kia Kula',
    replays: 'Mikolo Miakulu',
    liveStreamTitle: 'Upange wa Mulongesi uala lelo',
    liveActiveSpeaker: 'Paula Moraes (Ulungesi wa Finanças)',
    liveSpeaker2: 'Daniel Lacerda',
    liveSpeaker3: 'Roberto Santos',
    liveSpeaker4: 'Cristina Oliveira',
    liveChat: 'Zuela mu kikalakalo',
    chatPlaceholder: 'Zuela cithangana lelo...',
    pollQuestion: 'Kikalakalo kia VukaPay kia beta o mbote lelo?',
    pollVoted: 'Sakidila kiambote kia votala!',
    audienceTitle: 'Lungeka makamba',
    addMember: 'Bandesa kamba',
    memberSearchPlaceholder: 'Sota kamba ni jina...',
    scoreLabel: 'Kujia',
    roleLabel: 'Kikalakalo',
    entryDateLabel: 'Kithangana kia Bokona',
    bioLabel: 'Upange ue',
    achievementsLabel: 'Medallas ni Ikulu',
    podiumTitle: 'Líderes ja kithangana kyene',
    points: 'pontos',
    rankBronzeTitle: 'Saver ya Bronze',
    rankBronzeDesc: 'Ualunda akumuene 100.000 Kz moxi app.',
    rankKixikilaTitle: 'Ngunza ya Kixiquila',
    rankKixikilaDesc: 'Ualonga kixiquila kiambote mu muiji.',
    rankEliteTitle: 'Nongola ya Elite',
    rankEliteDesc: 'Uasongesa planilhas ja mbongo kiambote.',
    officialBadge: 'Ngunza',
    likesCount: 'Gostos',
    shareLabel: 'Kusongesa',
    postTitleLabel: 'Jina dia post',
    postCategoryLabel: 'Kididi',
    postContentLabel: 'Mulonga',
    cancel: 'Cancelá',
    publish: 'Tula posts',
    raisingHand: 'Maku Lwalu',
    raiseHand: 'Luka Maku',
    screenShare: 'Songesa Tela',
    leave: 'Katuka',
    endRoom: 'Zubisa upange',
  },
  'umb': {
    title: 'Cisoko VukaPay',
    welcome: 'Eya ciwa kovicina VukaPay',
    welcomeDesc: 'Okulilongisa vali olombanja kumuamue la vakuene.',
    newPost: 'Esapulo liokaliye',
    createPost: 'Tula esapulo',
    feed: 'Ovinganyu',
    live: 'Okumona Lelo',
    members: 'Alumbanda',
    ranking: 'Elelo liakulu',
    searchPlaceholder: 'Sandiliya ovicina...',
    spaceTitle: 'Cisoko cose',
    allSpaces: 'Olofesta viose',
    startHere: 'Fetika tulo',
    intro: 'Kuelisa ciwa',
    updates: 'Ondaka yokaliye',
    playbooks: 'Upange Wombongo',
    discussions: 'Olovasola vinene',
    wins: 'Okuyolela kumuamue',
    replays: 'Olofesta viapua',
    liveStreamTitle: 'Okulilongisa Ombongo lelo mu tela',
    liveActiveSpeaker: 'Paula Moraes (Ukuasi wombongo)',
    liveSpeaker2: 'Daniel Lacerda',
    liveSpeaker3: 'Roberto Santos',
    liveSpeaker4: 'Cristina Oliveira',
    liveChat: 'Chat yocisoko',
    chatPlaceholder: 'Soneka vali citeta...',
    pollQuestion: 'Nkia mpila ya VukaPay ya ku kuatisa vali mbongo?',
    pollVoted: 'Okuli kunda o voto!',
    audienceTitle: 'Luleka alumbanda',
    addMember: 'Medisa umbanda',
    memberSearchPlaceholder: 'Sandiliya alumbanda la name...',
    scoreLabel: 'Kujia',
    roleLabel: 'Upange',
    entryDateLabel: 'Utembo weya',
    bioLabel: 'Ocinyo ceyi',
    achievementsLabel: 'Medallas kumuamue',
    podiumTitle: 'Olonjeyi vinene vutembo uulo',
    points: 'pontos',
    rankBronzeTitle: 'Poupador Bronze',
    rankBronzeDesc: 'Ualunda 100.000 Kz vocisoko app.',
    rankKixikilaTitle: 'Kixikila Njeyi',
    rankKixikilaDesc: 'Ualonga ciwa kixikila la makamba.',
    rankEliteTitle: 'Creative ya Elite',
    rankEliteDesc: 'Uasongesa planilhas vutembo wosi.',
    officialBadge: 'Administradores',
    likesCount: 'Gostos',
    shareLabel: 'Lekisa',
    postTitleLabel: 'Jina liokaliye',
    postCategoryLabel: 'Upange',
    postContentLabel: 'Ondaka',
    cancel: 'Teyela',
    publish: 'Kapa esapulo',
    raisingHand: 'Eka Kulu',
    raiseHand: 'Petula Eka',
    screenShare: 'Lekisa Ocisoko',
    leave: 'Tunda',
    endRoom: 'Malisa ocisoko',
  },
  'kg': {
    title: 'Kinkundi VukaPay',
    welcome: 'Luizilu kiambote mu Kinkundi',
    welcomeDesc: 'Kulongesa ye nlundu mbongo kumuamue ye makanda mankaka.',
    newPost: 'Nsangu ya mpa',
    createPost: 'Sola nsangu',
    feed: 'Zimvuala',
    live: 'Mavangu amoyo',
    members: 'Makanda',
    ranking: 'Kinsasa ye Zimponto',
    searchPlaceholder: 'Sota nsangu na komputador...',
    spaceTitle: 'Kinkundi kia bisalu',
    allSpaces: 'Bisalu bionsono',
    startHere: 'Yantika vava',
    intro: 'Kukabula nsangu',
    updates: 'Nsangu zampa',
    playbooks: 'Nlongeso wa mbongo',
    discussions: 'Nzonza zampila mosi',
    wins: 'Kiese kia luyalu',
    replays: 'Bisalu biamana',
    liveStreamTitle: 'Kulongesa Mbongo muna live streaming',
    liveActiveSpeaker: 'Paula Moraes (Mbuta ya Mbongo)',
    liveSpeaker2: 'Daniel Lacerda',
    liveSpeaker3: 'Roberto Santos',
    liveSpeaker4: 'Cristina Oliveira',
    liveChat: 'Zuela mu kinkundi',
    chatPlaceholder: 'Zuela nsangu zaku...',
    pollQuestion: 'Nkia kisalu kia VukaPay kisadisi zimbongo zaku?',
    pollVoted: 'Ntondele na voto yaku!',
    audienceTitle: 'Lulondolo lwa makanda',
    addMember: 'Yika kanda',
    memberSearchPlaceholder: 'Sota kanda mu nkumbu...',
    scoreLabel: 'Kuzola',
    roleLabel: 'Kisalu',
    entryDateLabel: 'Lumbu kia kota',
    bioLabel: 'Nsangu zaku',
    achievementsLabel: 'Medallas ye Conquistas',
    podiumTitle: 'Zimbuta zambote mu ngonda yayi',
    points: 'pontos',
    rankBronzeTitle: 'Saver ya Bronze',
    rankBronzeDesc: 'Ualunda mbongo zingi 100.000 Kz app.',
    rankKixikilaTitle: 'Kixikila Mbuta',
    rankKixikilaDesc: 'Ualondola kixikila kiambote ye makanda.',
    rankEliteTitle: 'Criativo Elite',
    rankEliteDesc: 'Uakabula planilhas muna kinkundi.',
    officialBadge: 'Oficial',
    likesCount: 'Likes',
    shareLabel: 'Kabula',
    postTitleLabel: 'Ntu a nsangu',
    postCategoryLabel: 'Kisalu',
    postContentLabel: 'Nsangu',
    cancel: 'Tula vana',
    publish: 'Kaba nsangu',
    raisingHand: 'Moko ya Banduka',
    raiseHand: 'Moko muna zulu',
    screenShare: 'Songesa kinsasa',
    leave: 'Katuka',
    endRoom: 'Manisa e nsangu',
  }
};

const CATEGORIES = ['Geral', 'Poupança', 'Kixikila', 'Negócios', 'Dúvida', 'Novidades'];

const FALLBACK_TIPS = [
  {
    id: 'f1',
    category: 'Poupança',
    title: 'Regra dos 50/30/20 adaptada a Angola',
    content: 'Aplique 50% das receitas nas necessidades básicas (alimentação, propinas, renda), 30% em desejos pessoais e 20% em poupança ou fundo de maneio. Numa economia volátil, ter 20% resguardados em contas de alta liquidez faz toda a diferença.',
    author: 'Aline Coelho',
    isAdmin: true,
    created_at: Date.now() - 100000,
    likes: 18,
    comments: 4
  },
  {
    id: 'f2',
    category: 'Kixikila',
    title: 'Gerindo a Kixikila sem conflitos',
    content: 'A Kixikila é maravilhosa, mas exige clareza. Use o menu de Poupança/Kixikila do VukaPay para registrar cada rodada, quem já recebeu e quem falta contribuir. Transparência gera confiança e evita mal-entendidos familiares.',
    author: 'Daniel Lacerda',
    isAdmin: false,
    created_at: Date.now() - 200000,
    likes: 34,
    comments: 9
  },
  {
    id: 'f3',
    category: 'Multicaixa',
    title: 'Segurança no Multicaixa Express',
    content: 'Dica de ouro: Nunca compartilhe coordenadas do seu cartão ou códigos SMS recebidos por terceiros. Configure no VukaPay o seu teto diário de transferências para ter controle analítico real das suas movimentações financeiras.',
    author: 'Cristina Oliveira',
    isAdmin: true,
    created_at: Date.now() - 300000,
    likes: 29,
    comments: 11
  }
];

// Mock database de membros para tabela de audiência
const AUDIENCE_MEMBERS = [
  { id: 'm1', name: 'Gustavo Souza', email: 'gsouza@gmail.com', score: '9.2', role: 'Membro', entryDate: '12 Abr 2024', bio: 'Pequeno empresário em Luanda. Fã de Kixikila Digital e planeamento financeiro robusto.', badges: ['🥇 Kixikila Master', '🌱 Poupador Bronze'] },
  { id: 'm2', name: 'Roberto Santos', email: 'betosantos@fox.com', score: '9.4', role: 'Membro', entryDate: '5 Mar 2024', bio: 'Desenvolvedor freelance focado em construir património sólido através de investimentos locais.', badges: ['🏆 Empreendedor Vuka', '📈 Investidor Ativo'] },
  { id: 'm3', name: 'Marcela Alves', email: 'alvesmarcela@gmail.com', score: '6.0', role: 'Membro', entryDate: '22 Jun 2024', bio: 'Estudante universitária de Economia. Aprendendo a poupar e investir usando o VukaPay.', badges: ['🌱 Poupador Bronze'] },
  { id: 'm4', name: 'Daniela Costa', email: 'dcosta@yahoo.com', score: '8.7', role: 'Moderador', entryDate: '9 Mar 2023', bio: 'Mentora de finanças para mulheres empreendedoras. Moderadora dedicada da comunidade Vuka.', badges: ['🛡️ Moderador Vuka', '🌟 Estrela de Ajuda'] },
  { id: 'm5', name: 'Cristina Oliveira', email: 'cris@oliveira.com', score: '8.3', role: 'Administrador', entryDate: '19 Set 2022', bio: 'Administradora oficial do VukaPay. Criadora de conteúdo e palestrante sobre finanças pessoais.', badges: ['🛡️ Administrador Geral', '💎 Membro Pioneiro'] },
  { id: 'm6', name: 'Carlos Ribeiro', email: 'ribeiro@yahoo.com', score: '6.7', role: 'Membro', entryDate: '8 Jul 2024', bio: 'Comerciante no mercado do Kikolo. Gerindo o fluxo de caixa do meu negócio com o app.', badges: ['🏆 Empreendedor Vuka'] },
  { id: 'm7', name: 'Rafael Almeida', email: 'afadesigner@gmail.com', score: '9.7', role: 'Moderador', entryDate: '1 Dez 2023', bio: 'UX Designer angolano apaixonado por acessibilidade financeira e interfaces que encantam.', badges: ['🎨 Criativo de Elite', '🛡️ Moderador Vuka'] }
];

export default function Community() {
  const { profile } = useFinance();
  const { user } = useAuth();
  const { licenseState } = useLicense();
  const { lang } = useTranslation();

  const ct = useMemo(() => {
    return COMMUNITY_TRANSLATIONS[lang] || COMMUNITY_TRANSLATIONS['pt-AO'];
  }, [lang]);

  const [activeTopTab, setActiveTopTab] = useState<'feed' | 'cursos' | 'live' | 'members' | 'ranking'>('feed');
  const [activeSpace, setActiveSpace] = useState<string>('todos');

  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [micMuted, setMicMuted] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [liveChatOpen, setLiveChatOpen] = useState(true);
  const [simulatedChat, setSimulatedChat] = useState<Array<{ sender: string, text: string, time: string, isAdmin?: boolean }>>([
    { sender: 'Paula Moraes', text: 'Olá pessoal! Sejam bem-vindos à nossa mentoria mensal.', time: '19:40', isAdmin: true },
    { sender: 'Gustavo Souza', text: 'Boa tarde Paula! Muito feliz por estar aqui.', time: '19:41' },
    { sender: 'Rafael Almeida', text: 'Excelente iniciativa. Esse tema do MCX Express me interessa muito.', time: '19:42' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({
    'Poupança / Kixikila': 45,
    'Faturação / Negócios': 30,
    'Controle de Contas': 25
  });

  const [selectedMember, setSelectedMember] = useState<typeof AUDIENCE_MEMBERS[0] | null>(null);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'contato' | 'membro' | 'convidado' | 'admin' | 'moderador'>('all');

  const userId = user?.id || licenseState.hardwareId || 'anonymous';

  useEffect(() => {
    const q = query(collection(db, 'community_posts'), orderBy('created_at', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const list: FirestorePost[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as FirestorePost);
        });
        setPosts(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore community posts query failed, falling back to local seed:', err);
        const mockPosts: FirestorePost[] = FALLBACK_TIPS.map(t => ({
          id: t.id,
          category: t.category,
          title: t.title,
          content: t.content,
          author: t.author,
          isAdmin: t.isAdmin,
          created_at: t.created_at,
          likes: t.likes,
          likedBy: []
        }));
        setPosts(mockPosts);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim() || !newContent.trim()) {
      setFormError('Por favor, preencha todos os campos.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_posts'), {
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim(),
        author: profile?.full_name || 'Membro do VukaPay',
        isAdmin: false,
        created_at: Date.now(),
        likes: 0,
        likedBy: []
      });

      setNewTitle('');
      setNewContent('');
      setIsWriteOpen(false);
    } catch (err: any) {
      console.error('Failed to publish post:', err);
      setFormError('Erro ao publicar. Verifique a ligação e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post: FirestorePost) => {
    const postRef = doc(db, 'community_posts', post.id);
    const hasLiked = post.likedBy?.includes(userId) ?? false;

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId)
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId)
        });
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          const likedBy = p.likedBy || [];
          const nextLikedBy = hasLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId];
          return {
            ...p,
            likes: p.likes + (hasLiked ? -1 : 1),
            likedBy: nextLikedBy
          };
        }
        return p;
      }));
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (activeSpace !== 'todos') {
        if (activeSpace === 'comece-agora' && post.category !== 'Geral') return false;
        if (activeSpace === 'apresentacoes' && post.category !== 'Dúvida') return false;
        if (activeSpace === 'novidades' && post.category !== 'Novidades') return false;
        if (activeSpace === 'playbooks' && post.category !== 'Poupança') return false;
        if (activeSpace === 'discussoes' && post.category !== 'Negócios') return false;
        if (activeSpace === 'conquistas' && post.category !== 'Kixikila') return false;
      }

      const matchCategory = categoryFilter === 'Todos' || post.category === categoryFilter;

      const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [posts, categoryFilter, searchQuery, activeSpace]);

  const filteredMembers = useMemo(() => {
    return AUDIENCE_MEMBERS.filter(member => {
      const roleLower = member.role.toLowerCase();
      if (memberRoleFilter !== 'all') {
        if (memberRoleFilter === 'contato') {
          if (roleLower !== 'membro' && roleLower !== 'moderador') return false;
        } else if (memberRoleFilter === 'membro' && roleLower !== 'membro') {
          return false;
        } else if (memberRoleFilter === 'moderador' && roleLower !== 'moderador') {
          return false;
        } else if (memberRoleFilter === 'admin' && roleLower !== 'administrador') {
          return false;
        } else if (memberRoleFilter === 'convidado') {
          if (roleLower !== 'membro' || Number(member.score) >= 8.0) return false;
        }
      }
      const matchSearch = member.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchMemberQuery.toLowerCase());
      return matchSearch;
    });
  }, [searchMemberQuery, memberRoleFilter]);

  const handleSendLiveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setSimulatedChat(prev => [
      ...prev,
      {
        sender: profile?.full_name || 'Membro Vuka',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
  };

  const handleVotePoll = (key: string) => {
    if (hasVoted) return;
    setPollVotes(prev => ({
      ...prev,
      [key]: prev[key] + 1
    }));
    setSelectedVote(key);
    setHasVoted(true);
  };

  const pollPercentages = useMemo(() => {
    const total = Object.values(pollVotes).reduce((a, b) => a + b, 0);
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(pollVotes)) {
      result[key] = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
    }
    return result;
  }, [pollVotes]);

  return (
    <PageTransition className="space-y-6 max-w-7xl mx-auto px-1">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-4 shadow-[0_4px_30px_rgba(0,0,0,0.015)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm font-black text-gray-900 dark:text-white cursor-pointer select-none">
              <span>VukaPay Network</span>
              <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider">Comunidade Oficial</p>
          </div>
        </div>

        <div className="flex bg-gray-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-gray-150/40 dark:border-slate-850 max-w-max mx-auto md:mx-0">
          {[
            { id: 'feed', label: 'Início', icon: Compass },
            { id: 'cursos', label: 'Cursos', icon: PlaySquare },
            { id: 'live', label: 'Eventos', icon: Video },
            { id: 'members', label: 'Membros', icon: Users },
            { id: 'ranking', label: 'Ranking', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTopTab(tab.id as any);
                setActiveSpace('todos');
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeTopTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-150/60 dark:border-slate-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <tab.icon className={cn("w-3.5 h-3.5", tab.id === 'live' && activeTopTab !== 'live' && "text-red-500 animate-pulse")} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors" title="Pesquisar">
            <Search className="w-4.5 h-4.5" />
          </button>
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors relative" title="Notificações">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors" title="Mensagens">
            <MessageSquare className="w-4.5 h-4.5" />
          </button>
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors" title="Explorar">
            <Compass className="w-4.5 h-4.5" />
          </button>
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors" title="Guardados">
            <Star className="w-4.5 h-4.5" />
          </button>
          <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 border border-white dark:border-slate-850 flex items-center justify-center font-black text-white text-[10px] shadow-sm select-none shrink-0 ml-1">
            {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'US'}
          </div>
        </div>
      </div>

      {activeTopTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in fade-in duration-300">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-6">
            <div className="space-y-1">
              <button
                onClick={() => setActiveSpace('todos')}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all border border-transparent",
                  activeSpace === 'todos'
                    ? "bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/30"
                    : "text-gray-650 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Newspaper className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                <span>Feed</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-[9px] uppercase tracking-widest text-gray-450 dark:text-gray-500 px-3.5">
                Hub de Novos Membros
              </h4>
              <div className="flex flex-col gap-0.5">
                {[
                  { id: 'comece-agora', label: 'Comece Agora', icon: MapPin },
                  { id: 'apresentacoes', label: 'Apresentações', icon: MessageSquare }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSpace(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all border border-transparent",
                      activeSpace === item.id
                        ? "bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/30"
                        : "text-gray-650 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-[9px] uppercase tracking-widest text-gray-450 dark:text-gray-500 px-3.5">
                Comunidade
              </h4>
              <div className="flex flex-col gap-0.5">
                {[
                  { id: 'novidades', label: 'Atualizações e Novidades', icon: Bell },
                  { id: 'playbooks', label: 'Playbooks de Finanças', icon: PlaySquare },
                  { id: 'discussoes', label: 'Discussões Estratégicas', icon: MessageSquare },
                  { id: 'conquistas', label: 'Conquistas e Comemorações', icon: Trophy }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSpace(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all border border-transparent",
                      activeSpace === item.id
                        ? "bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/30"
                        : "text-gray-650 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-[9px] uppercase tracking-widest text-gray-450 dark:text-gray-500 px-3.5">
                Eventos
              </h4>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => setActiveSpace('replays')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all border border-transparent",
                    activeSpace === 'replays'
                      ? "bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/30"
                      : "text-gray-650 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Video className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <span>Replays de Eventos</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-850">
              <button
                onClick={() => setActiveTopTab('live')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850 text-xs font-black text-gray-700 dark:text-gray-200 transition-colors"
              >
                <Video className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Iniciar Live</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-650 rounded-full" />
                <span className="text-xs font-black text-gray-900 dark:text-white">Diga Olá</span>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-blue-500 flex items-center justify-center text-[8px] font-black text-white">LC</div>
                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500 flex items-center justify-center text-[8px] font-black text-white">TV</div>
                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white">RF</div>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-550">+ 233</span>
                </div>
                
                <button
                  onClick={() => setIsWriteOpen(true)}
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 transition-transform active:scale-[0.98]"
                >
                  Novo post
                </button>
              </div>
            </div>

            <div className="relative bg-[#1E60F2] rounded-[2rem] p-8 sm:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10 border border-blue-500/20 h-64 flex items-center">
              <div className="absolute inset-y-0 right-0 left-1/4 sm:left-1/3 flex items-center justify-center pointer-events-none select-none">
                <svg className="w-[480px] h-[480px] text-white/5" viewBox="0 0 100 100">
                  <circle cx="70" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.4" />
                  <circle cx="70" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="0.4" />
                  <circle cx="70" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="0.4" />
                  <circle cx="70" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.4" />
                </svg>
              </div>

              <div className="absolute top-10 right-32 hidden md:flex bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 items-center gap-2 text-[10px] font-extrabold animate-bounce duration-[3500ms] select-none">
                <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-[8px] font-black text-white">CO</div>
                <span>Comece Agora</span>
              </div>
              <div className="absolute bottom-12 right-64 hidden xl:flex bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 items-center gap-2 text-[10px] font-extrabold animate-pulse select-none">
                <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center text-[8px] font-black text-white">AP</div>
                <span>Apresentações</span>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-12 hidden lg:flex bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 items-center gap-2 text-[10px] font-extrabold animate-bounce duration-[4500ms] select-none">
                <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[8px] font-black text-white">CC</div>
                <span>Compartilhe Suas Conquistas</span>
              </div>
              <div className="absolute bottom-6 right-20 hidden md:flex bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 items-center gap-2 text-[10px] font-extrabold animate-pulse select-none">
                <div className="w-5 h-5 rounded-full bg-purple-400 flex items-center justify-center text-[8px] font-black text-white">EC</div>
                <span>Estratégias de Crescimento</span>
              </div>
              <div className="absolute top-1/4 right-1/4 pointer-events-none opacity-40">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>

              <div className="relative z-10 space-y-3 max-w-sm sm:max-w-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[9px] font-black tracking-widest uppercase">
                  Comece Agora
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight">
                  Bem-vindo à Comunidade VukaPay Network
                </h2>
              </div>
            </div>

            <div
              onClick={() => setIsWriteOpen(true)}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-4.5 rounded-3xl shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-slate-850 flex items-center justify-center text-blue-600 dark:text-blue-450 font-black text-xs select-none">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Criar um post</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-950 flex items-center justify-center text-gray-450 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                <Plus className="w-4 h-4" />
              </div>
            </div>

            {activeSpace === 'replays' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                {[
                  { id: 'r1', title: 'Mentoria: Gestão de Fluxo de Caixa no MCX Express', date: '15 de Mai 2026', views: '142 visualizações', duration: '55:20', instructor: 'Paula Moraes', thumb: 'from-blue-600/30 to-indigo-650/40 border-indigo-500/20' },
                  { id: 'r2', title: 'Workshop: Planeando a sua Kixiquila Digital', date: '3 de Mai 2026', views: '98 visualizações', duration: '1:12:40', instructor: 'Daniel Lacerda', thumb: 'from-emerald-600/30 to-teal-650/40 border-teal-500/20' },
                  { id: 'r3', title: 'Segurança e Práticas de Contas Bancárias Angolanas', date: '20 de Abr 2026', views: '210 visualizações', duration: '45:10', instructor: 'Cristina Oliveira', thumb: 'from-purple-600/30 to-purple-800/40 border-purple-500/20' }
                ].map(replay => (
                  <div key={replay.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-4.5 shadow-sm space-y-4 hover:shadow-md transition-all duration-300 group">
                    <div className={cn("aspect-video rounded-2xl bg-gradient-to-tr flex flex-col justify-between p-4 relative overflow-hidden text-white border", replay.thumb)}>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="flex justify-between items-start z-10">
                        <span className="px-2 py-0.5 bg-black/45 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-wider">{replay.duration}</span>
                        <PlaySquare className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="z-10 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-[9px] text-white">
                          {replay.instructor.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold text-white/90">{replay.instructor}</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-sm rounded-full flex items-center justify-center transition-all group-hover:scale-105">
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white leading-snug">{replay.title}</h3>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mt-1">
                        <span>{replay.date}</span>
                        <span>{replay.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-4 rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={ct.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-150/60 dark:border-slate-850 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/25 dark:text-white dark:placeholder-gray-600"
                    />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0 items-center">
                    {['Todos', ...CATEGORIES].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                          "px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0",
                          categoryFilter === cat
                            ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm"
                            : "bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-gray-400 border-gray-150/40 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-850"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-16 rounded-3xl text-center shadow-sm">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-xs font-bold">A carregar publicações...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-16 rounded-3xl text-center shadow-sm">
                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Nenhuma publicação encontrada</h3>
                    <p className="text-gray-500 dark:text-gray-450 text-xs max-w-xs mx-auto leading-relaxed">
                      Não foi encontrado nenhum post correspondente. Seja o primeiro a publicar nesta categoria!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map(post => {
                      const isLiked = post.likedBy?.includes(userId) ?? false;
                      const initial = post.author ? post.author.charAt(0).toUpperCase() : 'M';
                      return (
                        <div
                          key={post.id}
                          className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 p-6 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-blue-500/20 dark:hover:border-blue-500/10 transition-all duration-300 group"
                        >
                          <div className="flex gap-4">
                            <div className={cn(
                              "w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-extrabold text-white text-sm shadow-sm select-none",
                              post.isAdmin
                                ? "bg-gradient-to-br from-blue-500 to-indigo-650"
                                : "bg-gradient-to-br from-slate-400 to-slate-500"
                            )}>
                              {post.isAdmin ? <ShieldCheck className="w-5 h-5" /> : initial}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-4 mb-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100/30 dark:border-blue-900/20">
                                    {post.category}
                                  </span>
                                  <span className="text-xs font-bold text-gray-900 dark:text-gray-200">
                                    {post.author}
                                  </span>
                                  {post.isAdmin && (
                                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100/20 dark:border-emerald-900/10">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Oficial
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400 dark:text-gray-550 font-medium">
                                    • {new Date(post.created_at).toLocaleDateString('pt-AO', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <button className="p-1 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                  <span className="font-extrabold text-xs px-0.5">•••</span>
                                </button>
                              </div>

                              <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {post.title}
                              </h3>

                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-305 leading-relaxed whitespace-pre-wrap">
                                {post.content}
                              </p>

                              <div className="flex items-center gap-6 mt-4 pt-3.5 border-t border-gray-50 dark:border-slate-850/60">
                                <button
                                  onClick={() => handleLike(post)}
                                  className={cn(
                                    "flex items-center gap-1.5 text-xs font-bold transition-all",
                                    isLiked
                                      ? "text-rose-500 scale-105"
                                      : "text-gray-400 hover:text-rose-500"
                                  )}
                                >
                                  <Heart className={cn("w-4 h-4 transition-all", isLiked && "fill-current")} />
                                  <span>{post.likes || 0} {post.likes === 1 ? 'Gosto' : 'Gostos'}</span>
                                </button>

                                <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                  <Share2 className="w-4 h-4" />
                                  <span>Partilhar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTopTab === 'cursos' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-1.5">Cursos de Capacitação Financeira</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Aprenda a gerir o seu dinheiro, estruturar poupanças e garantir a sustentabilidade do seu negócio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'c1', title: 'Fundamentos de Finanças Pessoais', desc: 'Aprenda a controlar o seu orçamento diário, poupar e fugir das dívidas de consumo.', lessons: 8, duration: '2h 15m', level: 'Iniciante', instructor: 'Paula Moraes', progress: 100, category: 'Poupança', grad: 'from-blue-600 to-indigo-650' },
              { id: 'c2', title: 'Gestão de Caixa para Pequenos Negócios', desc: 'Como separar o dinheiro pessoal do empresarial e garantir o capital de giro da sua PME.', lessons: 12, duration: '4h 30m', level: 'Intermédio', instructor: 'Aline Coelho', progress: 40, category: 'Negócios', grad: 'from-emerald-600 to-teal-600' },
              { id: 'c3', title: 'Kixiquila Digital Avançada', desc: 'Descubra como estruturar e liderar grupos de poupança coletiva com total segurança e transparência.', lessons: 6, duration: '1h 45m', level: 'Todos', instructor: 'Daniel Lacerda', progress: 0, category: 'Kixikila', grad: 'from-purple-600 to-indigo-700' }
            ].map(course => (
              <div key={course.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                <div className="space-y-3">
                  <div className={cn("h-32 rounded-2xl bg-gradient-to-tr flex items-center justify-center relative overflow-hidden text-white border border-black/5", course.grad)}>
                    <div className="absolute inset-0 bg-black/10" />
                    <PlaySquare className="w-12 h-12 relative z-10 opacity-70 group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/55 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-wider">
                      {course.level}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    <span>{course.category}</span>
                    <span>{course.duration}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{course.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed font-medium">{course.desc}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-50 dark:border-slate-850/60">
                  <div className="flex justify-between items-center text-[9px] font-black text-gray-500">
                    <span>{course.lessons} AULAS</span>
                    <span>{course.progress}% CONCLUÍDO</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-100 dark:border-slate-850">
                    <div
                      style={{ width: `${course.progress}%` }}
                      className={cn("h-full rounded-full bg-blue-600", course.progress === 100 && "bg-emerald-500")}
                    />
                  </div>
                  <button className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-black transition-transform active:scale-[0.98]",
                    course.progress === 100
                      ? "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/5"
                  )}>
                    {course.progress === 100 ? 'Reassistir' : course.progress > 0 ? 'Continuar' : 'Começar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTopTab === 'live' && (
        <div className="flex flex-col xl:flex-row gap-6 animate-in fade-in duration-300">
          <div className="flex-1 flex flex-col bg-slate-950 dark:bg-black rounded-[2rem] overflow-hidden border border-slate-900 shadow-2xl relative">
            <div className="p-4 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-white font-extrabold text-xs uppercase tracking-widest">{ct.liveStreamTitle}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                <Users className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-white text-[10px] font-black">25</span>
              </div>
            </div>

            <div className="flex-1 min-h-[420px] max-h-[580px] p-6 flex flex-col justify-between items-center relative bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="w-full flex-1 flex flex-col items-center justify-center">
                {videoMuted ? (
                  <div className="w-44 h-44 rounded-full bg-indigo-650/20 border-2 border-indigo-500/40 flex items-center justify-center shadow-inner relative animate-pulse">
                    <User className="w-20 h-20 text-indigo-455" />
                    <div className="absolute -bottom-2 bg-indigo-600 px-3.5 py-1.5 rounded-full border border-indigo-400/40 text-[9px] text-white font-black tracking-wider uppercase select-none">
                      Paula Moraes
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full max-w-xl aspect-video rounded-3xl border border-slate-850 overflow-hidden relative shadow-2xl bg-slate-950">
                    <div className="absolute inset-0 bg-indigo-900/10 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2.5 h-2.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[10px] text-indigo-300 mt-2 font-bold tracking-widest uppercase">Transmissão Ativa</span>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs text-white font-bold border border-slate-800/80">
                      {ct.liveActiveSpeaker}
                    </div>
                    <div className="absolute top-4 right-4 bg-red-650 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-white select-none">
                      Host
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 w-full mt-4 max-w-2xl">
                {[
                  { name: ct.liveSpeaker2, muted: false, speaking: true, initials: 'DL', bg: 'bg-emerald-600/20 border-emerald-500/30' },
                  { name: ct.liveSpeaker3, muted: true, speaking: false, initials: 'RS', bg: 'bg-indigo-650/20 border-slate-900' },
                  { name: ct.liveSpeaker4, muted: true, speaking: false, initials: 'CO', bg: 'bg-purple-650/20 border-slate-900' }
                ].map((speaker, idx) => (
                  <div key={idx} className={cn("bg-slate-950/80 border rounded-2xl p-3 flex flex-col items-center justify-center gap-2 aspect-video text-center relative", speaker.bg)}>
                    <div className="w-9 h-9 rounded-full bg-slate-850 flex items-center justify-center text-xs font-black text-white relative select-none">
                      {speaker.initials}
                      {speaker.speaking && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-350 font-bold truncate w-full">{speaker.name}</span>
                    <div className="absolute top-2.5 right-2.5">
                      {speaker.muted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-slate-950 border-t border-slate-900/60 flex flex-wrap justify-between items-center gap-4 z-10">
              <div className="flex items-center gap-2">
                <button className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-850 transition-colors" title="Definições">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-850 transition-colors" title="Métricas">
                  <BarChart2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setHandRaised(!handRaised)}
                  className={cn(
                    "p-3 rounded-xl border transition-colors flex items-center gap-2 text-xs font-bold",
                    handRaised
                      ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-500"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-305 border-slate-850"
                  )}
                >
                  <Hand className="w-4 h-4" />
                  <span>{ct.raiseHand}</span>
                </button>

                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    micMuted
                      ? "bg-red-650/20 hover:bg-red-600/30 text-red-400 border-red-500/20"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-850"
                  )}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => setVideoMuted(!videoMuted)}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    videoMuted
                      ? "bg-red-650/20 hover:bg-red-600/30 text-red-400 border-red-500/20"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-850"
                  )}
                >
                  {videoMuted ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4 text-emerald-400" />}
                </button>

                <button className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 border border-slate-850 transition-colors" title="Partilhar Tela">
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setLiveChatOpen(!liveChatOpen)}
                  className={cn(
                    "p-3 rounded-xl border transition-colors",
                    liveChatOpen
                      ? "bg-blue-600 text-white border-blue-650"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-850"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white rounded-xl text-xs font-bold border border-slate-850 transition-colors">
                  {ct.leave}
                </button>
                <button className="px-4 py-2.5 bg-red-600 hover:bg-red-550 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                  {ct.endRoom}
                </button>
              </div>
            </div>
          </div>

          {liveChatOpen && (
            <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm h-[320px] flex flex-col justify-between">
                <div className="border-b border-gray-100 dark:border-slate-850 pb-3 flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    {ct.liveChat}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-thin">
                  {simulatedChat.map((msg, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-black", msg.isAdmin ? "text-blue-600 dark:text-blue-400" : "text-gray-500")}>
                          {msg.sender}
                        </span>
                        <span className="text-[8px] text-gray-400">{msg.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-gray-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-gray-100/50 dark:border-slate-850">
                        {msg.text}
                      </p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendLiveMessage} className="flex gap-2 border-t border-gray-50 dark:border-slate-850 pt-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={ct.chatPlaceholder}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                  />
                  <button type="submit" className="p-2.5 bg-blue-600 hover:bg-blue-550 text-white rounded-xl transition-all">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-50 dark:border-slate-850 pb-3">
                  <BarChart2 className="w-4 h-4 text-blue-500" />
                  <h3 className="font-extrabold text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Sondagem Ao Vivo</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-relaxed">
                    {ct.pollQuestion}
                  </p>
                  <div className="space-y-2">
                    {Object.keys(pollVotes).map(option => {
                      const pct = pollPercentages[option];
                      return (
                        <button
                          key={option}
                          disabled={hasVoted}
                          onClick={() => handleVotePoll(option)}
                          className={cn(
                            "w-full text-left p-3.5 rounded-2xl text-xs font-bold transition-all relative overflow-hidden border flex justify-between items-center",
                            selectedVote === option
                              ? "border-blue-500 text-blue-600 bg-blue-50/10 dark:bg-blue-950/20"
                              : "border-gray-150 dark:border-slate-800 text-gray-650 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-850"
                          )}
                        >
                          {hasVoted && (
                            <div
                              style={{ width: `${pct}%` }}
                              className="absolute inset-y-0 left-0 bg-blue-500/10 dark:bg-blue-400/10 transition-all duration-500"
                            />
                          )}
                          <span className="relative z-10">{option}</span>
                          {hasVoted && <span className="relative z-10 text-[9px] font-black text-blue-650 dark:text-blue-400">{pct}%</span>}
                        </button>
                      );
                    })}
                  </div>
                  {hasVoted && (
                    <p className="text-[10px] text-emerald-500 dark:text-emerald-450 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ct.pollVoted}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTopTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in fade-in duration-300">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white px-2">
              Audiência
            </h3>
            <div className="flex flex-col gap-0.5">
              {[
                { id: 'gerenciar', label: 'Gerenciar audiência', active: true },
                { id: 'segmentos', label: 'Segmentos', active: false },
                { id: 'convites', label: 'Links de convite', active: false },
                { id: 'tags', label: 'Tags', active: false },
                { id: 'campos', label: 'Campos de perfil', active: false },
                { id: 'registros', label: 'Registros em massa', active: false }
              ].map(item => (
                <button
                  key={item.id}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-xs font-bold text-left transition-all border border-transparent",
                    item.active
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-black"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Gerenciar audiência</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-850 text-gray-400 hover:text-gray-600 transition-colors">
                  <span className="font-black text-sm px-1.5">•••</span>
                </button>
                <button className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl text-xs font-black shadow-sm transition-transform active:scale-[0.98]">
                  Adicionar
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-100 dark:border-slate-805 overflow-x-auto scrollbar-none gap-4">
              {[
                { id: 'all', label: 'Todos', count: '720' },
                { id: 'contato', label: 'Contatos', count: '719' },
                { id: 'membro', label: 'Membros', count: '700' },
                { id: 'convidado', label: 'Convidados', count: '700' },
                { id: 'admin', label: 'Administradores', count: '4' },
                { id: 'moderador', label: 'Moderadores', count: '3' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMemberRoleFilter(tab.id as any)}
                  className={cn(
                    "pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap",
                    memberRoleFilter === tab.id
                      ? "text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white font-black"
                      : "text-gray-400 dark:text-gray-550 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
              {[
                { label: 'Nome' },
                { label: 'Email marketing' },
                { label: 'Membro' },
                { label: 'Fonte' },
                { label: 'Data adicionada' },
                { label: 'Add filter' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 text-gray-600 dark:text-gray-400 rounded-full text-[10px] font-black border border-gray-200 dark:border-slate-800 shrink-0 flex items-center gap-1.5 transition-all active:scale-[0.97]"
                >
                  <span className="text-gray-400">+</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-gray-100 dark:border-slate-805">
              <span className="text-xs font-black text-gray-900 dark:text-white">
                {filteredMembers.length === AUDIENCE_MEMBERS.length ? '720' : filteredMembers.length} pessoas
              </span>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black border border-gray-200 dark:border-slate-800 transition-colors">
                  Salvar segmento
                </button>
                <button className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-305 rounded-xl text-xs font-black border border-gray-200 dark:border-slate-800 transition-colors flex items-center gap-1">
                  <span>Ações em massa</span>
                  <span>▾</span>
                </button>
                <button className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-305 rounded-xl text-xs font-black border border-gray-200 dark:border-slate-800 transition-colors flex items-center gap-1">
                  <span>Mais</span>
                  <span>▾</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.015)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/40 dark:bg-slate-950/20">
                      <th className="py-4.5 px-6">NOME</th>
                      <th className="py-4.5 px-6">PONTUAÇÃO</th>
                      <th className="py-4.5 px-6">FUNÇÃO</th>
                      <th className="py-4.5 px-6">DATA DE ENTRADA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-850/80">
                    {filteredMembers.map(member => (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-850/15 cursor-pointer transition-all duration-150"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-slate-800 flex items-center justify-center font-bold text-xs shrink-0 select-none bg-blue-50/60 dark:bg-slate-850 text-blue-600 dark:text-blue-400 font-extrabold">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-gray-950 dark:text-gray-200 leading-snug">{member.name}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border",
                            Number(member.score) >= 9.0
                              ? "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6] dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/10"
                              : "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3] dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/10"
                          )}>
                            <span>😊</span>
                            <span>{member.score}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-600 dark:text-gray-300 font-bold">
                          {member.role}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-600 dark:text-gray-350 font-bold">
                          {member.entryDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTopTab === 'ranking' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-blue-500 animate-bounce" />
              {ct.podiumTitle}
            </h3>

            <div className="flex flex-col sm:flex-row justify-center items-end gap-6 max-w-xl mx-auto pt-6 pb-2">
              <div className="flex flex-col items-center flex-1 order-2 sm:order-1">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-350 flex items-center justify-center relative shadow-md">
                  <span className="text-xs font-black text-slate-500">RS</span>
                  <div className="absolute -top-3 -right-2 bg-slate-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm">
                    2º
                  </div>
                </div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-3">Roberto Santos</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">340 {ct.points}</p>
                <div className="w-full h-16 bg-slate-100 dark:bg-slate-800/60 rounded-t-2xl mt-3 flex items-center justify-center border-t border-slate-200/50">
                  <span className="text-xs font-black text-slate-400">🥈 PRATA</span>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 order-1 sm:order-2">
                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500 flex items-center justify-center relative shadow-lg ring-4 ring-blue-500/10">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">GA</span>
                  <div className="absolute -top-3 -right-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 border-white dark:border-slate-900 shadow-md">
                    1º
                  </div>
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white mt-3">Gustavo Souza</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">480 {ct.points}</p>
                <div className="w-full h-24 bg-blue-650 text-white rounded-t-2xl mt-3 flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400" />
                  <span className="text-xs font-black tracking-widest flex items-center gap-1">
                    🥇 OURO
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 order-3 sm:order-3">
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500/30 flex items-center justify-center relative shadow-md">
                  <span className="text-xs font-black text-amber-600">RA</span>
                  <div className="absolute -top-3 -right-2 bg-amber-650 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm">
                    3º
                  </div>
                </div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-3">Rafael Almeida</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">290 {ct.points}</p>
                <div className="w-full h-12 bg-amber-500/10 dark:bg-amber-950/20 rounded-t-2xl mt-3 flex items-center justify-center border-t border-amber-500/20">
                  <span className="text-xs font-black text-amber-500">🥉 BRONZE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: ct.rankBronzeTitle, desc: ct.rankBronzeDesc, icon: PiggyBank, pct: 85, color: 'from-amber-500 to-orange-600 shadow-orange-500/10' },
              { title: ct.rankKixikilaTitle, desc: ct.rankKixikilaDesc, icon: Target, pct: 40, color: 'from-blue-500 to-indigo-600 shadow-blue-500/10' },
              { title: ct.rankEliteTitle, desc: ct.rankEliteDesc, icon: Sparkles, pct: 100, color: 'from-emerald-500 to-teal-600 shadow-emerald-500/10', completed: true }
            ].map((badge, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 bg-gradient-to-tr rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", badge.color)}>
                    <badge.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                      {badge.title}
                      {badge.completed && <span className="text-emerald-500 text-xs">✓</span>}
                    </h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{badge.desc}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-505 uppercase tracking-wider">
                    <span>Progresso</span>
                    <span>{badge.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-100 dark:border-slate-850">
                    <div
                      style={{ width: `${badge.pct}%` }}
                      className={cn("h-full rounded-full bg-gradient-to-r", badge.completed ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-indigo-550')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isWriteOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsWriteOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">{ct.createPost}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-450 mt-0.5 font-medium">Partilhe ideias ou levante dúvidas financeiras.</p>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-550 dark:text-red-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-1.5">{ct.postTitleLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Como gerir a Kixikila?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-2xl text-xs focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-455 dark:text-gray-400 uppercase tracking-wider mb-1.5">{ct.postCategoryLabel}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-2xl text-xs focus:outline-none focus:border-blue-500 text-gray-700 dark:text-gray-300"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-455 dark:text-gray-400 uppercase tracking-wider mb-1.5">{ct.postContentLabel}</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Descreva detalhadamente a sua dúvida ou ideia..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-2xl text-xs focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-2xl text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{ct.publish}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{ct.publish}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWriteOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-gray-350 font-bold rounded-2xl text-xs transition-colors"
                >
                  {ct.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 mb-6 border-b border-gray-100 dark:border-slate-800 pb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-650/20 border border-indigo-200/30 flex items-center justify-center font-extrabold text-blue-600 dark:text-blue-400 text-xl shadow-inner">
                {selectedMember.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-gray-450 dark:text-gray-500 font-medium">{selectedMember.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/10 text-[9px] font-black rounded-full uppercase tracking-wider">
                    {selectedMember.role}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/20 dark:border-emerald-900/10 text-[9px] font-black rounded-full uppercase tracking-wider">
                    ⭐ Reputação {selectedMember.score}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-wider mb-1">{ct.bioLabel}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium bg-gray-55 dark:bg-slate-950 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-850">
                  {selectedMember.bio}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-gray-455 dark:text-gray-500 uppercase tracking-wider mb-2">{ct.achievementsLabel}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.badges.map((badge, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-850 rounded-xl text-[10px] font-bold text-gray-700 dark:text-gray-300">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <a
                  href={`mailto:${selectedMember.email}`}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs text-center transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Mensagem</span>
                </a>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
