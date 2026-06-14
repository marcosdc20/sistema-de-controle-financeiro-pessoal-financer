import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  BookOpen, Play, Award, Lock, ArrowRight, TrendingUp,
  AlertTriangle, CheckCircle2, Calculator, Lightbulb,
  GraduationCap, Target, Wallet, Brain, Coins, BarChart3,
  X, ChevronRight, Check, ShieldCheck, PieChart, Download, RefreshCw
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FUNDAMENTALS, COURSES, Fundamental, Course, Lesson } from '@/data/education';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getDatabase } from '@/database/db';

type Tab = 'overview' | 'fundamentals' | 'courses' | 'simulators';

export default function Education() {
  const { accounts, transactions, investments, loans, budgets, goals, getRate } = useFinance();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Firestore Synchronized States
  const [courses, setCourses] = useState<Course[]>([]);
  const [fundamentals, setFundamentals] = useState<Fundamental[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  // Offline Lessons State (SQLite)
  const [downloadedLessonIds, setDownloadedLessonIds] = useState<string[]>([]);
  const [downloadedLessons, setDownloadedLessons] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Content Viewing State
  const [selectedFundamental, setSelectedFundamental] = useState<Fundamental | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedLessons');
    return saved ? JSON.parse(saved) : [];
  });

  // Escuta conexão online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carrega as lições descarregadas no SQLite local
  useEffect(() => {
    const loadOfflineLessons = async () => {
      try {
        const localDb = await getDatabase();
        const rows = await localDb.select<any[]>('SELECT * FROM downloaded_lessons');
        setDownloadedLessons(rows || []);
        setDownloadedLessonIds((rows || []).map(r => r.id));
      } catch (err) {
        console.error('Erro ao ler lições offline do SQLite:', err);
      }
    };
    loadOfflineLessons();
  }, [isOnline]);

  // 1. Sync Content with Firestore and Auto-Seed (apenas se estiver online)
  useEffect(() => {
    if (!isOnline) {
      setLoadingContent(false);
      return;
    }

    let unsubscribeCourses: () => void;
    let unsubscribeFundamentals: () => void;

    const setupListeners = async () => {
      try {
        const { getDocs } = await import('firebase/firestore');
        const coursesSnap = await getDocs(collection(db, 'education_courses'));
        if (coursesSnap.empty) {
          for (const course of COURSES) {
            await setDoc(doc(db, 'education_courses', course.id), course);
          }
        }
        
        const fundSnap = await getDocs(collection(db, 'education_fundamentals'));
        if (fundSnap.empty) {
          for (const item of FUNDAMENTALS) {
            await setDoc(doc(db, 'education_fundamentals', item.id), item);
          }
        }
      } catch (err) {
        console.error("Error seeding education data:", err);
      }

      unsubscribeCourses = onSnapshot(collection(db, 'education_courses'), (snapshot) => {
        const list: Course[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(list);
      });

      unsubscribeFundamentals = onSnapshot(collection(db, 'education_fundamentals'), (snapshot) => {
        const list: Fundamental[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Fundamental);
        });
        setFundamentals(list);
        setLoadingContent(false);
      });
    };

    setupListeners();

    return () => {
      if (unsubscribeCourses) unsubscribeCourses();
      if (unsubscribeFundamentals) unsubscribeFundamentals();
    };
  }, [isOnline]);

  // Função para descarregar aula para offline (converte vídeo para Base64)
  const handleDownloadLesson = async (lesson: Lesson, courseId: string) => {
    setDownloadingId(lesson.id);
    try {
      let base64Video = '';
      if (lesson.videoUrl) {
        const isIframe = lesson.videoUrl.includes('youtube.com') || 
                         lesson.videoUrl.includes('youtu.be') || 
                         lesson.videoUrl.includes('vimeo.com');
        if (isIframe) {
          console.log('[Download Offline] Vídeo é um iframe (Youtube/Vimeo). Baixando apenas textos da aula.');
        } else {
          try {
            const res = await fetch(lesson.videoUrl);
            if (!res.ok) throw new Error('Erro na resposta do download.');
            const blob = await res.blob();
            base64Video = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (videoErr) {
            console.warn('[Download Offline] Falha ao baixar vídeo em base64. A aula será guardada sem vídeo:', videoErr);
          }
        }
      }

      const localDb = await getDatabase();
      await localDb.execute(
        `INSERT INTO downloaded_lessons (id, course_id, title, content, video_url, local_video_base64, downloaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           video_url = EXCLUDED.video_url,
           local_video_base64 = EXCLUDED.local_video_base64,
           downloaded_at = EXCLUDED.downloaded_at`,
        [lesson.id, courseId, lesson.title, lesson.content || '', lesson.videoUrl || '', base64Video, Date.now()]
      );

      setDownloadedLessonIds(prev => [...prev, lesson.id]);
      
      // Se offline, atualiza a lista exibida imediatamente
      if (!isOnline) {
        const rows = await localDb.select<any[]>('SELECT * FROM downloaded_lessons');
        setDownloadedLessons(rows || []);
      }
      
      alert('Aula descarregada com sucesso para estudo offline!');
    } catch (err) {
      console.error('Erro ao guardar aula offline:', err);
      alert('Ocorreu um erro ao guardar a aula localmente.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Reconstrói a estrutura dos cursos virtuais no modo offline
  const offlineCourses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    downloadedLessons.forEach(lesson => {
      if (!groups[lesson.course_id]) {
        groups[lesson.course_id] = [];
      }
      groups[lesson.course_id].push({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.local_video_base64 || lesson.video_url,
        duration: 'Acesso Offline'
      });
    });

    return Object.entries(groups).map(([courseId, modules]) => {
      const realCourse = COURSES.find(c => c.id === courseId);
      return {
        id: courseId,
        title: realCourse?.title || `Curso (${courseId})`,
        description: realCourse?.description || 'Conteúdo descarregado para visualização offline.',
        image: realCourse?.image || '📚',
        level: realCourse?.level || 'Qualquer',
        duration: realCourse?.duration || 'Completo',
        modules: modules
      } as Course;
    });
  }, [downloadedLessons]);

  const displayedCourses = isOnline ? courses : offlineCourses;
  const displayedFundamentals = isOnline 
    ? (fundamentals.length > 0 ? fundamentals : FUNDAMENTALS) 
    : FUNDAMENTALS;

  // Update selectedLesson when selectedCourse changes
  useEffect(() => {
    if (selectedCourse && selectedCourse.modules && selectedCourse.modules.length > 0) {
      setSelectedLesson(selectedCourse.modules[0]);
    } else {
      setSelectedLesson(null);
    }
  }, [selectedCourse]);

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

    // Monthly stats
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

  // Video helpers
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes('vimeo.com')) {
      const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
      const match = url.match(regExp);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
    return url;
  };

  const isIframeVideo = (url: string) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'));
  };

  // --- Components ---

  const ProgressBar = ({ value, max = 100 }: { value: number, max?: number }) => (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-white rounded-full transition-all duration-500"
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );

  const CompoundInterestSimulator = () => {
    const [initial, setInitial] = useState(100000);
    const [monthly, setMonthly] = useState(20000);
    const [years, setYears] = useState(10);
    const [rate, setRate] = useState(12);

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
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900">
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
                className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Aporte Mensal (AOA)</label>
              <input
                type="number"
                value={monthly}
                onChange={e => setMonthly(Number(e.target.value))}
                className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200"
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
                className="w-full accent-black cursor-pointer"
              />
              <div className="text-right text-sm font-semibold text-gray-900">{years} anos</div>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Taxa Anual (%)</label>
              <input
                type="range"
                min="1"
                max="20"
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="text-right text-sm font-semibold text-gray-900">{rate}% a.a.</div>
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
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
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
    const [interestRate, setInterestRate] = useState(15);
    const [monthlyPayment, setMonthlyPayment] = useState(20000);

    const calculation = useMemo(() => {
      let balance = loanAmount;
      let months = 0;
      let totalInterest = 0;
      const monthlyRate = interestRate / 100 / 12;

      while (balance > 0 && months < 360) {
        const interest = balance * monthlyRate;
        totalInterest += interest;
        const principal = monthlyPayment - interest;

        if (principal <= 0) break;

        balance -= principal;
        months++;
      }

      return { months, totalInterest, isPayable: balance <= 0 };
    }, [loanAmount, interestRate, monthlyPayment]);

    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900">
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
                className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Taxa de Juros Anual (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={e => setInterestRate(Number(e.target.value))}
                className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Pagamento Mensal (AOA)</label>
              <input
                type="number"
                value={monthlyPayment}
                onChange={e => setMonthlyPayment(Number(e.target.value))}
                className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200"
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
    const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4);

    const targetAmount = monthlyExpenses * 12 / (safeWithdrawalRate / 100);

    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900">
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
                className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200"
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
                className="w-full accent-black cursor-pointer"
              />
              <div className="text-right text-sm font-semibold text-gray-900">{safeWithdrawalRate}%</div>
            </div>
          </div>
          <div className="bg-gray-900 text-white rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">Sua Meta de Patrimônio</p>
              <p className="text-3xl md:text-4xl font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', notation: 'compact' }).format(targetAmount)}
              </p>
              <p className="text-xs text-gray-400 mt-4 max-w-xs leading-relaxed">
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
          <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-start sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedFundamental.title}</h3>
                <p className="text-sm text-gray-500">{selectedFundamental.description}</p>
              </div>
            </div>
            <button onClick={() => setSelectedFundamental(null)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-8 prose prose-gray max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {selectedFundamental.content}
          </div>
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={() => setSelectedFundamental(null)}
              className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
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

    const isLessonCompleted = selectedLesson ? completedLessons.includes(selectedLesson.id) : false;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
          {/* Sidebar */}
          <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 flex flex-col h-1/3 md:h-full">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{selectedCourse.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <span className="px-2 py-0.5 bg-white border rounded text-[10px] font-semibold">{selectedCourse.level}</span>
                <span>{selectedCourse.duration}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
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
                const isSelected = selectedLesson?.id === lesson.id;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={cn(
                      "p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 group",
                      isSelected ? "border-black bg-black text-white shadow-sm" :
                      isCompleted ? "bg-emerald-50/50 border-emerald-100 text-gray-800" :
                      "bg-white border-gray-100 hover:border-gray-200 text-gray-800"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors text-xs font-semibold",
                      isSelected ? "bg-white text-black" :
                      isCompleted ? "bg-emerald-500 text-white" :
                      "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                    )}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("text-xs font-bold truncate", isSelected ? "text-white" : isCompleted ? "text-emerald-950" : "text-gray-950")}>
                        {lesson.title}
                      </h4>
                      <p className={cn("text-[10px] mt-0.5", isSelected ? "text-gray-300" : "text-gray-500")}>{lesson.duration}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col h-2/3 md:h-full bg-white overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-gray-50/30">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visualizador de Aula</span>
              <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {selectedLesson ? (
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-950">{selectedLesson.title}</h2>
                    <p className="text-xs text-gray-400 mt-1">Duração estimada: {selectedLesson.duration}</p>
                  </div>
                  {isOnline && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadLesson(selectedLesson, selectedCourse.id);
                      }}
                      disabled={downloadedLessonIds.includes(selectedLesson.id) || downloadingId === selectedLesson.id}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all self-start sm:self-auto",
                        downloadedLessonIds.includes(selectedLesson.id)
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 cursor-default"
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 cursor-pointer active:scale-95"
                      )}
                    >
                      {downloadingId === selectedLesson.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>A descarregar...</span>
                        </>
                      ) : downloadedLessonIds.includes(selectedLesson.id) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Guardado Offline</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Descarregar para Offline</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Video Player Section */}
                {selectedLesson.videoUrl && (
                  <div className="w-full relative overflow-hidden rounded-2xl shadow-md border border-gray-100 bg-black aspect-video max-h-[380px]">
                    {isIframeVideo(selectedLesson.videoUrl) ? (
                      <iframe
                        src={getEmbedUrl(selectedLesson.videoUrl)}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={selectedLesson.videoUrl}
                        controls
                        className="absolute inset-0 w-full h-full"
                      />
                    )}
                  </div>
                )}

                {/* Text Content */}
                <div className="prose prose-gray max-w-none text-gray-600 text-sm leading-relaxed whitespace-pre-line border-t border-gray-100 pt-6">
                  {selectedLesson.content}
                </div>

                {/* Completion Control */}
                <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Concluir aulas acumula pontos de XP e ajuda a evoluir seu nível FinHealth.</span>
                  </div>
                  <button
                    onClick={() => toggleLessonCompletion(selectedLesson.id)}
                    className={cn(
                      "w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2",
                      isLessonCompleted 
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                        : "bg-black text-white hover:bg-gray-800"
                    )}
                  >
                    {isLessonCompleted ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Aula Concluída</span>
                      </>
                    ) : (
                      <span>Marcar como Concluída</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mb-6">
                  {selectedCourse.image}
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-3">Selecione uma Aula</h2>
                <p className="text-gray-500 max-w-sm text-sm">
                  Escolha um dos módulos na barra lateral para começar a aprender, assistir aos vídeos do curso e marcar o progresso.
                </p>
              </div>
            )}
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
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'fundamentals', label: 'Fundamentos', icon: BookOpen },
          { id: 'courses', label: 'Cursos', icon: GraduationCap },
          { id: 'simulators', label: 'Simuladores', icon: Calculator },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-black text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loadingContent ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {!isOnline && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-2xl flex items-center gap-3 text-xs mb-6">
                <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold">Modo Offline Ativo.</span> Você está visualizando apenas os cursos e lições descarregados localmente.
                </div>
              </div>
            )}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
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
                            "font-bold text-sm mb-1",
                            tip.type === 'warning' ? "text-orange-900" :
                              tip.type === 'alert' ? "text-yellow-900" :
                                tip.type === 'danger' ? "text-red-900" :
                                  "text-blue-900"
                          )}>{tip.title}</h3>
                          <p className={cn(
                            "text-xs mb-3 leading-relaxed",
                            tip.type === 'warning' ? "text-orange-700" :
                              tip.type === 'alert' ? "text-yellow-700" :
                                tip.type === 'danger' ? "text-red-700" :
                                  "text-blue-700"
                          )}>{tip.message}</p>
                          <button
                            onClick={() => setActiveTab(tip.targetTab as Tab)}
                            className="text-[10px] font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
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
                    <h2 className="text-base font-bold text-gray-950">Continuar Aprendendo</h2>
                    {displayedCourses.length > 0 && (
                      <div
                        onClick={() => {
                          const course = displayedCourses.find(c => c.id === 'invest-angola') || displayedCourses[0];
                          if (course) {
                            setSelectedCourse(course);
                          }
                        }}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-center group cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                          {displayedCourses.find(c => c.id === 'invest-angola')?.image || displayedCourses[0].image}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-950 text-base">{displayedCourses.find(c => c.id === 'invest-angola')?.title || displayedCourses[0].title}</h3>
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">Recomendado</span>
                          </div>
                          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                            {displayedCourses.find(c => c.id === 'invest-angola')?.description || displayedCourses[0].description}
                          </p>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-1/3" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 mt-2">30% concluído</p>
                        </div>
                        <button className="p-3 bg-gray-950 text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm cursor-pointer">
                          <Play className="w-4 h-4 ml-0.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-base font-bold text-gray-950">Conquistas</h2>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <div className={`flex items-center gap-4 ${completedLessons.length >= 3 ? '' : 'opacity-50'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${completedLessons.length >= 3 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <Target className={`w-5 h-5 ${completedLessons.length >= 3 ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">Estudante Dedicado</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">Complete 3 aulas</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-4 ${budgets.length > 0 ? '' : 'opacity-50'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${budgets.length > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                          <Award className={`w-5 h-5 ${budgets.length > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">Primeiro Passo</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">Criou o primeiro orçamento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fundamentals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {displayedFundamentals.map((item) => {
                  const Icon = {
                    Wallet, TrendingUp, AlertTriangle, Coins, BarChart3, Brain, ShieldCheck, PieChart
                  }[item.icon] || BookOpen;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFundamental(item)}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gray-50 text-black border border-gray-100 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-gray-950 text-sm mb-2">{item.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {displayedCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-full sm:w-44 h-28 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-102 transition-transform">
                      {course.image}
                    </div>
                    <div className="flex-1 py-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm text-gray-900">{course.title}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-semibold text-gray-600">{course.level}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 mb-2 leading-relaxed">{course.description}</p>
                        <div className="flex items-center gap-4 text-[10px] text-gray-400 font-semibold">
                          <span className="flex items-center"><BookOpen className="w-3.5 h-3.5 mr-1" /> {course.modules.length} Aulas</span>
                          <span className="flex items-center">⏱️ {course.duration}</span>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        Começar Curso <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'simulators' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <CompoundInterestSimulator />
                <DebtAmortizationSimulator />
                <FinancialIndependenceSimulator />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <FundamentalModal />
      <CourseModal />

    </PageTransition>
  );
}
