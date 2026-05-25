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

async function testUpload() {
  console.log(`=== TESTANDO UPLOAD COMO: ${adminEmail} ===`);

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

  // Test upload to course-covers
  const dummyFile = Buffer.from("dummy content");
  const path = `test-${Date.now()}.txt`;
  
  console.log("Tentando upload em course-covers...");
  const { data: uploadData1, error: uploadErr1 } = await userClient.storage
    .from('course-covers')
    .upload(path, dummyFile, { contentType: 'text/plain' });

  if (uploadErr1) {
    console.error("❌ Erro ao fazer upload em course-covers:", uploadErr1.message);
  } else {
    console.log("✅ Upload em course-covers com sucesso:", uploadData1);
    // Cleanup
    await adminClient.storage.from('course-covers').remove([path]);
  }

  // Test upload to lesson-videos
  console.log("Tentando upload em lesson-videos...");
  const { data: uploadData2, error: uploadErr2 } = await userClient.storage
    .from('lesson-videos')
    .upload(path, dummyFile, { contentType: 'text/plain' });

  if (uploadErr2) {
    console.error("❌ Erro ao fazer upload em lesson-videos:", uploadErr2.message);
  } else {
    console.log("✅ Upload em lesson-videos com sucesso:", uploadData2);
    // Cleanup
    await adminClient.storage.from('lesson-videos').remove([path]);
  }

  console.log("=== FIM DOS TESTES ===");
}

testUpload();
