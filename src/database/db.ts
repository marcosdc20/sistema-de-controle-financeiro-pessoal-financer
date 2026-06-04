interface IDatabase {
  execute(query: string, values?: any[]): Promise<any>;
  select<T>(query: string, values?: any[]): Promise<T>;
  close(): Promise<boolean>;
}

class MockDatabase implements IDatabase {
  path: string;
  constructor(path: string) {
    this.path = path;
    console.log(`[MockDatabase] Inicializado banco simulado para: ${path}`);
  }

  static async load(path: string): Promise<MockDatabase> {
    return new MockDatabase(path);
  }

  async execute(query: string, values?: any[]): Promise<{ rowsAffected: number; lastInsertId: number }> {
    console.log(`[MockDatabase] [execute] SQL: ${query}`, values || '');
    return { rowsAffected: 0, lastInsertId: 0 };
  }

  async select<T = any[]>(query: string, values?: any[]): Promise<T> {
    console.log(`[MockDatabase] [select] SQL: ${query}`, values || '');
    const q = query.toLowerCase();
    
    // Simula retornos específicos de PRAGMA e contagens para evitar migrações desnecessárias na web
    if (q.includes('pragma user_version')) {
      return [{ user_version: 6 }] as any;
    }
    if (q.includes('select count(*) as count from categories')) {
      return [{ count: 9 }] as any;
    }
    if (q.includes('select count(*) as count from exchange_rates')) {
      return [{ count: 4 }] as any;
    }
    
    return [] as any;
  }

  async close(): Promise<boolean> {
    console.log('[MockDatabase] Conexão simulada fechada');
    return true;
  }
}

let dbInstance: IDatabase | null = null;
let activeDbPath: string | null = null;

/**
 * Retorna o caminho do banco de dados específico para o usuário logado.
 * Se for o usuário local principal ('local-user'), mantém 'sqlite:financer.db'
 * para preservar dados antigos.
 */
function getDatabasePath(): string {
  try {
    const savedUser = localStorage.getItem('vukapay_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user && user.id) {
        if (user.id === 'local-user') {
          return 'sqlite:financer.db';
        }
        // Limpa caracteres especiais para manter o nome do arquivo válido
        const safeId = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `sqlite:financer_${safeId}.db`;
      }
    }
  } catch (e) {
    console.error('[Database] Erro ao ler usuário do localStorage:', e);
  }
  return 'sqlite:financer.db'; // Fallback padrão
}

/**
 * Retorna a instância do banco de dados SQLite local correspondente ao usuário ativo.
 * Se o usuário mudar, fecha a conexão antiga e abre a nova dinamicamente.
 */
export async function getDatabase(): Promise<any> {
  const targetPath = getDatabasePath();

  if (dbInstance) {
    if (activeDbPath === targetPath) {
      return dbInstance;
    }
    console.log(`[Database] Mudança de usuário detectada. Fechando conexão antiga (${activeDbPath}) para abrir (${targetPath})`);
    try {
      await dbInstance.close();
    } catch (e) {
      console.warn('[Database] Erro ao fechar banco de dados antigo:', e);
    }
    dbInstance = null;
    activeDbPath = null;
  }

  console.log(`[Database] Abrindo conexão com: ${targetPath}`);

  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

  if (isTauri) {
    try {
      const { default: TauriDatabase } = await import('@tauri-apps/plugin-sql');
      dbInstance = await TauriDatabase.load(targetPath) as any;
    } catch (err) {
      console.error('[Database] Falha ao carregar plugin SQL do Tauri, usando fallback mock:', err);
      dbInstance = await MockDatabase.load(targetPath);
    }
  } else {
    console.log('[Database] Executando fora do ambiente Tauri. Inicializando MockDatabase...');
    dbInstance = await MockDatabase.load(targetPath);
  }

  activeDbPath = targetPath;

  // Inicializa a estrutura do banco (tabelas e migrações) de forma isolada para este arquivo
  await initDatabaseInstance(dbInstance);

  return dbInstance;
}

/**
 * Inicializa o banco de dados ativo.
 */
