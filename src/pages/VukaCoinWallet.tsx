import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, orderBy } from 'firebase/firestore';
import { Wallet, ArrowRightLeft, ShoppingBag, History, CreditCard, ChevronRight, User, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';

interface Transaction {
  id: string;
  type: 'transfer' | 'purchase' | 'earned';
  amount: number;
  date: string;
  sender_email?: string;
  receiver_email?: string;
  description: string;
}

export default function VukaCoinWallet() {
  const { user } = useAuth();
  const { profile } = useFinance();
  const navigate = useNavigate();
  // Saldo vem do FinanceContext (sincronizado com SQLite + Firestore em tempo real)
  const balance = profile?.vuka_coins ?? 0;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Toast
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Fetch Transactions only (balance comes from FinanceContext)
        const txQuery1 = query(collection(db, 'vukacoin_transactions'), where('sender_email', '==', user.email));
        const txQuery2 = query(collection(db, 'vukacoin_transactions'), where('receiver_email', '==', user.email));
        
        const [snap1, snap2] = await Promise.all([getDocs(txQuery1), getDocs(txQuery2)]);
        
        const allTxs: Transaction[] = [];
        snap1.forEach(doc => allTxs.push({ id: doc.id, ...doc.data() } as Transaction));
        snap2.forEach(doc => {
          if (!allTxs.find(t => t.id === doc.id)) {
            allTxs.push({ id: doc.id, ...doc.data() } as Transaction);
          }
        });

        // Sort by date desc
        allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(allTxs);

      } catch (err) {
        console.error('Erro ao carregar transações da carteira:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    
    if (!user?.email) {
      setTransferError('Utilizador atual não autenticado adequadamente.');
      return;
    }

    const amount = Number(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('O valor deve ser superior a zero.');
      return;
    }

    if (amount > balance) {
      setTransferError('Saldo insuficiente.');
      return;
    }

    const receiverEmail = transferEmail.trim().toLowerCase();
    if (receiverEmail === user.email.toLowerCase()) {
      setTransferError('Não pode transferir para si próprio.');
      return;
    }

    setTransferring(true);

    try {
      // Find receiver in community_users
      const qReceiver = query(collection(db, 'community_users'), where('email', '==', receiverEmail));
      const receiverSnap = await getDocs(qReceiver);

      if (receiverSnap.empty) {
        setTransferError('Destinatário não encontrado no VukaPay.');
        setTransferring(false);
        return;
      }

      const receiverDoc = receiverSnap.docs[0];
      const senderRef = doc(db, 'community_users', user.id);
      const receiverRef = doc(db, 'community_users', receiverDoc.id);

      // Perform transaction
      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        const recSnap = await transaction.get(receiverRef);

        if (!senderSnap.exists()) throw new Error('Conta remetente não encontrada.');
        
        const currentSenderBalance = senderSnap.data().vuka_coins || 0;
        if (currentSenderBalance < amount) {
          throw new Error('Saldo insuficiente no momento da transação.');
        }

        const currentReceiverBalance = recSnap.exists() ? (recSnap.data().vuka_coins || 0) : 0;

        // Deduz
        transaction.update(senderRef, { vuka_coins: currentSenderBalance - amount });
        // Adiciona
        transaction.update(receiverRef, { vuka_coins: currentReceiverBalance + amount });

        // Regista a transação
        const newTxRef = doc(collection(db, 'vukacoin_transactions'));
        const txData = {
          type: 'transfer',
          amount: amount,
          date: new Date().toISOString(),
          sender_email: user.email,
          receiver_email: receiverEmail,
          description: `Transferência enviada para ${receiverEmail}`
        };
        transaction.set(newTxRef, txData);
      });

      // Update Local State (balance comes from FinanceContext live sync)
      const newLocalTx: Transaction = {
        id: Date.now().toString(),
        type: 'transfer',
        amount: amount,
        date: new Date().toISOString(),
        sender_email: user.email,
        receiver_email: receiverEmail,
        description: `Transferência enviada para ${receiverEmail}`
      };
      setTransactions(prev => [newLocalTx, ...prev]);

      showToast('Transferência efetuada com sucesso!');
      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferEmail('');

    } catch (err: any) {
      console.error(err);
      setTransferError(err.message || 'Erro ao realizar transferência.');
    } finally {
      setTransferring(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm animate-in fade-in">
        <div className="w-16 h-16 bg-amber-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
          <Wallet className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Necessário</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Para usar a Carteira VukaCoin e fazer transferências, deve iniciar sessão com a sua conta do Google.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 relative">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-10 border ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.type === 'success' ? <Wallet className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header Profile / Balance Card */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-500/20 dark:from-amber-400/10 dark:to-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-gradient-to-tr from-indigo-400/10 to-purple-500/10 dark:from-indigo-400/5 dark:to-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 ring-4 ring-amber-50 dark:ring-slate-800">
              <span className="text-3xl">🪙</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                {loading ? '...' : balance} <span className="text-amber-500">VC</span>
              </h1>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">Saldo de VukaCoins</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-gray-900/10"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transferir VC
            </button>
            <button
              onClick={() => navigate('/vuka-store')}
              className="flex items-center gap-2 px-5 py-3 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 rounded-2xl text-sm font-bold transition-all active:scale-95 border border-amber-200 dark:border-amber-500/30"
            >
              <ShoppingBag className="w-4 h-4" />
              Gastar na Loja
            </button>
             <button
              onClick={() => navigate('/buy-vukacoins')}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Comprar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Histórico Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Histórico de Transações</h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">A carregar...</div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                {transactions.map(tx => {
                  const isSender = tx.sender_email === user.email;
                  return (
                    <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isSender ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'
                        }`}>
                          {isSender ? <ArrowRightLeft className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">
                            {tx.description || (isSender ? `Para: ${tx.receiver_email}` : `De: ${tx.sender_email}`)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(tx.date).toLocaleString('pt-AO')}
                          </p>
                        </div>
                      </div>
                      <div className={`font-black ${isSender ? 'text-red-500' : 'text-emerald-500'}`}>
                        {isSender ? '-' : '+'}{tx.amount} VC
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-center p-6">
                <History className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">Sem histórico de VukaCoins.<br/>Comece a interagir na comunidade!</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <CreditCard className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">O que são VukaCoins?</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                A moeda virtual oficial do ecossistema VukaPay. Ganhe-as a concluir desafios financeiros, ajudando na comunidade e use-as para adquirir funcionalidades na VukaStore.
              </p>
              <button 
                onClick={() => navigate('/community')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold backdrop-blur-sm transition-colors border border-white/20 flex items-center justify-center gap-2"
              >
                Como Ganhar Mais <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transferir VukaCoins</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Envie saldo para amigos ou membros da comunidade.</p>
            </div>
            
            <form onSubmit={handleTransfer} className="p-6 space-y-5">
              {transferError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {transferError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email do Destinatário</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="email@amigo.com"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quantidade de VC</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl">🪙</div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    Máx: {balance}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={transferring}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {transferring ? 'A transferir...' : 'Confirmar Envio'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={transferring}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
