import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // explicit path

import { createClient } from "@supabase/supabase-js";

// Server-side keys only
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug check
console.log("SUPABASE_URL:", SUPABASE_URL ? "✅ loaded" : "❌ missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✅ loaded" : "❌ missing");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRole() {
  try {
    const { data, error } = await supabase.rpc("get_my_role");
    if (error) console.error("❌ Error:", error);
    else console.log("✅ Your current role is:", data);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

checkRole();