export async function initDatabase(): Promise<void> {
  // getDatabase() automaticamente abre e inicializa o banco correto
  await getDatabase();
}

/**
 * Inicializa uma instância específica do banco de dados (tabelas e migrações).
 */
async function initDatabaseInstance(db: any): Promise<void> {
  try {
    console.log('Inicializando banco de dados SQLite local com versionamento...');

    // Habilita suporte a chaves estrangeiras no SQLite
    await db.execute('PRAGMA foreign_keys = ON;');

    // Consulta a versão atual do banco
    const versionRes = await db.select<any[]>('PRAGMA user_version;');
    const versionObj = versionRes[0] || {};
    let currentVersion = versionObj.user_version !== undefined 
      ? versionObj.user_version 
      : (versionObj.USER_VERSION !== undefined ? versionObj.USER_VERSION : 0);

    console.log(`Versão atual do banco de dados (PRAGMA user_version): ${currentVersion}`);

    // MIGRATION 1: Criação básica do esquema inicial (Versão 1)
    if (currentVersion < 1) {
      console.log('Executando migração: Versão 1 (Esquema Inicial)...');
      
      // Profiles (Perfis dos usuários)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          full_name TEXT,
          avatar_url TEXT,
          password TEXT,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Accounts (Contas financeiras)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          currency TEXT NOT NULL DEFAULT 'AOA',
          balance REAL DEFAULT 0.00,
          status TEXT DEFAULT 'active',
          color TEXT,
          icon TEXT,
          institution TEXT,
          is_main INTEGER DEFAULT 0,
          hide_from_total INTEGER DEFAULT 0,
          min_balance_limit REAL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Categories (Categorias de transações)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          type TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Transactions (Transações)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          account_id TEXT NOT NULL,
          destination_account_id TEXT,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'AOA',
          type TEXT NOT NULL,
          description TEXT,
          date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'paid',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
          FOREIGN KEY(destination_account_id) REFERENCES accounts(id) ON DELETE CASCADE
        );
      `);

      // Budgets (Orçamentos)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          period TEXT DEFAULT 'monthly',
          type TEXT DEFAULT 'category',
          currency TEXT NOT NULL DEFAULT 'AOA',
          category TEXT,
          amount REAL NOT NULL,
          account_id TEXT,
          notify_at TEXT DEFAULT '[50, 80, 100]',
          auto_renew INTEGER DEFAULT 1,
          status TEXT DEFAULT 'active',
          start_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          end_date TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL
        );
      `);

      // Goals (Metas financeiras)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          target_amount REAL NOT NULL,
          current_amount REAL DEFAULT 0.00,
          currency TEXT NOT NULL DEFAULT 'AOA',
          deadline TEXT,
          account_id TEXT,
          priority TEXT DEFAULT 'medium',
          type TEXT DEFAULT 'deadline',
          status TEXT DEFAULT 'active',
          color TEXT,
          icon TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL
        );
      `);

      // Subscriptions (Assinaturas e serviços recorrentes)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'AOA',
          cycle TEXT DEFAULT 'monthly',
          start_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          next_billing_date TEXT NOT NULL,
          auto_renew INTEGER DEFAULT 1,
          status TEXT DEFAULT 'active',
          account_id TEXT,
          icon TEXT,
          color TEXT,
          reminder_days INTEGER DEFAULT 3,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL
        );
      `);

      // Investments (Investimentos)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS investments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          invested_amount REAL NOT NULL,
          current_value REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'AOA',
          purchase_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          quantity REAL,
          unit_price REAL,
          fees REAL DEFAULT 0.00,
          account_id TEXT,
          broker TEXT,
          risk TEXT DEFAULT 'Médio',
          status TEXT DEFAULT 'active',
          goal_id TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL,
          FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE SET NULL
        );
      `);

      // Loans (Empréstimos)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS loans (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          counterparty TEXT NOT NULL,
          institution TEXT,
          category TEXT NOT NULL,
          principal_amount REAL NOT NULL,
          current_balance REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'AOA',
          interest_rate REAL DEFAULT 0.00,
          interest_type TEXT DEFAULT 'simple',
          start_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          due_date TEXT,
          frequency TEXT DEFAULT 'monthly',
          status TEXT DEFAULT 'active',
          description TEXT,
          account_id TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL
        );
      `);

      // Loan Payments (Pagamentos de empréstimos)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS loan_payments (
          id TEXT PRIMARY KEY,
          loan_id TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(loan_id) REFERENCES loans(id) ON DELETE CASCADE
        );
      `);

      // Exchange Rates (Taxas de câmbio)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS exchange_rates (
          id TEXT PRIMARY KEY,
          from_currency TEXT NOT NULL,
          to_currency TEXT NOT NULL,
          rate REAL NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(from_currency, to_currency)
        );
      `);

      // Savings (Poupanças)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS savings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'AOA',
          interest_rate REAL DEFAULT 0.00,
          target_amount REAL,
          start_date TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // User Preferences (Preferências de Usuário)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id TEXT PRIMARY KEY,
          base_currency TEXT DEFAULT 'AOA',
          language TEXT DEFAULT 'pt-AO',
          date_format TEXT DEFAULT 'DD/MM/YYYY',
          theme TEXT DEFAULT 'light',
          notifications TEXT,
          security TEXT,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      await db.execute('PRAGMA user_version = 1;');
      currentVersion = 1;
      console.log('Migração para Versão 1 concluída.');
    }

    // MIGRATION 2: Garantir que a coluna password existe na tabela profiles (Versão 2)
    if (currentVersion < 2) {
      console.log('Executando migração: Versão 2 (Garantir campo password em profiles)...');
      try {
        await db.execute('ALTER TABLE profiles ADD COLUMN password TEXT;');
        console.log('Coluna password adicionada à tabela profiles com sucesso.');
      } catch (e) {
        // Ignora se a coluna já existir
        console.log('Coluna password já existia na tabela profiles.');
      }
      await db.execute('PRAGMA user_version = 2;');
      currentVersion = 2;
      console.log('Migração para Versão 2 concluída.');
    }

    // MIGRATION 3: Adicionar colunas para PIN, recuperação de senha, formas de pagamento, investimentos e criar tabela de kixiquilas (Versão 3)
    if (currentVersion < 3) {
      console.log('Executando migração: Versão 3 (Campos de segurança, formas de pagamento, investimentos e Kixiquila)...');
      
      // Adicionar colunas em profiles
      const columnsToAddProfiles = [
        { name: 'security_question', type: 'TEXT' },
        { name: 'security_answer', type: 'TEXT' },
        { name: 'recovery_email', type: 'TEXT' },
        { name: 'pin_code', type: 'TEXT' }
      ];
      for (const col of columnsToAddProfiles) {
        try {
          await db.execute(`ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type};`);
        } catch (e) {
          console.log(`Coluna ${col.name} já existe em profiles ou erro ao adicionar.`);
        }
      }

      // Adicionar colunas em transactions
      try {
        await db.execute("ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'Express';");
      } catch (e) {
        console.log("Coluna payment_method já existe em transactions ou erro ao adicionar.");
      }

      // Adicionar colunas em investments
      const columnsToAddInvestments = [
        { name: 'maturity_date', type: 'TEXT' },
        { name: 'interest_rate', type: 'REAL DEFAULT 0.0' },
        { name: 'payment_frequency', type: 'TEXT' }
      ];
      for (const col of columnsToAddInvestments) {
        try {
          await db.execute(`ALTER TABLE investments ADD COLUMN ${col.name} ${col.type};`);
        } catch (e) {
          console.log(`Coluna ${col.name} já existe em investments ou erro ao adicionar.`);
        }
      }

      // Criar tabela kixiquilas
      await db.execute(`
        CREATE TABLE IF NOT EXISTS kixiquilas (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          contribution REAL NOT NULL,
          members_count INTEGER NOT NULL,
          my_turn_month INTEGER NOT NULL,
          start_date TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          members_list TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      await db.execute('PRAGMA user_version = 3;');
      currentVersion = 3;
      console.log('Migração para Versão 3 concluída.');
    }
    
    // MIGRATION 4: Rastreamento de sessões/dispositivos ativos do utilizador (Versão 4)
    if (currentVersion < 4) {
      console.log('Executando migração: Versão 4 (Tabela de sessões de login)...');
      await db.execute(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          device_name TEXT NOT NULL,
          login_type TEXT NOT NULL,
          location TEXT,
          last_active TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_current INTEGER DEFAULT 0,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);
      await db.execute('PRAGMA user_version = 4;');
      currentVersion = 4;
      console.log('Migração para Versão 4 concluída.');
    }

    // MIGRATION 5: Projetos, tarefas, regras de auto-categorização e expansão de categorias (Versão 5)
    if (currentVersion < 5) {
      console.log('Executando migração: Versão 5 (Projetos, Tarefas, Regras de Auto-categorização)...');
      
      // Criar tabela de projetos
      await db.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'Em Planeamento',
          budget_limit REAL,
          due_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Criar tabela de tarefas
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'todo',
          due_date TEXT,
          estimated_revenue REAL,
          subtasks TEXT,
          tags TEXT,
          tools_cost TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Criar tabela de regras de auto-categorização
      await db.execute(`
        CREATE TABLE IF NOT EXISTS auto_categorization_rules (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          keyword TEXT NOT NULL,
          category_name TEXT NOT NULL,
          subcategory_name TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Adicionar colunas parent_id e limit_amount na tabela categories se não existirem
      try {
        await db.execute('ALTER TABLE categories ADD COLUMN parent_id TEXT;');
      } catch (e) {
        console.log('Coluna parent_id já existia ou erro ao adicionar.');
      }

      try {
        await db.execute('ALTER TABLE categories ADD COLUMN limit_amount REAL;');
      } catch (e) {
        console.log('Coluna limit_amount já existia ou erro ao adicionar.');
      }

      await db.execute('PRAGMA user_version = 5;');
      currentVersion = 5;
      console.log('Migração para Versão 5 concluída.');
    }

    // MIGRATION 6: Angolan banking details and contacts table (Versão 6)
    if (currentVersion < 6) {
      console.log('Executando migração: Versão 6 (Campos bancários Angolanos e Contatos com Mesadas)...');
      
      const columnsToAdd = [
        { name: 'iban', type: 'TEXT' },
        { name: 'account_number', type: 'TEXT' },
        { name: 'mc_express_phone', type: 'TEXT' },
        { name: 'mc_express_limit', type: 'REAL DEFAULT 0.0' },
        { name: 'mc_express_coords', type: 'TEXT' }
      ];

      for (const col of columnsToAdd) {
        try {
          await db.execute(`ALTER TABLE accounts ADD COLUMN ${col.name} ${col.type};`);
        } catch (e) {
          console.log(`Coluna ${col.name} já existe em accounts ou erro ao adicionar:`, e);
        }
      }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          relationship TEXT DEFAULT 'family',
          has_allowance INTEGER DEFAULT 0,
          allowance_amount REAL DEFAULT 0.00,
          allowance_day INTEGER DEFAULT 5,
          allowance_currency TEXT DEFAULT 'AOA',
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      await db.execute('PRAGMA user_version = 6;');
      currentVersion = 6;
      console.log('Migração para Versão 6 concluída.');
    }

    // Preenche categorias padrões se estiverem vazias
    const existingCats = await db.select('SELECT count(*) as count FROM categories');
    const catCount = (existingCats as any)[0]?.count || 0;
    if (catCount === 0) {
      console.log('Inserindo categorias padrão...');
      const defaultCategories = [
        { id: 'cat-alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#EF4444', type: 'expense' },
        { id: 'cat-transporte', name: 'Transporte', icon: 'Car', color: '#3B82F6', type: 'expense' },
        { id: 'cat-moradia', name: 'Moradia', icon: 'Home', color: '#10B981', type: 'expense' },
        { id: 'cat-lazer', name: 'Lazer', icon: 'Gamepad', color: '#F59E0B', type: 'expense' },
        { id: 'cat-saude', name: 'Saúde', icon: 'Heart', color: '#EC4899', type: 'expense' },
        { id: 'cat-educacao', name: 'Educação', icon: 'GraduationCap', color: '#8B5CF6', type: 'expense' },
        { id: 'cat-salario', name: 'Salário', icon: 'Briefcase', color: '#10B981', type: 'income' },
        { id: 'cat-investimentos', name: 'Investimentos', icon: 'TrendingUp', color: '#6366F1', type: 'income' },
        { id: 'cat-outros', name: 'Outros', icon: 'Plus', color: '#6B7280', type: 'income' }
      ];

      for (const cat of defaultCategories) {
        await db.execute(
          'INSERT INTO categories (id, name, icon, color, type) VALUES ($1, $2, $3, $4, $5)',
          [cat.id, cat.name, cat.icon, cat.color, cat.type]
        );
      }
    }

    // Preenche taxas de câmbio padrões se estiverem vazias
    const existingRates = await db.select('SELECT count(*) as count FROM exchange_rates');
    const rateCount = (existingRates as any)[0]?.count || 0;
    if (rateCount === 0) {
      console.log('Inserindo taxas de câmbio padrão...');
      const defaultRates = [
        { id: 'rate-aoa', from_currency: 'AOA', to_currency: 'AOA', rate: 1.0 },
        { id: 'rate-usd', from_currency: 'USD', to_currency: 'AOA', rate: 900.0 },
        { id: 'rate-eur', from_currency: 'EUR', to_currency: 'AOA', rate: 980.0 },
        { id: 'rate-zar', from_currency: 'ZAR', to_currency: 'AOA', rate: 50.0 }
      ];

      for (const rate of defaultRates) {
        await db.execute(
          'INSERT INTO exchange_rates (id, from_currency, to_currency, rate) VALUES ($1, $2, $3, $4)',
          [rate.id, rate.from_currency, rate.to_currency, rate.rate]
        );
      }
    }

    console.log('Banco de dados SQLite inicializado com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados SQLite:', error);
    throw error;
  }
}

