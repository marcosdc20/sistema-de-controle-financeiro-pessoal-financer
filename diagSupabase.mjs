/**
 * Check what tables exist in Supabase
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gqnpgpclfmrgegbmbhzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbnBncGNsZm1yZ2VnYm1iaHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODI4NDEsImV4cCI6MjA4NzU1ODg0MX0.ioO3hchF025Qe2Zbk3X9ctalrvtW5an4tr-HPrlA2pw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n🔍 Verificando estrutura do banco de dados Supabase...\n');

// Test each table
const tables = ['accounts', 'transactions', 'budgets', 'goals', 'subscriptions', 'investments', 'loans', 'loan_payments', 'exchange_rates', 'categories', 'profiles'];

for (const table of tables) {
    try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: existe (${data?.length ?? 0} registros visíveis)`);
        }
    } catch (e) {
        console.log(`💥 ${table}: EXCEÇÃO - ${e.message}`);
    }
}

// Test auth
console.log('\n🔐 Verificando configurações de autenticação...\n');
try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.log('❌ Auth getSession:', error.message);
    } else {
        console.log('✅ Auth funcional, sessão:', data.session ? 'Activa' : 'Nenhuma (esperado)');
    }
} catch (e) {
    console.log('💥 Auth error:', e.message);
}

// Try signup with a more standard email
console.log('\n📧 Testando signup com email simples...');
const ts = Date.now();
try {
    const { data, error } = await supabase.auth.signUp({
        email: `user${ts}@gmail.com`,
        password: 'TesteSenha@123',
    });
    if (error) {
        console.log('❌ Signup falhou:', error.message, '| Status:', error.status);
    } else {
        console.log('✅ Signup bem-sucedido! User ID:', data.user?.id);
        console.log('   Email confirmação necessária?', !data.session ? 'SIM' : 'NÃO');
        if (data.user) {
            console.log('\n📧 Email de teste:', `user${ts}@gmail.com`);
            console.log('🔑 Senha de teste: TesteSenha@123');

            // Try immediate sign in (only works if email confirmation is disabled)
            const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
                email: `user${ts}@gmail.com`,
                password: 'TesteSenha@123',
            });
            if (loginErr) {
                console.log('⚠️  Login imediato falhou (confirmação de email pode ser necessária):', loginErr.message);
            } else if (loginData.session) {
                console.log('✅ Login imediato bem-sucedido! (Confirmação de email desactivada)');

                // Now test tables with authenticated user
                console.log('\n🗄️ Verificando tabelas com autenticação...\n');
                for (const table of ['accounts', 'transactions']) {
                    const { data: td, error: te } = await supabase.from(table).select('count').limit(1);
                    if (te) console.log(`❌ ${table} (autenticado): ${te.message}`);
                    else console.log(`✅ ${table} (autenticado): OK`);
                }

                await supabase.auth.signOut();
            }
        }
    }
} catch (e) {
    console.log('💥 Signup exceção:', e.message);
}

console.log('\n✅ Diagnóstico concluído.\n');
