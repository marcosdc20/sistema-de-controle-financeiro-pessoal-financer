-- VukaPay - SQL para corrigir tabelas faltantes
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gqnpgpclfmrgegbmbhzm/sql
-- =====================================================

-- Create subscriptions table (if not exists)
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

-- Create investments table (if not exists)
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

-- Create loans table (if not exists)
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
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

-- Create loan_payments table (if not exists)
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create exchange_rates table (if not exists)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(15,6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(from_currency, to_currency)
);

-- Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can manage their own subscriptions') THEN
    CREATE POLICY "Users can manage their own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for investments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investments' AND policyname = 'Users can manage their own investments') THEN
    CREATE POLICY "Users can manage their own investments" ON investments FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for loans
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Users can manage their own loans') THEN
    CREATE POLICY "Users can manage their own loans" ON loans FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for loan_payments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loan_payments' AND policyname = 'Users can manage their own loan payments') THEN
    CREATE POLICY "Users can manage their own loan payments" ON loan_payments FOR ALL USING (
      EXISTS (
        SELECT 1 FROM loans
        WHERE loans.id = loan_payments.loan_id
        AND loans.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- RLS Policies for exchange_rates (anyone can read, authenticated can write)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rates' AND policyname = 'Anyone can view exchange rates') THEN
    CREATE POLICY "Anyone can view exchange rates" ON exchange_rates FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rates' AND policyname = 'Authenticated users can manage exchange rates') THEN
    CREATE POLICY "Authenticated users can manage exchange rates" ON exchange_rates FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Insert default exchange rates (AOA as base currency)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
  ('AOA', 'AOA', 1.000000),
  ('USD', 'AOA', 900.000000),
  ('EUR', 'AOA', 980.000000),
  ('ZAR', 'AOA', 50.000000)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('accounts', 'transactions', 'budgets', 'goals', 'subscriptions', 'investments', 'loans', 'loan_payments', 'exchange_rates', 'categories', 'profiles')
ORDER BY table_name;
