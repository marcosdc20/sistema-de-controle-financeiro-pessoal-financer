import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqnpgpclfmrgegbmbhzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbnBncGNsZm1yZ2VnYm1iaHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODI4NDEsImV4cCI6MjA4NzU1ODg0MX0.ioO3hchF025Qe2Zbk3X9ctalrvtW5an4tr-HPrlA2pw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        const { data, error } = await supabase.from('pg_tables').select().limit(1);
        console.log('✅ Conexão ativa!');
    } catch (err) {
        console.log('❌ Conexão falhou:', err.message);
    }
}

checkConnection();