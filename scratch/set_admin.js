import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const logFile = 'scratch/set_admin_result.txt';
fs.writeFileSync(logFile, "=== LOG DE LIMPEZA DE ROLE ===\n");

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
}

log("Iniciando script para remover a role de aluno do administrador...");

// 1. Carregar e parsear manualmente o arquivo .env
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
  log("✓ Arquivo .env carregado com sucesso!");
} catch (err) {
  log("❌ Erro ao ler o arquivo .env: " + err.message);
  process.exit(1);
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  log("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no arquivo .env.");
  process.exit(1);
}

// Cria cliente Supabase Admin
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const targetUserId = "1f3d485e-7485-4cff-bfb3-6fc3feea4751"; // UID do administrador

async function cleanRoles() {
  try {
    // Deletar a role 'aluno' para o administrador
    const { data, error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId)
      .eq('role', 'aluno')
      .select();

    if (error) {
      log("❌ Erro ao deletar a role de aluno: " + error.message);
    } else {
      log("✅ Role de aluno removida com sucesso! Retorno: " + JSON.stringify(data));
    }

    // Listar as roles atuais do usuário para confirmação
    const { data: currentRoles, error: listError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId);

    if (listError) {
      log("❌ Erro ao listar roles atuais: " + listError.message);
    } else {
      log("📋 Roles atuais do usuário: " + JSON.stringify(currentRoles));
    }

    log("🎉 Concluído com sucesso!");
  } catch (err) {
    log("❌ Ocorreu um erro inesperado: " + err.message);
  }
}

cleanRoles();
