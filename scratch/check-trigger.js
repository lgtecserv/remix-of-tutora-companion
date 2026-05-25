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

async function checkTrigger() {
  console.log("=== VERIFICANDO TRIGGERS E FUNÇÕES ===");

  // Podemos usar o client do supabase com uma query para buscar metadados das tabelas de sistema se tivermos permissão
  // Ou criar uma rpc temporária para verificar isso. Mas espera, podemos consultar pg_trigger através de uma view ou chamando RPC?
  // Supabase não permite rodar queries SQL puras direto pela API REST de forma nativa a menos que haja um RPC ou via postgrest.
  // Mas podemos ler da API do PostgREST se existe alguma RPC configurada ou tentar ler de views de sistema.
  // Vamos ver quais RPCs estão disponíveis consultando a rota do swagger ou da api!
  
  // Vamos tentar chamar uma consulta de metadados via postgrest se as views de sistema estiverem expostas.
  // Exemplo: ler de pg_catalog ou information_schema via PostgREST.
  const { data: schemas, error: schemaError } = await supabase
    .from('_analytics')
    .select('*')
    .limit(1)
    .maybeSingle(); // Isso é só pra testar se postgrest nos dá erro.
  
  console.log("Tentando consultar schema via postgrest...");
  
  // Como não temos acesso fácil ao psql direto via REST sem RPC, vamos criar uma função RPC temporária que roda SQL para nós!
  // Espera, será que conseguimos rodar comandos SQL se usarmos o client de postgres?
  // Podemos instalar o pacote 'pg' e conectar diretamente usando a connection string do banco de dados!
  // Mas onde está a connection string?
  // A connection string do Supabase costuma ser: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:6543/postgres
  // Mas não sabemos a senha! A senha do banco de dados não está no .env.
  // Contudo, podemos ver se há alguma forma de checar o banco de dados criando uma função RPC via supabase.
  // Espera, para criar uma função RPC nós precisamos rodar SQL primeiro. É um dilema de ovo e galinha.
  // Mas espere! Se a migração foi rodada, os triggers devem estar lá.
  // Vamos testar se a criação de um usuário através do auth.signUp funciona e cria um perfil!
  
  console.log("\nSimulando a criação de um usuário temporário para testar o trigger...");
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = "Password123!";
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: "Usuário de Teste"
      }
    }
  });

  if (signUpError) {
    console.error("❌ Erro ao registrar usuário teste:", signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  console.log("✅ Usuário registrado no auth com ID:", userId);

  // Esperar 2 segundos para o trigger rodar
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verificar se o perfil correspondente foi criado na tabela 'profiles'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error("❌ Erro ao buscar perfil criado pelo trigger:", profileError.message);
  } else if (!profile) {
    console.error("❌ O perfil não foi criado! O trigger 'on_auth_user_created' falhou ou não existe.");
  } else {
    console.log("✅ Perfil correspondente criado com sucesso pelo trigger:", profile);
  }

  // Verificar se a role foi atribuída na tabela 'user_roles'
  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (roleError) {
    console.error("❌ Erro ao buscar role criada pelo trigger:", roleError.message);
  } else if (!role) {
    console.error("❌ A role 'aluno' não foi atribuída! O trigger falhou ou não existe.");
  } else {
    console.log("✅ Role 'aluno' atribuída com sucesso pelo trigger:", role);
  }

  // Limpeza
  console.log("\nLimpando usuário de teste...");
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("❌ Erro ao excluir usuário de teste:", deleteError.message);
  } else {
    console.log("✅ Usuário de teste excluído.");
  }
}

checkTrigger();