/**
 * Exporta todas as tabelas do banco de dados SQLite para uma string JSON.
 */
export async function exportDatabaseToJson(): Promise<string> {
  const db = await getDatabase();
  const tables = [
    'profiles',
    'accounts',
    'categories',
    'transactions',
    'budgets',
    'goals',
    'subscriptions',
    'investments',
    'loans',
    'loan_payments',
    'exchange_rates',
    'savings',
    'user_preferences',
    'kixiquilas',
    'user_sessions',
    'projects',
    'tasks',
    'auto_categorization_rules',
    'contacts'
  ];

  const backup: Record<string, any[]> = {};
  for (const table of tables) {
    try {
      const rows = await db.select<any[]>(`SELECT * FROM ${table}`);
      backup[table] = rows || [];
    } catch (e) {
      console.warn(`Tabela ${table} não pôde ser exportada ou não existe:`, e);
      backup[table] = [];
    }
  }
  return JSON.stringify(backup);
}

/**
 * Importa dados a partir de uma string JSON, substituindo o conteúdo atual.
 */
export async function importDatabaseFromJson(jsonStr: string): Promise<void> {
  const db = await getDatabase();
  const backup = JSON.parse(jsonStr);

  await db.execute('PRAGMA foreign_keys = OFF;');

  const tables = [
    'profiles',
    'accounts',
    'categories',
    'transactions',
    'budgets',
    'goals',
    'subscriptions',
    'investments',
    'loans',
    'loan_payments',
    'exchange_rates',
    'savings',
    'user_preferences',
    'kixiquilas',
    'user_sessions',
    'projects',
    'tasks',
    'auto_categorization_rules',
    'contacts'
  ];

  try {
    // Limpa todas as tabelas
    for (const table of tables) {
      await db.execute(`DELETE FROM ${table};`);
    }

    // Insere os registros do backup
    for (const table of tables) {
      const rows = backup[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      const columns = keys.join(', ');
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = keys.map(k => row[k]);
        await db.execute(sql, values);
      }
    }
  } catch (error) {
    console.error('Erro durante a restauração do backup JSON:', error);
    throw error;
  } finally {
    await db.execute('PRAGMA foreign_keys = ON;');
  }
}
