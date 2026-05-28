import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  BookOpen, Play, Award, Lock, ArrowRight, TrendingUp,
  AlertTriangle, CheckCircle2, Calculator, Lightbulb,
  GraduationCap, Target, Wallet, Brain, Coins, BarChart3,
  X, ChevronRight, Check
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn, CURRENCIES } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FUNDAMENTALS, COURSES, Fundamental, Course, Lesson } from '@/data/education';

type Tab = 'overview' | 'fundamentals' | 'courses' | 'simulators';

export default function Education() {
  const { accounts, transactions, investments, loans, budgets, goals, getRate } = useFinance();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Content Viewing State
  const [selectedFundamental, setSelectedFundamental] = useState<Fundamental | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedLessons');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
  }, [completedLessons]);

  const toggleLessonCompletion = (lessonId: string) => {
    setCompletedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  // --- Smart Analysis & Gamification ---
  const analysis = useMemo(() => {
    // Calculate totals
    const totalBalance = accounts.reduce((acc, a) => acc + a.balance * getRate(a.currency), 0);
    const totalDebt = loans.filter(l => l.type === 'received' && l.status === 'active')
      .reduce((acc, l) => acc + l.currentBalance * getRate(l.currency), 0);
    const totalInvested = investments.filter(i => i.status === 'active')
      .reduce((acc, i) => acc + i.currentValue * getRate(i.currency), 0);

    // Monthly stats (approximate for demo)
    const currentMonth = new Date().getMonth();
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
      .reduce((acc, t) => acc + t.amount * getRate(t.currency), 0);

    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth)
      .reduce((acc, t) => acc + t.amount * getRate(t.currency), 0);

    // Gamification Score
    let score = 0;
    if (budgets.length > 0) score += 20;
    if (goals.length > 0) score += 20;
    if (investments.length > 0) score += 30;
    if (totalDebt === 0) score += 30;

    // Add points for learning
    score += Math.min(completedLessons.length * 5, 50); // Cap learning points at 50

    let level = 'Iniciante';
    if (score >= 50) level = 'Intermediário';
    if (score >= 100) level = 'Avançado';

    // Smart Tips Generation
    const tips = [];

    if (totalDebt > 0) {
      tips.push({
        type: 'warning',
        title: 'Atenção às Dívidas',
        message: 'Você possui empréstimos ativos. Priorize pagar as dívidas com juros mais altos primeiro.',
        action: 'Ver Estratégias de Dívida',
        targetTab: 'courses'
      });
    }

    if (totalBalance < monthlyExpenses * 3) {
      tips.push({
        type: 'alert',
        title: 'Fundo de Emergência',
        message: `Sua reserva cobre menos de 3 meses de despesas. O ideal é ter pelo menos ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: 'compact' }).format(monthlyExpenses * 6)}.`,
        action: 'Aprender sobre Reservas',
        targetTab: 'fundamentals'
      });
    }

    if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
      tips.push({
        type: 'danger',
        title: 'Orçamento Desequilibrado',
        message: 'Seus gastos estão superando sua renda este mês. Revise seu orçamento.',
        action: 'Ir para Orçamentos',
        targetTab: 'courses'
      });
    }

    if (totalInvested === 0 && totalBalance > monthlyExpenses * 3) {
      tips.push({
        type: 'opportunity',
        title: 'Comece a Investir',
        message: 'Você já tem uma reserva de segurança. Que tal fazer seu dinheiro render?',
        action: 'Curso de Investimentos',
        targetTab: 'courses'
      });
    }

    return { score, level, tips, totalDebt, totalInvested };
  }, [accounts, transactions, investments, loans, budgets, goals, completedLessons]);

  // --- Components ---

  const ProgressBar = ({ value, max = 100 }: { value: number, max?: number }) => (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-black rounded-full transition-all duration-500"
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );

  const CompoundInterestSimulator = () => {
    const [initial, setInitial] = useState(100000);
    const [monthly, setMonthly] = useState(20000);
    const [years, setYears] = useState(10);
    const [rate, setRate] = useState(12); // 12% annual return (optimistic/nominal)

    const data = useMemo(() => {
      const result = [];
      let current = initial;
      for (let i = 0; i <= years; i++) {
        result.push({ year: i, value: current });
        current = current * (1 + rate / 100) + (monthly * 12);
      }
      return result;
    }, [initial, monthly, years, rate]);

    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Simulador de Juros Compostos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Investimento Inicial (AOA)</label>
              <input
                type="number"
                value={initial}
                onChange={e => setInitial(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Aporte Mensal (AOA)</label>
              <input
                type="number"
                value={monthly}
                onChange={e => setMonthly(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Tempo (Anos)</label>
              <input
                type="range"
                min="1"
                max="30"
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-black"
              />
              <div className="text-right text-sm font-medium">{years} anos</div>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Taxa Anual (%)</label>
              <input
                type="range"
                min="1"
                max="20"
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full accent-black"
              />
              <div className="text-right text-sm font-medium">{rate}% a.a.</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => new Intl.NumberFormat('pt-AO', { notation: 'compact' }).format(val)}
                />
                <Tooltip
                  formatter={(val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val)}
                  labelFormatter={(label) => `Ano ${label}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Total Acumulado</p>
              <p className="text-2xl font-bold text-emerald-600">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(data[data.length - 1].value)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DebtAmortizationSimulator = () => {
    const [loanAmount, setLoanAmount] = useState(500000);
    const [interestRate, setInterestRate] = useState(15); // Annual
    const [monthlyPayment, setMonthlyPayment] = useState(20000);

    const calculation = useMemo(() => {
      let balance = loanAmount;
      let months = 0;
      let totalInterest = 0;
      const monthlyRate = interestRate / 100 / 12;

      // Safety break to prevent infinite loops
      while (balance > 0 && months < 360) {
        const interest = balance * monthlyRate;
        totalInterest += interest;
        const principal = monthlyPayment - interest;

        if (principal <= 0) break; // Payment too low to cover interest

        balance -= principal;
        months++;
      }

      return { months, totalInterest, isPayable: balance <= 0 };
    }, [loanAmount, interestRate, monthlyPayment]);

    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Simulador de Amortização de Dívidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Valor da Dívida (AOA)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={e => setLoanAmount(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Taxa de Juros Anual (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={e => setInterestRate(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Pagamento Mensal (AOA)</label>
              <input
                type="number"
                value={monthlyPayment}
                onChange={e => setMonthlyPayment(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            {calculation.isPayable ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Tempo para Quitar</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.floor(calculation.months / 12)} anos e {calculation.months % 12} meses
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de Juros Pagos</p>
                  <p className="text-xl font-semibold text-red-500">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(calculation.totalInterest)}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-red-500 flex flex-col items-center">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="font-medium">Pagamento mensal insuficiente para cobrir os juros.</p>
                <p className="text-sm mt-1">Aumente o valor da parcela.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FinancialIndependenceSimulator = () => {
    const [monthlyExpenses, setMonthlyExpenses] = useState(150000);
    const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4); // 4% rule

    const targetAmount = monthlyExpenses * 12 / (safeWithdrawalRate / 100);

    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          Calculadora de Independência Financeira
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Baseado na "Regra dos 4%", descubra quanto você precisa acumular para viver apenas dos rendimentos dos seus investimentos.
            </p>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Despesas Mensais Desejadas (AOA)</label>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={e => setMonthlyExpenses(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Taxa de Retirada Segura (%)</label>
              <input
                type="range"
                min="2"
                max="6"
                step="0.1"
                value={safeWithdrawalRate}
                onChange={e => setSafeWithdrawalRate(Number(e.target.value))}
                className="w-full accent-black"
              />
              <div className="text-right text-sm font-medium">{safeWithdrawalRate}%</div>
            </div>
          </div>
          <div className="bg-gray-900 text-white rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">Sua Meta de Patrimônio</p>
              <p className="text-3xl md:text-4xl font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: 'compact' }).format(targetAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Com esse valor investido, você poderia sacar {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(monthlyExpenses)} por mês vitaliciamente (ajustado pela inflação).
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
              <Target className="w-48 h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Modals ---

  const FundamentalModal = () => {
    if (!selectedFundamental) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className={`p-6 bg-${selectedFundamental.color}-50 border-b border-${selectedFundamental.color}-100 flex justify-between items-start sticky top-0 z-10`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-${selectedFundamental.color}-600 shadow-sm`}>
                {/* @ts-ignore */}
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedFundamental.title}</h3>
                <p className="text-sm text-gray-500">{selectedFundamental.description}</p>
              </div>
            </div>
            <button onClick={() => setSelectedFundamental(null)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-8 prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: selectedFundamental.content.replace(/\n/g, '<br/>') }} />
          </div>
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={() => setSelectedFundamental(null)}
              className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CourseModal = () => {
    if (!selectedCourse) return null;
    const progress = selectedCourse.modules.filter(m => completedLessons.includes(m.id)).length;
    const total = selectedCourse.modules.length;
    const percent = Math.round((progress / total) * 100);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">
          {/* Sidebar */}
          <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedCourse.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span className="px-2 py-0.5 bg-white border rounded text-xs">{selectedCourse.level}</span>
                <span>{selectedCourse.duration}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Progresso</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedCourse.modules.map((lesson, idx) => {
                const isCompleted = completedLessons.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    onClick={() => toggleLessonCompletion(lesson.id)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 group",
                      isCompleted ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      isCompleted ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                    )}>
                      {isCompleted ? <Check className="w-3 h-3" /> : <span className="text-xs">{idx + 1}</span>}
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-medium", isCompleted ? "text-emerald-900" : "text-gray-900")}>
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{lesson.duration}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col h-[50vh] md:h-auto">
            <div className="p-4 border-b border-gray-100 flex justify-end">
              <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-6">
                {selectedCourse.image}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bem-vindo ao curso</h2>
              <p className="text-gray-500 max-w-md mb-8">
                Selecione uma aula ao lado para marcar como concluída. O conteúdo detalhado de cada aula seria exibido aqui em vídeo ou texto.
              </p>
              <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm max-w-md">
                <p className="font-medium mb-1">Dica:</p>
                Clique nos círculos ao lado das aulas para marcar seu progresso e ganhar pontos de experiência!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageTransition className="space-y-8">
      {/* Header & Gamification */}
      <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                Nível: {analysis.level}
              </span>
              <span className="flex items-center text-yellow-400 text-sm font-medium">
                <Award className="w-4 h-4 mr-1" />
                {analysis.score} Pontos
              </span>
            </div>
            <h1 className="text-3xl font-semibold mb-2">Universidade Financeira</h1>
            <p className="text-gray-400 max-w-xl">
              Evolua sua inteligência financeira. Complete cursos, atinja metas e desbloqueie conquistas.
            </p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm w-full md:w-auto min-w-[280px]">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Progresso Geral</h3>
            <ProgressBar value={analysis.score} />
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>Iniciante</span>
              <span>Avançado</span>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-1/4 translate-y-1/4 pointer-events-none">
          <BookOpen className="w-96 h-96" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {[
          { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
          { id: 'fundamentals', label: 'Fundamentos', icon: BookOpen },
          { id: 'courses', label: 'Cursos', icon: GraduationCap },
          { id: 'simulators', label: 'Simuladores', icon: Calculator },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center whitespace-nowrap",
              activeTab === tab.id
                ? "bg-black text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
            )}
          >
            {/* @ts-ignore */}
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Smart Tips */}
            {analysis.tips.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.tips.map((tip, idx) => (
                  <div key={idx} className={cn(
                    "p-5 rounded-2xl border flex items-start gap-4",
                    tip.type === 'warning' ? "bg-orange-50 border-orange-100" :
                      tip.type === 'alert' ? "bg-yellow-50 border-yellow-100" :
                        tip.type === 'danger' ? "bg-red-50 border-red-100" :
                          "bg-blue-50 border-blue-100"
                  )}>
                    <div className={cn(
                      "p-2 rounded-xl",
                      tip.type === 'warning' ? "bg-orange-100 text-orange-600" :
                        tip.type === 'alert' ? "bg-yellow-100 text-yellow-600" :
                          tip.type === 'danger' ? "bg-red-100 text-red-600" :
                            "bg-blue-100 text-blue-600"
                    )}>
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-semibold mb-1",
                        tip.type === 'warning' ? "text-orange-900" :
                          tip.type === 'alert' ? "text-yellow-900" :
                            tip.type === 'danger' ? "text-red-900" :
                              "text-blue-900"
                      )}>{tip.title}</h3>
                      <p className={cn(
                        "text-sm mb-3",
                        tip.type === 'warning' ? "text-orange-700" :
                          tip.type === 'alert' ? "text-yellow-700" :
                            tip.type === 'danger' ? "text-red-700" :
                              "text-blue-700"
                      )}>{tip.message}</p>
                      <button
                        onClick={() => setActiveTab(tip.targetTab as Tab)}
                        className="text-xs font-semibold underline opacity-80 hover:opacity-100"
                      >
                        {tip.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Featured Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Continuar Aprendendo</h2>
                <div
                  onClick={() => {
                    const course = COURSES.find(c => c.id === 'invest-angola');
                    if (course) {
                      setSelectedCourse(course);
                      setActiveTab('courses');
                    }
                  }}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-center group cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                    🇦🇴
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">Investir em Angola</h3>
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">Novo</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                      Entenda como funciona a BODIVA, os títulos do tesouro e como proteger seu patrimônio da inflação local.
                    </p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-1/3" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">30% concluído</p>
                  </div>
                  <button className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors">
                    <Play className="w-5 h-5 ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Conquistas</h2>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className={`flex items-center gap-4 ${completedLessons.length >= 3 ? '' : 'opacity-50'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${completedLessons.length >= 3 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <Target className={`w-6 h-6 ${completedLessons.length >= 3 ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Estudante Dedicado</h4>
                      <p className="text-xs text-gray-500">Complete 3 aulas</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-4 ${budgets.length > 0 ? '' : 'opacity-50'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${budgets.length > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                      <Award className={`w-6 h-6 ${budgets.length > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Primeiro Passo</h4>
                      <p className="text-xs text-gray-500">Criou o primeiro orçamento</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fundamentals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {FUNDAMENTALS.map((item) => {
              // Dynamic icon mapping
              const Icon = {
                Wallet, TrendingUp, AlertTriangle, Coins, BarChart3, Brain
              }[item.icon] || BookOpen;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedFundamental(item)}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {COURSES.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-full sm:w-48 h-32 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                  {course.image}
                </div>
                <div className="flex-1 py-2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-xl text-gray-900">{course.title}</h3>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">{course.level}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 mb-2">{course.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" /> {course.modules.length} Módulos</span>
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {course.duration}</span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    Começar Curso <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'simulators' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CompoundInterestSimulator />
            <DebtAmortizationSimulator />
            <FinancialIndependenceSimulator />
          </div>
        )}
      </div>

      {/* Modals */}
      <FundamentalModal />
      <CourseModal />

    </PageTransition>
  );
}

// Helper icon component for the courses tab
function LayoutDashboard(props: any) { return <BarChart3 {...props} /> }
function Clock(props: any) { return <div {...props}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div> }

