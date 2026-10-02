import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware";
import {
  Exam,
  Branch,
  AcademicYear,
  Class,
  Section,
  Group,
  Subject,
} from "@/backend/models/postgres";

// Automatically update exam status based on current date
async function autoUpdateExamStatuses(exams) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  for (let exam of exams) {
    if (exam.status !== 'scheduled' && exam.status !== 'ongoing') continue;

    const subjects = exam.subjects || [];
    if (subjects.length === 0) continue;

    const dates = subjects.map(s => s.date).filter(Boolean).sort();
    if (dates.length === 0) continue;

    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    let targetStatus = exam.status;

    if (maxDate < todayStr) {
      targetStatus = 'completed';
    } else if (minDate <= todayStr && maxDate >= todayStr) {
      targetStatus = 'ongoing';
    } else if (minDate > todayStr) {
      targetStatus = 'scheduled';
    }

    if (targetStatus !== exam.status) {
      try {
        await Exam.update({ status: targetStatus }, { where: { id: exam.id } });
        exam.status = targetStatus; 
      } catch (err) {
        console.error(`Failed to auto-update exam ${exam.id} status:`, err);
      }
    }
  }
}

function getStudentContext(user) {
  const academicInfo = user.details?.academic_info || {};
  return {
    branchId: user.branch_id,
    classId: academicInfo.class_id || null,
    sectionId: academicInfo.section_id || null,
  };
}

async function listStudentExams(req) {
  try {
    const student = req.user;
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100,
    );
    const offset = (page - 1) * limit;

    const studentContext = getStudentContext(student);
    if (!studentContext.classId || !studentContext.sectionId) {
      return NextResponse.json(
        {
          success: true,
          data: {
            exams: [],
            pagination: { page, limit, total: 0, pages: 0 },
          },
        },
        { status: 200 },
      );
    }

    const where = {
      branch_id: studentContext.branchId,
      class_id: studentContext.classId,
      section_id: studentContext.sectionId,
    };

    const { rows: exams, count: total } = await Exam.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name"] },
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
        { model: Group, as: "group", attributes: ["id", "name"] },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Section, as: "section", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    await autoUpdateExamStatuses(exams);

    const allSubjectIds = [
      ...new Set(
        exams.flatMap((e) =>
          (e.subjects || []).map((s) => s.subject_id).filter(Boolean)
        )
      ),
    ];

    const subjectRecords = allSubjectIds.length
      ? await Subject.findAll({
          where: { id: allSubjectIds },
          attributes: ["id", "name"],
        })
      : [];
    const subjectMap = {};
    subjectRecords.forEach((s) => { subjectMap[s.id] = s.name; });

    const examsWithSubjectNames = exams.map((exam) => {
      const plain = exam.toJSON();
      plain.subjects = (plain.subjects || []).map((s) => ({
        ...s,
        subject_name: subjectMap[s.subject_id] || s.subject_name || "Unknown Subject",
      }));
      return plain;
    });

    return NextResponse.json({
      success: true,
      data: {
        exams: examsWithSubjectNames,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withAuth(listStudentExams, ["STUDENT"]);
