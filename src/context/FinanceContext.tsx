import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { CURRENCIES, CATEGORIES } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/types/database';
import { getDatabase, exportDatabaseToJson, importDatabaseFromJson, IDatabase } from '@/database/db';

export type TransactionType = 'expense' | 'income' | 'transfer' | 'adjustment';
export type TransactionStatus = 'paid' | 'pending' | 'overdue' | 'cancelled' | 'scheduled';

export type AccountStatus = 'active' | 'inactive' | 'archived' | 'blocked';
export type AccountCategory = 'bank' | 'digital' | 'physical' | 'investment';

export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly' | 'custom';
export type BudgetType = 'category' | 'goal' | 'project' | 'general';
export type BudgetStatus = 'active' | 'completed' | 'exceeded' | 'paused' | 'archived';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial' | 'expired';
export type BillingCycle = 'monthly' | 'annual' | 'weekly' | 'custom';

export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalType = 'deadline' | 'no_deadline' | 'recurring';
export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'paused';

export type InvestmentType = 'Ações' | 'Fundos' | 'Obrigações' | 'Depósito a prazo' | 'Criptomoeda' | 'Negócio próprio' | 'Outro';
export type InvestmentRisk = 'Baixo' | 'Médio' | 'Alto';
export type InvestmentStatus = 'active' | 'sold';

export type LoanType = 'received' | 'granted';
export type LoanCategory = 'personal' | 'family' | 'professional' | 'business';
export type LoanStatus = 'active' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type InterestType = 'simple' | 'compound';
export type PaymentFrequency = 'one_time' | 'weekly' | 'monthly' | 'yearly';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'Em Planeamento' | 'Ativo' | 'Suspenso' | 'Concluído';
  budgetLimit?: number;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ToolCost {
  name: string;
  cost: number;
}

export interface Task {
  id: string;
  projectId?: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'doing' | 'done';
  dueDate?: string;
  estimatedRevenue?: number;
  subtasks: Subtask[];
  tags: string[];
  toolsCost: ToolCost[];
  createdAt: string;
}

export interface AutoRule {
  id: string;
  userId: string;
  keyword: string;
  categoryName: string;
  subcategoryName?: string;
  createdAt: string;
}

