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

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const adminEmail = "lgtecserv@gmail.com";

async function testUserUpdate() {
  console.log(`=== TESTANDO UPDATE DO CURSO COMO: ${adminEmail} ===`);

  // B. Gerar link de login para obter tokens
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: adminEmail
  });

  if (linkErr) {
    console.error("Erro ao gerar link de login:", linkErr.message);
    return;
  }

  const urlObj = new URL(linkData.properties.action_link);
  const tokenHash = urlObj.searchParams.get("token");
  
  const userClient = createClient(SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: sessionData, error: sessionErr } = await userClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink'
  });

  if (sessionErr) {
    console.error("Erro de autenticação:", sessionErr.message);
    return;
  }
  console.log("✅ Autenticado com sucesso!");

  // 1. Inserir o curso
  const testCourseSlug = `curso-para-update-${Date.now()}`;
  console.log("Inserindo curso...");
  const { data: course, error: insertErr } = await userClient
    .from('courses')
    .insert({
      title: "Curso Teste Update",
      slug: testCourseSlug,
    })
    .select()
    .single();

  if (insertErr) {
    console.error("❌ Erro ao criar curso:", insertErr.message);
    return;
  }
  console.log("✅ Curso criado. ID:", course.id);

  // 2. Agora simular o update que o formulário faz!
  // O formulário faz: const { id: _, created_at, updated_at, ...rest } = form;
  // E depois: update(rest).eq("id", id)
  const { id: _, created_at, updated_at, ...rest } = course;
  
  // Vamos modificar alguns campos como o formulário do admin faria
  rest.description = "Descrição atualizada!";
  rest.short_description = "Subtítulo atualizado";
  rest.tags = ["tag1", "tag2"];
  rest.what_you_learn = ["Aprender 1", "Aprender 2"];
  rest.requirements = ["Requisito 1"];
  rest.price_mzn = 1500;
  rest.is_published = true;

  console.log("Tentando ATUALIZAR (update) o curso como o usuário...");
  const { data: updatedCourse, error: updateErr } = await userClient
    .from('courses')
    .update(rest)
    .eq('id', course.id)
    .select()
    .single();

  if (updateErr) {
    console.error("❌ Erro de RLS ou tipo ao fazer update do curso:", updateErr.message);
  } else {
    console.log("✅ Curso atualizado com sucesso! Novo título:", updatedCourse.title, "Preço:", updatedCourse.price_mzn);
  }

  // Cleanup
  console.log("Limpando curso...");
  await adminClient.from('courses').delete().eq('id', course.id);
  console.log("=== FIM DOS TESTES ===");
}

testUserUpdate();
