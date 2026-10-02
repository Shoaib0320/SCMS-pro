import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { AssignmentSubmission, Assignment, Subject, Class, Section, User } from "@/backend/models/postgres";

async function listStudentSubmissions(req) {
  const student = req.user;
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignment_id");
  const status = searchParams.get("status");

  const where = { student_id: student.id };
  if (assignmentId) where.assignment_id = assignmentId;
  if (status) where.status = status;

  const submissions = await AssignmentSubmission.findAll({
    where,
    include: [
      {
        model: Assignment,
        as: "assignment",
        include: [
          { model: Subject, as: "subject", attributes: ["id", "name"] },
          { model: Class, as: "class", attributes: ["id", "name"] },
          { model: Section, as: "section", attributes: ["id", "name"] },
          {
            model: User,
            as: "teacher",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
      },
    ],
    order: [["submitted_at", "DESC"]],
  });

  return NextResponse.json({
    success: true,
    data: submissions,
  });
}

export const GET = withAuth(listStudentSubmissions, ["STUDENT"]);

export const POST = withAuth(async (req) => {
  try {
    const student = req.user;
    const body = await req.json();
    const { assignment_id, submission_text, submission_url } = body;

    if (!assignment_id) {
      return NextResponse.json({ error: "assignment_id is required" }, { status: 400 });
    }

    const assignment = await Assignment.findByPk(assignment_id);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const is_late = new Date() > new Date(assignment.due_date);

    let submission = await AssignmentSubmission.findOne({
      where: { assignment_id, student_id: student.id }
    });

    if (submission) {
      submission.submission_text = submission_text;
      submission.submission_url = submission_url;
      submission.submitted_at = new Date();
      submission.is_late = is_late;
      submission.status = "submitted";
      await submission.save();
    } else {
      submission = await AssignmentSubmission.create({
        assignment_id,
        student_id: student.id,
        submission_text,
        submission_url,
        submitted_at: new Date(),
        status: "submitted",
        is_late,
      });
    }

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}, ["STUDENT"]);