export interface DbCategory {
  id: string;
  userId?: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'expense' | 'income' | 'transfer' | 'adjustment';
  parentId?: string;
  limitAmount?: number;
  createdAt?: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Loan {
  id: string;
  type: LoanType;
  counterparty: string;
  institution?: string;
  category: LoanCategory;
  principalAmount: number;
  currentBalance: number;
  currency: keyof typeof CURRENCIES;
  interestRate: number;
  interestType: InterestType;
  startDate: string;
  dueDate?: string;
  frequency: PaymentFrequency;
  status: LoanStatus;
  description?: string;
  accountId?: string;
  payments: LoanPayment[];
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  currency: keyof typeof CURRENCIES;
  purchaseDate: string;
  quantity?: number;
  unitPrice?: number;
  fees: number;
  accountId?: string;
  broker?: string;
  risk: InvestmentRisk;
  status: InvestmentStatus;
  goalId?: string;
  maturityDate?: string;
  interestRate?: number;
  paymentFrequency?: string;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  currency: keyof typeof CURRENCIES;
  deadline?: string;
  accountId?: string;
  priority: GoalPriority;
  type: GoalType;
  status: GoalStatus;
  createdAt: string;
  color?: string;
  icon?: string;
}

export interface Saving {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: keyof typeof CURRENCIES;
  interestRate: number;
  targetAmount?: number;
  startDate: string;
  createdAt: string;
}

export interface Kixiquila {
  id: string;
  userId: string;
  name: string;
  contribution: number;
  membersCount: number;
  myTurnMonth: number;
  startDate: string;
  status: string;
  membersList?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: keyof typeof CURRENCIES;
  cycle: BillingCycle;
  startDate: string;
  nextBillingDate: string;
  autoRenew: boolean;
  status: SubscriptionStatus;
  accountId?: string;
  icon?: string;
  color?: string;
  reminderDays?: number;
  notes?: string;
}

export interface Budget {
  id: string;
  name: string;
  period: BudgetPeriod;
  type: BudgetType;
  currency: keyof typeof CURRENCIES;
  category?: string;
  amount: number;
  accountId?: string;
  notifyAt: number[]; // e.g., [50, 80, 100]
  autoRenew: boolean;
  status: BudgetStatus;
  startDate: string;
  endDate?: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  category: AccountCategory;
  currency: keyof typeof CURRENCIES;
  balance: number;
  status: AccountStatus;
  color?: string;
  icon?: string;
  institution?: string;
  isMain?: boolean;
  hideFromTotal?: boolean;
  createdAt?: string;
  minBalanceLimit?: number;
  iban?: string;
  accountNumber?: string;
  mcExpressPhone?: string;
  mcExpressLimit?: number;
  mcExpressCoords?: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  relationship: 'family' | 'friend' | 'business' | 'other';
  hasAllowance: boolean;
  allowanceAmount: number;
  allowanceDay: number;
  allowanceCurrency: string;
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  currency: keyof typeof CURRENCIES;
  accountId: string;
  destinationAccountId?: string;
  category: string;
  date: string;
  status: TransactionStatus;
  paymentMethod?: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
}

export interface UserPreferences {
  base_currency: string;
  language: string;
  date_format: string;
  theme: string;
  notifications: {
    balanceAlert: boolean;
    weeklyReport: boolean;
    billReminders: boolean;
    goalAchievements: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  security: {
    twoFactor: boolean;
    appLock: boolean;
    biometrics: boolean;
  };
}

export interface Notification {
  id: string;
  title: string;
  desc: string;
  type: 'success' | 'warning' | 'info' | 'error';
  date: string;
  read: boolean;
}

interface FinanceContextType {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  subscriptions: Subscription[];
  goals: Goal[];
  investments: Investment[];
  savings: Saving[];
  loans: (Loan & { payments: LoanPayment[] })[];
  exchangeRates: ExchangeRate[];
  categories: typeof CATEGORIES;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    password?: string | null;
    security_question?: string | null;
    security_answer?: string | null;
    recovery_email?: string | null;
    pin_code?: string | null;
  } | null;
  updateProfile: (profile: {
    full_name?: string;
    avatar_url?: string;
    password?: string;
    security_question?: string;
    security_answer?: string;
    recovery_email?: string;
    pin_code?: string;
  }) => Promise<void>;
  addTransaction: (transaction: Omit<Database['public']['Tables']['transactions']['Insert'], 'user_id'> & { payment_method?: string }) => Promise<void>;
  updateTransaction: (id: string, transaction: Database['public']['Tables']['transactions']['Update']) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addAccount: (account: Omit<Database['public']['Tables']['accounts']['Insert'], 'user_id'>) => Promise<void>;
  updateAccount: (id: string, account: Database['public']['Tables']['accounts']['Update']) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Database['public']['Tables']['budgets']['Insert'], 'user_id'>) => Promise<void>;
  updateBudget: (id: string, budget: Database['public']['Tables']['budgets']['Update']) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addSubscription: (subscription: Omit<Database['public']['Tables']['subscriptions']['Insert'], 'user_id'>) => Promise<void>;
  updateSubscription: (id: string, subscription: Database['public']['Tables']['subscriptions']['Update']) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Database['public']['Tables']['goals']['Insert'], 'user_id'>) => Promise<void>;
  updateGoal: (id: string, goal: Database['public']['Tables']['goals']['Update']) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number, accountId: string) => Promise<void>;
  addInvestment: (investment: Omit<Database['public']['Tables']['investments']['Insert'], 'user_id'>) => Promise<void>;
  updateInvestment: (id: string, investment: Database['public']['Tables']['investments']['Update']) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addInvestmentTransaction: (investmentId: string, type: 'aporte' | 'resgate' | 'dividendo', amount: number, accountId: string, date: string) => Promise<void>;
  addSaving: (saving: Omit<Database['public']['Tables']['savings']['Insert'], 'user_id'>) => Promise<void>;
  updateSaving: (id: string, saving: Database['public']['Tables']['savings']['Update']) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;
  kixiquilas: Kixiquila[];
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  payAllowance: (contactId: string, accountId: string, amount: number) => Promise<void>;
  addKixiquila: (kixiquila: Omit<Kixiquila, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateKixiquila: (id: string, updates: Partial<Kixiquila>) => Promise<void>;
  deleteKixiquila: (id: string) => Promise<void>;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  isTransactionModalOpen: boolean;
  setIsTransactionModalOpen: (open: boolean) => void;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  addLoan: (loan: Omit<Database['public']['Tables']['loans']['Insert'], 'user_id'>) => Promise<void>;
  updateLoan: (id: string, loan: Database['public']['Tables']['loans']['Update']) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  addLoanPayment: (loanId: string, amount: number, date: string, accountId: string, note?: string) => Promise<void>;
  addCategory: (type: keyof typeof CATEGORIES, category: string) => void;
  deleteCategory: (type: keyof typeof CATEGORIES, category: string) => void;
  updateExchangeRate: (from: string, to: string, rate: number) => Promise<void>;
  getAccountBalance: (accountId: string) => number;
  getRate: (currency: string, toCurrency?: string) => number;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (date: string | Date) => string;
  totalBalanceInBaseCurrency: number;
  preferences: UserPreferences | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  loading: boolean;
  refreshData: () => Promise<void>;
  exportDatabase: () => Promise<string>;
  importDatabase: (jsonStr: string) => Promise<void>;
  clearAllFinancialData: () => Promise<void>;
  projects: Project[];
  tasks: Task[];
  autoRules: AutoRule[];
  dbCategories: DbCategory[];
  addProject: (project: Omit<Project, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addAutoRule: (rule: Omit<AutoRule, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteAutoRule: (id: string) => Promise<void>;
  addDbCategory: (category: Omit<DbCategory, 'id' | 'createdAt'>) => Promise<void>;
  updateDbCategory: (id: string, category: Partial<DbCategory>) => Promise<void>;
  deleteDbCategory: (id: string) => Promise<void>;
  optimizeDatabaseVacuum: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Helper para ajustar o saldo da conta localmente
const adjustAccountBalance = async (db: IDatabase, accountId: string, change: number) => {
  await db.execute('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [change, accountId]);
};

// Helper para atualizar dinamicamente uma linha no SQLite
async function updateRow(db: IDatabase, table: string, id: string, updates: Record<string, any>, idCol: string = 'id') {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined) continue;
    fields.push(`${key} = $${i++}`);
    values.push(typeof val === 'boolean' ? (val ? 1 : 0) : (typeof val === 'object' && val !== null ? JSON.stringify(val) : val));
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE ${table} SET ${fields.join(', ')} WHERE ${idCol} = $${i}`, values);
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<typeof CATEGORIES>(CATEGORIES);
  const [loans, setLoans] = useState<(Loan & { payments: LoanPayment[] })[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [kixiquilas, setKixiquilas] = useState<Kixiquila[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
    password?: string | null;
    security_question?: string | null;
    security_answer?: string | null;
    recovery_email?: string | null;
    pin_code?: string | null;
  } | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [autoRules, setAutoRules] = useState<AutoRule[]>([]);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('vukapay_privacy_mode') === 'true';
  });

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode(prev => {
      const next = !prev;
      localStorage.setItem('vukapay_privacy_mode', String(next));
      document.documentElement.classList.toggle('privacy-mode-active', next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('privacy-mode-active', isPrivacyMode);
  }, [isPrivacyMode]);

  const getRate = useCallback((from: string, to: string = preferences?.base_currency || 'AOA') => {
    if (from === to) return 1;

    const getRateToAOA = (curr: string) => {
      if (curr === 'AOA') return 1;
      const rateObj = exchangeRates.find(r => r.from === curr && r.to === 'AOA');
      return rateObj ? rateObj.rate : CURRENCIES[curr as keyof typeof CURRENCIES]?.rate || 1;
    };

    const rateFromToAOA = getRateToAOA(from);
    const rateToToAOA = getRateToAOA(to);

    return rateFromToAOA / rateToToAOA;
  }, [exchangeRates, preferences?.base_currency]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const [accs, trans, invs, gls, subs, bdgs, svgs, rates, lns, payments, cats, profiles, prefs, kixs, projs, tsks, rls, cts] = await Promise.all([
        db.select<any[]>('SELECT * FROM accounts ORDER BY created_at'),
        db.select<any[]>('SELECT * FROM transactions ORDER BY date DESC'),
        db.select<any[]>('SELECT * FROM investments'),
        db.select<any[]>('SELECT * FROM goals'),
        db.select<any[]>('SELECT * FROM subscriptions'),
        db.select<any[]>('SELECT * FROM budgets'),
        db.select<any[]>('SELECT * FROM savings'),
        db.select<any[]>('SELECT * FROM exchange_rates'),
        db.select<any[]>('SELECT * FROM loans'),
        db.select<any[]>('SELECT * FROM loan_payments'),
        db.select<any[]>('SELECT * FROM categories WHERE user_id IS NULL OR user_id = $1', [user.id]),
        db.select<any[]>('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [user.id]),
        db.select<any[]>('SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1', [user.id]),
        db.select<any[]>('SELECT * FROM kixiquilas WHERE user_id = $1', [user.id]),
        db.select<any[]>('SELECT * FROM projects WHERE user_id = $1', [user.id]),
        db.select<any[]>('SELECT * FROM tasks WHERE user_id = $1', [user.id]),
        db.select<any[]>('SELECT * FROM auto_categorization_rules WHERE user_id = $1', [user.id]),
        db.select<any[]>('SELECT * FROM contacts WHERE user_id = $1', [user.id])
      ]);

      const newNotifications: Notification[] = [];

      // Alertas de saldo baixo
      accs?.forEach(acc => {
        if (Number(acc.balance) < (acc.min_balance_limit || 1000)) {
          newNotifications.push({
            id: `low-bal-${acc.id}`,
            title: 'Saldo Baixo',
            desc: `A conta ${acc.name} está com saldo abaixo do limite recomendado (${acc.currency}).`,
            type: 'warning',
            date: new Date().toISOString(),
            read: false
          });
        }
      });

      // Alertas de orçamento excedido
      bdgs?.forEach(b => {
        const spent = trans?.filter(t => t.account_id === b.account_id && t.category === b.category)
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        if (spent > Number(b.amount)) {
          newNotifications.push({
            id: `over-budget-${b.id}`,
            title: 'Orçamento Excedido',
            desc: `Você ultrapassou o limite do orçamento ${b.name}.`,
            type: 'error',
            date: new Date().toISOString(),
            read: false
          });
        }
      });

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const filteredNew = newNotifications.filter(n => !existingIds.has(n.id));
        return [...filteredNew, ...prev].slice(0, 50);
      });

      if (accs) {
        setAccounts(accs.map(acc => ({
          id: acc.id,
          name: acc.name,
          type: acc.type,
          category: acc.category as AccountCategory,
          currency: acc.currency as keyof typeof CURRENCIES,
          balance: Number(acc.balance),
          status: acc.status as AccountStatus,
          color: acc.color,
          icon: acc.icon,
          institution: acc.institution,
          isMain: acc.is_main === 1 || acc.is_main === true,
          hideFromTotal: acc.hide_from_total === 1 || acc.hide_from_total === true,
          minBalanceLimit: acc.min_balance_limit ? Number(acc.min_balance_limit) : undefined,
          createdAt: acc.created_at,
          iban: acc.iban,
          accountNumber: acc.account_number,
          mcExpressPhone: acc.mc_express_phone,
          mcExpressLimit: acc.mc_express_limit ? Number(acc.mc_express_limit) : undefined,
          mcExpressCoords: acc.mc_express_coords
        })));
      }

      if (cts) {
        setContacts(cts.map(c => ({
          id: c.id,
          userId: c.user_id,
          name: c.name,
          phone: c.phone,
          relationship: c.relationship as any,
          hasAllowance: c.has_allowance === 1 || c.has_allowance === true,
          allowanceAmount: Number(c.allowance_amount),
          allowanceDay: Number(c.allowance_day),
          allowanceCurrency: c.allowance_currency || 'AOA',
          notes: c.notes,
          createdAt: c.created_at
        })));
      }

      if (trans) {
        setTransactions(trans.map(t => {
          const rawType = (t.type || '').toLowerCase().trim();
          let normalizedType: TransactionType = 'expense';

          if (rawType.includes('income') || rawType.includes('receita') || rawType.includes('entrada')) {
            normalizedType = 'income';
          } else if (rawType.includes('expense') || rawType.includes('despesa') || rawType.includes('saída') || rawType.includes('saida')) {
            normalizedType = 'expense';
          } else if (rawType.includes('transfer')) {
            normalizedType = 'transfer';
          } else if (rawType.includes('adjust') || rawType.includes('ajuste')) {
            normalizedType = 'adjustment';
          }

          return {
            id: t.id,
            type: normalizedType,
            description: t.description || '',
            amount: Number(t.amount),
            currency: t.currency as keyof typeof CURRENCIES,
            accountId: t.account_id,
            destinationAccountId: t.destination_account_id,
            category: t.category,
            date: t.date,
            status: t.status as TransactionStatus,
            paymentMethod: t.payment_method || 'Express'
          };
        }));
      }

      if (invs) {
        setInvestments(invs.map(i => ({
          id: i.id,
          name: i.name,
          type: i.type as InvestmentType,
          investedAmount: Number(i.invested_amount),
          currentValue: Number(i.current_value),
          currency: i.currency as keyof typeof CURRENCIES,
          purchaseDate: i.purchase_date,
          quantity: i.quantity ? Number(i.quantity) : undefined,
          unitPrice: i.unit_price ? Number(i.unit_price) : undefined,
          fees: Number(i.fees),
          accountId: i.account_id,
          broker: i.broker,
          risk: i.risk as InvestmentRisk,
          status: i.status as InvestmentStatus,
          goalId: i.goal_id,
          maturityDate: i.maturity_date,
          interestRate: i.interest_rate ? Number(i.interest_rate) : undefined,
          paymentFrequency: i.payment_frequency
        })));
      }

      if (gls) {
        setGoals(gls.map(g => ({
          id: g.id,
          name: g.name,
          category: g.category,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount),
          currency: g.currency as keyof typeof CURRENCIES,
          deadline: g.deadline,
          accountId: g.account_id,
          priority: g.priority as GoalPriority,
          type: g.type as GoalType,
          status: g.status as GoalStatus,
          createdAt: g.created_at,
          color: g.color,
          icon: g.icon
        })));
      }

      if (subs) {
        setSubscriptions(subs.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          amount: Number(s.amount),
          currency: s.currency as keyof typeof CURRENCIES,
          cycle: s.cycle as BillingCycle,
          startDate: s.start_date,
          nextBillingDate: s.next_billing_date,
          autoRenew: s.auto_renew === 1 || s.auto_renew === true,
          status: s.status as SubscriptionStatus,
          accountId: s.account_id,
          icon: s.icon,
          color: s.color,
          reminderDays: s.reminder_days,
          notes: s.notes
        })));
      }

      if (bdgs) {
        setBudgets(bdgs.map(b => {
          let parsedNotify = [50, 80, 100];
          try {
            if (typeof b.notify_at === 'string') {
              parsedNotify = JSON.parse(b.notify_at);
            } else if (Array.isArray(b.notify_at)) {
              parsedNotify = b.notify_at;
            }
          } catch (e) {
            console.error("Erro no parse de notify_at:", e);
          }

          return {
            id: b.id,
            name: b.name,
            period: b.period as BudgetPeriod,
            type: b.type as BudgetType,
            currency: b.currency as keyof typeof CURRENCIES,
            category: b.category,
            amount: Number(b.amount),
            accountId: b.account_id,
            notifyAt: parsedNotify,
            autoRenew: b.auto_renew === 1 || b.auto_renew === true,
            status: b.status as BudgetStatus,
            startDate: b.start_date,
            endDate: b.end_date
          };
        }));
      }

      if (svgs) {
        setSavings(svgs.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          amount: Number(s.amount),
          currency: s.currency as keyof typeof CURRENCIES,
          interestRate: Number(s.interest_rate),
          targetAmount: s.target_amount ? Number(s.target_amount) : undefined,
          startDate: s.start_date || '',
          createdAt: s.created_at || ''
        })));
      }

      if (kixs) {
        setKixiquilas(kixs.map(k => ({
          id: k.id,
          userId: k.user_id,
          name: k.name,
          contribution: Number(k.contribution),
          membersCount: Number(k.members_count),
          myTurnMonth: Number(k.my_turn_month),
          startDate: k.start_date,
          status: k.status,
          membersList: k.members_list,
          createdAt: k.created_at
        })));
      }

      if (rates) {
        setExchangeRates(rates.map(r => ({ from: r.from_currency, to: r.to_currency, rate: Number(r.rate) })));
      }

      let profData = profiles?.[0];
      if (!profData) {
        const defaultName = user.user_metadata?.full_name || 'Usuário Local';
        const defaultAvatar = user.user_metadata?.avatar_url || '';
        await db.execute('INSERT INTO profiles (id, full_name, avatar_url, password) VALUES ($1, $2, $3, $4)', [user.id, defaultName, defaultAvatar, null]);
        profData = { id: user.id, full_name: defaultName, avatar_url: defaultAvatar, password: null };
      }
      setProfile({
        full_name: profData.full_name,
        avatar_url: profData.avatar_url,
        password: profData.password,
        security_question: profData.security_question,
        security_answer: profData.security_answer,
        recovery_email: profData.recovery_email,
        pin_code: profData.pin_code
      });

      let prefsData = prefs?.[0];
      if (!prefsData) {
        const defaultPrefs = {
          user_id: user.id,
          base_currency: 'AOA',
          language: 'pt-AO',
          date_format: 'DD/MM/YYYY',
          theme: 'light',
          notifications: JSON.stringify({
            balanceAlert: true,
            weeklyReport: false,
            billReminders: true,
            goalAchievements: true,
            pushNotifications: true,
            emailNotifications: false
          }),
          security: JSON.stringify({
            twoFactor: false,
            appLock: false,
            biometrics: false
          })
        };
        await db.execute(
          'INSERT INTO user_preferences (user_id, base_currency, language, date_format, theme, notifications, security) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [defaultPrefs.user_id, defaultPrefs.base_currency, defaultPrefs.language, defaultPrefs.date_format, defaultPrefs.theme, defaultPrefs.notifications, defaultPrefs.security]
        );
        prefsData = defaultPrefs;
      }

      let parsedNotifications = {
        balanceAlert: true,
        weeklyReport: false,
        billReminders: true,
        goalAchievements: true,
        pushNotifications: true,
        emailNotifications: false
      };
      let parsedSecurity = {
        twoFactor: false,
        appLock: false,
        biometrics: false
      };

      try {
        if (typeof prefsData.notifications === 'string') {
          parsedNotifications = JSON.parse(prefsData.notifications);
        } else if (prefsData.notifications) {
          parsedNotifications = prefsData.notifications;
        }
      } catch (e) {
        console.error("Erro no parse de notificações:", e);
      }

      try {
        if (typeof prefsData.security === 'string') {
          parsedSecurity = JSON.parse(prefsData.security);
        } else if (prefsData.security) {
          parsedSecurity = prefsData.security;
        }
      } catch (e) {
        console.error("Erro no parse de segurança:", e);
      }

      setPreferences({
        base_currency: prefsData.base_currency,
        language: prefsData.language,
        date_format: prefsData.date_format,
        theme: 'light',
        notifications: parsedNotifications,
        security: parsedSecurity
      });
      document.documentElement.classList.remove('dark');
      // Also persist to localStorage for Login page to pick up before context loads
      localStorage.setItem('vukapay_theme', 'light');

      if (lns) {
        setLoans(lns.map(l => {
          const lPayments = (payments || [])
            .filter(p => p.loan_id === l.id)
            .map(p => ({
              id: p.id,
              loanId: p.loan_id,
              amount: Number(p.amount),
              date: p.date,
              note: p.note
            }));

          return {
            id: l.id,
            type: l.type as LoanType,
            counterparty: l.counterparty,
            institution: l.institution,
            category: l.category as LoanCategory,
            principalAmount: Number(l.principal_amount),
            currentBalance: Number(l.current_balance),
            currency: l.currency as keyof typeof CURRENCIES,
            interestRate: Number(l.interest_rate),
            interestType: l.interest_type as InterestType,
            startDate: l.start_date,
            dueDate: l.due_date,
            frequency: l.frequency as PaymentFrequency,
            status: l.status as LoanStatus,
            description: l.description,
            accountId: l.account_id,
            payments: lPayments
          };
        }));
      }

      if (cats) {
        const grouped = {
          income: cats.filter(c => c.type === 'income' || c.type === 'incomes').map(c => c.name),
          expense: cats.filter(c => c.type === 'expense' || c.type === 'expenses').map(c => c.name),
          transfer: cats.filter(c => c.type === 'transfer' || !c.type).map(c => c.name),
          adjustment: cats.filter(c => c.type === 'adjustment').map(c => c.name)
        };

        const merged = {
          income: Array.from(new Set([...grouped.income, ...CATEGORIES.income])),
          expense: Array.from(new Set([...grouped.expense, ...CATEGORIES.expense])),
          transfer: Array.from(new Set([...grouped.transfer, ...CATEGORIES.transfer])),
          adjustment: Array.from(new Set([...grouped.adjustment, ...CATEGORIES.adjustment]))
        };
        setCategories(merged);
        setDbCategories(cats.map(c => ({
          id: c.id,
          userId: c.user_id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type as any,
          parentId: c.parent_id,
          limitAmount: c.limit_amount ? Number(c.limit_amount) : undefined,
          createdAt: c.created_at
        })));
      }

      if (projs) {
        setProjects(projs.map(p => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          description: p.description,
          status: p.status as any,
          budgetLimit: p.budget_limit ? Number(p.budget_limit) : undefined,
          dueDate: p.due_date,
          notes: p.notes,
          createdAt: p.created_at
        })));
      }

      if (tsks) {
        setTasks(tsks.map(t => {
          let parsedSubtasks: Subtask[] = [];
          let parsedTags: string[] = [];
          let parsedToolsCost: ToolCost[] = [];
          try {
            if (t.subtasks) parsedSubtasks = JSON.parse(t.subtasks);
          } catch (e) {
            console.error('Error parsing subtasks JSON:', e);
          }
          try {
            if (t.tags) parsedTags = JSON.parse(t.tags);
          } catch (e) {
            console.error('Error parsing tags JSON:', e);
          }
          try {
            if (t.tools_cost) parsedToolsCost = JSON.parse(t.tools_cost);
          } catch (e) {
            console.error('Error parsing tools_cost JSON:', e);
          }

          return {
            id: t.id,
            projectId: t.project_id || undefined,
            userId: t.user_id,
            title: t.title,
            description: t.description,
            priority: t.priority as any,
            status: t.status as any,
            dueDate: t.due_date,
            estimatedRevenue: t.estimated_revenue ? Number(t.estimated_revenue) : undefined,
            subtasks: parsedSubtasks,
            tags: parsedTags,
            toolsCost: parsedToolsCost,
            createdAt: t.created_at
          };
        }));
      }

      if (rls) {
        setAutoRules(rls.map(r => ({
          id: r.id,
          userId: r.user_id,
          keyword: r.keyword,
          categoryName: r.category_name,
          subcategoryName: r.subcategory_name || undefined,
          createdAt: r.created_at
        })));
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setSubscriptions([]);
      setGoals([]);
      setInvestments([]);
      setLoans([]);
      setExchangeRates([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        await refreshData();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, refreshData]);

  const addTransaction = async (transaction: Omit<Database['public']['Tables']['transactions']['Insert'], 'user_id'> & { payment_method?: string }) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();

      const paymentMethod = transaction.payment_method || 'Express';

      // Lógica de Auto-categorização por palavra-chave
      let finalCategory = transaction.category;
      if (transaction.type !== 'transfer' && transaction.type !== 'adjustment') {
        const descLower = (transaction.description || '').toLowerCase();
        const matched = autoRules.find(r => descLower.includes(r.keyword.toLowerCase()));
        if (matched) {
          finalCategory = matched.categoryName;
          console.log(`[Auto-Categorização] Palavra-chave "${matched.keyword}" detectada. Categoria alterada para "${finalCategory}"`);
        }
      }

      await db.execute(
        'INSERT INTO transactions (id, user_id, account_id, destination_account_id, category, amount, currency, type, description, date, status, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [
          id,
          user.id,
          transaction.account_id,
          transaction.destination_account_id,
          finalCategory,
          transaction.amount,
          transaction.currency,
          transaction.type,
          transaction.description || '',
          transaction.date || new Date().toISOString(),
          transaction.status || 'paid',
          paymentMethod
        ]
      );

      // Ajusta o saldo da conta no frontend local
      const srcAcc = accounts.find(a => a.id === transaction.account_id);
      const srcRate = srcAcc ? getRate(transaction.currency, srcAcc.currency) : 1;
      const srcChange = Number(transaction.amount) * srcRate;

      if (transaction.type === 'income' || transaction.type === 'adjustment') {
        await adjustAccountBalance(db, transaction.account_id, srcChange);
      } else if (transaction.type === 'expense') {
        await adjustAccountBalance(db, transaction.account_id, -srcChange);
      } else if (transaction.type === 'transfer' && transaction.destination_account_id) {
        const destAcc = accounts.find(a => a.id === transaction.destination_account_id);
        const destRate = destAcc ? getRate(transaction.currency, destAcc.currency) : 1;
        const destChange = Number(transaction.amount) * destRate;

        await adjustAccountBalance(db, transaction.account_id, -srcChange);
        await adjustAccountBalance(db, transaction.destination_account_id, destChange);
      }

      // Cofre Automático Rounding logic
      const cofreConfigStr = localStorage.getItem(`vukapay_cofre_${user.id}`);
      if (cofreConfigStr && transaction.type === 'expense' && transaction.currency === 'AOA') {
        try {
          const cofreConfig = JSON.parse(cofreConfigStr);
          if (cofreConfig && cofreConfig.active && cofreConfig.rule && cofreConfig.goalId) {
            const amount = Number(transaction.amount);
            const rule = Number(cofreConfig.rule); // e.g., 100 or 500
            if (amount > 0 && (amount % rule) !== 0) {
              const nextMultiple = Math.ceil(amount / rule) * rule;
              const change = nextMultiple - amount;
              if (change > 0) {
                console.log(`[Cofre Automático] Arredondando ${amount} para ${nextMultiple} (+${change})`);
                setTimeout(() => {
                  addGoalContribution(cofreConfig.goalId, change, transaction.account_id).catch(e => {
                    console.error('[Cofre Automático] Erro ao aportar troco:', e);
                  });
                }, 1000);
              }
            }
          }
        } catch (e) {
          console.error('[Cofre Automático] Erro no parsing das configurações:', e);
        }
      }

      // Check budget alerts for desktop notifications
      if (transaction.type === 'expense') {
        try {
          const category = finalCategory;
          const matchingBudgets = budgets.filter(b => b.category === category && b.status === 'active');
          if (matchingBudgets.length > 0) {
            const today = new Date();
            const spentSoFar = transactions
              .filter(t => {
                const tDate = new Date(t.date);
                return (
                  t.type === 'expense' &&
                  t.category === category &&
                  tDate.getMonth() === today.getMonth() &&
                  tDate.getFullYear() === today.getFullYear()
                );
              })
              .reduce((sum, t) => sum + t.amount * getRate(t.currency), 0);
            
            const addedAmountInBase = Number(transaction.amount) * getRate(transaction.currency);
            const newTotalSpent = spentSoFar + addedAmountInBase;

            for (const b of matchingBudgets) {
              const budgetAmountInBase = b.amount * getRate(b.currency);
              const spentPct = budgetAmountInBase > 0 ? (newTotalSpent / budgetAmountInBase) * 100 : 0;
              const prevPct = budgetAmountInBase > 0 ? (spentSoFar / budgetAmountInBase) * 100 : 0;

              if (spentPct >= 100 && prevPct < 100) {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('VukaPay - Orçamento Excedido!', {
                    body: `Atenção: O seu orçamento para "${category}" foi ultrapassado (${spentPct.toFixed(0)}% consumido).`,
                    icon: '/logo.png'
                  });
                }
              } else if (spentPct >= 80 && prevPct < 80) {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('VukaPay - Alerta de Orçamento', {
                    body: `Aviso: O seu orçamento para "${category}" atingiu ${spentPct.toFixed(0)}% do limite.`,
                    icon: '/logo.png'
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error('[Budget Alert] Erro ao disparar notificação:', e);
        }
      }

      await refreshData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const updateTransaction = async (id: string, transactionUpdates: Database['public']['Tables']['transactions']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const oldList = await db.select<any[]>('SELECT * FROM transactions WHERE id = $1 LIMIT 1', [id]);
      const old = oldList?.[0];
      if (old) {
        // Reverte saldo anterior
        const oldSrcAcc = accounts.find(a => a.id === old.account_id);
        const oldSrcRate = oldSrcAcc ? getRate(old.currency, oldSrcAcc.currency) : 1;
        const oldSrcChange = Number(old.amount) * oldSrcRate;

        if (old.type === 'income' || old.type === 'adjustment') {
          await adjustAccountBalance(db, old.account_id, -oldSrcChange);
        } else if (old.type === 'expense') {
          await adjustAccountBalance(db, old.account_id, oldSrcChange);
        } else if (old.type === 'transfer' && old.destination_account_id) {
          const oldDestAcc = accounts.find(a => a.id === old.destination_account_id);
          const oldDestRate = oldDestAcc ? getRate(old.currency, oldDestAcc.currency) : 1;
          const oldDestChange = Number(old.amount) * oldDestRate;

          await adjustAccountBalance(db, old.account_id, oldSrcChange);
          await adjustAccountBalance(db, old.destination_account_id, -oldDestChange);
        }

        await updateRow(db, 'transactions', id, transactionUpdates);

        const updatedList = await db.select<any[]>('SELECT * FROM transactions WHERE id = $1 LIMIT 1', [id]);
        const updated = updatedList?.[0];
        if (updated) {
          const newSrcAcc = accounts.find(a => a.id === updated.account_id);
          const newSrcRate = newSrcAcc ? getRate(updated.currency, newSrcAcc.currency) : 1;
          const newSrcChange = Number(updated.amount) * newSrcRate;

          if (updated.type === 'income' || updated.type === 'adjustment') {
            await adjustAccountBalance(db, updated.account_id, newSrcChange);
          } else if (updated.type === 'expense') {
            await adjustAccountBalance(db, updated.account_id, -newSrcChange);
          } else if (updated.type === 'transfer' && updated.destination_account_id) {
            const newDestAcc = accounts.find(a => a.id === updated.destination_account_id);
            const newDestRate = newDestAcc ? getRate(updated.currency, newDestAcc.currency) : 1;
            const newDestChange = Number(updated.amount) * newDestRate;

            await adjustAccountBalance(db, updated.account_id, -newSrcChange);
            await adjustAccountBalance(db, updated.destination_account_id, newDestChange);
          }
        }
      }
      await refreshData();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const oldList = await db.select<any[]>('SELECT * FROM transactions WHERE id = $1 LIMIT 1', [id]);
      const old = oldList?.[0];
      if (old) {
        const oldSrcAcc = accounts.find(a => a.id === old.account_id);
        const oldSrcRate = oldSrcAcc ? getRate(old.currency, oldSrcAcc.currency) : 1;
        const oldSrcChange = Number(old.amount) * oldSrcRate;

        if (old.type === 'income' || old.type === 'adjustment') {
          await adjustAccountBalance(db, old.account_id, -oldSrcChange);
        } else if (old.type === 'expense') {
          await adjustAccountBalance(db, old.account_id, oldSrcChange);
        } else if (old.type === 'transfer' && old.destination_account_id) {
          const oldDestAcc = accounts.find(a => a.id === old.destination_account_id);
          const oldDestRate = oldDestAcc ? getRate(old.currency, oldDestAcc.currency) : 1;
          const oldDestChange = Number(old.amount) * oldDestRate;

          await adjustAccountBalance(db, old.account_id, oldSrcChange);
          await adjustAccountBalance(db, old.destination_account_id, -oldDestChange);
        }

        await db.execute('DELETE FROM transactions WHERE id = $1', [id]);
      }
      await refreshData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addAccount = async (account: Omit<Database['public']['Tables']['accounts']['Insert'], 'user_id'> & {
    iban?: string;
    account_number?: string;
    mc_express_phone?: string;
    mc_express_limit?: number;
    mc_express_coords?: string;
  }) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO accounts (id, user_id, name, type, category, currency, balance, status, color, icon, institution, is_main, hide_from_total, min_balance_limit, iban, account_number, mc_express_phone, mc_express_limit, mc_express_coords) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)',
        [
          id,
          user.id,
          account.name,
          account.type,
          account.category,
          account.currency,
          account.balance || 0.0,
          account.status || 'active',
          account.color,
          account.icon,
          account.institution,
          account.is_main ? 1 : 0,
          account.hide_from_total ? 1 : 0,
          account.min_balance_limit,
          account.iban || null,
          account.account_number || null,
          account.mc_express_phone || null,
          account.mc_express_limit || 0.0,
          account.mc_express_coords || null
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const updateAccount = async (id: string, accountUpdates: Database['public']['Tables']['accounts']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'accounts', id, accountUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM accounts WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const addBudget = async (budget: Omit<Database['public']['Tables']['budgets']['Insert'], 'user_id'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO budgets (id, user_id, name, period, type, currency, category, amount, account_id, notify_at, auto_renew, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
        [
          id,
          user.id,
          budget.name,
          budget.period || 'monthly',
          budget.type || 'category',
          budget.currency || 'AOA',
          budget.category,
          budget.amount,
          budget.account_id,
          JSON.stringify(budget.notify_at || [50, 80, 100]),
          budget.auto_renew ? 1 : 0,
          budget.status || 'active',
          budget.start_date || new Date().toISOString(),
          budget.end_date
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const updateBudget = async (id: string, budgetUpdates: Database['public']['Tables']['budgets']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'budgets', id, budgetUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM budgets WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const addSubscription = async (subscription: Omit<Database['public']['Tables']['subscriptions']['Insert'], 'user_id'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO subscriptions (id, user_id, name, category, amount, currency, cycle, start_date, next_billing_date, auto_renew, status, account_id, icon, color, reminder_days, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)',
        [
          id,
          user.id,
          subscription.name,
          subscription.category,
          subscription.amount,
          subscription.currency || 'AOA',
          subscription.cycle || 'monthly',
          subscription.start_date || new Date().toISOString(),
          subscription.next_billing_date,
          subscription.auto_renew ? 1 : 0,
          subscription.status || 'active',
          subscription.account_id,
          subscription.icon,
          subscription.color,
          subscription.reminder_days || 3,
          subscription.notes
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  };

  const updateSubscription = async (id: string, subscriptionUpdates: Database['public']['Tables']['subscriptions']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'subscriptions', id, subscriptionUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM subscriptions WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const addGoal = async (goal: Omit<Database['public']['Tables']['goals']['Insert'], 'user_id'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO goals (id, user_id, name, category, target_amount, current_amount, currency, deadline, account_id, priority, type, status, color, icon) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
        [
          id,
          user.id,
          goal.name,
          goal.category,
          goal.target_amount,
          goal.current_amount || 0.0,
          goal.currency || 'AOA',
          goal.deadline,
          goal.account_id,
          goal.priority || 'medium',
          goal.type || 'deadline',
          goal.status || 'active',
          goal.color,
          goal.icon
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = async (id: string, goalUpdates: Database['public']['Tables']['goals']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'goals', id, goalUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM goals WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const addGoalContribution = async (goalId: string, amount: number, accountId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    await updateGoal(goalId, { current_amount: (goal.currentAmount || 0) + amount });

    if (goal.accountId && goal.accountId !== accountId) {
      await addTransaction({
        description: `Contribuição para meta: ${goal.name}`,
        amount,
        currency: goal.currency,
        type: 'transfer',
        category: 'Investimento',
        date: new Date().toISOString(),
        account_id: accountId,
        destination_account_id: goal.accountId,
        status: 'paid'
      });
    } else {
      await addTransaction({
        description: `Contribuição para meta: ${goal.name}`,
        amount,
        currency: goal.currency,
        type: 'expense',
        category: 'Investimento',
        date: new Date().toISOString(),
        account_id: accountId,
        status: 'paid'
      });
    }
  };

  const addInvestment = async (investment: Omit<Database['public']['Tables']['investments']['Insert'], 'user_id'> & { maturity_date?: string, interest_rate?: number, payment_frequency?: string }) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO investments (id, user_id, name, type, invested_amount, current_value, currency, purchase_date, quantity, unit_price, fees, account_id, broker, risk, status, goal_id, maturity_date, interest_rate, payment_frequency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)',
        [
          id,
          user.id,
          investment.name,
          investment.type,
          investment.invested_amount,
          investment.current_value,
          investment.currency || 'AOA',
          investment.purchase_date || new Date().toISOString(),
          investment.quantity,
          investment.unit_price,
          investment.fees || 0.0,
          investment.account_id,
          investment.broker,
          investment.risk || 'Médio',
          investment.status || 'active',
          investment.goal_id,
          investment.maturity_date,
          investment.interest_rate || 0.0,
          investment.payment_frequency
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const updateInvestment = async (id: string, investmentUpdates: Database['public']['Tables']['investments']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'investments', id, investmentUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating investment:', error);
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM investments WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const addInvestmentTransaction = async (
    investmentId: string,
    type: 'aporte' | 'resgate' | 'dividendo',
    amount: number,
    accountId: string,
    date: string
  ) => {
    const investment = investments.find(i => i.id === investmentId);
    if (!investment) return;

    if (type === 'aporte') {
      await updateInvestment(investmentId, {
        invested_amount: (investment.investedAmount || 0) + amount,
        current_value: (investment.currentValue || 0) + amount
      });

      if (investment.goalId) {
        const goal = goals.find(g => g.id === investment.goalId);
        if (goal) {
          await updateGoal(goal.id, { current_amount: (goal.currentAmount || 0) + amount });
        }
      }

    } else if (type === 'resgate') {
      const newInvestedAmount = Math.max(0, (investment.investedAmount || 0) - amount);
      const newCurrentValue = Math.max(0, (investment.currentValue || 0) - amount);
      await updateInvestment(investmentId, {
        invested_amount: newInvestedAmount,
        current_value: newCurrentValue,
        status: newCurrentValue === 0 ? 'sold' : 'active'
      });

      if (investment.goalId) {
        const goal = goals.find(g => g.id === investment.goalId);
        if (goal) {
          await updateGoal(goal.id, { current_amount: Math.max(0, (goal.currentAmount || 0) - amount) });
        }
      }
    }

    await addTransaction({
      description: `${type === 'aporte' ? 'Aporte em' : type === 'resgate' ? 'Resgate de' : 'Dividendos de'} ${investment.name}`,
      amount,
      currency: investment.currency,
      type: type === 'aporte' ? 'expense' : 'income',
      category: 'Investimento',
      date,
      account_id: accountId,
      status: 'paid'
    });
  };

  const addSaving = async (saving: Omit<Database['public']['Tables']['savings']['Insert'], 'user_id'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO savings (id, user_id, name, description, amount, currency, interest_rate, target_amount, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          id,
          user.id,
          saving.name,
          saving.description || '',
          saving.amount || 0.0,
          saving.currency || 'AOA',
          saving.interest_rate || 0.0,
          saving.target_amount,
          saving.start_date || new Date().toISOString()
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding saving:', error);
    }
  };

  const updateSaving = async (id: string, savingUpdates: Database['public']['Tables']['savings']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'savings', id, savingUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating saving:', error);
    }
  };

  const deleteSaving = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM savings WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting saving:', error);
    }
  };

  const addKixiquila = async (kix: Omit<Kixiquila, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO kixiquilas (id, user_id, name, contribution, members_count, my_turn_month, start_date, status, members_list) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          id,
          user.id,
          kix.name,
          kix.contribution,
          kix.membersCount,
          kix.myTurnMonth,
          kix.startDate,
          kix.status || 'active',
          kix.membersList || ''
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding kixiquila:', error);
    }
  };

  const updateKixiquila = async (id: string, updates: Partial<Kixiquila>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.contribution !== undefined) dbUpdates.contribution = updates.contribution;
      if (updates.membersCount !== undefined) dbUpdates.members_count = updates.membersCount;
      if (updates.myTurnMonth !== undefined) dbUpdates.my_turn_month = updates.myTurnMonth;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.membersList !== undefined) dbUpdates.members_list = updates.membersList;

      await updateRow(db, 'kixiquilas', id, dbUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating kixiquila:', error);
    }
  };

  const deleteKixiquila = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM kixiquilas WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting kixiquila:', error);
    }
  };

  const addLoan = async (loan: Omit<Database['public']['Tables']['loans']['Insert'], 'user_id'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO loans (id, user_id, type, counterparty, institution, category, principal_amount, current_balance, currency, interest_rate, interest_type, start_date, due_date, frequency, status, description, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
        [
          id,
          user.id,
          loan.type,
          loan.counterparty,
          loan.institution,
          loan.category,
          loan.principal_amount,
          loan.current_balance,
          loan.currency || 'AOA',
          loan.interest_rate || 0.0,
          loan.interest_type || 'simple',
          loan.start_date || new Date().toISOString(),
          loan.due_date,
          loan.frequency || 'monthly',
          loan.status || 'active',
          loan.description,
          loan.account_id
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding loan:', error);
    }
  };

  const updateLoan = async (id: string, loanUpdates: Database['public']['Tables']['loans']['Update']) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'loans', id, loanUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating loan:', error);
    }
  };

  const deleteLoan = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM loans WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const addLoanPayment = async (loanId: string, amount: number, date: string, accountId: string, note?: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();

      await db.execute(
        'INSERT INTO loan_payments (id, loan_id, amount, date, note) VALUES ($1, $2, $3, $4, $5)',
        [id, loanId, amount, date, note || '']
      );

      const newBalance = Math.max(0, (loan.currentBalance || 0) - amount);
      const newStatus = newBalance === 0 ? 'paid' : loan.status;

      await updateLoan(loanId, {
        current_balance: newBalance,
        status: newStatus
      });

      await addTransaction({
        description: `Pagamento de Empréstimo: ${loan.counterparty}`,
        amount,
        currency: loan.currency,
        type: loan.type === 'received' ? 'expense' : 'income',
        category: 'Empréstimo',
        date,
        account_id: accountId,
        status: 'paid'
      });
      await refreshData();
    } catch (error) {
      console.error('Error adding loan payment:', error);
    }
  };

  const addCategory = async (type: keyof typeof CATEGORIES, category: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO categories (id, name, type, user_id) VALUES ($1, $2, $3, $4)',
        [id, category, type, user.id]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategory = async (type: keyof typeof CATEGORIES, category: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute(
        'DELETE FROM categories WHERE name = $1 AND type = $2 AND user_id = $3',
        [category, type, user.id]
      );
      await refreshData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const addContact = async (contact: Omit<Contact, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO contacts (id, user_id, name, phone, relationship, has_allowance, allowance_amount, allowance_day, allowance_currency, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          id,
          user.id,
          contact.name,
          contact.phone || null,
          contact.relationship || 'family',
          contact.hasAllowance ? 1 : 0,
          contact.allowanceAmount || 0.0,
          contact.allowanceDay || 5,
          contact.allowanceCurrency || 'AOA',
          contact.notes || null
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const updateContact = async (id: string, contactUpdates: Partial<Contact>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const dbUpdates: Record<string, any> = {};
      if (contactUpdates.name !== undefined) dbUpdates.name = contactUpdates.name;
      if (contactUpdates.phone !== undefined) dbUpdates.phone = contactUpdates.phone;
      if (contactUpdates.relationship !== undefined) dbUpdates.relationship = contactUpdates.relationship;
      if (contactUpdates.hasAllowance !== undefined) dbUpdates.has_allowance = contactUpdates.hasAllowance ? 1 : 0;
      if (contactUpdates.allowanceAmount !== undefined) dbUpdates.allowance_amount = contactUpdates.allowanceAmount;
      if (contactUpdates.allowanceDay !== undefined) dbUpdates.allowance_day = contactUpdates.allowanceDay;
      if (contactUpdates.allowanceCurrency !== undefined) dbUpdates.allowance_currency = contactUpdates.allowanceCurrency;
      if (contactUpdates.notes !== undefined) dbUpdates.notes = contactUpdates.notes;

      await updateRow(db, 'contacts', id, dbUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM contacts WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const payAllowance = async (contactId: string, accountId: string, amount: number) => {
    if (!user) return;
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    try {
      await addTransaction({
        description: `Pagamento de Mesada: ${contact.name}`,
        amount,
        currency: contact.allowanceCurrency as any,
        type: 'expense',
        category: 'Mesada',
        account_id: accountId,
        date: new Date().toISOString(),
        status: 'paid'
      });
      await refreshData();
    } catch (error) {
      console.error('Error paying allowance:', error);
    }
  };

  const updateExchangeRate = async (from: string, to: string, rate: number) => {
    try {
      const db = await getDatabase();
      const id = `${from}-${to}`;
      await db.execute(
        'INSERT INTO exchange_rates (id, from_currency, to_currency, rate) VALUES ($1, $2, $3, $4) ON CONFLICT(from_currency, to_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = CURRENT_TIMESTAMP',
        [id, from, to, rate]
      );
      await refreshData();
    } catch (error) {
      console.error('Error updating exchange rate:', error);
    }
  };



  const formatCurrency = useCallback((value: number, currency: string = preferences?.base_currency || 'AOA') => {
    const locale = preferences?.language || 'pt-AO';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  }, [preferences?.language, preferences?.base_currency]);

  const formatDate = useCallback((date: string | Date) => {
    const locale = preferences?.language || 'pt-AO';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale);
  }, [preferences?.language]);

  const getAccountBalance = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.balance || 0;
  };

  const totalBalanceInBaseCurrency = useMemo(() => accounts.reduce((total, acc) => {
    if (acc.hideFromTotal) return total;
    const rate = getRate(acc.currency);
    return total + ((acc.balance || 0) * rate);
  }, 0), [accounts, getRate]);

  const updateProfile = async (updates: {
    full_name?: string;
    avatar_url?: string;
    password?: string;
    security_question?: string;
    security_answer?: string;
    recovery_email?: string;
    pin_code?: string;
  }) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'profiles', user.id, updates);
      await refreshData();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await updateRow(db, 'user_preferences', user.id, updates, 'user_id');
      // Force light theme
      if ('theme' in updates) {
        updates.theme = 'light';
        document.documentElement.classList.remove('dark');
        localStorage.setItem('vukapay_theme', 'light');
      }
      await refreshData();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'date' | 'read'>) => {
    setNotifications(prev => [{
      ...notif,
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      read: false
    }, ...prev]);
  };

  const exportDatabase = async (): Promise<string> => {
    return await exportDatabaseToJson();
  };

  const importDatabase = async (jsonStr: string): Promise<void> => {
    await importDatabaseFromJson(jsonStr);
    await refreshData();
  };

  const clearAllFinancialData = async () => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('PRAGMA foreign_keys = OFF;');
      await db.execute('DELETE FROM transactions WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM accounts WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM budgets WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM goals WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM subscriptions WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM investments WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM loans WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM savings WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM kixiquilas WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM categories WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM user_preferences WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM user_sessions WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM projects WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM tasks WHERE user_id = $1', [user.id]);
      await db.execute('DELETE FROM auto_categorization_rules WHERE user_id = $1', [user.id]);
      await db.execute('PRAGMA foreign_keys = ON;');
      await refreshData();
    } catch (e) {
      console.error('[FinanceContext] Erro ao limpar dados financeiros do SQLite:', e);
      throw e;
    }
  };

  const addProject = async (proj: Omit<Project, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO projects (id, user_id, name, description, status, budget_limit, due_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          id,
          user.id,
          proj.name,
          proj.description || '',
          proj.status || 'Em Planeamento',
          proj.budgetLimit,
          proj.dueDate,
          proj.notes || ''
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.budgetLimit !== undefined) dbUpdates.budget_limit = updates.budgetLimit;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      await updateRow(db, 'projects', id, dbUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM projects WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO tasks (id, project_id, user_id, title, description, priority, status, due_date, estimated_revenue, subtasks, tags, tools_cost) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [
          id,
          task.projectId || null,
          user.id,
          task.title,
          task.description || '',
          task.priority || 'medium',
          task.status || 'todo',
          task.dueDate,
          task.estimatedRevenue || 0.0,
          JSON.stringify(task.subtasks || []),
          JSON.stringify(task.tags || []),
          JSON.stringify(task.toolsCost || [])
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const dbUpdates: Record<string, any> = {};
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId || null;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.estimatedRevenue !== undefined) dbUpdates.estimated_revenue = updates.estimatedRevenue;
      if (updates.subtasks !== undefined) dbUpdates.subtasks = JSON.stringify(updates.subtasks);
      if (updates.tags !== undefined) dbUpdates.tags = JSON.stringify(updates.tags);
      if (updates.toolsCost !== undefined) dbUpdates.tools_cost = JSON.stringify(updates.toolsCost);

      await updateRow(db, 'tasks', id, dbUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM tasks WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const addAutoRule = async (rule: Omit<AutoRule, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO auto_categorization_rules (id, user_id, keyword, category_name, subcategory_name) VALUES ($1, $2, $3, $4, $5)',
        [id, user.id, rule.keyword, rule.categoryName, rule.subcategoryName || null]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding auto categorization rule:', error);
    }
  };

  const deleteAutoRule = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM auto_categorization_rules WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting auto rule:', error);
    }
  };

  const addDbCategory = async (cat: Omit<DbCategory, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO categories (id, user_id, name, type, parent_id, limit_amount) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, user.id, cat.name, cat.type, cat.parentId || null, cat.limitAmount || null]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding rich category:', error);
    }
  };

  const updateDbCategory = async (id: string, updates: Partial<DbCategory>) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId || null;
      if (updates.limitAmount !== undefined) dbUpdates.limit_amount = updates.limitAmount || null;

      await updateRow(db, 'categories', id, dbUpdates);
      await refreshData();
    } catch (error) {
      console.error('Error updating rich category:', error);
    }
  };

  const deleteDbCategory = async (id: string) => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM categories WHERE id = $1', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting rich category:', error);
    }
  };

  const optimizeDatabaseVacuum = async () => {
    if (!user) return;
    try {
      const db = await getDatabase();
      await db.execute('VACUUM;');
      console.log('[SQLite Vacuum] Banco de dados otimizado com sucesso!');
      await refreshData();
    } catch (error) {
      console.error('Error performing vacuum on database:', error);
      throw error;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        accounts,
        budgets,
        subscriptions,
        goals,
        investments,
        loans,
        exchangeRates,
        categories,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addBudget,
        updateBudget,
        deleteBudget,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalContribution,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addInvestmentTransaction,
        savings,
        addSaving,
        updateSaving,
        deleteSaving,
        kixiquilas,
        addKixiquila,
        updateKixiquila,
        deleteKixiquila,
        isPrivacyMode,
        togglePrivacyMode,
        addLoan,
        updateLoan,
        deleteLoan,
        addLoanPayment,
        addCategory,
        deleteCategory,
        updateExchangeRate,
        getAccountBalance,
        getRate,
        formatCurrency,
        formatDate,
        totalBalanceInBaseCurrency,
        loading,
        refreshData,
        profile,
        updateProfile,
        preferences,
        updatePreferences,
        isTransactionModalOpen,
        setIsTransactionModalOpen,
        notifications,
        markNotificationAsRead,
        addNotification,
        exportDatabase,
        importDatabase,
        clearAllFinancialData,
        projects,
        tasks,
        autoRules,
        dbCategories,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        addAutoRule,
        deleteAutoRule,
        addDbCategory,
        updateDbCategory,
        deleteDbCategory,
        optimizeDatabaseVacuum,
        contacts,
        addContact,
        updateContact,
        deleteContact,
        payAllowance
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
