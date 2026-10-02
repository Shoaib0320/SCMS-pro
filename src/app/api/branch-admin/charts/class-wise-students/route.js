import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { Class, User, sequelize } from '@/backend/models/postgres/index.js';
import { ROLES } from '@/constants/roles';

// Trigger Next.js route registration

async function getClassWiseStudents(request) {
  try {
    const branchId = request.user.branch_id || request.user.branchId;
    if (!branchId) {
      return NextResponse.json({ success: false, message: 'No branch assigned' }, { status: 400 });
    }

    const classes = await Class.findAll({
      where: { branch_id: branchId },
      attributes: ['id', 'name'],
      raw: true
    });

    const classKeyExpr = "COALESCE(details->'academic_info'->>'class_id', details->'student'->>'classId', details->'student'->>'class_id', details->>'class_id', details->>'classId')";

    const counts = await User.findAll({
      where: {
        branch_id: branchId,
        role: ROLES.STUDENT
      },
      attributes: [
        [sequelize.literal(classKeyExpr), 'class_id'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.literal(classKeyExpr)],
      raw: true
    });

    const studentCounts = {};
    counts.forEach(row => {
      if (row.class_id) {
        studentCounts[String(row.class_id)] = parseInt(row.count, 10) || 0;
      }
    });

    const data = classes.map(c => ({
      class: c.name,
      students: studentCounts[String(c.id)] || 0
    })).sort((a, b) => b.students - a.students).slice(0, 5);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Class-wise students error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getClassWiseStudents, [ROLES.BRANCH_ADMIN]);
