import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Parse .env
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing keys. URL:", supabaseUrl, "Key length:", serviceRoleKey?.length);
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function run() {
  const paymentId = crypto.randomUUID();
  const reference = paymentId.replace(/-/g, "");

  // Let's find a user and a course first
  const { data: user, error: userErr } = await supabaseAdmin.from("profiles").select("id").limit(1).maybeSingle();
  const { data: course, error: courseErr } = await supabaseAdmin.from("courses").select("id").limit(1).maybeSingle();

  if (userErr || courseErr) {
    console.error("Error fetching user/course:", { userErr, courseErr });
    process.exit(1);
  }

  if (!user || !course) {
    console.error("No user or course found in DB to test with.");
    process.exit(1);
  }

  console.log(`Using user ID: ${user.id}, course ID: ${course.id}`);
  console.log(`Inserting payment with ID ${paymentId} and reference ${reference}...`);

  const { error: insertError } = await supabaseAdmin.from("payments").insert({
    id: paymentId,
    user_id: user.id,
    course_id: course.id,
    amount_mzn: 100,
    method: "transferencia", // Let's try "transferencia"
    status: "pending",
    reference: reference,
  });

  if (insertError) {
    console.error("INSERT FAILED WITH ERROR:", insertError);
  } else {
    console.log("INSERT SUCCESSFUL!");
    // Clean up
    await supabaseAdmin.from("payments").delete().eq("id", paymentId);
    console.log("Cleaned up payment.");
  }
}

run();
