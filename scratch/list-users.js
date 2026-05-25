import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env
let env = {};
try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });
} catch (err) {
  console.error("Erro ao ler o arquivo .env:", err.message);
  process.exit(1);
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listUsers() {
  console.log("=== LISTANDO USUÁRIOS DO AUTH ===");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Erro ao listar usuários:", error.message);
  } else {
    users.forEach(u => {
      console.log(`- ID: ${u.id}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Confirmado em: ${u.email_confirmed_at}`);
      console.log(`  Criado em: ${u.created_at}`);
      console.log(`  Metadata:`, u.user_metadata);
      console.log(`  Last Sign In: ${u.last_sign_in_at}`);
      console.log("-----------------------------------------");
    });
  }
}

listUsers();
