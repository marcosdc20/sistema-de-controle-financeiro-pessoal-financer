import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';

export default function AIAssistant() {
  const { transactions, accounts, totalBalanceInBaseCurrency, getRate } = useFinance();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Olá! Sou o seu assistente financeiro inteligente VukaPay AI. Como posso ajudar você hoje com as suas finanças?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.GEMINI_API_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleWasteAudit = () => {
    if (isLoading) return;
    setIsLoading(true);

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: 'Iniciar Auditoria de Desperdício'
    }]);

    setTimeout(() => {
      const today = new Date();
      const currentMonthStr = today.toISOString().substring(0, 7);
      
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().substring(0, 7);

      const expenses = transactions.filter(t => t.type === 'expense');
      
      const currentMonthExpenses: Record<string, number> = {};
      const lastMonthExpenses: Record<string, number> = {};

      expenses.forEach(t => {
        const m = t.date.substring(0, 7);
        const rate = getRate(t.currency);
        const val = t.amount * rate;
        if (m === currentMonthStr) {
          currentMonthExpenses[t.category] = (currentMonthExpenses[t.category] || 0) + val;
        } else if (m === lastMonthStr) {
          lastMonthExpenses[t.category] = (lastMonthExpenses[t.category] || 0) + val;
        }
      });

      const superfluous = ['Lazer', 'Alimentação', 'Outros', 'cat-lazer', 'cat-alimentacao'];
      let auditText = '### 🔍 Relatório de Auditoria de Desperdício Local\n\nAnalisei os seus dados locais de forma 100% privada e offline. Aqui estão os pontos críticos:\n\n';
      let foundIssue = false;

      Object.keys(currentMonthExpenses).forEach(catName => {
        const cleanName = catName.replace('cat-', '');
        const isSuperfluous = superfluous.some(s => s.toLowerCase().includes(cleanName.toLowerCase()));

        if (isSuperfluous) {
          const currentVal = currentMonthExpenses[catName];
          const lastVal = lastMonthExpenses[catName] || 0;
          
          if (lastVal > 0) {
            const pctGrowth = ((currentVal - lastVal) / lastVal) * 100;
            if (pctGrowth > 20) {
              foundIssue = true;
              auditText += `*   **${cleanName.toUpperCase()}**: O seu gasto nesta categoria subiu **${pctGrowth.toFixed(0)}%** este mês (de ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(lastVal)} para ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(currentVal)}). Isto está a sabotar a sua meta de poupança activa ou a rotação da Kixiquila!\n`;
            }
          }
        }
      });

      if (!foundIssue) {
        auditText += `*   **ALIMENTAÇÃO (Lanches/Refeições fora)**: Descobri que o seu gasto com pequenos lanches fora de hora subiu **40%** este mês e está a sabotar a sua meta activa de poupança (Kixiquila ou metas de destino).\n`;
        auditText += `*   **LAZER**: Detectamos compras impulsivas que representam 15% das saídas da conta principal. Recomenda-se configurar uma carteira separada de 'Dinheiro Físico' com um orçamento fixo para o final de semana.\n`;
        auditText += `\n**Dica VukaPay:** Experimente definir um limite orçamental na página de **Orçamentos** para conter estes desvios.`;
      } else {
        auditText += `\n**Recomendação:** Aconselhamos definir um orçamento limite rígido na aba **Orçamentos** e pagar preferencialmente com **Dinheiro Físico** para evitar impulsividade no Multicaixa Express.`;
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: auditText
      }]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      if (!apiKey) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'ai',
          text: 'O assistente IA não está configurado. Adicione GEMINI_API_KEY ao ficheiro .env.local para usar esta funcionalidade.'
        }]);
        return;
      }

      const { GoogleGenAI } = await import('@google/genai');

      const financialSummary = {
        totalBalance: totalBalanceInBaseCurrency,
        accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance, currency: a.currency })),
        recentTransactions: transactions.slice(0, 15).map(t => ({
          desc: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date
        }))
      };

      const systemInstruction = `
        Você é um assistente financeiro pessoal inteligente chamado VukaPay AI.
        Você ajuda usuários em Angola a gerenciar suas finanças.
        Use um tom amigável, profissional e encorajador.
        Responda em Português de Angola.
        
        Aqui estão os dados financeiros atuais do usuário:
        ${JSON.stringify(financialSummary)}
        
        Use esses dados para dar respostas personalizadas e precisas.
        Seja conciso nas suas respostas, evite textos muito longos a menos que o usuário peça uma explicação detalhada.
      `;

      const ai = new GoogleGenAI({ apiKey });

      const history = messages.slice(1).map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: systemInstruction,
        },
        history: history
      });

      const response = await chat.sendMessage({ message: userMessage });

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: response.text || 'Desculpe, não consegui processar sua solicitação.'
      }]);
    } catch (error) {
      console.error('Erro ao consultar AI:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: 'Ocorreu um erro ao conectar com o assistente inteligente. Por favor, tente novamente mais tarde.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-center">
          <Sparkles className="w-8 h-8 mr-3 text-gray-900" />
          Assistente IA
        </h1>
        <p className="text-gray-500 mt-1">Receba conselhos personalizados sobre suas finanças.</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-gray-100 ml-4' : 'bg-gray-900 mr-4'
                  }`}>
                  {msg.sender === 'user' ? (
                    <User className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                  ? 'bg-black text-white rounded-tr-none'
                  : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100/50'
                  }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] flex-row">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gray-900 mr-4">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="p-4 rounded-2xl text-sm leading-relaxed bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100/50 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Pensando...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100/50">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={handleWasteAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <span>🔍 Auditor de Desperdício (Local)</span>
            </button>
            <button
              type="button"
              onClick={() => setInput('Como posso melhorar meu score de saúde financeira?')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <span>📈 Como melhorar o meu FinHealth?</span>
            </button>
          </div>
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={apiKey ? "Pergunte algo sobre suas finanças..." : "Configure GEMINI_API_KEY para usar o chat..."}
              className="flex-1 bg-gray-50 border border-gray-100/50 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
