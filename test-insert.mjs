import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);

async function testInsert() {
  const reference = "123e4567e89b12d3a456426614174000"; // uuid without hyphens
  // Let's get a real courseId and userId to test
  const { data: user } = await supabaseAdmin.from("profiles").select("id").limit(1).single();
  const { data: course } = await supabaseAdmin.from("courses").select("id").limit(1).single();

  if (!user || !course) {
    console.log("No user or course found");
    return;
  }

  const { error } = await supabaseAdmin.from("payments").insert({
    id: reference,
    user_id: user.id,
    course_id: course.id,
    amount_mzn: 1000,
    method: "credit_card",
    status: "pending",
    reference: reference,
  });

  console.log("Insert Error for credit_card:", error);
}

testInsert();
