"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FullPageLoader from "@/components/ui/full-page-loader";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import {
  Search, Building2, BookOpen, Users, BarChart2,
  ChevronDown, ChevronRight, TrendingUp, TrendingDown,
  Award, AlertCircle, CheckCircle2, XCircle, Clock,
  RefreshCw, Eye, RotateCcw, X
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import ExamDetailsModal from "@/components/modals/ExamDetailsModal";
import { ExamSkeleton } from "@/components/ui/skeleton";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fd = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch { return "—"; }
};

const statusColor = (s) => {
  switch (s?.toLowerCase()) {
    case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "ongoing":
    case "active":    return "bg-blue-100   text-blue-700   border-blue-200";
    case "scheduled": return "bg-amber-100  text-amber-700  border-amber-200";
    default:          return "bg-slate-100  text-slate-600  border-slate-200";
  }
};

const getGrade = (pct) => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuperAdminExamsPage() {
  const router = useRouter();
  const [exams, setExams]         = useState([]);
  const [marks, setMarks]         = useState({}); // examId → marks[]
  const [students, setStudents]   = useState({}); // examId → students[]
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [viewExam, setViewExam]   = useState(null);
  const [loadingDetails, setLoadingDetails] = useState({}); // examId → bool

  useEffect(() => { fetchExams(); }, []);

  // ── Fetch all exams ─────────────────────────────────────────────────────────
  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/exams");
      if (res.success) setExams(res.data || []);
    } catch {
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  // ── Lazy-load marks + students for a single exam when expanded ──────────────
  const loadExamDetails = async (exam) => {
    const eid = exam.id;
    if (marks[eid] !== undefined) return; // already loaded

    setLoadingDetails(p => ({ ...p, [eid]: true }));
    try {
      const [mRes, sRes] = await Promise.all([
        apiClient.get(`/api/exams/${eid}/marks`),
        apiClient.get(`/api/exams/${eid}/students`),
      ]);
      setMarks(p    => ({ ...p, [eid]: mRes.success    ? (mRes.data    || []) : [] }));
      setStudents(p => ({ ...p, [eid]: sRes.success ? (sRes.data || []) : [] }));
    } catch {
      setMarks(p    => ({ ...p, [eid]: [] }));
      setStudents(p => ({ ...p, [eid]: [] }));
    } finally {
      setLoadingDetails(p => ({ ...p, [eid]: false }));
    }
  };

  // ── Compute per-exam performance summary ────────────────────────────────────
  const getExamPerf = (exam) => {
    const eid       = exam.id;
    const mList     = marks[eid];
    const sList     = students[eid];
    if (!mList || !sList) return null;

    const subjects  = exam.subjects || [];
    const mmap      = {};
    mList.forEach(m => {
      if (!mmap[m.student_id]) mmap[m.student_id] = {};
      mmap[m.student_id][m.subject_id] = m;
    });

    let passed = 0, failed = 0, absent = 0, totalPct = 0, graded = 0;

    sList.forEach(student => {
      const sid        = student.id;
      const enrolled   = (student.enrolled_subjects || []).map(String);
      const mySubs     = enrolled.length > 0
        ? subjects.filter(s => enrolled.includes(String(s.subject_id)))
        : subjects;

      let sTotalMax = 0, sTotalObt = 0, sAllPass = true, sHasMark = false, sAbsent = false;

      mySubs.forEach(s => {
        const subId  = String(s.subject_id || "");
        const entry  = mmap[String(sid)]?.[subId];
        const max    = Number(s.total_marks)   || 0;
        const pass   = Number(s.passing_marks) || 0;
        sTotalMax += max;
        if (entry) {
          sHasMark = true;
          if (entry.is_absent) { sAbsent = true; sAllPass = false; }
          else {
            const obt = Number(entry.marks_obtained) || 0;
            sTotalObt += obt;
            if (obt < pass) sAllPass = false;
          }
        } else { sAllPass = false; }
      });

      if (sAbsent)         absent++;
      else if (!sHasMark)  { /* pending */ }
      else if (sAllPass)   { passed++; graded++; totalPct += sTotalMax > 0 ? Math.round((sTotalObt / sTotalMax) * 100) : 0; }
      else                 { failed++; graded++; totalPct += sTotalMax > 0 ? Math.round((sTotalObt / sTotalMax) * 100) : 0; }
    });

    const avgPct = graded > 0 ? Math.round(totalPct / graded) : 0;
    return {
      total:   sList.length,
      passed, failed, absent,
      graded:  graded + absent,
      avgPct,
      grade:   graded > 0 ? getGrade(avgPct) : "—",
      pending: sList.length - graded - absent,
    };
  };

  // ── Group exams by branch ────────────────────────────────────────────────────
  const byBranch = useMemo(() => {
    const filtered = exams.filter(e =>
      (branchFilter === "all" || (e.branch?.id || e.branch_id) === branchFilter) &&
      (search === "" || e.title.toLowerCase().includes(search.toLowerCase()))
    );

    const map = {};
    filtered.forEach(e => {
      const bid   = e.branch?.id   || e.branch_id   || "unknown";
      const bname = e.branch?.name || "Unknown Branch";
      if (!map[bid]) map[bid] = { id: bid, name: bname, exams: [] };
      map[bid].exams.push(e);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [exams, branchFilter, search]);

  // ── All unique branches for filter dropdown ──────────────────────────────────
  const branches = useMemo(() => {
    const seen = new Map();
    exams.forEach(e => {
      const bid   = e.branch?.id   || e.branch_id;
      const bname = e.branch?.name;
      if (bid && bname && !seen.has(bid)) seen.set(bid, bname);
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [exams]);

  // ── Top-level stats ──────────────────────────────────────────────────────────
  const topStats = useMemo(() => ({
    branches:  branches.length,
    total:     exams.length,
    completed: exams.filter(e => e.status === "completed").length,
    scheduled: exams.filter(e => e.status === "scheduled").length,
    ongoing:   exams.filter(e => e.status === "ongoing" || e.status === "active").length,
  }), [exams, branches]);

  if (loading) return <ExamSkeleton />;

  return (
    <div className="space-y-4">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <DashboardHeader
        title="Examination Management"
        subtitle="Branch-wise examination monitoring and student performance analytics"
        onRefresh={fetchExams}
      />

      {/* ── Summary KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        <StatsCard 
          title="Total Exams"
          value={topStats.total}
          icon={BookOpen}
          description="System examinations"
          color="blue"
        />
        <StatsCard 
          title="Campuses"
          value={topStats.branches}
          icon={Building2}
          description="Participating branches"
          color="purple"
        />
        <StatsCard 
          title="Scheduled"
          value={topStats.scheduled}
          icon={Clock}
          description="Upcoming exams"
          color="orange"
        />
        <StatsCard 
          title="Ongoing"
          value={topStats.ongoing}
          icon={TrendingUp}
          description="In-progress exams"
          color="green"
        />
        <StatsCard 
          title="Completed"
          value={topStats.completed}
          icon={CheckCircle2}
          description="Concluded exams"
          color="emerald"
        />
      </div>

      {/* ── Compact Filter Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Search exams…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div className="w-full sm:w-48">
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Reset Filters */}
          {(search || branchFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setBranchFilter('all');
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Results counter */}
        <div className="text-right flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            {byBranch.reduce((acc, b) => acc + b.exams.length, 0)} exams listed
          </span>
        </div>
      </div>

      {/* ── Branch-wise Accordion ────────────────────────────────── */}
      {byBranch.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2 bg-card rounded-xl border border-border shadow-xs">
          <BookOpen className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">No exams found matching your filter criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {byBranch.map(branch => {
            const isOpen = expandedBranch === branch.id;
            const branchExamCount = branch.exams.length;
            const branchCompleted = branch.exams.filter(e => e.status === "completed").length;

            return (
              <Card key={branch.id} className="overflow-hidden border border-border bg-card shadow-xs">
                {/* Branch Header — click to expand */}
                <button
                  onClick={() => {
                    const next = isOpen ? null : branch.id;
                    setExpandedBranch(next);
                    if (next) branch.exams.forEach(e => loadExamDetails(e));
                  }}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm leading-tight">{branch.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {branchExamCount} exam{branchExamCount !== 1 ? "s" : ""}
                          {branchCompleted > 0 && <span className="ml-2 text-emerald-600 font-semibold">· {branchCompleted} completed</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {/* Mini status pills */}
                      <div className="hidden sm:flex gap-1.5">
                        {["scheduled","ongoing","completed"].map(st => {
                          const cnt = branch.exams.filter(e => e.status === st || (st === "ongoing" && e.status === "active")).length;
                          if (!cnt) return null;
                          return (
                            <span key={st} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(st)}`}>
                              {st}: {cnt}
                            </span>
                          );
                        })}
                      </div>
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </button>

                {/* Exams Table (expanded) */}
                {isOpen && (
                  <div className="border-t border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border">
                            <th className="text-left px-3.5 py-2.5 font-bold text-muted-foreground uppercase tracking-wide">Exam</th>
                            <th className="text-left px-3.5 py-2.5 font-bold text-muted-foreground uppercase tracking-wide">Class / Section</th>
                            <th className="text-center px-3.5 py-2.5 font-bold text-muted-foreground uppercase tracking-wide">Subjects</th>
                            <th className="text-center px-3.5 py-2.5 font-bold text-muted-foreground uppercase tracking-wide">Students</th>
                            <th className="text-center px-3.5 py-2.5 font-bold text-muted-foreground uppercase tracking-wide">Performance</th>
                            <th className="text-center px-3.5 py-2.5 font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                            <th className="text-right px-3.5 py-2.5 font-bold text-muted-foreground uppercase tracking-wide">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {branch.exams.map(exam => {
                            const eid  = exam.id;
                            const perf = getExamPerf(exam);
                            const isLoadingThis = loadingDetails[eid];
                            const subjectCount = (exam.subjects || []).length;
                            const studentList = students[eid];

                            return (
                              <tr key={eid} className="hover:bg-slate-50/60 transition-colors">
                                {/* Exam name */}
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-900 leading-tight">{exam.title}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                                    {exam.exam_type || "Exam"}
                                  </p>
                                </td>

                                {/* Class / Section */}
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-700">
                                    {exam.class?.name || "—"}
                                  </span>
                                  {exam.section?.name && (
                                    <span className="text-slate-400 text-xs ml-1">· {exam.section.name}</span>
                                  )}
                                </td>

                                {/* Subject count */}
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {subjectCount}
                                  </span>
                                </td>

                                {/* Student count */}
                                <td className="px-4 py-3 text-center">
                                  {isLoadingThis ? (
                                    <span className="text-slate-400 text-xs animate-pulse">Loading…</span>
                                  ) : studentList !== undefined ? (
                                    <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                      <Users className="w-3.5 h-3.5 text-slate-400" /> {studentList.length}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-xs">—</span>
                                  )}
                                </td>

                                {/* Performance */}
                                <td className="px-4 py-3">
                                  {isLoadingThis ? (
                                    <div className="h-4 w-20 bg-slate-100 rounded animate-pulse mx-auto" />
                                  ) : perf ? (
                                    <div className="flex flex-col items-center gap-1">
                                      {/* Pass / Fail / Absent counts */}
                                      <div className="flex gap-1.5 justify-center">
                                        {perf.passed > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                            ✓ {perf.passed}
                                          </span>
                                        )}
                                        {perf.failed > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                            ✗ {perf.failed}
                                          </span>
                                        )}
                                        {perf.absent > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                            A {perf.absent}
                                          </span>
                                        )}
                                        {perf.pending > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                            ? {perf.pending}
                                          </span>
                                        )}
                                      </div>
                                      {/* Avg % */}
                                      {perf.graded > 0 && (
                                        <span className={`text-xs font-black ${perf.avgPct >= 60 ? "text-emerald-600" : perf.avgPct >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                          Avg {perf.avgPct}% · {perf.grade}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs block text-center">—</span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 text-center">
                                  <Badge className={`text-[10px] font-bold uppercase border ${statusColor(exam.status)}`}>
                                    {exam.status || "Scheduled"}
                                  </Badge>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => setViewExam(exam)}
                                    className="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Exam Details Modal ──────────────────────────────────── */}
      {viewExam && (
        <ExamDetailsModal
          exam={viewExam}
          onClose={() => setViewExam(null)}
        />
      )}
    </div>
  );
}
