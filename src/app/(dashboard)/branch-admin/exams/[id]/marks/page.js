"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Save, User, ArrowLeft, ChevronRight, AlertCircle, CheckCircle2, Printer } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { MarkSheetSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function EnterMarksPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = use(params);
  
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localMarks, setLocalMarks] = useState({});

  useEffect(() => {
    if (id) fetchExamAndData();
  }, [id]);

  const fetchExamAndData = async () => {
    try {
      setLoading(true);
      const examRes = await apiClient.get(`/api/exams/${id}`);
      if (examRes.success) {
        setExam(examRes.data);
      }

      const studentsRes = await apiClient.get(`/api/exams/${id}/students`);
      if (studentsRes.success) {
        setStudents(studentsRes.data);
      }

      const marksRes = await apiClient.get(`/api/exams/${id}/marks`);
      if (marksRes.success) {
        setExistingMarks(marksRes.data);
        const initialMarks = {};
        marksRes.data.forEach(m => {
          if (!initialMarks[m.subject_id]) initialMarks[m.subject_id] = {};
          initialMarks[m.subject_id][m.student_id] = {
            marks_obtained: m.marks_obtained,
            is_absent: m.is_absent,
            remarks: m.remarks || ""
          };
        });
        setLocalMarks(initialMarks);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, subjectId, field, value) => {
    setLocalMarks(prev => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || {}),
        [studentId]: {
          ...(prev[subjectId]?.[studentId] || { marks_obtained: "", is_absent: false, remarks: "" }),
          [field]: value
        }
      }
    }));
  };

  const hasValidationErrors = useMemo(() => {
    if (!exam?.subjects) return false;
    return exam.subjects.some((s) => {
      const subjectId = s.subject_id || s.subject?.id;
      const totalMarks = Number(s.total_marks ?? s.totalMarks) || 0;
      const subjectMarks = localMarks[subjectId] || {};
      return Object.values(subjectMarks).some((entry) => {
        if (entry.is_absent) return false;
        if (entry.marks_obtained === "" || entry.marks_obtained === null || entry.marks_obtained === undefined) return false;
        const val = Number(entry.marks_obtained);
        return isNaN(val) || val < 0 || (totalMarks > 0 && val > totalMarks);
      });
    });
  }, [exam, localMarks]);

  const handleSave = async () => {
    if (hasValidationErrors) {
      toast.error("Obtained marks cannot be greater than total marks.");
      return;
    }
    setSubmitting(true);
    try {
      let marksArray = [];
      exam.subjects.forEach(s => {
        const subjectId = s.subject_id || s.subject?.id;
        const subjectMarks = localMarks[subjectId] || {};
        
        Object.keys(subjectMarks).forEach(studentId => {
          // Only add to payload if they entered marks or checked absent
          if (subjectMarks[studentId].marks_obtained !== "" || subjectMarks[studentId].is_absent) {
            marksArray.push({
              student_id: studentId,
              subject_id: subjectId,
              marks_obtained: subjectMarks[studentId].is_absent ? 0 : parseFloat(subjectMarks[studentId].marks_obtained) || 0,
              is_absent: Boolean(subjectMarks[studentId].is_absent),
              remarks: subjectMarks[studentId].remarks
            });
          }
        });
      });

      if (marksArray.length === 0) {
        toast.info("No marks entered to save");
        setSubmitting(false);
        return;
      }

      const invalidInPayload = marksArray.find(m => {
        if (m.is_absent) return false;
        const sub = exam.subjects.find(s => (s.subject_id || s.subject?.id) === m.subject_id);
        const maxMarks = Number(sub?.total_marks ?? sub?.totalMarks) || 0;
        return m.marks_obtained < 0 || (maxMarks > 0 && m.marks_obtained > maxMarks);
      });

      if (invalidInPayload) {
        toast.error("Obtained marks cannot be greater than total marks.");
        setSubmitting(false);
        return;
      }

      const response = await apiClient.post(`/api/exams/${id}/marks`, { marks: marksArray });
      if (response.success) {
        toast.success("Marks saved successfully");
        const marksRes = await apiClient.get(`/api/exams/${id}/marks`);
        if (marksRes.success) setExistingMarks(marksRes.data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to save marks");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => {
      return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             s.registration_no?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort sequentially by GR No / Roll No
    result.sort((a, b) => {
      const aId = String(a.roll_no || a.details?.academic_info?.roll_no || a.registration_no || "");
      const bId = String(b.roll_no || b.details?.academic_info?.roll_no || b.registration_no || "");
      return aId.localeCompare(bId, undefined, { numeric: true, sensitivity: 'base' });
    });

    return result;
  }, [students, searchTerm]);

  if (loading) return <MarkSheetSkeleton />;
  if (!exam) return <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4"><AlertCircle className="w-10 h-10" /> Exam not found.</div>;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          @page {
            size: A4;
            margin: 0mm;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 15mm;
            box-sizing: border-box;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 no-print">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => router.back()} className="hover:text-primary transition-colors">Exams</button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Marks Entry</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{exam.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-semibold">{exam.class?.name || "Class"}</Badge>
                <Badge variant="outline" className="text-xs font-semibold uppercase">{exam.exam_type || "Exam"}</Badge>
                {exam.section?.name && <Badge variant="outline" className="text-xs font-semibold">Section: {exam.section.name}</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search students..." 
              className="pl-9 h-10 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => window.print()} className="h-10 px-4 w-full sm:w-auto">
            <Printer className="w-4 h-4 mr-2" />
            Print Mark Sheet
          </Button>
          <Button onClick={handleSave} disabled={submitting || hasValidationErrors} className="h-10 px-6 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "Saving..." : "Save All Marks"}
          </Button>
        </div>
      </div>

      {/* Mark Sheet Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full border-collapse">
            <TableHeader className="bg-muted/60">
              <TableRow className="border-b-2">
                <TableHead className="w-10 text-center font-bold text-xs py-4">#</TableHead>
                <TableHead className="min-w-[200px] font-bold text-xs py-4">Student Name</TableHead>
                <TableHead className="w-28 font-bold text-xs py-4">GR No</TableHead>
                <TableHead className="min-w-[160px] font-bold text-xs py-4">Subject</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Total</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Pass</TableHead>
                <TableHead className="w-28 text-center font-bold text-xs py-4">Marks</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Absent</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground font-medium">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, studentIndex) => {
                  const sid = student._id || student.id;

                  // Filter only enrolled subjects for this student
                  const enrolledSubjects = exam.subjects.filter(s => {
                    const subjectId = s.subject_id || s.subject?.id;
                    return !student.enrolled_subjects || 
                           student.enrolled_subjects.length === 0 || 
                           student.enrolled_subjects.includes(subjectId);
                  });

                  const rowCount = enrolledSubjects.length || 1;
                  const isLastStudent = studentIndex === filteredStudents.length - 1;

                  return enrolledSubjects.map((s, subIndex) => {
                    const subjectId = s.subject_id || s.subject?.id;
                    const marksData = localMarks[subjectId]?.[sid] || { marks_obtained: "", is_absent: false };
                    const obtained = parseFloat(marksData.marks_obtained);
                    const isPassing = marksData.marks_obtained !== "" && obtained >= (s.passing_marks || 0);
                    const isFailing = marksData.marks_obtained !== "" && obtained < (s.passing_marks || 0);

                    const isFirstRow = subIndex === 0;
                    const isLastRow = subIndex === rowCount - 1;
                    const borderClass = isLastRow && !isLastStudent ? "border-b-2 border-muted" : "border-b border-border/40";

                    return (
                      <TableRow 
                        key={`${sid}-${subjectId}`}
                        className={`transition-colors ${isFirstRow ? 'bg-background hover:bg-muted/20' : 'bg-muted/5 hover:bg-muted/20'} ${borderClass}`}
                      >
                        {/* Serial number — only on first subject row */}
                        {isFirstRow && (
                          <TableCell 
                            rowSpan={rowCount} 
                            className="text-center text-muted-foreground text-sm font-semibold align-middle border-r"
                          >
                            {studentIndex + 1}
                          </TableCell>
                        )}

                        {/* Student identity — only on first subject row */}
                        {isFirstRow && (
                          <TableCell rowSpan={rowCount} className="align-middle border-r py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-indigo-500" />
                              </div>
                              <span className="font-semibold text-sm text-foreground leading-snug">{student.name}</span>
                            </div>
                          </TableCell>
                        )}

                        {isFirstRow && (
                          <TableCell rowSpan={rowCount} className="align-middle border-r text-xs font-medium text-muted-foreground px-4">
                            {student.roll_no || student.rollNumber || student.details?.academic_info?.roll_no || "—"}
                          </TableCell>
                        )}

                        {/* Subject name */}
                        <TableCell className="py-2.5 px-4 text-sm font-medium text-foreground border-r">
                          {s.subject_name || s.subject?.name}
                        </TableCell>

                        {/* Total marks */}
                        <TableCell className="text-center text-sm font-semibold text-muted-foreground border-r">
                          {s.total_marks}
                        </TableCell>

                        {/* Passing marks */}
                        <TableCell className="text-center text-sm font-semibold text-muted-foreground border-r">
                          {s.passing_marks}
                        </TableCell>

                        {/* Marks input */}
                        <TableCell className="text-center py-2 border-r align-top">
                          {(() => {
                            const totalMax = Number(s.total_marks ?? s.totalMarks) || 0;
                            const val = marksData.marks_obtained;
                            const num = val !== "" && val !== null && val !== undefined ? Number(val) : null;
                            const isExceeding = !marksData.is_absent && num !== null && !isNaN(num) && totalMax > 0 && num > totalMax;
                            const isNegative = !marksData.is_absent && num !== null && !isNaN(num) && num < 0;
                            const hasError = isExceeding || isNegative;

                            return (
                              <div className="flex flex-col items-center">
                                <Input 
                                  type="number"
                                  min={0}
                                  max={totalMax || s.total_marks}
                                  value={marksData.marks_obtained}
                                  onChange={(e) => handleMarkChange(sid, subjectId, "marks_obtained", e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e") {
                                      e.preventDefault();
                                    }
                                  }}
                                  disabled={marksData.is_absent}
                                  placeholder="--"
                                  className={`h-9 w-20 mx-auto text-center text-sm font-bold transition-all
                                    ${hasError
                                      ? "border-red-500 bg-red-50 text-red-600 focus-visible:ring-red-500 ring-1 ring-red-500"
                                      : marksData.is_absent 
                                        ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" 
                                        : isPassing 
                                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-500" 
                                          : isFailing 
                                            ? "border-amber-300 bg-amber-50 text-amber-700 focus-visible:ring-amber-500" 
                                            : "focus-visible:ring-indigo-500"
                                    }
                                  `}
                                />
                                {isExceeding && (
                                  <span className="text-[10px] text-red-600 font-semibold mt-1 text-center whitespace-normal leading-tight max-w-[130px]">
                                    Obtained marks cannot exceed total marks ({totalMax})
                                  </span>
                                )}
                                {isNegative && (
                                  <span className="text-[10px] text-red-600 font-semibold mt-1 text-center whitespace-normal leading-tight max-w-[130px]">
                                    Obtained marks cannot be negative
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>

                        {/* Absent toggle */}
                        <TableCell className="text-center border-r">
                          <label className="flex items-center justify-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={marksData.is_absent}
                              onChange={(e) => handleMarkChange(sid, subjectId, "is_absent", e.target.checked)}
                              className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                            />
                          </label>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="text-center">
                          {marksData.is_absent ? (
                            <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold uppercase">Absent</Badge>
                          ) : isPassing ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Pass
                            </Badge>
                          ) : isFailing ? (
                            <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold uppercase">Fail</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] font-bold uppercase">—</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>

      {/* Printable Area */}
      <div className="hidden print:block print-area">
        <div className="text-center mb-6 mt-10">
          <div className="text-lg font-bold uppercase tracking-widest mb-1 text-slate-700">
            {user?.branch?.name || "ADAMJEE COACHING"}
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-widest">{exam.title} - Mark Sheet</h2>
          <div className="text-sm mt-2 font-semibold text-slate-600">
            Class: {exam.class?.name || "N/A"} | Type: {exam.exam_type || "N/A"} | Section: {exam.section?.name || "N/A"}
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            {/* Invisible spacer to create top margin on every page */}
            <tr>
              <th colSpan={7} className="border-none p-0" style={{ height: '10mm' }}></th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-10 text-center">#</th>
              <th className="border border-black p-2 text-left">Student Name</th>
              <th className="border border-black p-2 text-left w-24">GR No</th>
              <th className="border border-black p-2 text-left w-32">Subject</th>
              <th className="border border-black p-2 text-center w-20">Total</th>
              <th className="border border-black p-2 text-center w-24">Marks</th>
              <th className="border border-black p-2 text-center w-32">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, studentIndex) => {
              const enrolledSubjects = exam.subjects.filter(s => {
                const subjectId = s.subject_id || s.subject?.id;
                return !student.enrolled_subjects || 
                       student.enrolled_subjects.length === 0 || 
                       student.enrolled_subjects.includes(subjectId);
              });
              const rowCount = enrolledSubjects.length || 1;
              return enrolledSubjects.map((s, subIndex) => {
                const subjectId = s.subject_id || s.subject?.id;
                const sid = student._id || student.id;
                const marksData = localMarks[subjectId]?.[sid];
                const obtained = parseFloat(marksData?.marks_obtained);
                const isPassing = marksData?.marks_obtained !== undefined && marksData?.marks_obtained !== "" && obtained >= (s.passing_marks || 0);
                const isFailing = marksData?.marks_obtained !== undefined && marksData?.marks_obtained !== "" && obtained < (s.passing_marks || 0);

                let statusVal = "";
                if (marksData?.is_absent) statusVal = "Absent";
                else if (isPassing) statusVal = "Pass";
                else if (isFailing) statusVal = "Fail";

                const marksVal = marksData?.is_absent ? "Absent" : (marksData?.marks_obtained !== undefined && marksData?.marks_obtained !== "" ? marksData.marks_obtained : "");
                
                return (
                <tr key={`print-${sid}-${subjectId}`}>
                  {subIndex === 0 && (
                    <td rowSpan={rowCount} className="border border-black p-2 text-center font-semibold">{studentIndex + 1}</td>
                  )}
                  {subIndex === 0 && (
                    <td rowSpan={rowCount} className="border border-black p-2 font-bold">{student.name}</td>
                  )}
                  {subIndex === 0 && (
                    <td rowSpan={rowCount} className="border border-black p-2">{student.roll_no || student.rollNumber || student.details?.academic_info?.roll_no || "—"}</td>
                  )}
                  <td className="border border-black p-2 font-semibold">{s.subject_name || s.subject?.name}</td>
                  <td className="border border-black p-2 text-center font-bold">{s.total_marks}</td>
                  <td className="border border-black p-2 text-center font-bold">{marksVal}</td>
                  <td className={`border border-black p-2 text-center font-bold uppercase text-[11px] ${statusVal === 'Pass' ? 'text-green-700' : statusVal === 'Fail' || statusVal === 'Absent' ? 'text-red-700' : ''}`}>
                    {statusVal}
                  </td>
                </tr>
                );
              });
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-black p-4 text-center">No students found.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {/* Invisible spacer to create bottom margin on every page */}
            <tr>
              <td colSpan={7} className="border-none p-0" style={{ height: '10mm' }}></td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-16 mb-10 flex justify-between px-10">
          <div className="border-t border-black pt-2 w-48 text-center font-bold">Teacher's Signature</div>
          <div className="border-t border-black pt-2 w-48 text-center font-bold">Admin's Signature</div>
        </div>
      </div>
    </>
  );
}
