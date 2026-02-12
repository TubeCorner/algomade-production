// insertKeyword.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertKeyword(projectIdentifier, keywordsString) {
  try {
    console.log("🟢 insertKeyword.js started");
    console.log("📦 Project Identifier:", projectIdentifier);
    console.log("🗝️ Keywords String:", keywordsString);

    // Validate
    if (!projectIdentifier || !keywordsString) {
      console.error("❌ Missing arguments. Usage: node insertKeyword.js <project_id_or_name> <comma,separated,keywords>");
      process.exit(1);
    }

    // Split keywords
    const keywords = keywordsString.split(',').map(k => k.trim());
    console.log("🧩 Parsed Keywords:", keywords);

    // Try both ID and Name lookup — safely handle UUIDs
    let project;
    const isUUID = /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(projectIdentifier);

    if (isUUID) {
      project = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectIdentifier)
        .maybeSingle();
    } else {
      project = await supabase
        .from('projects')
        .select('*')
        .or(`slug.eq.${projectIdentifier},name.eq.${projectIdentifier}`)
        .maybeSingle();
    }

    if (project.error) {
      throw new Error(`Failed to fetch project: ${project.error.message}`);
    }

    if (!project.data) {
      throw new Error(`No project found with ID or name "${projectIdentifier}"`);
    }

    const projectId = project.data.id;
    console.log("✅ Found project:", projectId);

    // 1️⃣ Get user_id for production
    const userId = process.env.TEST_USER_ID; // Replace with real user_id from session in production
    if (!userId) throw new Error('❌ No user_id provided. Set TEST_USER_ID in .env');

    const inserts = keywords.map(k => ({
      project_id: projectId,
      user_id: userId,           // 👈 Added for production
      search_keyword: k,         // correct column name
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase.from('keywords').insert(inserts).select();

    if (error) throw new Error(`Keyword insertion failed: ${error.message}`);

    console.log("🎉 Keywords inserted successfully:", data);
  } catch (err) {
    console.error("🚨 Error:", err.message);
  } finally {
    console.log("🔚 Script execution completed.");
  }
}

const [,, projectIdentifier, keywordsString] = process.argv;
insertKeyword(projectIdentifier, keywordsString);
