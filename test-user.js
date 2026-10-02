import { User, Branch } from './src/backend/models/postgres/index.js';

async function test() {
  try {
    const user = await User.findOne({ 
      where: { role: 'BRANCH_ADMIN' }, 
      include: [{ model: Branch, as: 'branch' }] 
    });
    console.log(JSON.stringify(user, null, 2));
  } catch(e) { console.error(e); }
  process.exit();
}
test();
