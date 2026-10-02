import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

// Dynamically import after env is guaranteed to be loaded
const { default: sequelize } = await import("../config/database.js");
await import("../models/postgres/index.js");

async function sync() {
  try {
    console.log("Starting database sync...");
    await sequelize.sync();
    console.log("✅ Database synchronized successfully!");

    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`\n📋 Verified ${tables.length} tables in database:`);
    console.log(tables.map((t) => " - " + (t.table_name || Object.values(t)[0])).join("\n"));

    process.exit(0);
  } catch (err) {
    console.error("❌ Database sync failed:", err);
    process.exit(1);
  }
}

sync();
