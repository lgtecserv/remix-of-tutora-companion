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

async function testBlogInsert() {
  console.log(`=== TESTANDO INSERÇÃO DE BLOG POST COMO: ${adminEmail} ===`);

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

  // Test insert
  console.log("Tentando inserir blog_posts...");
  const { data: post, error: insertErr } = await userClient
    .from('blog_posts')
    .insert({
      title: "Novo artigo teste",
      slug: "novo-artigo-teste-" + Date.now().toString(36),
      is_published: false
    })
    .select()
    .single();

  if (insertErr) {
    console.error("❌ Erro de RLS ou restrição ao inserir blog post:", insertErr.message);
  } else {
    console.log("✅ Blog post inserido com sucesso! ID:", post.id);
    
    // Cleanup
    await adminClient.from('blog_posts').delete().eq('id', post.id);
    console.log("♻️ Limpeza concluída.");
  }
  console.log("=== FIM DOS TESTES ===");
}

testBlogInsert();
