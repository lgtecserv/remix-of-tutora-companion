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
  console.error("Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no arquivo .env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runDiagnostics() {
  console.log("=== DIAGNÓSTICO DO BANCO DE DADOS ===");
  
  // 1. Verificar conexão e listar tabelas/contagem
  console.log("\n1. Verificando tabelas...");
  const tables = ['courses', 'modules', 'lessons', 'profiles', 'user_roles'];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`❌ Erro ao acessar a tabela '${table}':`, error.message);
    } else {
      console.log(`✅ Tabela '${table}' acessível. Total de registros: ${count}`);
    }
  }

  // 2. Testar inserção de um curso teste
  console.log("\n2. Testando inserção na tabela 'courses'...");
  const testSlug = `curso-teste-${Date.now()}`;
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: "Curso de Teste Diagnóstico",
      slug: testSlug,
      description: "Descrição do curso de teste",
      is_published: false,
      is_free: true
    })
    .select()
    .single();

  if (courseError) {
    console.error("❌ Falha ao criar curso de teste:", courseError.message);
    return;
  }
  console.log("✅ Curso de teste criado com ID:", courseData.id);

  // 3. Testar inserção de um módulo teste
  console.log("\n3. Testando inserção na tabela 'modules'...");
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .insert({
      course_id: courseData.id,
      title: "Módulo de Teste",
      position: 0
    })
    .select()
    .single();

  if (moduleError) {
    console.error("❌ Falha ao criar módulo de teste:", moduleError.message);
  } else {
    console.log("✅ Módulo de teste criado com ID:", moduleData.id);

    // 4. Testar inserção de uma aula teste
    console.log("\n4. Testando inserção na tabela 'lessons'...");
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        module_id: moduleData.id,
        title: "Aula de Teste",
        youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        position: 0,
        is_locked: false
      })
      .select()
      .single();

    if (lessonError) {
      console.error("❌ Falha ao criar aula de teste:", lessonError.message);
    } else {
      console.log("✅ Aula de teste criada com ID:", lessonData.id);
      
      // Cleanup da aula
      const { error: delLessError } = await supabase.from('lessons').delete().eq('id', lessonData.id);
      if (delLessError) console.error("⚠️ Erro ao limpar aula teste:", delLessError.message);
    }

    // Cleanup do módulo
    const { error: delModError } = await supabase.from('modules').delete().eq('id', moduleData.id);
    if (delModError) console.error("⚠️ Erro ao limpar módulo teste:", delModError.message);
  }

  // Cleanup do curso
  const { error: delCourseError } = await supabase.from('courses').delete().eq('id', courseData.id);
  if (delCourseError) console.error("⚠️ Erro ao limpar curso teste:", delCourseError.message);
  else console.log("\n♻️ Limpeza dos registros de teste executada.");

  // 5. Verificar perfis e user_roles para o administrador
  console.log("\n5. Verificando roles do usuário administrador...");
  const adminId = "1f3d485e-7485-4cff-bfb3-6fc3feea4751";
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', adminId);
  if (rolesError) {
    console.error("❌ Erro ao buscar roles:", rolesError.message);
  } else {
    console.log("Roles encontradas para o administrador:", roles);
  }

  console.log("\n=== FIM DO DIAGNÓSTICO ===");
}

runDiagnostics();
