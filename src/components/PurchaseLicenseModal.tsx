import React, { useState } from 'react';
import { 
  X, Zap, CreditCard, UploadCloud, ChevronRight, ArrowLeft, 
  CheckCircle2, Shield, AlertCircle, Smartphone, Building2, Loader2
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PurchaseLicenseModalProps {
  onClose: () => void;
  userEmail?: string | null;
}

type PlanType = 'monthly' | 'annual' | 'lifetime' | null;
type PaymentMethod = 'atlantico' | 'express' | 'paypay' | null;

export default function PurchaseLicenseModal({ onClose, userEmail }: PurchaseLicenseModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [plan, setPlan] = useState<PlanType>(null);
  const [email, setEmail] = useState(userEmail || '');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('atlantico');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNextStep1 = () => {
    if (!plan) { setError('Selecione um plano primeiro.'); return; }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!email) { setError('O e-mail é obrigatório para enviarmos a chave.'); return; }
    setError('');
    setStep(3);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 2MB.');
        return;
      }
      setReceiptFile(file);
      setError('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!receiptFile) { setError('Faça o upload do comprovativo para continuar.'); return; }
    
    setLoading(true);
    setError('');

    try {
      const base64Data = await fileToBase64(receiptFile);

      // Mapeamento do método de pagamento para os termos esperados pelo Admin
      const paymentMethodMap: Record<string, string> = {
        atlantico: 'bank_transfer',
        express: 'express',
        paypay: 'paypay'
      };

      await addDoc(collection(db, 'payment_proofs'), {
        client_email: email.trim().toLowerCase(),
        whatsapp: phone.trim(),
        plan_type: plan,
        payment_method: paymentMethodMap[method || 'atlantico'] || 'bank_transfer',
        proof_base64: base64Data,
        status: 'pending',
        created_at: Date.now()
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao enviar o comprovativo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPlanDetails = () => {
    switch(plan) {
      case 'monthly': return { name: 'Mensal', price: '1.500 AOA', desc: 'Renovável mensal' };
      case 'annual': return { name: 'Anual', price: '12.000 AOA', desc: '1 ano de atualizações' };
      case 'lifetime': return { name: 'Vitalício', price: '45.000 AOA', desc: 'Uso vitalício perpétuo' };
      default: return { name: '', price: '', desc: '' };
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#0a0a0b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
              <Zap size={20} color="#111" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Adquirir Licença VukaPay</h2>
              <p className="text-xs text-zinc-400">Desbloqueio premium e suporte VIP.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in slide-in-from-bottom-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Comprovativo Enviado!</h3>
              <p className="text-zinc-400 max-w-sm mb-8">
                A nossa equipa vai validar o seu pagamento. A chave de licença será enviada para <strong>{email}</strong> em breve.
              </p>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors"
              >
                Fechar Janela
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: PLANS */}
              {step === 1 && (
                <div className="animate-in slide-in-from-right-4">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Selecione o Plano</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {[
                      { id: 'monthly', name: 'Mensal', price: '1.500 AOA', desc: 'Renovável mensal' },
                      { id: 'annual', name: 'Anual', price: '12.000 AOA', desc: '1 ano de updates' },
                      { id: 'lifetime', name: 'Vitalício', price: '45.000 AOA', desc: 'Uso perpétuo' },
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setPlan(p.id as PlanType)}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                          plan === p.id 
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/50' 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`text-xs font-bold mb-2 ${plan === p.id ? 'text-[#D4AF37]' : 'text-zinc-400'}`}>
                          {p.name.toUpperCase()}
                        </div>
                        <div className="text-xl font-extrabold text-white mb-1">{p.price}</div>
                        <div className="text-xs text-zinc-500">{p.desc}</div>
                      </button>
                    ))}

                  </div>
                </div>
              )}

              {/* STEP 2: DETAILS */}
              {step === 2 && (
                <div className="animate-in slide-in-from-right-4 space-y-5">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Seus Detalhes</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-mail para receção da chave *</label>
                    <input 
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="exemplo@email.com"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp / Telefone (Opcional)</label>
                    <input 
                      type="text" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="9XX XXX XXX"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                    />
                    <p className="text-[11px] text-zinc-500 mt-2">Facilita o envio rápido e suporte personalizado.</p>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT & UPLOAD */}
              {step === 3 && (
                <div className="animate-in slide-in-from-right-4">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Método de Pagamento</h3>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button onClick={() => setMethod('atlantico')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${method === 'atlantico' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <Building2 size={20} className={method === 'atlantico' ? 'text-[#D4AF37]' : 'text-zinc-400'} />
                      <span className="text-xs font-semibold text-white">Atlântico</span>
                    </button>
                    <button onClick={() => setMethod('express')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${method === 'express' ? 'border-[#f97316] bg-[#f97316]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <Smartphone size={20} className={method === 'express' ? 'text-[#f97316]' : 'text-zinc-400'} />
                      <span className="text-xs font-semibold text-white">Express</span>
                    </button>
                    <button onClick={() => setMethod('paypay')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${method === 'paypay' ? 'border-[#8b5cf6] bg-[#8b5cf6]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <CreditCard size={20} className={method === 'paypay' ? 'text-[#8b5cf6]' : 'text-zinc-400'} />
                      <span className="text-xs font-semibold text-white">PayPay</span>
                    </button>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-zinc-400 font-semibold uppercase">Dados para Transferência</span>
                      <span className="text-sm font-bold text-[#D4AF37]">{getPlanDetails().price}</span>
                    </div>

                    {method === 'atlantico' && (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-zinc-500">Banco:</span><span className="text-white font-medium">Banco ATLANTICO</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Beneficiário:</span><span className="text-white font-medium text-right max-w-[200px] truncate" title={import.meta.env.VITE_PAYMENT_ATLANTICO_BENEFICIARY}>{import.meta.env.VITE_PAYMENT_ATLANTICO_BENEFICIARY || 'DOMINGOS M N CORREIA'}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">N.º Conta:</span><span className="text-white font-mono">{import.meta.env.VITE_PAYMENT_ATLANTICO_ACCOUNT || '33200874210001'}</span></div>
                        <div className="pt-3 border-t border-white/10 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">IBAN:</span>
                            <span className="text-xs text-[#D4AF37] cursor-pointer hover:underline" onClick={() => navigator.clipboard.writeText(import.meta.env.VITE_PAYMENT_ATLANTICO_IBAN || 'AO06005500003200874210154')}>Copiar</span>
                          </div>
                          <span className="text-white font-mono text-xs">{import.meta.env.VITE_PAYMENT_ATLANTICO_IBAN || 'AO06005500003200874210154'}</span>
                        </div>
                      </div>
                    )}
                    
                    {method === 'express' && (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-zinc-500">Rede:</span><span className="text-white font-medium">Multicaixa Express</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Tipo:</span><span className="text-white font-medium">Transferência / Pagamento</span></div>
                        <div className="pt-3 border-t border-white/10 flex flex-col gap-1">
                          <span className="text-zinc-500">N.º Telefone:</span>
                          <span className="text-white font-mono text-lg">{import.meta.env.VITE_PAYMENT_EXPRESS_PHONE || '9XX XXX XXX'}</span>
                        </div>
                      </div>
                    )}

                    {method === 'paypay' && (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-zinc-500">App:</span><span className="text-white font-medium">PayPay Africa</span></div>
                        <div className="pt-3 border-t border-white/10 flex flex-col gap-1">
                          <span className="text-zinc-500">ID / Telefone:</span>
                          <span className="text-white font-mono text-lg">{import.meta.env.VITE_PAYMENT_PAYPAY_PHONE || '9XX XXX XXX'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Carregar Comprovativo (.PDF, .PNG, .JPG)</h3>
                    <label className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${receiptFile ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}>
                      <input type="file" className="hidden" accept=".pdf,image/png,image/jpeg" onChange={handleFileChange} />
                      <UploadCloud size={28} className={`mx-auto mb-3 ${receiptFile ? 'text-[#D4AF37]' : 'text-zinc-400'}`} />
                      {receiptFile ? (
                        <div>
                          <span className="text-white font-medium">{receiptFile.name}</span>
                          <p className="text-xs text-zinc-500 mt-1">Clique para alterar</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-white font-medium block">Clique para selecionar o comprovativo</span>
                          <span className="text-xs text-zinc-500 mt-1">Tamanho máximo: 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!success && (
          <div className="p-5 border-t border-white/5 bg-black/40 flex justify-between gap-3">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1 as 1|2|3)}
                className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Voltar
              </button>
            ) : (
              <button onClick={onClose} className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors">
                Cancelar
              </button>
            )}

            {step === 1 && (
              <button 
                onClick={handleNextStep1}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-black font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#D4AF37]/20 ml-auto"
              >
                Continuar <ChevronRight size={18} />
              </button>
            )}
            
            {step === 2 && (
              <button 
                onClick={handleNextStep2}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-black font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#D4AF37]/20 ml-auto"
              >
                Ver Coordenadas de Pagamento <ChevronRight size={18} />
              </button>
            )}

            {step === 3 && (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-70 ml-auto"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {loading ? 'A Enviar...' : 'Submeter Comprovativo'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
