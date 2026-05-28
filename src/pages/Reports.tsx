import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CURRENCIES, cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import PageTransition from '@/components/PageTransition';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Wallet, PiggyBank, Target,
  Landmark, HandCoins, Scale, FileText, Calendar, Filter, Download, Printer, ChevronDown, FileSpreadsheet, FileOutput
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Types ---
type ReportType = 'overview' | 'income' | 'expenses' | 'cashflow' | 'accounts' | 'budgets' | 'goals' | 'investments' | 'loans' | 'networth';

// --- Components ---

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const formatCurrency = (value: number, currency: string = 'AOA') => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl text-xs">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { transactions, accounts, budgets, goals, investments, loans, loading, exchangeRates, getRate } = useFinance();
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 5)), // Last 6 months
    end: endOfMonth(new Date())
  });
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // --- All useMemo hooks MUST be before any conditional return (React Rules of Hooks) ---
  // --- Data Processing ---

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      const inDate = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const inAccount = selectedAccount === 'all' || t.accountId === selectedAccount;
      const inCurrency = selectedCurrency === 'all' || t.currency === selectedCurrency;
      return inDate && inAccount && inCurrency;
    });
  }, [transactions, dateRange, selectedAccount, selectedCurrency]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { name: string, income: number, expense: number, balance: number, isProjection?: boolean }> = {};

    // Initialize months
    let current = dateRange.start;
    while (current <= dateRange.end) {
      const key = format(current, 'yyyy-MM');
      data[key] = {
        name: format(current, 'MMM', { locale: ptBR }),
        income: 0,
        expense: 0,
        balance: 0,
        isProjection: false
      };
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    filteredTransactions.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM');
      if (data[key]) {
        const rate = getRate(t.currency);
        const amount = t.amount * rate;
        if (t.type === 'income') {
          data[key].income += amount;
        } else if (t.type === 'expense') {
          data[key].expense += amount;
        }
        data[key].balance = data[key].income - data[key].expense;
      }
    });

    return Object.values(data);
  }, [filteredTransactions, dateRange]);

  const monthlyDataWithProjection = useMemo(() => {
    if (monthlyData.length === 0) return [];

    const avgIncome = monthlyData.reduce((acc, curr) => acc + curr.income, 0) / monthlyData.length;
    const avgExpense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0) / monthlyData.length;

    const projections = [];
    for (let i = 1; i <= 3; i++) {
      const lastDate = dateRange.end;
      const nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1);
      projections.push({
        name: format(nextDate, 'MMM', { locale: ptBR }) + '*',
        income: avgIncome,
        expense: avgExpense,
        balance: avgIncome - avgExpense,
        isProjection: true
      });
    }

    return [...monthlyData, ...projections];
  }, [monthlyData, dateRange]);

  const categoryData = useMemo(() => {
    const expenses: Record<string, number> = {};
    const income: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      const rate = getRate(t.currency);
      const amount = t.amount * rate;
      if (t.type === 'expense') {
        expenses[t.category] = (expenses[t.category] || 0) + amount;
      } else if (t.type === 'income') {
        income[t.category] = (income[t.category] || 0) + amount;
      }
    });

    return {
      expenses: Object.entries(expenses)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      income: Object.entries(income)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    };
  }, [filteredTransactions]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonthTrans = transactions.filter(t =>
      isWithinInterval(new Date(t.date), { start: startOfMonth(now), end: endOfMonth(now) })
    );

    const income = currentMonthTrans
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    const expense = currentMonthTrans
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    return { income, expense, result: income - expense };
  }, [transactions]);

  const netWorthData = useMemo(() => {
    // Filter assets/liabilities based on selectedCurrency if applied
    const filterCurrency = (item: { currency: string }) => selectedCurrency === 'all' || item.currency === selectedCurrency;
    const filterAccount = (item: { id: string }) => selectedAccount === 'all' || item.id === selectedAccount;

    const totalAccounts = accounts
      .filter(filterCurrency)
      .filter(filterAccount)
      .reduce((acc, a) => {
        const rate = getRate(a.currency);
        return acc + a.balance * rate;
      }, 0);

    const totalInvestments = investments
      .filter(filterCurrency)
      // Investments might not have accountId, so we skip account filter or check if linked
      .reduce((acc, i) => {
        const rate = getRate(i.currency);
        return acc + i.currentValue * rate;
      }, 0);

    const totalLoans = loans
      .filter(l => l.type === 'received')
      .filter(filterCurrency)
      .reduce((acc, l) => {
        const rate = getRate(l.currency);
        return acc + l.currentBalance * rate;
      }, 0);

    return {
      totalAccounts,
      totalInvestments,
      totalLoans,
      assets: totalAccounts + totalInvestments,
      liabilities: totalLoans,
      netWorth: (totalAccounts + totalInvestments) - totalLoans
    };
  }, [accounts, investments, loans, selectedCurrency, selectedAccount]);

  const kpis = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const debtRatio = netWorthData.assets > 0 ? (netWorthData.liabilities / netWorthData.assets) * 100 : 0;

    return {
      savingsRate,
      debtRatio,
      investmentRatio: 0 // Placeholder, requires more specific investment flow data
    };
  }, [filteredTransactions, netWorthData]);

  const comparisonStats = useMemo(() => {
    const currentStart = startOfMonth(new Date());
    const currentEnd = endOfMonth(new Date());
    const previousStart = startOfMonth(subMonths(new Date(), 1));
    const previousEnd = endOfMonth(subMonths(new Date(), 1));

    const filterAccountAndCurrency = (t: any) => {
      const inAccount = selectedAccount === 'all' || t.accountId === selectedAccount;
      const inCurrency = selectedCurrency === 'all' || t.currency === selectedCurrency;
      return inAccount && inCurrency;
    };

    const currentIncome = transactions
      .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start: currentStart, end: currentEnd }) && filterAccountAndCurrency(t))
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    const previousIncome = transactions
      .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start: previousStart, end: previousEnd }) && filterAccountAndCurrency(t))
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    const currentExpense = transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: currentStart, end: currentEnd }) && filterAccountAndCurrency(t))
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    const previousExpense = transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: previousStart, end: previousEnd }) && filterAccountAndCurrency(t))
      .reduce((acc, t) => {
        const rate = getRate(t.currency);
        return acc + t.amount * rate;
      }, 0);

    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseChange = previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;

    return { incomeChange, expenseChange };
  }, [transactions, getRate, selectedAccount, selectedCurrency]);


  const handleExportCSV = () => {

    const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Valor', 'Moeda', 'Tipo'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        `"${t.description}"`,
        t.category,
        accounts.find(a => a.id === t.accountId)?.name || 'N/A',
        t.amount,
        t.currency,
        t.type
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Transactions
    const transHeaders = ['Data', 'Descrição', 'Categoria', 'Conta', 'Valor', 'Moeda', 'Tipo'];
    const transRows = filteredTransactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.description,
      t.category,
      accounts.find(a => a.id === t.accountId)?.name || 'N/A',
      t.amount,
      t.currency,
      t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : t.type
    ]);
    const wsTransactions = XLSX.utils.aoa_to_sheet([transHeaders, ...transRows]);
    wsTransactions['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 8 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transações');

    // Sheet 2: Monthly Summary
    const monthHeaders = ['Mês', 'Receitas', 'Despesas', 'Saldo'];
    const monthRows = monthlyData.map(m => [m.name, m.income, m.expense, m.balance]);
    const wsMonthly = XLSX.utils.aoa_to_sheet([monthHeaders, ...monthRows]);
    wsMonthly['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Resumo Mensal');

    // Sheet 3: By Category (expenses)
    const catHeaders = ['Categoria', 'Total Despesas', '% do Total'];
    const totalExp = categoryData.expenses.reduce((a, b) => a + b.value, 0);
    const catRows = categoryData.expenses.map(c => [
      c.name,
      c.value,
      `${((c.value / (totalExp || 1)) * 100).toFixed(1)}%`
    ]);
    const wsCategories = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
    wsCategories['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Por Categoria');

    XLSX.writeFile(wb, `relatorio_vukapay_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // === Header Banner ===
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('VukaPay', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Controle Financeiro Pessoal', 14, 20);
    doc.text(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 14, 20, { align: 'right' });

    // === KPI Summary ===
    const totalIncomeVal = monthlyData.reduce((a, b) => a + b.income, 0);
    const totalExpenseVal = monthlyData.reduce((a, b) => a + b.expense, 0);
    const result = totalIncomeVal - totalExpenseVal;

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período', 14, 40);

    autoTable(doc, {
      startY: 44,
      head: [['Receitas Totais', 'Despesas Totais', 'Resultado Líquido']],
      body: [[
        formatCurrency(totalIncomeVal),
        formatCurrency(totalExpenseVal),
        formatCurrency(result)
      ]],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 10, halign: 'center', fontStyle: 'bold' },
      columnStyles: {
        0: { textColor: [16, 185, 129] },
        1: { textColor: [239, 68, 68] },
        2: { textColor: result >= 0 ? [16, 185, 129] : [239, 68, 68] }
      }
    });

    // === Transactions Table ===
    const afterKPI = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 10
      : 80;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`Transações do Período (${filteredTransactions.length})`, 14, afterKPI);

    autoTable(doc, {
      startY: afterKPI + 4,
      head: [['Data', 'Descrição', 'Categoria', 'Conta', 'Valor', 'Tipo']],
      body: filteredTransactions.map(t => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.description.substring(0, 32),
        t.category,
        accounts.find(a => a.id === t.accountId)?.name || 'N/A',
        formatCurrency(t.amount, t.currency),
        t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : t.type
      ]),
      theme: 'striped',
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 55 },
        2: { cellWidth: 28 },
        3: { cellWidth: 30 },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 20, halign: 'center' }
      },
      didParseCell: (data: any) => {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Receita' ? [16, 185, 129] : [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // === Footer on every page ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `VukaPay — Controle Financeiro Pessoal  |  Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`relatorio_vukapay_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    setIsExportMenuOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Receitas (Período)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(monthlyData.reduce((acc, curr) => acc + curr.income, 0))}</h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Despesas (Período)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(monthlyData.reduce((acc, curr) => acc + curr.expense, 0))}</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500"
              style={{ width: `${Math.min((monthlyData.reduce((acc, curr) => acc + curr.expense, 0) / (monthlyData.reduce((acc, curr) => acc + curr.income, 0) || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Resultado (Período)</p>
              <h3 className={cn("text-2xl font-bold mt-1", monthlyData.reduce((acc, curr) => acc + curr.balance, 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                {formatCurrency(monthlyData.reduce((acc, curr) => acc + curr.balance, 0))}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {monthlyData.reduce((acc, curr) => acc + curr.balance, 0) >= 0 ? "Lucro no período" : "Prejuízo no período"}
          </p>
        </div>
      </div>

      {/* Advanced KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Taxa de Poupança</p>
            <h3 className={cn("text-2xl font-bold mt-1", kpis.savingsRate >= 20 ? "text-emerald-600" : kpis.savingsRate > 0 ? "text-yellow-600" : "text-red-600")}>
              {kpis.savingsRate.toFixed(1)}%
            </h3>
            <p className="text-xs text-gray-400 mt-1">Ideal: {'>'} 20%</p>
          </div>
          <div className="h-16 w-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: kpis.savingsRate }, { value: Math.max(0, 100 - kpis.savingsRate) }]} innerRadius={20} outerRadius={30} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill={kpis.savingsRate >= 20 ? "#10B981" : "#F59E0B"} />
                  <Cell fill="#F3F4F6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Índice de Endividamento</p>
            <h3 className={cn("text-2xl font-bold mt-1", kpis.debtRatio <= 30 ? "text-emerald-600" : kpis.debtRatio <= 50 ? "text-yellow-600" : "text-red-600")}>
              {kpis.debtRatio.toFixed(1)}%
            </h3>
            <p className="text-xs text-gray-400 mt-1">Ideal: {'<'} 30%</p>
          </div>
          <div className="h-16 w-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: kpis.debtRatio }, { value: Math.max(0, 100 - kpis.debtRatio) }]} innerRadius={20} outerRadius={30} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill={kpis.debtRatio <= 30 ? "#10B981" : "#EF4444"} />
                  <Cell fill="#F3F4F6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Evolução Mensal</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat('pt-AO', { notation: 'compact' }).format(val)} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
                <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 4, 4]} barSize={20} />
                <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[4, 4, 4, 4]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Fluxo de Caixa Acumulado</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat('pt-AO', { notation: 'compact' }).format(val)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" name="Saldo" stroke="#3B82F6" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Comparação Mensal</h3>
          <p className="text-sm text-gray-500">Em relação ao mês anterior</p>
        </div>
        <div className={cn("text-xl font-bold", comparisonStats.incomeChange >= 0 ? "text-emerald-600" : "text-red-600")}>
          {comparisonStats.incomeChange >= 0 ? "+" : ""}{comparisonStats.incomeChange.toFixed(1)}%
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Receitas por Categoria</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData.income} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {categoryData.income.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detalhamento</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {categoryData.income.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Comparação Mensal</h3>
          <p className="text-sm text-gray-500">Em relação ao mês anterior</p>
        </div>
        <div className={cn("text-xl font-bold", comparisonStats.expenseChange <= 0 ? "text-emerald-600" : "text-red-600")}>
          {comparisonStats.expenseChange > 0 ? "+" : ""}{comparisonStats.expenseChange.toFixed(1)}%
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Despesas por Categoria</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData.expenses} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {categoryData.expenses.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Maiores Gastos</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {categoryData.expenses.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 block">{formatCurrency(item.value)}</span>
                  <span className="text-xs text-gray-400">
                    {((item.value / (categoryData.expenses.reduce((a, b) => a + b.value, 0) || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNetWorth = () => {
    const chartData = [
      { name: 'Contas', value: netWorthData.totalAccounts },
      { name: 'Investimentos', value: netWorthData.totalInvestments },
      { name: 'Dívidas', value: netWorthData.totalLoans }
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Ativos Totais</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(netWorthData.assets)}</h3>
            <p className="text-xs text-gray-400 mt-2">Contas + Investimentos</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Passivos Totais</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(netWorthData.liabilities)}</h3>
            <p className="text-xs text-gray-400 mt-2">Empréstimos a Pagar</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-sm text-white">
            <p className="text-sm text-gray-400 font-medium">Patrimônio Líquido</p>
            <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(netWorthData.netWorth)}</h3>
            <p className="text-xs text-gray-500 mt-2">Ativos - Passivos</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Composição Patrimonial</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  <Cell fill="#3B82F6" />
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Fluxo de Caixa e Projeção (3 Meses)</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyDataWithProjection} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat('pt-AO', { notation: 'compact' }).format(val)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              <Bar dataKey="income" name="Entradas" fill="#10B981" barSize={20} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Saídas" fill="#EF4444" barSize={20} radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="balance"
                name="Saldo Líquido"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return <circle cx={cx} cy={cy} r={4} fill={payload.isProjection ? "#F59E0B" : "#3B82F6"} strokeWidth={0} />;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">* Meses marcados são projeções baseadas na média do período selecionado.</p>
      </div>
    </div>
  );

  const renderAccounts = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl">{account.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{account.name}</h4>
                  <p className="text-xs text-gray-500">{account.type}</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance, account.currency)}</h3>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500">
              <span>{account.currency}</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ativa</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Conta</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={accounts.map(a => ({ name: a.name, value: a.balance * getRate(a.currency) }))}
                cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none"
              >
                {accounts.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderBudgets = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        {budgets.map(budget => {
          const spent = transactions
            .filter(t => t.type === 'expense' && t.category === budget.category && isWithinInterval(new Date(t.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }))
            .reduce((acc, t) => acc + t.amount * getRate(t.currency), 0);
          const percentage = Math.min((spent / (budget.amount || 1)) * 100, 100);
          const isExceeded = spent > budget.amount;
          return (
            <div key={budget.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">{budget.category}</h4>
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full", isExceeded ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                  {isExceeded ? "Excedido" : "Dentro do limite"}
                </span>
              </div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(spent)}</span>
                <span className="text-sm text-gray-500 mb-1">de {formatCurrency(budget.amount)}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", isExceeded ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${percentage}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">{percentage.toFixed(1)}% consumido</p>
            </div>
          );
        })}
        {budgets.length === 0 && <div className="text-center py-12 text-gray-500">Nenhum orçamento definido.</div>}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const percentage = Math.min((goal.currentAmount / (goal.targetAmount || 1)) * 100, 100);
          return (
            <div key={goal.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Target className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                    <p className="text-xs text-gray-500">Meta: {formatCurrency(goal.targetAmount)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600">{percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Atual: {formatCurrency(goal.currentAmount)}</span>
                <span>Falta: {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInvestments = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Alocação de Ativos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={investments.map(i => ({ name: i.name, value: i.currentValue * getRate(i.currency) }))}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none"
                >
                  {investments.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          {investments.map(inv => {
            const profit = inv.currentValue - inv.investedAmount;
            const profitPercent = inv.investedAmount > 0 ? (profit / inv.investedAmount) * 100 : 0;
            return (
              <div key={inv.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">{inv.name}</h4>
                  <p className="text-xs text-gray-500">{inv.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(inv.currentValue, inv.currency)}</p>
                  <p className={cn("text-xs font-medium", profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {profit >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">A Receber (Ativos)</h3>
          <div className="space-y-4">
            {loans.filter(l => l.type === 'granted').map(loan => (
              <div key={loan.id} className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div>
                  <p className="font-medium text-gray-900">{loan.counterparty}</p>
                  <p className="text-xs text-emerald-700">Vence em: {format(new Date(loan.dueDate || new Date()), 'dd/MM/yyyy')}</p>
                </div>
                <p className="font-bold text-emerald-700">{formatCurrency(loan.currentBalance, loan.currency)}</p>
              </div>
            ))}
            {loans.filter(l => l.type === 'granted').length === 0 && <p className="text-gray-400 text-sm">Nenhum empréstimo concedido.</p>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">A Pagar (Passivos)</h3>
          <div className="space-y-4">
            {loans.filter(l => l.type === 'received').map(loan => (
              <div key={loan.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <p className="font-medium text-gray-900">{loan.counterparty}</p>
                  <p className="text-xs text-red-700">Vence em: {format(new Date(loan.dueDate || new Date()), 'dd/MM/yyyy')}</p>
                </div>
                <p className="font-bold text-red-700">{formatCurrency(loan.currentBalance, loan.currency)}</p>
              </div>
            ))}
            {loans.filter(l => l.type === 'received').length === 0 && <p className="text-gray-400 text-sm">Nenhum empréstimo recebido.</p>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cronograma de Vencimentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans
              .filter(l => l.currentBalance > 0 && l.dueDate)
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .slice(0, 6)
              .map(loan => {
                const isLate = new Date(loan.dueDate!) < new Date();
                return (
                  <div key={loan.id} className={cn("p-4 rounded-2xl border", isLate ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100")}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn("text-xs font-bold px-2 py-1 rounded-full", loan.type === 'granted' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                        {loan.type === 'granted' ? 'Receber' : 'Pagar'}
                      </span>
                      <span className={cn("text-xs font-medium", isLate ? "text-red-600" : "text-gray-500")}>{format(new Date(loan.dueDate!), 'dd MMM')}</span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{loan.counterparty}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(loan.currentBalance, loan.currency)}</p>
                  </div>
                );
              })}
            {loans.filter(l => l.currentBalance > 0 && l.dueDate).length === 0 && (
              <p className="text-gray-400 text-sm col-span-full text-center py-4">Nenhum vencimento próximo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Sidebar Navigation ---
  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'income', label: 'Receitas', icon: TrendingUp },
    { id: 'expenses', label: 'Despesas', icon: TrendingDown },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: HandCoins },
    { id: 'accounts', label: 'Contas', icon: Wallet },
    { id: 'budgets', label: 'Orçamentos', icon: PiggyBank },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'loans', label: 'Empréstimos', icon: Landmark },
    { id: 'networth', label: 'Patrimônio', icon: Scale },
  ];

  return (
    <PageTransition className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-6 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">Análise inteligente.</p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveReport(item.id as ReportType)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeReport === item.id
                  ? "bg-black text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Exportar</p>
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              className="w-full flex items-center justify-between gap-2 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                Exportar Relatório
              </span>
              <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", isExportMenuOpen && "rotate-180")} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors border-b border-gray-100"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <p className="font-semibold">Excel (.xlsx)</p>
                    <p className="text-gray-400 text-[10px]">3 folhas: Transações, Mensal, Categorias</p>
                  </div>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-800 transition-colors border-b border-gray-100"
                >
                  <FileOutput className="w-4 h-4 text-red-500" />
                  <div className="text-left">
                    <p className="font-semibold">PDF</p>
                    <p className="text-gray-400 text-[10px]">Com cabeçalho VukaPay e tabela formatada</p>
                  </div>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors border-b border-gray-100"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div className="text-left">
                    <p className="font-semibold">CSV</p>
                    <p className="text-gray-400 text-[10px]">Compatível com Excel e Google Sheets</p>
                  </div>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4 text-gray-500" />
                  <div className="text-left">
                    <p className="font-semibold">Imprimir</p>
                    <p className="text-gray-400 text-[10px]">Abre o diálogo de impressão</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="font-medium text-gray-900">Período:</span>
              <select
                className="bg-transparent border-none focus:ring-0 text-gray-900 font-medium cursor-pointer"
                onChange={(e) => {
                  const months = parseInt(e.target.value);
                  setDateRange({ start: startOfMonth(subMonths(new Date(), months)), end: endOfMonth(new Date()) });
                }}
              >
                <option value="5">Últimos 6 meses</option>
                <option value="2">Últimos 3 meses</option>
                <option value="11">Último ano</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Wallet className="w-4 h-4" />
              <span className="font-medium text-gray-900">Conta:</span>
              <select
                className="bg-transparent border-none focus:ring-0 text-gray-900 font-medium cursor-pointer"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="all">Todas</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <HandCoins className="w-4 h-4" />
              <span className="font-medium text-gray-900">Moeda:</span>
              <select
                className="bg-transparent border-none focus:ring-0 text-gray-900 font-medium cursor-pointer"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                <option value="all">Todas</option>
                {Object.keys(CURRENCIES).map(curr => <option key={curr} value={curr}>{curr}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        {activeReport === 'overview' && renderOverview()}
        {activeReport === 'income' && renderIncome()}
        {activeReport === 'expenses' && renderExpenses()}
        {activeReport === 'cashflow' && renderCashFlow()}
        {activeReport === 'accounts' && renderAccounts()}
        {activeReport === 'budgets' && renderBudgets()}
        {activeReport === 'goals' && renderGoals()}
        {activeReport === 'investments' && renderInvestments()}
        {activeReport === 'loans' && renderLoans()}
        {activeReport === 'networth' && renderNetWorth()}
      </div>
    </PageTransition>
  );
}
