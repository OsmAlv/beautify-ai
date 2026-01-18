const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  try {
    console.log("📝 Reading migration file...");
    const sql = fs.readFileSync("./migrate_prompts.sql", "utf8");

    console.log("🚀 Executing SQL migration...");
    const { error } = await supabase.rpc("exec", { sql });

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log("✅ Migration completed successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

runMigration();
