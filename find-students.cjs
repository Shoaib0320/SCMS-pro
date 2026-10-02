const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true },
  email: DataTypes.STRING,
  first_name: DataTypes.STRING,
  role: DataTypes.STRING,
  branch_id: DataTypes.UUID,
  details: DataTypes.JSONB
}, { tableName: 'users', timestamps: false });

const Branch = sequelize.define('Branch', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: DataTypes.STRING
}, { tableName: 'branches', timestamps: false });

async function findStudents() {
  try {
    const admin = await User.findOne({ where: { email: 'adamjeec12@gmail.com' } });
    if (!admin) {
      console.log('Admin adamjeec12@gmail.com not found!');
      process.exit(1);
    }
    
    console.log('Found Admin:', admin.first_name);
    console.log('Branch Name:', (await Branch.findByPk(admin.branch_id))?.name || 'Unknown');

    const students = await User.findAll({ 
      where: { 
        branch_id: admin.branch_id,
        role: 'STUDENT'
      } 
    });

    const targetGRs = [15, 73, 47];
    let foundTargetStudents = [];
    let clearedCount = 0;

    for (let u of students) {
      const rollNoStr = u.details?.academic_info?.roll_no;
      if (rollNoStr) {
        const rollNo = parseInt(rollNoStr, 10);
        if (targetGRs.includes(rollNo)) {
          const subjects = u.details?.academic_info?.subjects || [];
          foundTargetStudents.push({
            gr: rollNo,
            name: u.first_name,
            email: u.email,
            subjects: subjects
          });

          // CLEAR SUBJECTS
          if (subjects.length > 0) {
             const newDetails = { ...u.details };
             if (!newDetails.academic_info) newDetails.academic_info = {};
             newDetails.academic_info.subjects = [];
             await User.update({ details: newDetails }, { where: { id: u.id } });
             clearedCount++;
          }
        }
      }
    }
    
    console.log(`\n--- CLEARED SUBJECTS FOR ${clearedCount} TARGET STUDENTS ---`);
    foundTargetStudents.forEach(st => {
      console.log(`GR No: ${st.gr} | Name: ${st.name} | Subjects Cleared: Yes`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findStudents();

