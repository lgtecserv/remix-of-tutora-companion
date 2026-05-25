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

async function listAll() {
  console.log("=== LISTANDO DADOS DO BANCO ===");
  
  const { data: courses, error: coursesError } = await supabase.from('courses').select('*');
  if (coursesError) console.error("Erro courses:", coursesError.message);
  else console.log("Cursos:", courses);

  const { data: modules, error: modulesError } = await supabase.from('modules').select('*');
  if (modulesError) console.error("Erro modules:", modulesError.message);
  else console.log("Módulos:", modules);

  const { data: lessons, error: lessonsError } = await supabase.from('lessons').select('*');
  if (lessonsError) console.error("Erro lessons:", lessonsError.message);
  else console.log("Aulas:", lessons);

  console.log("===============================");
}

listAll();
