import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { 
  User, 
  Timetable, 
  Class, 
  Section, 
  Subject, 
  Group, 
  AcademicYear,
  sequelize 
} from "@/backend/models/postgres";
import { Op } from "sequelize";

async function getTeacherStudents(req) {
  try {
    const user = req.user;
    const teacherId = user.id;
    const url = new URL(req.url, `http://localhost`);
    const filterClassId = url.searchParams.get("classId");
    const filterSectionId = url.searchParams.get("sectionId");
    const filterSubjectId = url.searchParams.get("subjectId");

    if (filterClassId) {
      let conditionStr = `details->'academic_info'->>'class_id' = '${filterClassId}'`;
      if (filterSubjectId && filterSubjectId !== "unknown" && filterSubjectId !== "") {
        conditionStr += ` AND (
          details->'subjects' @> '[{"id": "${filterSubjectId}", "section_id": "${filterSectionId}"}]'
          OR details->'academic_info'->'subjects' @> '[{"id": "${filterSubjectId}", "section_id": "${filterSectionId}"}]'
          OR 
          (details->'academic_info'->>'section_id' = '${filterSectionId}' AND (details->'subjects' @> '[{"id": "${filterSubjectId}"}]' OR details->'academic_info'->'subjects' @> '[{"id": "${filterSubjectId}"}]'))
          OR
          (details->'academic_info'->>'section_id' = '${filterSectionId}' AND COALESCE(details->>'subjects', '[]') IN ('[]', 'null', '') AND COALESCE(details->'academic_info'->>'subjects', '[]') IN ('[]', 'null', ''))
        )`;
      } else if (filterSectionId) {
        conditionStr += ` AND details->'academic_info'->>'section_id' = '${filterSectionId}'`;
      }

      const students = await User.findAll({
        where: {
          role: "STUDENT",
          branch_id: user.branch_id,
          [Op.and]: [ sequelize.literal(conditionStr) ]
        },
        attributes: ["id", "first_name", "last_name", "email", "avatar_url", "details"]
      });

      const mappedStudents = students.map(s => {
        const details = s.details || {};
        const academicInfo = details.academic_info || {};
        const father = academicInfo.father || {};
        const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "N/A";
        return {
          id: s.id,
          name: fullName,
          email: s.email,
          avatar: s.avatar_url,
          grNo: academicInfo.roll_no || details.roll_number || details.gr_no || details.grNumber || "N/A",
          parentName: father.name || details.father_name || "N/A",
        };
      });

      return NextResponse.json({ success: true, data: mappedStudents });
    }

    // 1. Fetch Timetables where this teacher is assigned to any period
    const timetables = await Timetable.findAll({
      where: {
        branch_id: user.branch_id,
        periods: {
          [Op.contains]: [{ teacherId }]
        }
      },
      include: [
        { 
          model: Class, 
          as: "class", 
          attributes: ["id", "name"],
          include: [
            { model: Group, as: "group", attributes: ["id", "name"] }
          ]
        },
        { model: Section, as: "section", attributes: ["id", "name"] }
      ]
    });

    // 2. Extract unique Class + Section + Subject combinations
    const classesMap = new Map();
    const subjectIds = new Set();

    timetables.forEach(tt => {
      const myPeriods = (tt.periods || []).filter(p => p.teacherId === teacherId);
      myPeriods.forEach(p => {
        const pSubjectId = p.subjectId || "unknown";
        if (p.subjectId) {
          subjectIds.add(p.subjectId);
        }

        const key = `${tt.class_id}-${tt.section_id}-${pSubjectId}`;

        if (!classesMap.has(key)) {
          classesMap.set(key, {
            classId: tt.class_id,
            sectionId: tt.section_id,
            subjectId: p.subjectId || "",
            className: tt.class?.name || "N/A",
            sectionName: tt.section?.name || "N/A",
            groupName: tt.class?.group?.name || "N/A",
            subjectName: "Loading..."
          });
        }
      });
    });

    const myClasses = Array.from(classesMap.values());

    // 3. Resolve Subject Names
    let subjectMap = {};
    if (subjectIds.size > 0) {
      const subjects = await Subject.findAll({
        where: { id: Array.from(subjectIds) },
        attributes: ["id", "name"]
      });
      subjects.forEach(s => subjectMap[s.id] = s.name);

      myClasses.forEach(c => {
        if (c.subjectId && subjectMap[c.subjectId]) {
          c.subjectName = subjectMap[c.subjectId];
        } else {
          c.subjectName = "Subject Not Assigned";
        }
      });
    }

    // 4. Fetch students for each class/section/subject
    const allStudents = [];
    const addedStudentIds = new Set(); // To prevent duplicates if a student takes multiple subjects with same teacher

    for (let cls of myClasses) {
      let conditionStr = `details->'academic_info'->>'class_id' = '${cls.classId}'`;
      if (cls.subjectId && cls.subjectId !== "unknown" && cls.subjectId !== "") {
        conditionStr += ` AND (
          details->'subjects' @> '[{"id": "${cls.subjectId}", "section_id": "${cls.sectionId}"}]'
          OR details->'academic_info'->'subjects' @> '[{"id": "${cls.subjectId}", "section_id": "${cls.sectionId}"}]'
          OR 
          (details->'academic_info'->>'section_id' = '${cls.sectionId}' AND (details->'subjects' @> '[{"id": "${cls.subjectId}"}]' OR details->'academic_info'->'subjects' @> '[{"id": "${cls.subjectId}"}]'))
          OR
          (details->'academic_info'->>'section_id' = '${cls.sectionId}' AND COALESCE(details->>'subjects', '[]') IN ('[]', 'null', '') AND COALESCE(details->'academic_info'->>'subjects', '[]') IN ('[]', 'null', ''))
        )`;
      } else {
        conditionStr += ` AND details->'academic_info'->>'section_id' = '${cls.sectionId}'`;
      }

      const students = await User.findAll({
        where: {
          role: "STUDENT",
          branch_id: user.branch_id,
          [Op.and]: [
            sequelize.literal(conditionStr)
          ]
        },
        attributes: ["id", "first_name", "last_name", "email", "avatar_url", "details"]
      });

      for (let s of students) {
        if (!addedStudentIds.has(s.id)) {
          addedStudentIds.add(s.id);
          
          const details = s.details || {};
          const academicInfo = details.academic_info || {};
          const father = academicInfo.father || {};

          const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "N/A";

          allStudents.push({
            id: s.id,
            name: fullName,
            email: s.email,
            avatar: s.avatar_url,
            grNo: academicInfo.roll_no || details.roll_number || details.gr_no || details.grNumber || "N/A",
            parentName: father.name || details.father_name || "N/A",
            className: cls.className,
            sectionName: cls.sectionName,
            groupName: cls.groupName,
            subjectName: cls.subjectName
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: allStudents
    });

  } catch (error) {
    console.error("Teacher Students API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch students", error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeacherStudents, ["TEACHER"]);
