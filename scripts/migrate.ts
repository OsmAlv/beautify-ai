import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateDatabase() {
  try {
    console.log("🔧 Starting database migration...");

    // Drop old table if exists
    console.log("📋 Dropping old generation_logs table...");
    const { error: dropError } = await supabase.rpc("execute_sql", {
      sql: "DROP TABLE IF EXISTS generation_logs CASCADE;",
    });

    if (dropError) {
      console.log("⚠️ Table might not exist, continuing...");
    } else {
      console.log("✓ Old table dropped");
    }

    // Create new table with correct structure
    console.log("📝 Creating new generation_logs table...");
    const createTableSQL = `
      CREATE TABLE generation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mode VARCHAR(50) NOT NULL,
        environment VARCHAR(50),
        cost DECIMAL(18, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        wavespeed_request_id VARCHAR(255),
        original_image_url TEXT
      );
      
      CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
      CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at DESC);
    `;

    const { error: createError } = await supabase.rpc("execute_sql", {
      sql: createTableSQL,
    });

    if (createError) {
      console.error("❌ Failed to create table:", createError);
      process.exit(1);
    }

    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}

migrateDatabase();
