# 📋 INSTRUÇÃO OBRIGATÓRIA — Aplicar SQL no Supabase

## Problema Encontrado
5 tabelas estão **faltando** no banco de dados Supabase:
- `subscriptions`
- `investments`  
- `loans`
- `loan_payments`
- `exchange_rates`

## Como Corrigir

### Passo 1: Acesse o Supabase SQL Editor
Abra este link no navegador:
👉 https://supabase.com/dashboard/project/gqnpgpclfmrgegbmbhzm/sql/new

### Passo 2: Execute o SQL de Correção
Copie e cole todo o conteúdo do arquivo:
`supabase/migrations/20260225_fix_missing_tables.sql`

Clique em **"Run"** para executar.

### Passo 3: Desativar Confirmação de Email (Para testes)
Para fazer login imediatamente após cadastro (sem aguardar confirmação de email):
1. Acesse: https://supabase.com/dashboard/project/gqnpgpclfmrgegbmbhzm/auth/providers
2. Em "Email", **desmarque** "Confirm email"
3. Clique em **Save**

> **Nota:** Para produção, reative a confirmação de email.

## Resultado Esperado
Após executar o SQL, o sistema terá todas as 11 tabelas funcionais:
- ✅ profiles
- ✅ accounts
- ✅ categories
- ✅ transactions
- ✅ budgets
- ✅ goals
- ✅ subscriptions ← NOVA
- ✅ investments ← NOVA
- ✅ loans ← NOVA
- ✅ loan_payments ← NOVA
- ✅ exchange_rates ← NOVA
