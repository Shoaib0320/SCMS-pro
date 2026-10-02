const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/adamjee_db', { logging: false });
async function run() {
  const [results] = await sequelize.query("SELECT details FROM users WHERE role = 'STUDENT' AND details IS NOT NULL LIMIT 1");
  console.log(JSON.stringify(results[0]?.details, null, 2));
}
run();
