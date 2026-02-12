// listProjects.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLE_PROJECTS = process.env.SUPABASE_TABLE_PROJECTS || "projects";

async function listProjects() {
  try {
    const { data, error } = await supabase
      .from(TABLE_PROJECTS)
      .select("id, name, slug") // matches your actual columns
      .order("name", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch projects:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.log("⚠️ No projects found in table:", TABLE_PROJECTS);
      return;
    }

    console.log(`\n📋 Projects from table: ${TABLE_PROJECTS}\n`);
    data.forEach((project, index) => {
      console.log(
        `${index + 1}. UUID: ${project.id} | Slug: ${project.slug || "(none)"} | Name: ${project.name}`
      );
    });
    console.log("\n✅ Copy UUID, slug, or name to use in insertKeyword.js\n");
  } catch (err) {
    console.error("❌ Unexpected error:", err.message || err);
  }
}

listProjects();
