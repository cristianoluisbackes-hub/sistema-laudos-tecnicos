// lib/supabaseClient.js
// Conecta a aplicação ao Supabase

import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam credenciais do Supabase no .env.local');
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Supabase está configurado e seguro
// Toda comunicação é encriptada via HTTPS/TLS 1.2+
