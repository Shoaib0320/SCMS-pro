import React, { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Dropdown from "@/components/ui/dropdown";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { Printer, Loader2, FileText, Download, AlertCircle } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import StudentReportPrintable from "../exams/StudentReportPrintable";
import SearchableStudentSelect from "@/components/ui/searchable-student-select";
import { useAuth } from "@/hooks/useAuth";

export default function StudentReportModal({
  isOpen,
  onClose,
  classes = [],
  sections = [],
  subjects = [],
  exams = [],
  academicYears = [],
}) {
  const { user } = useAuth();
  
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [allSections, setAllSections] = useState(sections || []);

  useEffect(() => {
    if (sections && sections.length > 0) {
      setAllSections(sections);
    } else if (isOpen) {
      apiClient.get("/api/sections").then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setAllSections(res.data);
        } else if (Array.isArray(res?.data)) {
          setAllSections(res.data);
        } else if (Array.isArray(res)) {
          setAllSections(res);
        }
      }).catch((err) => {
        console.warn("Could not fetch sections in StudentReportModal:", err);
      });
    }
  }, [sections, isOpen]);

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState("");

  const printRef = useRef(null);
  const previewRef = useRef(null);

  const dynamicBranchInfo = {
    name: user?.branch?.name || "Adamjee Coaching Center",
    address: user?.branch?.address
  };

  const handleGenerate = async () => {
    if (!selectedStudent || !selectedMonth) {
      toast.error("Please select a student and a month");
      return;
    }

    setLoading(true);
    setNoResultsMessage("");
    setReportData(null);

    try {
      const studentRes = await apiClient.get(`/api/users/students/${selectedStudent}`);
      const student = studentRes.data || studentRes;
      if (!student || (!student.id && !student._id)) throw new Error("Student not found");
      if (student.is_active === false) {
        toast.error("Cannot generate report card for an inactive student.");
        setLoading(false);
        return;
      }
      setStudentData(student);

      const targetDate = parseISO(`${selectedMonth}-01`);
      const targetStart = startOfMonth(targetDate);
      const targetEnd = endOfMonth(targetDate);

      // Previous month logic
      const prevDate = new Date(targetDate);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevStart = startOfMonth(prevDate);
      const prevEnd = endOfMonth(prevDate);

      // Find exams that occurred in target month and previous month
      const getExamsInInterval = (start, end) => {
        return exams.filter((ex) => {
          let dateStr = ex.date || ex.start_date;
          if (!dateStr && ex.subjects && ex.subjects.length > 0) {
             const dates = ex.subjects.map(s => s.date).filter(Boolean).sort();
             if (dates.length > 0) dateStr = dates[0];
          }
          if (!dateStr) return false;
          
          const exDate = new Date(dateStr);
          return isWithinInterval(exDate, { start, end });
        });
      };

      const currentExams = getExamsInInterval(targetStart, targetEnd);
      const prevExams = getExamsInInterval(prevStart, prevEnd);

      // Fetch marks for these exams
      const fetchMarksForExams = async (examList) => {
        const marksRes = await Promise.all(
          examList.map(async (ex) => {
            const exId = ex.id || ex._id;
            try {
              const res = await apiClient.get(`/api/exams/${exId}/marks`);
              if (res.success && res.data) {
                // Filter all marks for this student (they might have multiple subjects in one exam)
                const studentMarks = res.data.filter(d => (d.student_id === selectedStudent || d.student?.id === selectedStudent));
                if (studentMarks.length > 0) {
                  return studentMarks.map(m => ({
                    exam: ex,
                    mark: m
                  }));
                }
              }
            } catch (e) {}
            return [];
          })
        );
        return marksRes.flat();
      };

      const currentMarksData = await fetchMarksForExams(currentExams);
      const prevMarksData = await fetchMarksForExams(prevExams);

      // Empty Result Handling: If no exam results exist for that student in that month
      if (!currentMarksData || currentMarksData.length === 0) {
        setReportData(null);
        setNoResultsMessage("The selected month result is not available for the selected student.");
        return;
      }

      // Fetch Attendance Summary
      let attSummary = { totalDays: 30, presentDays: 0 };
      try {
        const fromDate = format(targetStart, 'yyyy-MM-dd');
        const toDate = format(targetEnd, 'yyyy-MM-dd');
        const attRes = await apiClient.get("/api/attendance", {
          student_id: selectedStudent,
          fromDate,
          toDate
        });
        if (attRes.success && attRes.data) {
          const records = attRes.data;
          const presentDays = records.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
          // You could use endOfMonth to get total days in month, or just use records length if they mark every day
          const totalDays = records.length > 0 ? records.length : parseInt(format(targetEnd, 'dd'), 10);
          attSummary = { totalDays, presentDays };
        }
      } catch (e) { console.error("Failed to fetch attendance", e); }

      // Resolve student's section information
      const academicInfo = student?.details?.academic_info || student?.academic_info || {};
      const studentSecId = academicInfo.section_id || student?.section_id;
      const matchedSection = (allSections || []).find(
        (s) => String(s.id || s._id) === String(studentSecId)
      );

      const defaultStudentSection =
        academicInfo.section_name ||
        student?.section_name ||
        student?.section?.name ||
        matchedSection?.name ||
        "";

      const studentSecClean = defaultStudentSection.replace(/^(section|sec\.?)\s*/i, "").trim();

      const calculateSummary = (marksArr) => {
        let obtained = 0;
        let total = 0;
        const examMarks = marksArr.map(item => {
          const subId = item.mark?.subject_id || item.exam?.subject_id;
          const subjectObj = subjects.find(s => (s.id || s._id) === subId);
          const subName = subjectObj?.name || item.exam?.subject?.name || item.exam?.title || "Unknown";

          let maxMRaw = item.exam?.total_marks;
          if (!maxMRaw && item.exam?.subjects) {
            const subj = item.exam.subjects.find(s => s.subject_id === subId || s.subject?.id === subId);
            if (subj && subj.total_marks) maxMRaw = subj.total_marks;
            else if (subj && subj.max_marks) maxMRaw = subj.max_marks;
          }
          let maxM = Number(maxMRaw);
          if (isNaN(maxM) || maxM <= 0) maxM = 100;

          const obtM = item.mark?.is_absent ? 0 : 
            (item.mark?.marks_obtained !== undefined && item.mark?.marks_obtained !== null && item.mark?.marks_obtained !== "" 
              ? Number(item.mark.marks_obtained) 
              : 0);

          obtained += obtM;
          total += maxM;

          const pct = total > 0 ? (obtM / maxM) * 100 : 0;

          let dateStr = item.exam?.date || item.exam?.start_date;
          if (!dateStr && item.exam?.subjects?.length > 0) {
            const subjectSpecific = item.exam.subjects.find(s => (s.subject_id === subId) || (s.subject?.id === subId));
            if (subjectSpecific && subjectSpecific.date) dateStr = subjectSpecific.date;
            else {
              const dates = item.exam.subjects.map(s => s.date).filter(Boolean);
              if (dates.length > 0) dateStr = dates[0];
            }
          }
          const validDateStr = dateStr || new Date().toISOString();

          // Resolve section according to the student's actual section
          const enrolledSubj = (academicInfo.subjects || []).find(
            (s) => String(s.id || s._id || s.subject_id) === String(subId)
          );
          const subjSecId = enrolledSubj?.section_id || studentSecId || item.exam?.section_id;
          const subjSecObj = (allSections || []).find(
            (s) => String(s.id || s._id) === String(subjSecId)
          );

          let resolvedSecName =
            subjSecObj?.name ||
            defaultStudentSection ||
            item.exam?.section?.name ||
            item.exam?.section_name ||
            "";

          const cleanSec = resolvedSecName.replace(/^(section|sec\.?)\s*/i, "").trim() || "A";

          return {
            subject: subName,
            sec: cleanSec,
            testNo: "0 / 1",
            testDate: format(new Date(validDateStr), "dd-MMM-yy"),
            type: item.exam?.type || "Monthly",
            obtained: obtM,
            total: maxM,
            percentage: pct,
            remarks: pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Average" : "Unsatisfactory"
          }
        });

        const percentage = total > 0 ? (obtained / total) * 100 : 0;
        let grade = "F";
        if (percentage >= 80) grade = "A+";
        else if (percentage >= 70) grade = "A";
        else if (percentage >= 60) grade = "B";
        else if (percentage >= 50) grade = "C";
        else if (percentage >= 40) grade = "D";

        return { obtained, total, percentage, grade, examMarks };
      };

      const currSummary = calculateSummary(currentMarksData);
      const prevSummary = calculateSummary(prevMarksData);

      const academicYearId = student?.details?.academic_info?.academic_year_id || student?.academic_year_id;
      const academicYearObj = academicYears?.find(y => (y.id || y._id) === academicYearId);
      const batchName = student?.details?.academic_info?.academic_year_name || academicYearObj?.name || "2025-2026";

      const classId = student?.details?.academic_info?.class_id || student?.class_id;
      const classObj = classes?.find(c => (c.id || c._id) === classId);
      const resolvedClassName = student?.details?.academic_info?.class_name || student?.class?.name || classObj?.name || "N/A";

      let classDisplay = resolvedClassName;
      if (studentSecClean && !resolvedClassName.toLowerCase().includes("sec")) {
        classDisplay = `${resolvedClassName} - Sec ${studentSecClean}`;
      }

      setReportData({
        batch: batchName,
        className: classDisplay,
        section: studentSecClean,
        examMarks: currSummary.examMarks,
        grandTotalObtained: currSummary.obtained,
        grandTotalMax: currSummary.total,
        overallPercentage: currSummary.percentage,
        grade: currSummary.grade,
        prevMonthSummary: {
          obtained: prevSummary.obtained,
          total: prevSummary.total,
          percentage: prevSummary.percentage,
          grade: prevSummary.grade
        },
        attendanceSummary: attSummary
      });

    } catch (error) {
      toast.error(error.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };


  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    
    try {
      // Dynamic import to avoid SSR issues
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const element = previewRef.current;
      
      // We don't need to mess with classes since previewRef is already visible and sized properly
      const imgData = await htmlToImage.toPng(element, {
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        style: {
          transform: 'none', // ensure no scaling issues from modal container
        }
      });
      
      // No need to restore classes

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Load image to get dimensions
      const img = new Image();
      img.src = imgData;
      await new Promise(resolve => img.onload = resolve);

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${studentData?.name || 'Student'}_Report_${selectedMonth}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to export PDF");
      if (printRef.current) {
        printRef.current.className = "print-area bg-white text-black p-8 hidden print:block";
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Student Report"
        className="w-full max-w-5xl"
      >
        <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start w-full">
            <div className="space-y-2 w-full">
              <Label>Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                placeholder="August 2026"
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setReportData(null); // Reset preview when month changes
                  setNoResultsMessage("");
                }}
                onClick={(e) => {
                  if (typeof e.target.showPicker === 'function') {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      // Fallback if browser restricts showPicker invocation
                    }
                  }
                }}
                className="cursor-pointer w-full"
              />
            </div>

            <div className="space-y-2 w-full">            
              <SearchableStudentSelect
                value={selectedStudent}
                branchId={user?.branch_id || user?.branchId}
                searchByPhone={false}
                placeholder="Search by Name or GR No..."
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  setReportData(null); // Reset preview when student changes
                  setNoResultsMessage("");
                }}
                label="Student"
                required
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full mt-4 h-12 text-lg"
            disabled={loading || !selectedStudent}
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
            {loading ? "Generating Preview..." : "Generate Preview"}
          </Button>

          {noResultsMessage && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{noResultsMessage}</span>
            </div>
          )}

          {reportData && reportData.examMarks && reportData.examMarks.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">Report Preview</h3>
                  <p className="text-sm text-gray-500">Review the details below before printing.</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleExportPDF} 
                    className="border-primary text-primary hover:bg-primary/10 hover:text-primary-700 shadow-sm"
                    disabled={exporting}
                  >
                    {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Export PDF
                  </Button>
                  <Button onClick={() => window.print()} className="bg-primary hover:bg-primary-700 shadow-md">
                    <Printer className="w-4 h-4 mr-2" /> Print Report
                  </Button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-2 sm:p-6 overflow-x-auto shadow-inner">
                <div className="min-w-[210mm]">
                  <StudentReportPrintable
                    ref={previewRef}
                    student={studentData}
                    reportData={reportData}
                    branchInfo={dynamicBranchInfo}
                    monthName={format(parseISO(`${selectedMonth}-01`), "MMM-yyyy")}
                    isPreview={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Hidden printable component used for the actual browser print */}
      {reportData && reportData.examMarks && reportData.examMarks.length > 0 && (
        <StudentReportPrintable
          ref={printRef}
          student={studentData}
          reportData={reportData}
          branchInfo={dynamicBranchInfo}
          monthName={format(parseISO(`${selectedMonth}-01`), "MMM-yyyy")}
          isPreview={false}
        />
      )}
    </>
  );
}
