import { useState } from 'react';
import { Sparkles, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

export default function AIAdvisor() {
  const { transactions, accounts, totalBalanceInBaseCurrency } = useFinance();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  const apiKey = process.env.GEMINI_API_KEY;
  const hasApiKey = !!apiKey;

  const handleAnalyze = async () => {
    if (!hasApiKey) {
      setAdvice('A chave da API Gemini não está configurada. Adicione GEMINI_API_KEY ao ficheiro .env.local para usar o assistente IA.');
      return;
    }
    setLoading(true);
    try {
      const { GoogleGenAI } = await import('@google/genai');

      const financialSummary = {
        totalBalance: totalBalanceInBaseCurrency,
        accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance, currency: a.currency })),
        recentTransactions: transactions.slice(0, 10).map(t => ({
          desc: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category
        }))
      };

      const prompt = `
        Atue como um consultor financeiro pessoal especialista no mercado angolano.
        Analise os seguintes dados financeiros de um usuário:
        ${JSON.stringify(financialSummary)}

        Forneça 3 conselhos práticos e curtos (max 2 frases cada) para melhorar a saúde financeira.
        Foque em:
        1. Economia em despesas supérfluas.
        2. Otimização de investimentos (sugira produtos angolanos como Unitel Money, BAI, Tesouro Direto se fizer sentido).
        3. Planejamento de longo prazo.

        Use um tom motivador e profissional. Responda em Português de Angola.
        Formate a resposta como uma lista simples.
      `;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      setAdvice(response.text || 'Não foi possível gerar conselhos no momento.');
    } catch (error) {
      console.error('Erro ao consultar AI:', error);
      setAdvice('Ocorreu um erro ao conectar com o assistente inteligente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden h-full">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">VukaPay AI Coach</h3>
        </div>

        {!advice ? (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm leading-relaxed">
              Obtenha uma análise personalizada das suas finanças com inteligência artificial.
              Descubra onde economizar e como investir melhor.
            </p>
            {!hasApiKey && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">API Gemini não configurada</p>
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3.5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analisando dados...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Gerar Diagnóstico
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 rounded-2xl p-5 backdrop-blur-sm border border-white/10 text-sm leading-relaxed whitespace-pre-line text-gray-300">
              {advice}
            </div>
            <button
              onClick={() => setAdvice(null)}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors text-center w-full"
            >
              Nova Análise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
