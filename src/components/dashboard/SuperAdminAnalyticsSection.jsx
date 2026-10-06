'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  Building2,
  CalendarCheck,
  Receipt,
  Target,
  LayoutGrid,
  RefreshCw,
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SuperAdminStudentTrends from '@/components/dashboard/SuperAdminStudentTrends';
import SuperAdminClassWiseStudents from '@/components/dashboard/SuperAdminClassWiseStudents';
import SuperAdminBranchWiseStudents from '@/components/dashboard/SuperAdminBranchWiseStudents';
import SuperAdminStudentAttendance from '@/components/dashboard/SuperAdminStudentAttendance';
import SuperAdminMonthlyFeeCollection from '@/components/dashboard/SuperAdminMonthlyFeeCollection';
import SuperAdminPassFailRatio from '@/components/dashboard/SuperAdminPassFailRatio';

const ANALYTICS_TABS = [
  { id: 'trends', label: 'Student Trends', icon: TrendingUp },
  { id: 'classes', label: 'Class Distribution', icon: Users },
  { id: 'branches', label: 'Branch Comparison', icon: Building2 },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'fees', label: 'Fee Collection', icon: Receipt },
  { id: 'results', label: 'Pass / Fail Ratio', icon: Target },
  { id: 'all', label: 'View All (Grid)', icon: LayoutGrid },
];

export default function SuperAdminAnalyticsSection({
  selectedBranch = 'all',
  branchPerformance = [],
  onRefreshCharts,
}) {
  const [activeTab, setActiveTab] = useState('trends');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    if (onRefreshCharts) onRefreshCharts();
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Analytics Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
              Analytics Overview
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Select a metric below to view its detailed chart
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs font-semibold rounded-lg border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tabs / Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-sidebar-scrollbar">
        {ANALYTICS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Chart Display */}
      <div key={refreshKey} className="animate-in fade-in duration-200">
        {activeTab === 'trends' && (
          <div className="w-full">
            <SuperAdminStudentTrends selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="w-full">
            <SuperAdminClassWiseStudents selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="w-full">
            <SuperAdminBranchWiseStudents selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="w-full">
            <SuperAdminStudentAttendance selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="w-full">
            <SuperAdminMonthlyFeeCollection selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          </div>
        )}

        {activeTab === 'results' && (
          <div className="w-full">
            <SuperAdminPassFailRatio selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-4">
            <div className="grid gap-3.5 sm:gap-4 grid-cols-1 lg:grid-cols-2">
              <SuperAdminStudentTrends selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
              <SuperAdminClassWiseStudents selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
            </div>
            <div className="grid gap-3.5 sm:gap-4 grid-cols-1 lg:grid-cols-2">
              <SuperAdminBranchWiseStudents selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
              <SuperAdminStudentAttendance selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
            </div>
            <div className="grid gap-3.5 sm:gap-4 grid-cols-1 lg:grid-cols-2">
              <SuperAdminMonthlyFeeCollection selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
              <SuperAdminPassFailRatio selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
