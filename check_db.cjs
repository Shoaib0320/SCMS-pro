const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/scms_pro_db', { logging: false });

async function run() {
  try {
    const results = await sequelize.query("SELECT details FROM users WHERE role = 'STUDENT' LIMIT 3", { type: Sequelize.QueryTypes.SELECT });
    console.log("Sample details:", JSON.stringify(results.map(r => r.details), null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await sequelize.close();
  }
}
run();
