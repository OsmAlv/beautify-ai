const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const SUPABASE_URL = "https://fuqzkrsmeehyuhnrpwdf.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cXprcnNtZWVoeXVobnJwd2RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwMzY0MSwiZXhwIjoyMDgzOTc5NjQxfQ.ITrNuv8hdKarAAz601xOwqy6A_7DdelMaOaduZtylAs";

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
