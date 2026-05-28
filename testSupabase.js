import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase.from('accounts').select('*').limit(1);
  if (error) {
    console.log('❌ Conexão falhou:', error.message);
  } else {
    console.log('✅ Conexão bem-sucedida! Dados:', data);
  }
}

testConnection();