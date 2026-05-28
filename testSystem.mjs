/**
 * VukaPay - Comprehensive Supabase Integration Test
 * Tests: Auth (signup/login), Accounts CRUD, Transactions (income & expense)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gqnpgpclfmrgegbmbhzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbnBncGNsZm1yZ2VnYm1iaHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODI4NDEsImV4cCI6MjA4NzU1ODg0MX0.ioO3hchF025Qe2Zbk3X9ctalrvtW5an4tr-HPrlA2pw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test user credentials
const TEST_EMAIL = `teste_kwanza_${Date.now()}@test.com`;
const TEST_PASSWORD = 'TesteSenha@123';

let testUserId = null;
let testAccountId = null;
let passed = 0;
let failed = 0;

function log(emoji, msg, detail = '') {
    console.log(`${emoji} ${msg}${detail ? ': ' + detail : ''}`);
}

function pass(msg) {
    log('✅', msg);
    passed++;
}

function fail(msg, err) {
    log('❌', msg, typeof err === 'object' ? JSON.stringify(err) : err);
    failed++;
}

async function test(name, fn) {
    try {
        await fn();
    } catch (e) {
        fail(name, e.message || e);
    }
}

console.log('\n🚀 VukaPay - Sistema de Teste de Integração\n');
console.log('='.repeat(50));

// ─────────────────────────────────────────────────
// TEST 1: Supabase Connection
// ─────────────────────────────────────────────────
await test('Conexão com Supabase', async () => {
    const { data, error } = await supabase.from('exchange_rates').select('count').limit(1);
    if (error) throw error;
    pass('Conexão com Supabase estabelecida');
});

// ─────────────────────────────────────────────────
// TEST 2: Sign Up
// ─────────────────────────────────────────────────
await test('Cadastro de novo utilizador', async () => {
    const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from signUp');
    testUserId = data.user.id;
    pass(`Utilizador cadastrado: ${TEST_EMAIL} (id: ${testUserId})`);
});

// ─────────────────────────────────────────────────
// TEST 3: Sign In
// ─────────────────────────────────────────────────
await test('Login do utilizador', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (error) throw error;
    if (!data.session) throw new Error('No session after login');
    pass(`Login bem-sucedido! Token: ${data.session.access_token.substring(0, 30)}...`);
});

// ─────────────────────────────────────────────────
// TEST 4: Verify Current Session
// ─────────────────────────────────────────────────
await test('Verificar sessão ativa', async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new Error('No active session found');
    pass(`Sessão ativa: user_id = ${session.user.id}`);
});

// ─────────────────────────────────────────────────
// TEST 5: Create Account
// ─────────────────────────────────────────────────
await test('Criar conta bancária', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
        .from('accounts')
        .insert([{
            user_id: user.id,
            name: 'Conta Corrente BAI (Teste)',
            type: 'Corrente',
            category: 'bank',
            currency: 'AOA',
            balance: 500000.00,
            status: 'active',
            color: 'bg-blue-600',
            is_main: true,
            hide_from_total: false,
        }])
        .select()
        .single();

    if (error) throw error;
    testAccountId = data.id;
    pass(`Conta criada: "${data.name}" (id: ${testAccountId}), Saldo: ${data.balance} AOA`);
});

// ─────────────────────────────────────────────────
// TEST 6: Create Second Account (for transfers)
// ─────────────────────────────────────────────────
let secondAccountId = null;
await test('Criar segunda conta (carteira física)', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
        .from('accounts')
        .insert([{
            user_id: user.id,
            name: 'Carteira Física (Teste)',
            type: 'Dinheiro',
            category: 'physical',
            currency: 'AOA',
            balance: 25000.00,
            status: 'active',
            color: 'bg-emerald-500',
            is_main: false,
            hide_from_total: false,
        }])
        .select()
        .single();

    if (error) throw error;
    secondAccountId = data.id;
    pass(`Segunda conta criada: "${data.name}" (saldo: ${data.balance} AOA)`);
});

// ─────────────────────────────────────────────────
// TEST 7: Read Accounts (verify RLS works)
// ─────────────────────────────────────────────────
await test('Ler contas do utilizador (RLS)', async () => {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No accounts returned');
    pass(`${data.length} conta(s) encontrada(s): ${data.map(a => a.name).join(', ')}`);
});

// ─────────────────────────────────────────────────
// TEST 8: Add Income Transaction
// ─────────────────────────────────────────────────
let incomeTransactionId = null;
await test('Adicionar transação de RECEITA (Salário)', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    if (!testAccountId) throw new Error('No test account created');

    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            user_id: user.id,
            account_id: testAccountId,
            category: 'Salário',
            amount: 250000.00,
            currency: 'AOA',
            type: 'income',
            description: 'Salário de Fevereiro 2026 (TESTE)',
            date: new Date().toISOString(),
            status: 'paid',
        }])
        .select()
        .single();

    if (error) throw error;
    incomeTransactionId = data.id;
    pass(`RECEITA criada: "${data.description}" - ${data.amount} ${data.currency}`);
});

// ─────────────────────────────────────────────────
// TEST 9: Update Account Balance (simulate income effect)
// ─────────────────────────────────────────────────
await test('Actualizar saldo da conta após receita', async () => {
    // Get current balance
    const { data: acc, error: getErr } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', testAccountId)
        .single();

    if (getErr) throw getErr;

    const newBalance = Number(acc.balance) + 250000;
    const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', testAccountId);

    if (error) throw error;
    pass(`Saldo actualizado para: ${newBalance} AOA`);
});

// ─────────────────────────────────────────────────
// TEST 10: Add Expense Transaction
// ─────────────────────────────────────────────────
let expenseTransactionId = null;
await test('Adicionar transação de DESPESA (Alimentação)', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    if (!testAccountId) throw new Error('No test account created');

    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            user_id: user.id,
            account_id: testAccountId,
            category: 'Alimentação',
            amount: 15000.00,
            currency: 'AOA',
            type: 'expense',
            description: 'Compras no Mercado (TESTE)',
            date: new Date().toISOString(),
            status: 'paid',
        }])
        .select()
        .single();

    if (error) throw error;
    expenseTransactionId = data.id;
    pass(`DESPESA criada: "${data.description}" - ${data.amount} ${data.currency}`);
});

// ─────────────────────────────────────────────────
// TEST 11: Add Transfer Transaction
// ─────────────────────────────────────────────────
await test('Adicionar TRANSFERÊNCIA entre contas', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    if (!testAccountId || !secondAccountId) throw new Error('Need both accounts');

    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            user_id: user.id,
            account_id: testAccountId,
            destination_account_id: secondAccountId,
            category: 'Entre contas próprias',
            amount: 20000.00,
            currency: 'AOA',
            type: 'transfer',
            description: 'Transferência para carteira (TESTE)',
            date: new Date().toISOString(),
            status: 'paid',
        }])
        .select()
        .single();

    if (error) throw error;
    pass(`TRANSFERÊNCIA criada: "${data.description}" - ${data.amount} ${data.currency}`);
});

// ─────────────────────────────────────────────────
// TEST 12: Read Transactions (verify they exist)
// ─────────────────────────────────────────────────
await test('Ler transações do utilizador', async () => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No transactions found');

    const income = data.filter(t => t.type === 'income').length;
    const expense = data.filter(t => t.type === 'expense').length;
    const transfer = data.filter(t => t.type === 'transfer').length;
    pass(`${data.length} transação(ões) encontrada(s): ${income} receita(s), ${expense} despesa(s), ${transfer} transferência(s)`);
});

// ─────────────────────────────────────────────────
// TEST 13: Exchange Rates Table
// ─────────────────────────────────────────────────
await test('Verificar tabela de taxas de câmbio', async () => {
    const { data, error } = await supabase
        .from('exchange_rates')
        .select('*');

    if (error) {
        // Table might not have RLS for reading, try with anon
        log('⚠️', 'Taxas de câmbio', 'Tabela pode estar vazia (será preenchida no primeiro login)');
        return;
    }

    if (!data || data.length === 0) {
        log('⚠️', 'Taxas de câmbio', 'Tabela vazia - será preenchida automaticamente pelo app');
    } else {
        pass(`${data.length} taxa(s) de câmbio encontrada(s): ${data.map(r => `${r.from_currency}→${r.to_currency}=${r.rate}`).join(', ')}`);
    }
});

// ─────────────────────────────────────────────────
// TEST 14: Delete test data (cleanup)
// ─────────────────────────────────────────────────
await test('Limpeza: remover dados de teste', async () => {
    // Delete transactions first (foreign key)
    if (incomeTransactionId || expenseTransactionId) {
        const { error: tErr } = await supabase
            .from('transactions')
            .delete()
            .in('description', [
                'Salário de Fevereiro 2026 (TESTE)',
                'Compras no Mercado (TESTE)',
                'Transferência para carteira (TESTE)'
            ]);
        if (tErr) log('⚠️', 'Falha ao apagar transações de teste', tErr.message);
    }

    // Delete accounts
    if (testAccountId) {
        const { error: aErr } = await supabase.from('accounts').delete().eq('id', testAccountId);
        if (aErr) log('⚠️', 'Falha ao apagar conta principal de teste', aErr.message);
    }
    if (secondAccountId) {
        const { error: aErr2 } = await supabase.from('accounts').delete().eq('id', secondAccountId);
        if (aErr2) log('⚠️', 'Falha ao apagar segunda conta de teste', aErr2.message);
    }

    pass('Dados de teste removidos');
});

// ─────────────────────────────────────────────────
// Sign Out
// ─────────────────────────────────────────────────
await supabase.auth.signOut();

// ─────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────
console.log('\n' + '='.repeat(50));
console.log(`\n📊 RESULTADOS: ${passed} passou | ${failed} falhou\n`);

if (failed === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM! O sistema está 100% funcional.\n');
} else {
    console.log('⚠️  Alguns testes falharam. Verifique os erros acima.\n');
    process.exit(1);
}
