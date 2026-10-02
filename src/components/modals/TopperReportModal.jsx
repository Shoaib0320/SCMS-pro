"use client";

import React, { useState, useEffect, useMemo } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Dropdown from "@/components/ui/dropdown";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { generateTopperReportPDF } from "@/lib/generateTopperReportPDF";
import {
  Award,
  FileDown,
  Loader2,
  Calendar,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Layers,
  FileText,
  Users,
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_OPTIONS = [
  { value: "", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/**
 * Checks if an exam falls within the target month.
 * If targetMonth is empty, matches all months.
 */
function isExamInMonth(exam, targetMonth) {
  if (!targetMonth) return true; // All Months

  const targetNum = Number(targetMonth);
  const monthName = MONTH_NAMES[targetNum - 1]?.toLowerCase() || "";

  // 1. Check if any subject in this exam has a date in targetMonth
  if (Array.isArray(exam.subjects)) {
    const hasSubjectInMonth = exam.subjects.some((s) => {
      if (!s.date) return false;
      try {
        const d = new Date(s.date);
        if (!isNaN(d.getTime())) {
          return d.getMonth() + 1 === targetNum;
        }
        const parts = String(s.date).split("-");
        if (parts.length >= 2 && Number(parts[1]) === targetNum) return true;
      } catch {
        return false;
      }
      return false;
    });
    if (hasSubjectInMonth) return true;
  }

  // 2. Check title (e.g. "Monthly Test of September")
  if (monthName && exam.title?.toLowerCase().includes(monthName)) return true;

  // 3. Fallback to created_at if no subjects had explicit dates
  const hasAnySubjectDates = (exam.subjects || []).some((s) => Boolean(s.date));
  if (!hasAnySubjectDates && (exam.created_at || exam.createdAt)) {
    try {
      const d = new Date(exam.created_at || exam.createdAt);
      if (!isNaN(d.getTime())) {
        return d.getMonth() + 1 === targetNum;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export default function TopperReportModal({
  isOpen,
  onClose,
  classes = [],
  subjects = [],
  exams = [],
  user = null,
}) {
  const [activeTab, setActiveTab] = useState("complete"); // "complete" | "top10"
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [branchExams, setBranchExams] = useState(exams || []);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [searched, setSearched] = useState(false);

  // Sync / fetch complete branch examinations
  useEffect(() => {
    if (!isOpen) return;

    if (exams && exams.length > 0) {
      setBranchExams(exams);
    }

    let isMounted = true;
    const fetchFreshExams = async () => {
      try {
        const res = await apiClient.get("/api/exams");
        if (isMounted && res.success && Array.isArray(res.data)) {
          setBranchExams(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch fresh exams in TopperReportModal:", err);
      }
    };

    fetchFreshExams();
    return () => {
      isMounted = false;
    };
  }, [isOpen, exams]);

  // Step 1: Filter exams matching the selected month (or all exams if All Months)
  const monthFilteredExams = useMemo(() => {
    if (!selectedMonth) return branchExams;
    return branchExams.filter((exam) => isExamInMonth(exam, selectedMonth));
  }, [branchExams, selectedMonth]);

  // Step 2: Dynamic Class Options (Only classes that actually have exams in selected month)
  const dynamicClassOptions = useMemo(() => {
    const classIdSet = new Set();
    const classNamesFromExams = new Map();

    monthFilteredExams.forEach((exam) => {
      const cid = String(exam.class_id || exam.class?.id || "");
      if (cid) {
        classIdSet.add(cid);
        if (exam.class?.name && !classNamesFromExams.has(cid)) {
          classNamesFromExams.set(cid, exam.class.name);
        }
      }
    });

    if (classIdSet.size === 0) return [];

    const matched = [];
    const addedIds = new Set();

    classes.forEach((c) => {
      const cid = String(c.id || c._id);
      if (classIdSet.has(cid) && !addedIds.has(cid)) {
        matched.push({ value: cid, label: c.name });
        addedIds.add(cid);
      }
    });

    // Include any class from exams not found in classes prop
    classIdSet.forEach((cid) => {
      if (!addedIds.has(cid)) {
        matched.push({
          value: cid,
          label: classNamesFromExams.get(cid) || "Class",
        });
        addedIds.add(cid);
      }
    });

    matched.sort((a, b) => a.label.localeCompare(b.label));
    return matched;
  }, [monthFilteredExams, classes]);

  // Step 3: Dynamic Section Options (Only sections that exist for selected class & month)
  const dynamicSectionOptions = useMemo(() => {
    const defaultOption = { value: "", label: "All Sections / Combined" };
    if (!selectedClass) return [defaultOption];

    const classExams = monthFilteredExams.filter(
      (e) => String(e.class_id || e.class?.id) === String(selectedClass)
    );

    const sectionMap = new Map();
    classExams.forEach((exam) => {
      const secId = String(exam.section_id || exam.section?.id || "");
      if (!secId) return;

      if (!sectionMap.has(secId)) {
        const rawName = exam.section?.name || "Section";
        const formatted = rawName.toLowerCase().startsWith("sec")
          ? rawName
          : `Sec ${rawName}`;
        sectionMap.set(secId, formatted);
      }
    });

    const opts = Array.from(sectionMap.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));

    opts.sort((a, b) => a.label.localeCompare(b.label));
    return [defaultOption, ...opts];
  }, [selectedClass, monthFilteredExams]);

  // Step 4: Dynamic Subject Options (Only subjects that exist in exams for selected class, section & month)
  const dynamicSubjectOptions = useMemo(() => {
    const defaultOption = { value: "", label: "All Subjects" };

    if (!selectedClass) {
      return [defaultOption];
    }

    let classExams = monthFilteredExams.filter(
      (e) => String(e.class_id || e.class?.id) === String(selectedClass)
    );

    if (selectedSection) {
      classExams = classExams.filter(
        (e) => String(e.section_id || e.section?.id) === String(selectedSection)
      );
    }

    const subjectMap = new Map();

    classExams.forEach((exam) => {
      (exam.subjects || []).forEach((s) => {
        const sid = String(s.subject_id || s.id || s.subject?.id || "");
        if (!sid) return;

        if (!subjectMap.has(sid)) {
          const foundInMaster = subjects.find(
            (sub) => String(sub.id || sub._id) === sid
          );
          const name =
            s.subject_name ||
            s.name ||
            s.subject?.name ||
            foundInMaster?.name ||
            "Subject";
          subjectMap.set(sid, name);
        }
      });
    });

    const opts = Array.from(subjectMap.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));

    opts.sort((a, b) => a.label.localeCompare(b.label));
    return [defaultOption, ...opts];
  }, [selectedClass, selectedSection, monthFilteredExams, subjects]);

  // Cascading reset handlers
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedClass("");
    setSelectedSection("");
    setSelectedSubject("");
    setResultData(null);
    setSearched(false);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedSection("");
    setSelectedSubject("");
    setResultData(null);
    setSearched(false);
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
    setSelectedSubject("");
    setResultData(null);
    setSearched(false);
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setResultData(null);
    setSearched(false);
  };

  // Safety: reset selected class if it becomes invalid under new month
  useEffect(() => {
    if (selectedClass && dynamicClassOptions.length > 0) {
      const exists = dynamicClassOptions.some((c) => c.value === selectedClass);
      if (!exists) {
        setSelectedClass("");
        setSelectedSection("");
        setSelectedSubject("");
      }
    }
  }, [dynamicClassOptions, selectedClass]);

  // Safety: reset selected section if it becomes invalid under new class
  useEffect(() => {
    if (selectedSection && dynamicSectionOptions.length > 0) {
      const exists = dynamicSectionOptions.some((s) => s.value === selectedSection);
      if (!exists) {
        setSelectedSection("");
        setSelectedSubject("");
      }
    }
  }, [dynamicSectionOptions, selectedSection]);

  const handleGenerate = async () => {
    if (!selectedClass) {
      toast.error("Please select a class.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = {
        class_id: selectedClass,
      };
      if (selectedMonth) {
        params.month = selectedMonth;
      }
      if (selectedSection) {
        params.section_id = selectedSection;
      }
      if (selectedSubject) {
        params.subject_id = selectedSubject;
      }
      if (user?.branch_id) {
        params.branch_id = user.branch_id;
      }

      const res = await apiClient.get("/api/exams/toppers", params);

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch report data");
      }

      const { toppers, students, meta } = res.data;
      setResultData(res.data);

      const currentList = activeTab === "top10" ? toppers : students;

      if (!currentList || currentList.length === 0) {
        toast.info("No exam results found for the selected criteria.");
        return;
      }

      // Generate & download PDF for active tab
      await generateTopperReportPDF({
        reportType: activeTab,
        toppers,
        students,
        meta,
      });

      const reportLabel =
        activeTab === "top10" ? "Top 10 Positions Report" : "Complete Merit List";
      toast.success(`${reportLabel} PDF generated and downloaded successfully!`);
    } catch (error) {
      console.error("Report Generation Error:", error);
      toast.error(error.message || "Failed to generate Report PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOnly = async () => {
    const currentList =
      activeTab === "top10" ? resultData?.toppers : resultData?.students;
    if (!currentList || currentList.length === 0) return;

    try {
      setLoading(true);
      await generateTopperReportPDF({
        reportType: activeTab,
        toppers: resultData.toppers,
        students: resultData.students,
        meta: resultData.meta,
      });
      toast.success("Report PDF downloaded!");
    } catch (e) {
      toast.error("Failed to download PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMonth("");
    setSelectedClass("");
    setSelectedSection("");
    setSelectedSubject("");
    setResultData(null);
    setSearched(false);
    onClose();
  };

  // Preview dataset based on active tab
  const activeItems =
    activeTab === "top10" ? resultData?.toppers || [] : resultData?.students || [];

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Award className="w-5 h-5 text-primary" />
          <span>Exam Management — Complete Result / Merit List</span>
        </div>
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl px-5"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {activeItems.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadOnly}
                disabled={loading}
                className="rounded-xl border-primary text-primary hover:bg-indigo-50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download Again
              </Button>
            )}

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !selectedClass}
              className="bg-primary hover:bg-primary-700 text-white rounded-xl px-6 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  {activeTab === "complete"
                    ? "Generate Merit List PDF"
                    : "Generate Top 10 PDF"}
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 min-h-[420px] pb-6">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("complete")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "complete"
                ? "border-primary text-primary bg-indigo-50/40 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            Complete Result / Merit List
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("top10")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "top10"
                ? "border-primary text-primary bg-indigo-50/40 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Top 10 Positions
          </button>
        </div>

        {/* Tab Context Description */}
        <div className="text-xs text-gray-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          {activeTab === "complete" ? (
            <p>
              <strong className="text-gray-800">Complete Result / Merit List:</strong>{" "}
              Ranks all enrolled candidates. Passing students receive ranks, while
              failing students are flagged with status{" "}
              <span className="text-red-600 font-bold">FAIL</span> and do not
              receive numeric ranks.
            </p>
          ) : (
            <p>
              <strong className="text-gray-800">Top 10 Positions:</strong> Ranks
              the top 10 positions (1st through 10th). Tied percentages share
              the same position. Evaluates passing students across all selected
              sections and subjects.
            </p>
          )}
        </div>

        {/* Dynamic Cascading Filter Controls Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/90 p-4 rounded-xl border border-gray-200 relative overflow-visible">
          {/* Step 1: Month Selection (Stacking z-40) */}
          <div className="relative z-40">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Exam Month <span className="text-red-500">*</span>
            </Label>
            <Dropdown
              value={selectedMonth}
              onChange={handleMonthChange}
              options={MONTH_OPTIONS}
              placeholder="All Months"
              buttonClassName="h-10 text-sm bg-white"
            />
          </div>

          {/* Step 2: Class Selection (Stacking z-30) */}
          <div className="relative z-30">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
              Class / Group <span className="text-red-500">*</span>
            </Label>
            <Dropdown
              value={selectedClass}
              onChange={handleClassChange}
              options={dynamicClassOptions}
              placeholder={
                dynamicClassOptions.length > 0
                  ? "Select Class"
                  : selectedMonth
                  ? "No classes this month"
                  : "No classes found"
              }
              disabled={dynamicClassOptions.length === 0}
              buttonClassName="h-10 text-sm bg-white"
            />
          </div>

          {/* Step 3: Section Selection (Stacking z-20) */}
          <div className="relative z-20">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              Section <span className="text-xs font-normal text-gray-400">(Dynamic)</span>
            </Label>
            <Dropdown
              value={selectedSection}
              onChange={handleSectionChange}
              options={dynamicSectionOptions}
              placeholder="All Sections / Combined"
              disabled={!selectedClass}
              buttonClassName="h-10 text-sm bg-white"
            />
          </div>

          {/* Step 4: Subject Selection (Stacking z-10) */}
          <div className="relative z-10">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
              Subject <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </Label>
            <Dropdown
              value={selectedSubject}
              onChange={handleSubjectChange}
              options={dynamicSubjectOptions}
              placeholder="All Subjects"
              disabled={!selectedClass}
              buttonClassName="h-10 text-sm bg-white"
            />
          </div>
        </div>

        {/* Results Preview Area */}
        {searched && (
          <div className="space-y-3 pt-1">
            {activeItems.length > 0 ? (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-200 gap-2">
                  <div className="flex items-center gap-2">
                    {activeTab === "top10" ? (
                      <Trophy className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-sm font-semibold text-gray-800">
                      {activeTab === "top10"
                        ? `Top Positions Preview (${activeItems.length} Students)`
                        : `Complete Merit List (${activeItems.length} Students)`}
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      ({resultData.meta?.className} • {resultData.meta?.sectionName} • {resultData.meta?.subjectName})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {resultData.meta && (
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                          Total: {resultData.meta.totalStudents}
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                          Passed: {resultData.meta.passCount}
                        </span>
                        <span className="bg-rose-50 text-rose-700 font-medium px-2 py-0.5 rounded-full border border-rose-200">
                          Failed: {resultData.meta.failCount}
                        </span>
                      </div>
                    )}
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PDF Ready
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-xs max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-gray-700 font-semibold sticky top-0 border-b border-gray-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap w-14">Rank</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap w-20">GR No</th>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Student Name</th>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">Section</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[80px]">Obtained</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[70px]">Total</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[95px]">Percentage</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[75px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeItems.map((t, idx) => {
                        const isFail = t.status === "FAIL";
                        const isGold = !isFail && t.rankNumber === 1;
                        const isSilver = !isFail && t.rankNumber === 2;
                        const isBronze = !isFail && t.rankNumber === 3;

                        const formatVal = (v) => {
                          const n = Number(v) || 0;
                          return n % 1 === 0 ? n.toString() : n.toFixed(1);
                        };

                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isGold
                                ? "bg-amber-50/70 font-medium"
                                : isSilver
                                ? "bg-slate-50/70 font-medium"
                                : isBronze
                                ? "bg-orange-50/50 font-medium"
                                : isFail
                                ? "bg-rose-50/30"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {isFail ? (
                                <span className="text-gray-400 font-medium">—</span>
                              ) : (
                                <span
                                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold ${
                                    isGold
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : isSilver
                                      ? "bg-slate-200 text-slate-800"
                                      : isBronze
                                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {t.rank}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600 font-mono whitespace-nowrap">
                              {t.grNo}
                            </td>
                            <td className="py-2 px-3 font-semibold text-gray-900 whitespace-nowrap">
                              {t.name}
                            </td>
                            <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                              {t.section || t.classSection}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-800 font-medium whitespace-nowrap">
                              {formatVal(t.marksObtained)}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-500 whitespace-nowrap">
                              {formatVal(t.totalMarks)}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-indigo-600 whitespace-nowrap">
                              {Number(t.percentage).toFixed(2)}%
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {isFail ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  FAIL
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  PASS
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-sm font-medium text-gray-800">
                  No Exam Results Found
                </p>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  There are no graded exam marks matching the selected criteria.
                  Please verify that exams exist and marks have been entered.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
