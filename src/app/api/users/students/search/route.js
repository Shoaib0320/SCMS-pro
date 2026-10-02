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
    const q = searchParams.get("q");
    const branchId = searchParams.get("branch_id") || searchParams.get("branchId");
    const isRecent = searchParams.get("recent") === "true" || searchParams.has("limit");
    const status = searchParams.get("status") || searchParams.get("is_active");

    if (!q || !q.trim()) {
      if (isRecent) {
        const limitVal = parseInt(searchParams.get("limit") || "3", 10);
        let recentWhere = { 
          role: "STUDENT",
          deleted_at: null
        };

        if (status === "all") {
          // Show both active and inactive
        } else if (status === "inactive" || status === "false") {
          recentWhere.is_active = false;
        } else {
          recentWhere.is_active = true;
        }

        if (user.role === "BRANCH_ADMIN") {
          recentWhere.branch_id = user.branch_id;
        } else if (user.role === "SUPER_ADMIN" && branchId) {
          recentWhere.branch_id = branchId;
        }

        const recentStudents = await User.findAll({
          where: recentWhere,
          include: [
            {
              model: Branch,
              as: "branch",
              attributes: ["id", "name", "code", "settings"],
            },
          ],
          attributes: { exclude: ["password_hash", "plain_password"] },
          limit: limitVal,
          order: [["created_at", "DESC"]],
        });

        return NextResponse.json(recentStudents);
      }
      return NextResponse.json([]);
    }

    const cleanQ = q.trim().replace(/\s+/g, "");
    const searchPattern = `%${cleanQ}%`;

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
    }

    const academicYearId = searchParams.get("academic_year_id");
    const classId = searchParams.get("class_id");

    const orConditions = [
      // 1. Name search (Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn(
            "concat",
            sequelize.col("first_name"),
            sequelize.col("last_name")
          ),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 2. Registration No / GR No (Ignore spaces)
      sequelize.where(
        sequelize.fn("replace", sequelize.fn("COALESCE", sequelize.col("registration_no"), ""), " ", ""),
        { [Op.iLike]: searchPattern }
      ),
      // 3. Roll No (GR No in details)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'academic_info'->>'roll_no'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'academic_info'->>'rollNumber'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->>'roll_no'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 4. Father Name (JSONB search, Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'academic_info'->'father'->>'name'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'profile'->'father'->>'name'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 5. Guardian Name (JSONB search, Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'academic_info'->'guardian'->>'name'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'profile'->'guardian'->>'name'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 6. Mother Name
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn("COALESCE", sequelize.literal("details->'profile'->'mother'->>'name'"), ""),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 7. Email
      { email: { [Op.iLike]: `%${q.trim()}%` } },
    ];

    // Phone search (optional based on search_by_phone flag, defaults to true)
    const searchByPhone = searchParams.get("search_by_phone") !== "false";
    if (searchByPhone) {
      const digitsOnly = q.replace(/\D/g, "");
      if (digitsOnly.length >= 3) {
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
          // Primary phone
          orConditions.push(
            sequelize.where(
              sequelize.literal("regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')"),
              { [Op.iLike]: pPat }
            )
          );
          // Father phone
          orConditions.push(
            sequelize.where(
              sequelize.literal("regexp_replace(COALESCE(details->'academic_info'->'father'->>'phone', ''), '[^0-9]', '', 'g')"),
              { [Op.iLike]: pPat }
            )
          );
          orConditions.push(
            sequelize.where(
              sequelize.literal("regexp_replace(COALESCE(details->'profile'->'father'->>'phone', ''), '[^0-9]', '', 'g')"),
              { [Op.iLike]: pPat }
            )
          );
          // Guardian phone
          orConditions.push(
            sequelize.where(
              sequelize.literal("regexp_replace(COALESCE(details->'academic_info'->'guardian'->>'phone', ''), '[^0-9]', '', 'g')"),
              { [Op.iLike]: pPat }
            )
          );
          orConditions.push(
            sequelize.where(
              sequelize.literal("regexp_replace(COALESCE(details->'profile'->'guardian'->>'phone', ''), '[^0-9]', '', 'g')"),
              { [Op.iLike]: pPat }
            )
          );
          // Mother phone
          orConditions.push(
            sequelize.where(
              sequelize.literal("regexp_replace(COALESCE(details->'profile'->'mother'->>'phone', ''), '[^0-9]', '', 'g')"),
              { [Op.iLike]: pPat }
            )
          );
          // Alternate phone
          orConditions.push(
            sequelize.where(
              sequelize.literal("regexp_replace(COALESCE(details->>'alternate_phone', details->'profile'->>'alternate_phone', ''), '[^0-9]', '', 'g')"),
              { [Op.iLike]: pPat }
            )
          );
        }
      } else {
        orConditions.push(
          sequelize.where(
            sequelize.fn("replace", sequelize.fn("COALESCE", sequelize.col("phone"), ""), " ", ""),
            { [Op.iLike]: searchPattern }
          )
        );
      }
    }

    whereClause[Op.and] = [{ [Op.or]: orConditions }];

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

    const safeQ = cleanQ.replace(/'/g, "''");
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
      limit: 50, // Limit results for performance
      order: [
        sequelize.literal(`
          CASE
            WHEN details->'academic_info'->>'roll_no' = '${safeQ}' THEN 1
            WHEN details->'academic_info'->>'rollNumber' = '${safeQ}' THEN 1
            WHEN details->>'roll_no' = '${safeQ}' THEN 1
            WHEN registration_no = '${safeQ}' THEN 1
            WHEN registration_no ILIKE '%-' || lpad('${safeQ}', 4, '0') THEN 1
            WHEN registration_no ILIKE '%-' || '${safeQ}' THEN 2
            WHEN details->'academic_info'->>'roll_no' ILIKE '${safeQ}%' THEN 3
            WHEN details->'academic_info'->>'rollNumber' ILIKE '${safeQ}%' THEN 3
            WHEN registration_no ILIKE '%-' || '${safeQ}%' THEN 4
            WHEN first_name ILIKE '${safeQ}%' THEN 5
            WHEN last_name ILIKE '${safeQ}%' THEN 6
            WHEN concat(first_name, ' ', last_name) ILIKE '${safeQ}%' THEN 7
            WHEN replace(concat(first_name, last_name), ' ', '') ILIKE '%${safeQ}%' THEN 8
            WHEN details->'academic_info'->>'roll_no' ILIKE '%${safeQ}%' THEN 9
            WHEN registration_no ILIKE '%${safeQ}%' THEN 10
            ELSE 11
          END ASC
        `),
        ["created_at", "DESC"]
      ],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Student search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
