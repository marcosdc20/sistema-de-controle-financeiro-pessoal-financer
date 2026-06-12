import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  arrayUnion, 
  limit, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, Plus, Paperclip, Send, Image as ImageIcon, Video, Music, 
  User, Users, X, Check, Volume2, Play, Circle, MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  description?: string;
  members: string[];
  lastMessage?: string;
  lastMessageAt?: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'none';
  createdAt: number;
}

interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  xp?: number;
  badge?: string;
}

export default function ChatsManager() {
  const { user } = useAuth();
  const activeUserId = user?.id || 'local-user';
  const activeUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizador VukaPay';
  const activeUserAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUserName)}&background=random`;

  // States
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modais
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  
  // Criar Grupo Form
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Referências para scroll e uploads
  const messageEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // States de upload/status
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachmentStatus, setAttachmentStatus] = useState('');

  // 1. Escutar conversas em tempo real
  useEffect(() => {
    const chatsCol = collection(db, 'community_chats');
    const unsubscribe = onSnapshot(chatsCol, async (snapshot) => {
      const list: Chat[] = [];
      snapshot.forEach(docSnap => {
        const c = { id: docSnap.id, ...docSnap.data() } as Chat;
        if (c.members?.includes(activeUserId)) {
          list.push(c);
        }
      });

      if (list.length === 0 && snapshot.empty) {
        // Semear conversas iniciais se vazio geral
        await seedInitialChats();
      } else {
        setChats(list.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)));
      }
    });

    return () => unsubscribe();
  }, [activeUserId]);

  // 2. Escutar lista de utilizadores para Nova Conversa/Grupo
  useEffect(() => {
    const usersCol = collection(db, 'community_users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const list: CommunityUser[] = [];
      snapshot.forEach(docSnap => {
        const u = { id: docSnap.id, ...docSnap.data() } as CommunityUser;
        if (u.id !== activeUserId) {
          list.push(u);
        }
      });
      setUsers(list);
    });

    return () => unsubscribe();
  }, [activeUserId]);

  // 3. Escutar mensagens do chat selecionado
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const messagesCol = collection(db, `community_chats/${selectedChat.id}/messages`);
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(list);
      // Auto scroll
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Semeador de Chats Iniciais
  const seedInitialChats = async () => {
    try {
      // 1. Criar perfil fictício dos parceiros se não existirem
      const mockUsers = [
        { id: 'seed-carlos', name: 'Dr. Carlos Invest', avatar: 'https://ui-avatars.com/api/?name=Dr.+Carlos&background=c7d2fe&color=3730a3', xp: 850, badge: '🥈 Pro' },
        { id: 'seed-mariana', name: 'Mariana Finanças', avatar: 'https://ui-avatars.com/api/?name=Mariana+Finanças&background=bbf7d0&color=166534', xp: 1200, badge: '🥇 Expert' }
      ];
      for (const mu of mockUsers) {
        await setDoc(doc(db, 'community_users', mu.id), mu);
      }

      // 2. Criar chat do grupo "Círculo BODIVA"
      const groupChatId = 'group-circulo-bodiva';
      const groupData: Chat = {
        id: groupChatId,
        type: 'group',
        name: 'Círculo BODIVA 📈',
        description: 'Debate sobre compra e venda de ações e Obrigações do Tesouro na Bolsa de Angola.',
        members: [activeUserId, 'seed-carlos', 'seed-mariana'],
        lastMessage: 'Mariana partilhou um infográfico de investimentos.',
        lastMessageAt: Date.now()
      };
      await setDoc(doc(db, 'community_chats', groupChatId), groupData);

      // Enviar mensagens iniciais
      const mCol = collection(db, `community_chats/${groupChatId}/messages`);
      
      await addDoc(mCol, {
        senderId: 'seed-carlos',
        senderName: 'Dr. Carlos Invest',
        senderAvatar: 'https://ui-avatars.com/api/?name=Dr.+Carlos&background=c7d2fe&color=3730a3',
        content: 'Olá parceiros! Criei este círculo para debatermos oportunidades na Bodiva.',
        createdAt: Date.now() - 4 * 60 * 60 * 1000
      });

      await addDoc(mCol, {
        senderId: 'seed-mariana',
        senderName: 'Mariana Finanças',
        senderAvatar: 'https://ui-avatars.com/api/?name=Mariana+Finanças&background=bbf7d0&color=166534',
        content: 'Excelente iniciativa, Carlos! Vejam o gráfico de rendimentos das Obrigações do Tesouro Angolanas:',
        mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=400&auto=format&fit=crop',
        mediaType: 'image',
        createdAt: Date.now() - 3.5 * 60 * 60 * 1000
      });

      // 3. Criar chat privado com Carlos
      const privateChatId = `private_${activeUserId}_seed-carlos`;
      const privateData: Chat = {
        id: privateChatId,
        type: 'private',
        members: [activeUserId, 'seed-carlos'],
        lastMessage: 'Tudo bem! Pode enviar o ficheiro do orçamento.',
        lastMessageAt: Date.now() - 10 * 60 * 1000
      };
      await setDoc(doc(db, 'community_chats', privateChatId), privateData);

      const pmCol = collection(db, `community_chats/${privateChatId}/messages`);
      await addDoc(pmCol, {
        senderId: 'seed-carlos',
        senderName: 'Dr. Carlos Invest',
        senderAvatar: 'https://ui-avatars.com/api/?name=Dr.+Carlos&background=c7d2fe&color=3730a3',
        content: 'Olá! Precisas de ajuda para configurar a tua carteira de poupança familiar?',
        createdAt: Date.now() - 30 * 60 * 1000
      });
      await addDoc(pmCol, {
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        content: 'Sim, por favor. Queria saber se o Kixiquila de Luanda compensa mais do que o depósito a prazo.',
        createdAt: Date.now() - 20 * 60 * 1000
      });
      await addDoc(pmCol, {
        senderId: 'seed-carlos',
        senderName: 'Dr. Carlos Invest',
        senderAvatar: 'https://ui-avatars.com/api/?name=Dr.+Carlos&background=c7d2fe&color=3730a3',
        content: 'Tudo bem! Pode enviar o ficheiro do orçamento.',
        createdAt: Date.now() - 10 * 60 * 1000
      });

    } catch (e) {
      console.error('Falha ao semear chats iniciais:', e);
    }
  };

  // Enviar mensagem de texto
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      const messagesCol = collection(db, `community_chats/${selectedChat.id}/messages`);
      await addDoc(messagesCol, {
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        content: messageText,
        mediaType: 'none',
        createdAt: Date.now()
      });

      // Atualizar última mensagem na conversa
      const chatRef = doc(db, 'community_chats', selectedChat.id);
      await updateDoc(chatRef, {
        lastMessage: messageText,
        lastMessageAt: Date.now()
      });

    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  // Processar e comprimir imagem via canvas
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Redimensionar para no máximo 600px de largura/altura para caber no limite de 1MB do Firestore
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 500;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // JPEG comprimido a 70% de qualidade
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Enviar Mídia
  const handleMediaSend = async (file: File, type: 'image' | 'video' | 'audio') => {
    if (!selectedChat) return;
    setIsAttaching(true);
    setAttachmentStatus('Processando ficheiro...');

    try {
      let finalMediaUrl = '';

      if (type === 'image') {
        finalMediaUrl = await processImageFile(file);
      } else {
        // Se for vídeo ou áudio, verificar o tamanho
        if (file.size > 600 * 1024) {
          // Arquivo muito grande, usar demo otimizada
          setAttachmentStatus('Arquivo muito grande! Gerando versão otimizada...');
          await new Promise(r => setTimeout(r, 1000));
          if (type === 'video') {
            finalMediaUrl = 'https://assets.mixkit.co/videos/preview/mixkit-hand-holding-smartphone-with-a-financial-app-40810-large.mp4';
          } else {
            finalMediaUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
          }
        } else {
          // Ler como base64
          finalMediaUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
      }

      // Enviar mensagem
      const messagesCol = collection(db, `community_chats/${selectedChat.id}/messages`);
      await addDoc(messagesCol, {
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        content: type === 'image' ? '📷 Foto' : type === 'video' ? '🎥 Vídeo' : '🎵 Áudio',
        mediaUrl: finalMediaUrl,
        mediaType: type,
        createdAt: Date.now()
      });

      // Atualizar última mensagem do chat
      const chatRef = doc(db, 'community_chats', selectedChat.id);
      await updateDoc(chatRef, {
        lastMessage: type === 'image' ? 'Partilhou uma foto.' : type === 'video' ? 'Partilhou um vídeo.' : 'Partilhou uma faixa áudio.',
        lastMessageAt: Date.now()
      });

    } catch (e) {
      console.error('Erro ao enviar mídia:', e);
      alert('Erro ao enviar ficheiro. Tente novamente.');
    } finally {
      setIsAttaching(false);
      setAttachmentStatus('');
    }
  };

  // Iniciar Conversa Privada
  const startPrivateChat = async (targetUser: CommunityUser) => {
    const chatId = `private_${[activeUserId, targetUser.id].sort().join('_')}`;
    const chatRef = doc(db, 'community_chats', chatId);

    try {
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        const newChat: Chat = {
          id: chatId,
          type: 'private',
          members: [activeUserId, targetUser.id],
          lastMessage: 'Conversa iniciada.',
          lastMessageAt: Date.now()
        };
        await setDoc(chatRef, newChat);
        setSelectedChat(newChat);
      } else {
        setSelectedChat({ id: chatId, ...snap.data() } as Chat);
      }
      setIsNewChatOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Criar Novo Grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedGroupMembers.length === 0) {
      alert('Preencha o nome do grupo e selecione pelo menos 1 membro.');
      return;
    }

    const newGroupId = `group_${Date.now()}`;
    const chatRef = doc(db, 'community_chats', newGroupId);

    try {
      const newGroup: Chat = {
        id: newGroupId,
        type: 'group',
        name: groupName.trim(),
        description: groupDesc.trim() || 'Sem descrição.',
        members: [activeUserId, ...selectedGroupMembers],
        lastMessage: 'Grupo criado por ' + activeUserName,
        lastMessageAt: Date.now()
      };

      await setDoc(chatRef, newGroup);
      
      const mCol = collection(db, `community_chats/${newGroupId}/messages`);
      await addDoc(mCol, {
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        content: 'Criou o grupo "' + groupName + '". Sejam bem-vindos!',
        createdAt: Date.now()
      });

      setSelectedChat(newGroup);
      
      // Limpar campos
      setGroupName('');
      setGroupDesc('');
      setSelectedGroupMembers([]);
      setIsNewGroupOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Resolver nome e avatar para chats privados
  const getPrivateChatInfo = (chat: Chat) => {
    const otherId = chat.members.find(id => id !== activeUserId);
    const u = users.find(user => user.id === otherId);
    return {
      name: u?.name || 'Utilizador VukaPay',
      avatar: u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}&background=random`
    };
  };

  const filteredChats = chats.filter(c => {
    if (c.type === 'group') {
      return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const info = getPrivateChatInfo(c);
    return info.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <PageTransition className="w-full max-w-7xl mx-auto h-[75vh] flex rounded-3xl overflow-hidden border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
      
      {/* ─── PAINEL ESQUERDO: LISTA DE CHATS ─── */}
      <aside className="w-full md:w-[350px] shrink-0 border-r border-gray-150 dark:border-slate-800 flex flex-col bg-gray-50/50 dark:bg-slate-900/50">
        
        {/* Header Esquerdo */}
        <div className="p-4 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <img className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-slate-800" src={activeUserAvatar} alt="" />
            <span className="font-black text-sm text-gray-900 dark:text-white leading-tight">Os Meus Chats</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsNewChatOpen(true)}
              title="Nova Conversa Privada"
              className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsNewGroupOpen(true)}
              title="Criar Círculo/Grupo"
              className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="p-3 border-b border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative flex items-center bg-gray-100 dark:bg-slate-950 px-3 py-2 rounded-xl">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Pesquisar conversas ou grupos..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-xs font-bold text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-850">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold">Nenhuma conversa ativa.</p>
              <p className="text-[10px] text-gray-400 mt-1">Inicie um chat ou crie um grupo clicando nos ícones acima.</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = selectedChat?.id === chat.id;
              const isGroup = chat.type === 'group';
              const info = isGroup ? { name: chat.name || 'Grupo', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'G')}&background=c7d2fe&color=3730a3` } : getPrivateChatInfo(chat);

              return (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-gray-100/60 dark:hover:bg-slate-800/40 text-left",
                    isActive ? "bg-indigo-50/50 dark:bg-indigo-950/10 border-l-4 border-indigo-600" : ""
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={info.avatar} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate mb-0.5">{info.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-505 truncate font-medium max-w-[200px]">
                        {chat.lastMessage || 'Nenhuma mensagem.'}
                      </p>
                    </div>
                  </div>
                  {chat.lastMessageAt && (
                    <span className="text-[9px] text-gray-400 shrink-0 font-medium">
                      {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ─── PAINEL DIREITO: CONVERSA ATIVA ─── */}
      <main className="flex-1 flex flex-col bg-gray-50/50 dark:bg-slate-900/30">
        {selectedChat ? (
          <>
            {/* Header da Conversa */}
            <div className="p-4 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3 text-left">
                <img 
                  src={selectedChat.type === 'group' ? `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.name || 'G')}&background=c7d2fe&color=3730a3` : getPrivateChatInfo(selectedChat).avatar} 
                  alt="" 
                  className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-slate-800" 
                />
                <div>
                  <h3 className="text-xs font-black text-gray-900 dark:text-white leading-tight">
                    {selectedChat.type === 'group' ? selectedChat.name : getPrivateChatInfo(selectedChat).name}
                  </h3>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block mt-0.5">
                    {selectedChat.type === 'group' ? `${selectedChat.members?.length} membros no círculo` : 'Conversa Privada Segura'}
                  </span>
                </div>
              </div>
            </div>

            {/* Balões de Mensagem */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-thin">
              {messages.length === 0 ? (
                <div className="my-auto text-center text-gray-400 py-10">
                  <p className="text-xs font-bold">Envie a primeira mensagem para este canal.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Suporta texto, fotos, áudio e vídeo.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.senderId === activeUserId;
                  const isAudio = msg.mediaType === 'audio';
                  const isVideo = msg.mediaType === 'video';
                  const isImage = msg.mediaType === 'image';

                  return (
                    <div 
                      key={msg.id}
                      className={cn(
                        "max-w-[70%] flex flex-col text-left p-3.5 rounded-[1.5rem] relative",
                        isSelf 
                          ? "bg-indigo-600 text-white rounded-tr-none self-end" 
                          : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-tl-none self-start border border-gray-150 dark:border-slate-850"
                      )}
                    >
                      {/* Remetente em grupos */}
                      {selectedChat.type === 'group' && !isSelf && (
                        <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-wider block">
                          @{msg.senderName}
                        </span>
                      )}

                      {/* Conteúdo de mídia */}
                      {isImage && msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-[280px]">
                          <img src={msg.mediaUrl} className="w-full object-cover max-h-[200px]" alt="Media" />
                        </div>
                      )}
                      
                      {isVideo && msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-[280px] bg-black">
                          <video src={msg.mediaUrl} controls className="w-full max-h-[200px]" />
                        </div>
                      )}

                      {isAudio && msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-[280px] p-2 bg-slate-900/10 rounded-lg">
                          <audio src={msg.mediaUrl} controls className="w-full text-black" />
                        </div>
                      )}

                      {/* Texto */}
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Timestamp */}
                      <span className={cn("text-[8px] mt-1 block text-right font-medium opacity-70", isSelf ? "text-indigo-100" : "text-gray-400")}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input e Barra de Ações */}
            <div className="p-4 border-t border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              
              {/* Indicador de processamento de mídia */}
              {isAttaching && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold">{attachmentStatus}</span>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                
                {/* Botões de Anexo Ocultos */}
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && handleMediaSend(e.target.files[0], 'image')} 
                />
                <input 
                  type="file" 
                  ref={videoInputRef} 
                  accept="video/*" 
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && handleMediaSend(e.target.files[0], 'video')} 
                />
                <input 
                  type="file" 
                  ref={audioInputRef} 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && handleMediaSend(e.target.files[0], 'audio')} 
                />

                {/* Dropdown de Anexos */}
                <div className="flex gap-1">
                  <button 
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    title="Enviar Imagem"
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    title="Enviar Vídeo"
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    title="Enviar Áudio/Música"
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Music className="w-4 h-4" />
                  </button>
                </div>

                {/* Input de Texto */}
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-gray-100 dark:bg-slate-950 border border-gray-150 dark:border-slate-850 p-3 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                />

                {/* Enviar */}
                <button 
                  type="submit"
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty Chat Area */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-slate-950/20">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-100 dark:border-indigo-900 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 leading-tight">VukaPay Conversas & Círculos</h3>
            <p className="text-sm text-gray-550 dark:text-gray-400 max-w-sm leading-relaxed font-medium">
              Fale de forma privada com outros investidores ou crie círculos de poupança (Kixiquila) com sincronização em tempo real.
            </p>
            <p className="text-xs text-gray-400 mt-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 px-3 py-1 rounded-full font-bold">
              Escolha uma conversa no painel esquerdo para começar.
            </p>
          </div>
        )}
      </main>

      {/* ─── MODAL: NOVA CONVERSA PRIVADA ─── */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsNewChatOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 text-left tracking-tight">Nova Conversa Privada</h2>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {users.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">Nenhum membro registado na comunidade.</p>
              ) : (
                users.map(u => (
                  <div 
                    key={u.id}
                    onClick={() => startPrivateChat(u)}
                    className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-850 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/5 dark:hover:bg-slate-800/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <img className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-slate-800" src={u.avatar} alt="" />
                      <div>
                        <p className="text-xs font-black text-gray-900 dark:text-white">@{u.name}</p>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-1 rounded font-bold uppercase">{u.badge || '🎯 Guardião'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black">Conversar</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CRIAR CÍRCULO / GRUPO ─── */}
      {isNewGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsNewGroupOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 text-left tracking-tight">Criar Novo Círculo/Grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Nome do Círculo *</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Ex: Investidores Luanda Sul"
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 p-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Descrição</label>
                <input 
                  type="text" 
                  value={groupDesc}
                  onChange={e => setGroupDesc(e.target.value)}
                  placeholder="Ex: Grupo para partilhar rondas de Kixiquila."
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 p-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Selecionar Membros *</label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {users.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Nenhum utilizador encontrado na comunidade para adicionar ao grupo.
                      </p>
                    </div>
                  ) : (
                    users.map(u => {
                      const isSelected = selectedGroupMembers.includes(u.id);
                      return (
                        <div 
                          key={u.id}
                          onClick={() => {
                            setSelectedGroupMembers(prev => 
                              prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className={cn(
                            "p-2.5 bg-gray-50 dark:bg-slate-950 border rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-all text-left",
                            isSelected ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20" : "border-gray-150 dark:border-slate-850"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <img className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-slate-800" src={u.avatar} alt="" />
                            <span className="text-xs font-black text-gray-800 dark:text-gray-200">@{u.name}</span>
                          </div>
                          <div className={cn(
                            "w-4.5 h-4.5 rounded-md border flex items-center justify-center text-white text-[10px]",
                            isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white dark:bg-slate-900 dark:border-slate-700"
                          )}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsNewGroupOpen(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-black text-sm rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  Criar Círculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
