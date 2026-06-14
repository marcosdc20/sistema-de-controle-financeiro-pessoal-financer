import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Coins, ArrowRightLeft, Upload, CheckCircle2, AlertCircle, HelpCircle, ArrowLeft, Landmark, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONVERSION_RATE = 100; // 1 VC = 100 Kz

export default function BuyVukaCoins() {
  const { user } = useAuth();
  const { profile } = useFinance();
  const navigate = useNavigate();
  const currentBalance = profile?.vuka_coins || 0;

  if (user?.isLocal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-amber-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-amber-200 dark:border-slate-700">
          <Landmark className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Login Necessário</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Para comprar VukaCoins e usar a loja, deve iniciar sessão com a sua conta do Google. Contas offline (convidado) não suportam esta funcionalidade.
        </p>
      </div>
    );
  }

  // Conversion States
  const [vcAmount, setVcAmount] = useState<string>('100');
  const [kzAmount, setKzAmount] = useState<string>('10000');

  // Form States
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptBase64, setReceiptBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Synced conversion handlers
  const handleVcChange = (val: string) => {
    setVcAmount(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setKzAmount(String(num * CONVERSION_RATE));
    } else {
      setKzAmount('');
    }
  };

  const handleKzChange = (val: string) => {
    setKzAmount(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setVcAmount(String(Math.round(num / CONVERSION_RATE)));
    } else {
      setVcAmount('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('O comprovativo é muito grande. O limite máximo é de 2MB.');
        return;
      }
      setReceiptName(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptBase64(reader.result as string);
      };
      reader.onerror = () => {
        setError('Erro ao ler o ficheiro do comprovativo.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!user) {
      setError('Deve iniciar sessão para realizar esta operação.');
      return;
    }

    const coins = Number(vcAmount);
    if (isNaN(coins) || coins <= 0) {
      setError('Indique uma quantia válida de VukaCoins.');
      return;
    }

    if (!receiptBase64) {
      setError('Por favor, anexe o comprovativo de transferência bancária.');
      return;
    }

    setLoading(true);

    try {
      const newRequest = {
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilizador',
        userEmail: user.email,
        vukaCoins: coins,
        priceKz: coins * CONVERSION_RATE,
        receipt: receiptBase64,
        status: 'pending',
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'vukacoin_purchases'), newRequest);
      setSuccess(true);
      setReceiptName('');
      setReceiptBase64('');
      setVcAmount('100');
      setKzAmount('10000');
    } catch (err) {
      console.error('Erro ao enviar comprovativo:', err);
      setError('Erro ao enviar pedido. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto px-4 lg:px-8 pb-12">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vukacoins')}
          className="p-2.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comprar VukaCoins</h1>
          <p className="text-xs text-gray-500 font-medium">Troque Kwanzas por moedas de recompensa VukaCoins</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Conversion & Form Section */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-brand-500" />
              Conversor de Moeda
            </h2>

            {/* Double Conversion Input */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantia de VukaCoins (VC)</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🪙</div>
                  <input
                    type="number"
                    value={vcAmount}
                    onChange={e => handleVcChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Valor em Kwanzas (AOA)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">AOA</span>
                  <input
                    type="number"
                    value={kzAmount}
                    onChange={e => handleKzChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 font-bold bg-amber-50 border border-amber-100/50 p-3.5 rounded-2xl flex gap-2">
              <span>💡</span>
              <span>Taxa fixa oficial: 1 VukaCoin (VC) = 100 Kwanzas (AOA). Os pedidos mínimos são de 50 VC.</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              Solicitação e Comprovativo
            </h2>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold">Solicitação enviada com sucesso!</p>
                  <p className="text-emerald-600/80 font-normal mt-0.5">
                    O administrador irá verificar o comprovativo e creditar os VukaCoins na sua carteira dentro de instantes.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* File Attachment UI */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Anexar Comprovativo de Pagamento</label>
                <div className="relative border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-indigo-50/10">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 mx-auto text-gray-400">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">
                        {receiptName ? `Selecionado: ${receiptName}` : 'Clique para anexar comprovativo'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, JPEG ou PDF até 2MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !receiptBase64}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md",
                loading || !receiptBase64
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                  : "bg-gray-900 hover:bg-gray-800 text-white shadow-gray-950/10 cursor-pointer"
              )}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>A Enviar Comprovativo...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4.5 h-4.5 text-amber-400" />
                  <span>Enviar Solicitação de {vcAmount || '0'} VC</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Info Section */}
        <div className="md:col-span-2 space-y-6">
          {/* Bank Accounts Info Card */}
          <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Landmark className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-300" />
                Dados de Pagamento
              </h3>
              <p className="text-xs text-indigo-150 leading-relaxed font-medium">
                Efetue a transferência ou depósito do valor exato em Kwanzas para uma das contas oficiais VukaPay abaixo:
              </p>

              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Banco BAI (Kwanza)</div>
                  <div className="text-xs font-bold font-mono bg-white/5 border border-white/15 px-3 py-1.5 rounded-lg select-all">
                    AO06 0040 0000 8923 1032 1014 5
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Banco BFA (Kwanza)</div>
                  <div className="text-xs font-bold font-mono bg-white/5 border border-white/15 px-3 py-1.5 rounded-lg select-all">
                    AO06 0006 0000 7712 5592 1018 9
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-indigo-200 leading-normal bg-white/5 p-3 rounded-2xl border border-white/10">
                ℹ️ Insira o seu email de login do VukaPay ({user?.email}) como referência ou observação no comprovativo bancário para agilizar a validação.
              </div>
            </div>
          </div>

          {/* VukaCoins Explanation */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-gray-400" />
              O que são VukaCoins?
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              VukaCoins (VC) é a unidade monetária exclusiva para gamificação e recompensas do VukaPay. 
            </p>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Você pode usá-la na **VukaStore** para resgatar serviços, selos de destaque VIP na comunidade, relatórios avançados de IA e consultorias com especialistas certificados.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
