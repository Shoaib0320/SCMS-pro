import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Exam, ExamMark, User, sequelize } from "@/backend/models/postgres";
import { Op } from "sequelize";
import NotificationService from "@/backend/services/NotificationService";

// Ensure table exists
let tableSynced = false;
async function ensureTableSynced() {
  if (!tableSynced) {
    try {
      await ExamMark.sync({ alter: true });
      tableSynced = true;
    } catch (e) {
      console.error("ExamMark table sync failed:", e);
    }
  }
}

// POST /api/exams/:id/marks
async function saveExamMarks(req, { params }) {
  await ensureTableSynced();
  const { id } = await params;
  const currentUser = req.user;

  try {
    const exam = await Exam.findByPk(id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Authorization
    if (
      (currentUser.role === "BRANCH_ADMIN" || currentUser.role === "TEACHER") &&
      currentUser.branch_id !== exam.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { marks } = await req.json(); // Array: [{ student_id, subject_id, marks_obtained, is_absent, remarks }]

    if (!marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: "Marks array is required" },
        { status: 400 },
      );
    }

    // Build map of subject_id -> total_marks configured for this exam
    const subjectTotalMarksMap = new Map();
    if (Array.isArray(exam.subjects)) {
      exam.subjects.forEach((s) => {
        const sid = String(s.subject_id || s.subject?.id || s.id || "");
        const total = Number(s.total_marks ?? s.totalMarks);
        if (sid) {
          subjectTotalMarksMap.set(sid, !isNaN(total) && total > 0 ? total : 100);
        }
      });
    }

    // Validate that obtainedMarks <= totalMarks and obtainedMarks >= 0 before persisting
    for (const markData of marks) {
      const { subject_id, marks_obtained, is_absent } = markData;
      if (is_absent) {
        continue;
      }
      if (marks_obtained !== undefined && marks_obtained !== null && marks_obtained !== "") {
        const obtained = Number(marks_obtained);
        const sid = String(subject_id || "");
        const totalMarks = subjectTotalMarksMap.has(sid)
          ? subjectTotalMarksMap.get(sid)
          : (Number(exam.total_marks ?? exam.totalMarks) || 100);

        if (isNaN(obtained) || obtained > totalMarks || obtained < 0) {
          return NextResponse.json(
            { success: false, error: "Obtained marks cannot be greater than total marks." },
            { status: 400 },
          );
        }
      }
    }

    // Ensure inactive students are excluded from grade/marks entry
    const studentIds = marks.map((m) => m.student_id).filter(Boolean);
    const activeStudents = await User.findAll({
      where: {
        id: { [Op.in]: studentIds },
        role: "STUDENT",
        is_active: true,
      },
      attributes: ["id"],
    });
    const activeStudentIdSet = new Set(activeStudents.map((s) => s.id));
    const validMarks = marks.filter((m) => activeStudentIdSet.has(m.student_id));

    // Batch create or update marks
    // We use a transaction for safety
    await sequelize.transaction(async (t) => {
      for (const markData of validMarks) {
        const { student_id, subject_id, marks_obtained, is_absent, remarks } =
          markData;

        // Upsert logic
        const [mark, created] = await ExamMark.findOrCreate({
          where: {
            exam_id: id,
            student_id,
            subject_id,
          },
          defaults: {
            marks_obtained,
            is_absent,
            remarks,
            created_by: currentUser.id,
          },
          transaction: t,
        });

        if (!created) {
          await mark.update(
            {
              marks_obtained,
              is_absent,
              remarks,
              updated_by: currentUser.id,
            },
            { transaction: t },
          );
        }
      }
    });

    // Send notifications asynchronously
    (async () => {
      try {
        // Collect unique student IDs to avoid duplicate notifications
        const uniqueStudentIds = [...new Set(marks.map(m => m.student_id))];
        for (const studentId of uniqueStudentIds) {
          await NotificationService.sendToUsers([studentId], {
            title: "Exam Results Published",
            message: `Marks for the exam "${exam.title}" have been updated. Please check your dashboard for details.`,
            type: "exam_result",
            branchId: exam.branch_id,
            sentBy: currentUser.id,
          });
        }
      } catch (err) {
        console.error("Exam Marks Notification Error:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Marks saved successfully",
    });
  } catch (error) {
    console.error("Save exam marks error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// GET /api/exams/:id/marks
async function getExamMarks(req, { params }) {
  await ensureTableSynced();
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const currentUser = req.user;
  let student_id = searchParams.get("student_id");

  if (currentUser.role === "STUDENT") {
    student_id = currentUser.id;
  }

  let where = { exam_id: id };
  if (student_id) where.student_id = student_id;

  try {
    const marks = await ExamMark.findAll({ where });
    return NextResponse.json({
      success: true,
      data: marks,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const POST = withAuth(saveExamMarks, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
export const GET = withAuth(getExamMarks, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
]);
