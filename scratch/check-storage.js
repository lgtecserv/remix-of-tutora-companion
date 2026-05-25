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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStorage() {
  console.log("=== DIAGNÓSTICO DO STORAGE ===");
  
  // 1. Listar buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("❌ Erro ao listar buckets:", bucketsError.message);
    return;
  }
  console.log("Buckets cadastrados:", buckets);

  // 2. Verificar políticas de storage no banco
  // As políticas de storage ficam na tabela storage.policies se for supabase self-hosted ou nas tabelas do postgres
  // Mas podemos fazer um teste de upload com o service role ou com um usuário autenticado
  console.log("\n=== FIM DO DIAGNÓSTICO ===");
}

checkStorage();
