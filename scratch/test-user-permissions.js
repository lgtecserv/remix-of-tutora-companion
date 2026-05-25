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
const VITE_SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error("Erro: Variaveis ausentes no .env");
  process.exit(1);
}

// 1. Instanciar cliente administrador para gerar link de login
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const adminEmail = "lgtecserv@gmail.com";

async function testUserPermissions() {
  console.log(`=== TESTANDO PERMISSÕES DO USUÁRIO: ${adminEmail} ===`);
  
  // A. Obter o ID do admin
  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error("Erro ao listar users:", listErr.message);
    return;
  }
  const userObj = users.find(u => u.email === adminEmail);
  if (!userObj) {
    console.error(`Usuário ${adminEmail} não encontrado.`);
    return;
  }
  console.log("ID do Usuário:", userObj.id);

  // B. Gerar link de login para obter tokens
  console.log("Gerando link de login...");
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: adminEmail,
    options: {
      redirectTo: 'http://localhost:8080/app'
    }
  });

  if (linkErr) {
    console.error("Erro ao gerar link de login:", linkErr.message);
    return;
  }

  // Extrair access_token do link
  const urlObj = new URL(linkData.properties.action_link);
  // O link gerado por generateLink costuma ser do tipo https://.../auth/v1/verify?token=...&type=signup/login
  // Ou o token_hash. Se for verify, podemos fazer o login usando o token hash ou o access_token se retornado.
  // Vamos ver o formato do link gerado
  console.log("Link de ação gerado:", linkData.properties.action_link);
  
  const tokenHash = urlObj.searchParams.get("token");
  const type = urlObj.searchParams.get("type") || "login";
  
  if (!tokenHash) {
    console.error("Não foi possível encontrar o token hash no link.");
    return;
  }
  
  // C. Criar cliente do usuário (anon) e autenticar usando o token_hash
  const userClient = createClient(SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  console.log("Autenticando sessão do usuário com token_hash...");
  const { data: sessionData, error: sessionErr } = await userClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink'
  });

  if (sessionErr) {
    console.error("Erro de autenticação:", sessionErr.message);
    return;
  }
  console.log("✅ Autenticado com sucesso!");

  // D. Agora que estamos autenticados no userClient como o usuário administrador, vamos testar as permissões RLS!
  const testCourseSlug = `curso-teste-rls-${Date.now()}`;
  console.log("\nTentando INSERIR um curso como o usuário autenticado...");
  const { data: course, error: insertCourseErr } = await userClient
    .from('courses')
    .insert({
      title: "Curso de Teste RLS",
      slug: testCourseSlug,
      description: "Teste RLS",
      is_published: false,
      is_free: true
    })
    .select()
    .single();

  if (insertCourseErr) {
    console.error("❌ Falha de RLS ao inserir curso:", insertCourseErr.message);
    return;
  }
  console.log("✅ Curso inserido com sucesso! ID:", course.id);

  console.log("\nTentando INSERIR um módulo no curso como o usuário autenticado...");
  const { data: moduleData, error: insertModuleErr } = await userClient
    .from('modules')
    .insert({
      course_id: course.id,
      title: "Módulo Teste RLS",
      position: 0
    })
    .select()
    .single();

  if (insertModuleErr) {
    console.error("❌ Falha de RLS ao inserir módulo:", insertModuleErr.message);
  } else {
    console.log("✅ Módulo inserido com sucesso! ID:", moduleData.id);

    console.log("\nTentando INSERIR uma aula no módulo como o usuário autenticado...");
    const { data: lessonData, error: insertLessonErr } = await userClient
      .from('lessons')
      .insert({
        module_id: moduleData.id,
        title: "Aula Teste RLS",
        youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        position: 0,
        is_locked: false
      })
      .select()
      .single();

    if (insertLessonErr) {
      console.error("❌ Falha de RLS ao inserir aula:", insertLessonErr.message);
    } else {
      console.log("✅ Aula inserida com sucesso! ID:", lessonData.id);
      
      // Limpar aula
      await adminClient.from('lessons').delete().eq('id', lessonData.id);
    }
    // Limpar módulo
    await adminClient.from('modules').delete().eq('id', moduleData.id);
  }

  // Limpar curso
  await adminClient.from('courses').delete().eq('id', course.id);
  console.log("\n♻️ Limpeza concluída.");
  console.log("=== FIM DOS TESTES ===");
}

testUserPermissions();
