import fs from 'fs';

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

async function listRpcs() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await response.json();
  console.log("=== SEARCHING rls_auto_enable IN DEFINITIONS/SCHEMAS ===");
  for (const [key, val] of Object.entries(data)) {
    if (key !== 'paths' && typeof val === 'object' && val !== null) {
      const matchedKeys = Object.keys(val).filter(k => k.toLowerCase().includes('rls_auto_enable'));
      if (matchedKeys.length > 0) {
        console.log(`Key in root: ${key}, matched sub-keys:`, matchedKeys);
        matchedKeys.forEach(mk => {
          console.log(`Details for ${mk}:`, JSON.stringify(val[mk], null, 2));
        });
      }
    }
  }
}

listRpcs();
