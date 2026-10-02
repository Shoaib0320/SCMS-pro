import { NextResponse } from "next/server";
import { Op } from "sequelize";
import {
  sequelize,
  User,
  Branch,
} from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const rollNo = searchParams.get("roll_no");
    const branchId = searchParams.get("branch_id") || searchParams.get("branchId");

    if (!rollNo || !rollNo.trim()) {
      return NextResponse.json([]);
    }

    const cleanRollNo = rollNo.trim().replace(/\s+/g, "");
    const status = searchParams.get("status") || searchParams.get("is_active");

    // --- Role-Based Filter ---
    let whereClause = { 
      role: "STUDENT",
      deleted_at: null
    };

    if (status === "all") {
      // Show both active and inactive
    } else if (status === "inactive" || status === "false") {
      whereClause.is_active = false;
    } else {
      whereClause.is_active = true;
    }

    if (user.role === "BRANCH_ADMIN") {
      whereClause.branch_id = user.branch_id;
    } else if (user.role === "SUPER_ADMIN" && branchId) {
      whereClause.branch_id = branchId;
    } else if (user.role === "TEACHER" && user.branch_id) {
      whereClause.branch_id = user.branch_id;
    }

    const academicYearId = searchParams.get("academic_year_id");
    const classId = searchParams.get("class_id");

    // Strict GR No (Roll No) search in JSONB and registration_no
    const grConditions = [
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'academic_info'->>'roll_no'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: `%${cleanRollNo}%` }
      ),
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'academic_info'->>'rollNumber'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: `%${cleanRollNo}%` }
      ),
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->>'roll_no'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: `%${cleanRollNo}%` }
      ),
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.col("registration_no"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: `%${cleanRollNo}%` }
      ),
    ];

    const searchByPhone = searchParams.get("search_by_phone") !== "false";
    const digitsOnly = rollNo.replace(/\D/g, "");
    if (searchByPhone && digitsOnly.length >= 3) {
      const phoneCandidates = new Set();
      phoneCandidates.add(digitsOnly);
      if (digitsOnly.startsWith("92") && digitsOnly.length > 2) {
        phoneCandidates.add(digitsOnly.slice(2));
        phoneCandidates.add("0" + digitsOnly.slice(2));
      } else if (digitsOnly.startsWith("0") && digitsOnly.length > 1) {
        phoneCandidates.add(digitsOnly.slice(1));
        phoneCandidates.add("92" + digitsOnly.slice(1));
      } else {
        phoneCandidates.add("0" + digitsOnly);
        phoneCandidates.add("92" + digitsOnly);
      }
      for (const cand of phoneCandidates) {
        const pPat = `%${cand}%`;
        grConditions.push(
          sequelize.where(
            sequelize.literal("regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')"),
            { [Op.iLike]: pPat }
          )
        );
        grConditions.push(
          sequelize.where(
            sequelize.literal("regexp_replace(COALESCE(details->'academic_info'->'father'->>'phone', ''), '[^0-9]', '', 'g')"),
            { [Op.iLike]: pPat }
          )
        );
        grConditions.push(
          sequelize.where(
            sequelize.literal("regexp_replace(COALESCE(details->'profile'->'father'->>'phone', ''), '[^0-9]', '', 'g')"),
            { [Op.iLike]: pPat }
          )
        );
        grConditions.push(
          sequelize.where(
            sequelize.literal("regexp_replace(COALESCE(details->'profile'->'guardian'->>'phone', ''), '[^0-9]', '', 'g')"),
            { [Op.iLike]: pPat }
          )
        );
      }
    }

    whereClause[Op.and] = [{ [Op.or]: grConditions }];

    // --- Academic Info Filtering ---
    const academicInfoFilter = {};
    let hasAcademicFilter = false;

    if (academicYearId) {
      academicInfoFilter.academic_year_id = academicYearId;
      hasAcademicFilter = true;
    }
    if (classId) {
      academicInfoFilter.class_id = classId;
      hasAcademicFilter = true;
    }

    if (hasAcademicFilter) {
      whereClause.details = {
        [Op.contains]: {
          academic_info: academicInfoFilter,
        },
      };
    }

    const safeRollNo = cleanRollNo.replace(/'/g, "''");
    const students = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code", "settings"],
        },
      ],
      attributes: { exclude: ["password_hash", "plain_password"] },
      limit: 50,
      order: [
        sequelize.literal(`
          CASE
            WHEN details->'academic_info'->>'roll_no' = '${safeRollNo}' THEN 1
            WHEN details->'academic_info'->>'rollNumber' = '${safeRollNo}' THEN 1
            WHEN details->>'roll_no' = '${safeRollNo}' THEN 1
            WHEN registration_no = '${safeRollNo}' THEN 1
            WHEN registration_no ILIKE '%-' || lpad('${safeRollNo}', 4, '0') THEN 1
            WHEN registration_no ILIKE '%-' || '${safeRollNo}' THEN 2
            WHEN details->'academic_info'->>'roll_no' ILIKE '${safeRollNo}%' THEN 3
            WHEN details->'academic_info'->>'rollNumber' ILIKE '${safeRollNo}%' THEN 3
            WHEN registration_no ILIKE '%-' || '${safeRollNo}%' THEN 4
            WHEN details->'academic_info'->>'roll_no' ILIKE '%${safeRollNo}%' THEN 5
            WHEN registration_no ILIKE '%${safeRollNo}%' THEN 6
            ELSE 7
          END ASC
        `),
        ["created_at", "DESC"]
      ],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Student GR search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
