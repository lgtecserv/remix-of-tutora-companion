import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

let supabaseUrl = "";
let serviceRoleKey = "";

try {
  const envContent = readFileSync(".env", "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("VITE_SUPABASE_URL=")) {
      supabaseUrl = trimmed.replace("VITE_SUPABASE_URL=", "").replace(/['"]/g, "").trim();
    }
    if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      serviceRoleKey = trimmed.replace("SUPABASE_SERVICE_ROLE_KEY=", "").replace(/['"]/g, "").trim();
    }
  }
} catch (e) {
  console.error("Error reading .env:", e);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function run() {
  const { data, error } = await supabaseAdmin.from("courses").select("id, title, is_published");
  if (error) {
    console.error("Error fetching courses:", error);
  } else {
    console.log(`Found ${data.length} courses:`);
    console.log(data);
  }
}

run();
