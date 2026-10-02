import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import {
  Exam,
  ExamMark,
  Class,
  Section,
  Subject,
  Branch,
  User,
} from "@/backend/models/postgres";
import { Op } from "sequelize";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getOrdinalSuffix(i) {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return `${i}st`;
  if (j === 2 && k !== 12) return `${i}nd`;
  if (j === 3 && k !== 13) return `${i}rd`;
  return `${i}th`;
}

async function getToppers(req) {
  try {
    const currentUser = req.user;
    const { searchParams } = new URL(req.url);

    const monthParam = searchParams.get("month");
    const classId = searchParams.get("class_id");
    const sectionId = searchParams.get("section_id") || "";
    const subjectId = searchParams.get("subject_id") || "";
    const branchIdParam = searchParams.get("branch_id");

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "Class is a required parameter." },
        { status: 400 }
      );
    }

    const isAllMonths = !monthParam || monthParam === "all" || monthParam === "0" || monthParam === "";
    let targetMonth = null;
    let monthName = "All Months";

    if (!isAllMonths) {
      targetMonth = Number(monthParam);
      if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
        return NextResponse.json(
          { success: false, error: "Invalid month value. Must be between 1 and 12, or empty for All Months." },
          { status: 400 }
        );
      }
      monthName = MONTH_NAMES[targetMonth - 1];
    }

    // Branch authorization
    let targetBranchId = null;
    if (currentUser.role === "BRANCH_ADMIN" || currentUser.role === "TEACHER") {
      targetBranchId = currentUser.branch_id;
    } else if (branchIdParam) {
      targetBranchId = branchIdParam;
    }

    // 1. Fetch Class, Section (if specified), Subject (if specified), and Branch info
    const [targetClass, targetSection, targetSubject, targetBranch] = await Promise.all([
      Class.findByPk(classId, { attributes: ["id", "name", "branch_id"] }),
      sectionId && sectionId !== "all"
        ? Section.findByPk(sectionId, { attributes: ["id", "name"] })
        : null,
      subjectId ? Subject.findByPk(subjectId, { attributes: ["id", "name"] }) : null,
      targetBranchId ? Branch.findByPk(targetBranchId, { attributes: ["id", "name", "code"] }) : null,
    ]);

    if (!targetClass) {
      return NextResponse.json(
        { success: false, error: "Class not found." },
        { status: 404 }
      );
    }

    const finalBranchId = targetBranchId || targetClass.branch_id;
    let branchName = targetBranch?.name || "Campus";
    if (!targetBranch && finalBranchId) {
      const b = await Branch.findByPk(finalBranchId, { attributes: ["id", "name"] });
      if (b?.name) branchName = b.name;
    }

    let sectionDisplayName = "All Sections / Combined";
    if (targetSection?.name) {
      sectionDisplayName = targetSection.name.toLowerCase().startsWith("sec")
        ? targetSection.name
        : `Sec ${targetSection.name}`;
    }

    // 2. Fetch Exams for this class (and optional section)
    let examWhere = {
      class_id: classId,
    };
    if (finalBranchId) {
      examWhere.branch_id = finalBranchId;
    }
    if (sectionId && sectionId !== "all") {
      examWhere.section_id = sectionId;
    }

    const classExams = await Exam.findAll({
      where: examWhere,
      include: [
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Section, as: "section", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    // 3. Filter exams matching the selected month (or all if All Months)
    const matchingExams = classExams.filter((e) => {
      if (isAllMonths) return true;

      // 3.1 Check if any subject in this exam has a date in the selected month
      const hasMatchingSubject = (e.subjects || []).some((s) => {
        if (!s.date) return false;
        try {
          const d = new Date(s.date);
          if (!isNaN(d.getTime())) {
            return d.getMonth() + 1 === targetMonth;
          }
          const parts = String(s.date).split("-");
          if (parts.length >= 2 && Number(parts[1]) === targetMonth) return true;
        } catch {
          return false;
        }
        return false;
      });
      if (hasMatchingSubject) return true;

      // 3.2 Check if the exam title mentions the month name
      if (monthName && e.title?.toLowerCase().includes(monthName.toLowerCase())) return true;

      // 3.3 Fallback: check created_at
      const hasAnySubjectDates = (e.subjects || []).some((s) => Boolean(s.date));
      if (!hasAnySubjectDates && (e.created_at || e.createdAt)) {
        try {
          const d = new Date(e.created_at || e.createdAt);
          if (!isNaN(d.getTime())) {
            return d.getMonth() + 1 === targetMonth;
          }
        } catch {
          return false;
        }
      }

      return false;
    });

    // If specific subject is selected, filter exams that have that subject
    const subjectFilteredExams = subjectId
      ? matchingExams.filter((e) =>
          (e.subjects || []).some(
            (s) => String(s.subject_id || s.id) === String(subjectId)
          )
        )
      : matchingExams;

    if (subjectFilteredExams.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          toppers: [],
          students: [],
          meta: {
            month: monthName,
            monthNumber: targetMonth,
            year: new Date().getFullYear(),
            className: targetClass.name,
            sectionName: sectionDisplayName,
            subjectName: targetSubject?.name || "All Subjects",
            branchName: branchName,
            totalStudents: 0,
            passCount: 0,
            failCount: 0,
          },
        },
      });
    }

    const matchingExamIds = subjectFilteredExams.map((e) => e.id);

    // 4. Fetch marks for all matching exams
    let markWhere = {
      exam_id: { [Op.in]: matchingExamIds },
    };
    if (subjectId) {
      markWhere.subject_id = subjectId;
    }

    const marks = await ExamMark.findAll({
      where: markWhere,
      include: [
        {
          model: User,
          as: "student",
          where: { is_active: true },
          attributes: [
            "id",
            "first_name",
            "last_name",
            "registration_no",
            "details",
            "is_active",
          ],
        },
        {
          model: Subject,
          as: "subject",
          attributes: ["id", "name"],
        },
        {
          model: Exam,
          as: "exam",
          include: [
            { model: Section, as: "section", attributes: ["id", "name"] },
            { model: Class, as: "class", attributes: ["id", "name"] },
          ],
        },
      ],
    });

    // 5. Aggregate marks per student
    const studentMap = {};

    marks.forEach((m) => {
      const student = m.student;
      if (!student) return;

      const sid = String(m.student_id);
      const exam = m.exam;

      // Find total/max marks configured for this subject in the exam
      const exSubj = (exam?.subjects || []).find(
        (s) => String(s.subject_id || s.id) === String(m.subject_id)
      );
      let maxMarks = Number(
        exSubj?.total_marks ?? exSubj?.max_marks ?? exam?.total_marks ?? 100
      );
      if (isNaN(maxMarks) || maxMarks <= 0) maxMarks = 100;

      // Passing marks threshold: defined in exam subject or fallback 40%
      let passingMarks = Number(exSubj?.passing_marks ?? exSubj?.pass_marks);
      if (isNaN(passingMarks) || passingMarks <= 0) {
        passingMarks = maxMarks * 0.4;
      }

      const isAbsent = Boolean(m.is_absent);
      const rawObtMarks = isAbsent ? 0 : Number(m.marks_obtained) || 0;
      // Safety guard: clamp obtained marks between 0 and maxMarks (guards against legacy input typos)
      const obtMarks = Math.max(0, Math.min(rawObtMarks, maxMarks));

      // Source/stored remarks status check
      const remarkStr = String(m.remarks || "").trim().toUpperCase();
      const hasStoredPass = remarkStr === "PASS" || remarkStr === "PASSED";
      const hasStoredFail = remarkStr === "FAIL" || remarkStr === "FAILED";

      const subjectPassed = hasStoredPass
        ? true
        : hasStoredFail
        ? false
        : !isAbsent && obtMarks >= passingMarks;

      if (!studentMap[sid]) {
        const academicInfo = student.details?.academic_info || {};
        const grNo =
          academicInfo.roll_no ||
          student.registration_no ||
          student.details?.roll_number ||
          student.details?.gr_no ||
          student.details?.grNumber ||
          "N/A";

        const secName =
          academicInfo.section_name ||
          exam?.section?.name ||
          "A";

        const formattedSec = secName.toLowerCase().startsWith("sec")
          ? secName
          : `Sec ${secName}`;

        const classSection = `${targetClass.name} - ${formattedSec}`;

        studentMap[sid] = {
          studentId: sid,
          name: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          grNo: String(grNo),
          section: formattedSec,
          classSection,
          subject: subjectId ? (targetSubject?.name || m.subject?.name || "Subject") : "All Subjects",
          marksObtained: 0,
          totalMarks: 0,
          hasMarks: false,
          allAbsent: true,
          hasStoredFail: false,
          subjectResults: [],
        };
      }

      studentMap[sid].marksObtained += obtMarks;
      studentMap[sid].totalMarks += maxMarks;
      studentMap[sid].hasMarks = true;
      if (!isAbsent) {
        studentMap[sid].allAbsent = false;
      }
      if (hasStoredFail) {
        studentMap[sid].hasStoredFail = true;
      }

      studentMap[sid].subjectResults.push({
        subjectId: m.subject_id,
        obtMarks,
        maxMarks,
        passingMarks,
        isAbsent,
        passed: subjectPassed,
        hasStoredFail,
      });
    });

    // 6. Compute standardized percentages & assign verified status (PASS / FAIL)
    const studentList = Object.values(studentMap)
      .filter((s) => s.hasMarks && s.totalMarks > 0)
      .map((s) => {
        // Standardized percentage formula rounded strictly to 2 decimal places
        const pct = (s.marksObtained / s.totalMarks) * 100;
        const percentage = Math.round(pct * 100) / 100;

        let status = "PASS";

        if (subjectId) {
          // Scenario A: Single subject-wise report
          const res = s.subjectResults[0];
          if (!res || res.isAbsent || !res.passed) {
            status = "FAIL";
          }
        } else {
          // Scenario B: Overall combined report across all subjects
          // A candidate fails if absent across all exams, has percentage below 40%, or has stored FAIL
          if (s.allAbsent || percentage < 40 || s.hasStoredFail) {
            status = "FAIL";
          }
        }

        return {
          ...s,
          percentage,
          status,
        };
      });

    // 7. Unified Descending Sort Order:
    // Sort the entire table strictly by Percentage DESC, then Marks Obtained DESC
    // (Do not group all PASS at top and FAIL at bottom; preserve strict score hierarchy)
    studentList.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return b.marksObtained - a.marksObtained;
    });

    // 8. Assign Dense / Tie Ranking:
    // Students with identical percentage and obtained marks receive the exact SAME rank.
    // Failing students receive "-" and no numeric rank, while remaining in their proper percentage position.
    let currentRank = 0;
    let lastPassingPct = null;
    let lastPassingObt = null;

    studentList.forEach((s) => {
      if (s.status === "FAIL") {
        s.rank = "-";
        s.rankNumber = null;
      } else {
        if (
          lastPassingPct !== null &&
          s.percentage === lastPassingPct &&
          s.marksObtained === lastPassingObt
        ) {
          // Identical score shares the exact same rank
          s.rankNumber = currentRank;
        } else {
          // Next position rank
          currentRank += 1;
          s.rankNumber = currentRank;
          lastPassingPct = s.percentage;
          lastPassingObt = s.marksObtained;
        }
        s.rank = getOrdinalSuffix(s.rankNumber);
      }
    });

    // 9. Top 10 Positions (ranks 1st through 10th)
    const toppers = studentList.filter(
      (s) => s.status === "PASS" && s.rankNumber && s.rankNumber <= 10
    );

    // 10. Complete Result / Merit List (entire descending sorted roster)
    const completeList = studentList;

    const passCount = studentList.filter((s) => s.status === "PASS").length;
    const failCount = studentList.filter((s) => s.status === "FAIL").length;

    return NextResponse.json({
      success: true,
      data: {
        toppers,
        students: completeList,
        meta: {
          month: monthName,
          monthNumber: targetMonth,
          year: new Date().getFullYear(),
          className: targetClass.name,
          sectionName: sectionDisplayName,
          subjectName: targetSubject?.name || "All Subjects",
          branchName: branchName,
          totalStudents: completeList.length,
          passCount,
          failCount,
        },
      },
    });
  } catch (error) {
    console.error("Toppers calculation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate toppers" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getToppers, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
