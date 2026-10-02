import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const { default: sequelize } = await import("../src/backend/config/database.js");
const { User, Branch, AcademicYear } = await import("../src/backend/models/postgres/index.js");

async function seed() {
  try {
    console.log("🌱 Starting SCMS Pro Database Seeder...\n");
    await sequelize.authenticate();
    console.log("🔌 Connected to PostgreSQL Database.");

    // 1. Seed or Verify Default Super Admin
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@scmspro.com").toLowerCase().trim();
    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@123";

    let superAdmin = await User.findOne({ where: { email: superAdminEmail } });

    if (!superAdmin) {
      // Create fresh Super Admin
      superAdmin = await User.create({
        role: "SUPER_ADMIN",
        first_name: "Super",
        last_name: "Admin",
        email: superAdminEmail,
        phone: "03001234567",
        password_hash: defaultPassword, // Hook will auto-hash with bcrypt
        plain_password: defaultPassword,
        is_active: true,
      });
      console.log(`✅ Super Admin created: ${superAdminEmail}`);
    } else {
      // Ensure super admin has valid credentials & role
      await superAdmin.update({
        role: "SUPER_ADMIN",
        password_hash: defaultPassword, // Hook will auto-hash with bcrypt
        plain_password: defaultPassword,
        is_active: true,
      });
      console.log(`ℹ️ Existing Super Admin updated with verified credentials: ${superAdminEmail}`);
    }

    // 2. Seed Default Branch (if no branch exists)
    let branch = await Branch.findOne();
    if (!branch) {
      branch = await Branch.create({
        name: "Main Campus",
        code: "MAIN-01",
        admin_id: superAdmin.id,
        created_by: superAdmin.id,
        address: {
          city: "Karachi",
          country: "Pakistan",
        },
        contact: {
          email: superAdminEmail,
          phone: "021-111-222-333",
        },
        is_active: true,
      });
      console.log(`✅ Default Branch created: Main Campus (MAIN-01)`);
    } else {
      console.log(`ℹ️ Branch already exists: ${branch.name} (${branch.code})`);
    }

    // Assign branch to superAdmin if not already set
    if (!superAdmin.branch_id) {
      await superAdmin.update({ branch_id: branch.id });
    }

    // 3. Seed Default Academic Year (if none exists)
    let academicYear = await AcademicYear.findOne();
    if (!academicYear) {
      const currentYear = new Date().getFullYear();
      academicYear = await AcademicYear.create({
        name: `${currentYear}-${currentYear + 1}`,
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-12-31`,
        is_current: true,
        branch_id: branch.id,
        created_by: superAdmin.id,
      });
      console.log(`✅ Default Academic Year created: ${academicYear.name}`);
    } else {
      console.log(`ℹ️ Academic Year already exists: ${academicYear.name}`);
    }

    console.log("\n========================================");
    console.log("🎉 SCMS PRO DATABASE SEEDING COMPLETE!");
    console.log("========================================");
    console.log("Default Login Credentials:");
    console.log(`  📧 Email:    ${superAdminEmail}`);
    console.log(`  🔑 Password: ${defaultPassword}`);
    console.log(`  🏢 Role:     SUPER_ADMIN`);
    console.log(`  🏫 Branch:   ${branch.name}`);
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
