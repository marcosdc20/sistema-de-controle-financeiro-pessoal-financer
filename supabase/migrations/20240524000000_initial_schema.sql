-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AOA',
  balance DECIMAL(15,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  color TEXT,
  icon TEXT,
  institution TEXT,
  is_main BOOLEAN DEFAULT false,
  hide_from_total BOOLEAN DEFAULT false,
  min_balance_limit DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- NULL for default categories
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL, -- 'income', 'expense'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts ON DELETE CASCADE NOT NULL,
  destination_account_id UUID REFERENCES accounts ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AOA',
  type TEXT NOT NULL, -- 'income', 'expense', 'transfer', 'adjustment'
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'paid', -- 'pending', 'paid', 'overdue', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  period TEXT DEFAULT 'monthly',
  type TEXT DEFAULT 'category',
  currency TEXT NOT NULL DEFAULT 'AOA',
  category TEXT,
  amount DECIMAL(15,2) NOT NULL,
  account_id UUID REFERENCES accounts ON DELETE SET NULL,
  notify_at INTEGER[] DEFAULT '{50, 80, 100}',
  auto_renew BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'AOA',
  deadline TIMESTAMP WITH TIME ZONE,
  account_id UUID REFERENCES accounts ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium',
  type TEXT DEFAULT 'deadline',
  status TEXT DEFAULT 'active',
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AOA',
  cycle TEXT DEFAULT 'monthly',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  account_id UUID REFERENCES accounts ON DELETE SET NULL,
  icon TEXT,
  color TEXT,
  reminder_days INTEGER DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  invested_amount DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AOA',
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  quantity DECIMAL(15,6),
  unit_price DECIMAL(15,6),
  fees DECIMAL(15,2) DEFAULT 0.00,
  account_id UUID REFERENCES accounts ON DELETE SET NULL,
  broker TEXT,
  risk TEXT DEFAULT 'Médio',
  status TEXT DEFAULT 'active',
  goal_id UUID REFERENCES goals ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'received', 'granted'
  counterparty TEXT NOT NULL,
  institution TEXT,
  category TEXT NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AOA',
  interest_rate DECIMAL(5,2) DEFAULT 0.00,
  interest_type TEXT DEFAULT 'simple',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  frequency TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  description TEXT,
  account_id UUID REFERENCES accounts ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create loan_payments table
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(15,6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(from_currency, to_currency)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view default categories and their own" ON categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals" ON goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own investments" ON investments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own loans" ON loans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own loan payments" ON loan_payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM loans
    WHERE loans.id = loan_payments.loan_id
    AND loans.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view exchange rates" ON exchange_rates FOR SELECT USING (true);

-- Create function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance(acc_id UUID, amount_change DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE accounts
  SET balance = balance + amount_change
  WHERE id = acc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default categories
INSERT INTO categories (name, icon, color, type) VALUES
('Alimentação', 'Utensils', '#EF4444', 'expense'),
('Transporte', 'Car', '#3B82F6', 'expense'),
('Moradia', 'Home', '#10B981', 'expense'),
('Lazer', 'Gamepad', '#F59E0B', 'expense'),
('Saúde', 'Heart', '#EC4899', 'expense'),
('Educação', 'GraduationCap', '#8B5CF6', 'expense'),
('Salário', 'Briefcase', '#10B981', 'income'),
('Investimentos', 'TrendingUp', '#6366F1', 'income'),
('Outros', 'Plus', '#6B7280', 'income');
