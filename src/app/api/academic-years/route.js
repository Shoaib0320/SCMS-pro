import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { AcademicYear as AcademicYearModel, Branch } from "@/backend/models/postgres";
import { Op } from "sequelize";

// GET: List Academic Years
async function getAcademicYears(req) {
  try {
    const user = req.user;
    const { searchParams } = new URL(req.url);
    const branchIdParam = searchParams.get("branch_id") || searchParams.get("branchId");

    let whereClause = {};
    if (user.role === "SUPER_ADMIN") {
      if (branchIdParam) {
        whereClause = {
          [Op.or]: [
            { branch_id: branchIdParam },
            { branch_id: null }
          ]
        };
      }
    } else {
      whereClause = {
        [Op.or]: [
          { branch_id: user.branch_id },
          { branch_id: null }
        ]
      };
    }
    const years = await AcademicYearModel.findAll({ 
      where: whereClause, 
      order: [["start_date", "DESC"]],
      include: [
        { model: Branch, as: "branch", attributes: ["name", "code"] }
      ]
    });

    const now = new Date();
    const currentYear =
      years.find((y) => y.is_current === true || y.is_current === 1 || y.is_current === 'true') ||
      years.find((y) => {
        if (!y.start_date || !y.end_date) return false;
        const s = new Date(y.start_date);
        const e = new Date(y.end_date);
        return s <= now && e >= now;
      }) ||
      years[0] ||
      null;

    return NextResponse.json({ 
      success: true,
      academic_years: years, 
      current_academic_year: currentYear,
      data: {
        academicYears: years,
        currentAcademicYear: currentYear
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Create Academic Year
async function createAcademicYear(req) {
  try {
    const user = req.user;
    const { name, start_date, end_date, branch_id, is_current } = await req.json();
    let finalBranchId = user.role === "SUPER_ADMIN" ? (branch_id || null) : user.branch_id;

    if (is_current) {
        await AcademicYearModel.update({ is_current: false }, { where: { branch_id: finalBranchId, is_current: true } });
    }

    const newYear = await AcademicYearModel.create({
      name, start_date, end_date, is_current: is_current || false, branch_id: finalBranchId, created_by: user.id
    });
    return NextResponse.json(newYear, { status: 201 });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ error: "Academic Year with this name already exists for the selected branch!" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withAuth(getAcademicYears);
export const POST = withAuth(createAcademicYear);
