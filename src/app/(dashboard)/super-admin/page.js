'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import FullPageLoader from '@/components/ui/full-page-loader';
import Skeleton, { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import SuperAdminAnalyticsSection from '@/components/dashboard/SuperAdminAnalyticsSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardFilterPopover from '@/components/dashboard/DashboardFilterPopover';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import apiClient from '@/lib/api-client';
import {
  Users,
  Building2,
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  Bell,
  GraduationCap,
  UserCheck,
  CreditCard,
  Receipt,
  Target,
  Zap,
  UserPlus,
  CalendarDays,
  FileCheck,
  Wallet,
  Settings,
  Shield,
  Database
} from 'lucide-react';

function SuperAdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    headerStats: {},
    performanceMetrics: {},
    revenueAnalytics: {},
    studentAnalytics: {
      userRoleDistribution: []
    },
    recentActivities: [],
    systemAlerts: [],
    branchPerformance: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const { execute } = useApi();

  // Chart data states
  const [chartsLoading, setChartsLoading] = useState(false);
  const [studentTrendsData, setStudentTrendsData] = useState([]);
  const [classWiseStudentsData, setClassWiseStudentsData] = useState([]);
  const [studentAttendanceData, setStudentAttendanceData] = useState([]);
  const [monthlyFeeCollectionData, setMonthlyFeeCollectionData] = useState([]);
  const [passFailRatioData, setPassFailRatioData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange, selectedBranch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const url = `/api/super-admin/dashboard/stats?timeRange=${selectedTimeRange}&branch=${selectedBranch}`;
      const response = await apiClient.get(url);
      
      if (response?.success && response.data) {
        setDashboardData(prev => ({
          ...prev,
          ...response.data,
          headerStats: { ...prev.headerStats, ...response.data.headerStats },
          performanceMetrics: { ...prev.performanceMetrics, ...response.data.performanceMetrics },
          branchPerformance: response.data.branchPerformance || [],
          studentAnalytics: { ...prev.studentAnalytics, ...response.data.studentAnalytics },
          summary: { ...prev.summary, ...response.data.summary }
        }));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // toast.error('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    // Keeping chart data as mock for now, but adding logic if needed
    console.log('API fetchChartData bypassed');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-PK').format(num);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading && !dashboardData.headerStats.totalBranches) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 mb-2.5 pb-1.5 border-b border-border/50">
           <div className="space-y-1">
              <Skeleton className="h-7 w-56 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-md" />
           </div>
           <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
           <Skeleton className="h-20 rounded-xl" />
           <Skeleton className="h-20 rounded-xl" />
           <Skeleton className="h-20 rounded-xl" />
           <Skeleton className="h-20 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
           <Skeleton className="h-64 rounded-xl" />
           <Skeleton className="h-64 rounded-xl" />
        </div>

        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // Use real API data or fallback to default values
  const headerStats = dashboardData?.headerStats || {};
  const performanceMetrics = dashboardData?.performanceMetrics || {};
  const revenueAnalytics = dashboardData?.revenueAnalytics || {};
  const studentAnalytics = dashboardData?.studentAnalytics || {};
  const recentActivities = dashboardData?.recentActivities || [];
  const systemAlerts = dashboardData?.systemAlerts || [];
  const branchPerformance = dashboardData?.branchPerformance || [];
  const summary = dashboardData?.summary || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader 
        title="Super Admin Dashboard"
        subtitle="Overview of branches, personnel, academics, and finances"
        onRefresh={loadDashboardData}
      >
        <DashboardFilterPopover
          selectedTimeRange={selectedTimeRange}
          onTimeRangeChange={setSelectedTimeRange}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          branches={branchPerformance}
        />
      </DashboardHeader>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatsCard 
          title="Total Branches"
          value={formatNumber(headerStats.totalBranches || 0)}
          icon={Building2}
          change={headerStats.branchGrowth}
          description={`${headerStats.activeBranches || 0} Active • ${headerStats.inactiveBranches || 0} Inactive`}
          color="blue"
        />
        <StatsCard 
          title="Total Students"
          value={formatNumber(headerStats.totalStudents || 0)}
          icon={GraduationCap}
          change={headerStats.studentGrowth}
          description={`Across ${headerStats.activeBranches || 0} active branches`}
          color="green"
        />
        <StatsCard 
          title="Total Teachers"
          value={formatNumber(headerStats.totalTeachers || 0)}
          icon={UserCheck}
          description="Active faculty members"
          color="purple"
        />
        <StatsCard 
          title="Total Admins"
          value={formatNumber(headerStats.totalAdmins || 0)}
          icon={Users}
          description="Branch administrators"
          color="indigo"
        />
        <StatsCard 
          title="Total Classes"
          value={formatNumber(headerStats.totalClasses || 0)}
          icon={BookOpen}
          description={`${headerStats.activeClasses || 0} Active sections`}
          color="emerald"
        />
        <StatsCard 
          title="Total Revenue"
          value={formatCurrency(headerStats.totalRevenue || 0)}
          icon={DollarSign}
          change={headerStats.revenueChange}
          description={`${headerStats.feeCollectionRate || 0}% collection rate`}
          color="yellow"
        />
        <StatsCard 
          title="Total Attendance"
          value={formatNumber(headerStats.totalAttendance || 0)}
          icon={CheckCircle}
          description="Records processed"
          color="orange"
        />
        <StatsCard 
          title="System Uptime"
          value={`${headerStats.systemUptime || 0}%`}
          icon={Activity}
          description={`${headerStats.activeSessions || 0} active sessions`}
          color="red"
        />
      </div>

      {/* Performance Metrics & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        {/* Performance Metrics */}
        <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                Performance & Health Metrics
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                System Optimal
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            {/* 1. Average Attendance */}
            <div className="p-2.5 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground">Average Attendance</span>
                    <p className="text-[10px] text-muted-foreground">Across all enrolled students</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">{performanceMetrics.avgAttendance || 0}%</div>
                  <div className={cn("text-[10px] font-semibold flex items-center justify-end gap-0.5", getChangeColor(performanceMetrics.attendanceChange))}>
                    {getChangeIcon(performanceMetrics.attendanceChange)}
                    <span>{Math.abs(performanceMetrics.attendanceChange || 0)}%</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, performanceMetrics.avgAttendance || 0))}%` }} 
                />
              </div>
            </div>

            {/* 2. Pass Percentage */}
            <div className="p-2.5 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground">Pass Percentage</span>
                    <p className="text-[10px] text-muted-foreground">Examination benchmark</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">{performanceMetrics.passPercentage || 0}%</div>
                  <div className={cn("text-[10px] font-semibold flex items-center justify-end gap-0.5", getChangeColor(performanceMetrics.passChange))}>
                    {getChangeIcon(performanceMetrics.passChange)}
                    <span>{Math.abs(performanceMetrics.passChange || 0)}%</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, performanceMetrics.passPercentage || 0))}%` }} 
                />
              </div>
            </div>

            {/* 3. Bottom Row: 2 Mini KPI Tiles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl border border-border/70 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Zap className="w-3 h-3" />
                  </div>
                  <span className={cn("text-[10px] font-semibold flex items-center gap-0.5", getChangeColor(performanceMetrics.responseChange))}>
                    {getChangeIcon(performanceMetrics.responseChange)}
                    <span>{Math.abs(performanceMetrics.responseChange || 0)}%</span>
                  </span>
                </div>
                <div className="mt-1">
                  <div className="text-sm font-bold text-foreground">{performanceMetrics.apiResponseTime || 0}ms</div>
                  <span className="text-[10px] text-muted-foreground truncate block">API Latency</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-border/70 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div className="w-5 h-5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Database className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {performanceMetrics.presentCount || 0}P / {performanceMetrics.absentCount || 0}A
                  </span>
                </div>
                <div className="mt-1">
                  <div className="text-sm font-bold text-foreground">{formatNumber(performanceMetrics.totalAttendanceRecords || 0)}</div>
                  <span className="text-[10px] text-muted-foreground truncate block">Attendance Logs</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <PieChart className="w-3.5 h-3.5" />
                </div>
                System & Operations Overview
              </CardTitle>
              <span className="text-[10px] text-muted-foreground font-medium">
                Live Overview
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            {/* Top Stat Pills Grid (Users, Staff, Exams, Events) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <div className="p-2 rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/60 dark:bg-blue-950/20 text-center">
                <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 leading-tight">{formatNumber(summary.totalUsers || 0)}</div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5 truncate">Users</div>
              </div>
              <div className="p-2 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/60 dark:bg-emerald-950/20 text-center">
                <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{formatNumber(summary.totalStaff || 0)}</div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5 truncate">Staff</div>
              </div>
              <div className="p-2 rounded-xl border border-purple-200/50 dark:border-purple-800/30 bg-purple-50/60 dark:bg-purple-950/20 text-center">
                <div className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400 leading-tight">{formatNumber(summary.totalEvents || 0)}</div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5 truncate">Events</div>
              </div>
              <div className="p-2 rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/60 dark:bg-amber-950/20 text-center">
                <div className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 leading-tight">{formatNumber(summary.totalExams || 0)}</div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5 truncate">Exams</div>
              </div>
            </div>

            {/* Bottom 4 Operational Rows */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <span className="text-xs font-medium text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Calendar className="w-3 h-3" />
                  </div>
                  Upcoming Events
                </span>
                <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded-md bg-secondary border border-border/60">
                  {headerStats.upcomingEvents || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <span className="text-xs font-medium text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-3 h-3" />
                  </div>
                  Scheduled Exams
                </span>
                <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded-md bg-secondary border border-border/60">
                  {headerStats.scheduledExams || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <span className="text-xs font-medium text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Wallet className="w-3 h-3" />
                  </div>
                  Pending Expenses
                </span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50">
                  {formatCurrency(headerStats.pendingExpenses || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <span className="text-xs font-medium text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Bell className="w-3 h-3" />
                  </div>
                  Unread Notifications
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
                  {headerStats.unreadNotifications || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Branch Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Teachers</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Attendance Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPerformance.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.code}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}>
                        {branch.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(branch.students)}</TableCell>
                    <TableCell className="text-right">{formatNumber(branch.teachers)}</TableCell>
                    <TableCell className="text-right">{formatNumber(branch.classes)}</TableCell>
                    <TableCell className="text-right">{branch.attendanceRate}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(branch.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(branch.expenses)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Role Distribution & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentAnalytics.userRoleDistribution?.map((role, index) => (
                <div key={role.role} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      index === 0 ? 'bg-blue-100 text-blue-600' :
                      index === 1 ? 'bg-green-100 text-green-600' :
                      index === 2 ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {index === 0 ? <GraduationCap className="w-4 h-4" /> :
                       index === 1 ? <UserCheck className="w-4 h-4" /> :
                       index === 2 ? <UserPlus className="w-4 h-4" /> :
                       <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{role.role}</div>
                      <div className="text-xs text-gray-500">{role.percentage}% of total users</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatNumber(role.count)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(headerStats.collectedAmount || 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Collected</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(performanceMetrics.outstandingAmount || 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Outstanding</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-lg font-bold">{formatCurrency(headerStats.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Paid Expenses</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(headerStats.paidExpenses || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pending Expenses</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(headerStats.pendingExpenses || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <QuickActions 
        title="Quick Actions"
        actions={[
          { title: "Attendance", subtitle: "Mark & Track", icon: CheckCircle, category: "Academic", onClick: () => router.push('/super-admin/attendance') },
          { title: "Students", subtitle: "Profiles & List", icon: Users, category: "Personnel", onClick: () => router.push('/super-admin/student-management/students') },
          { title: "Branches", subtitle: "Campuses & Units", icon: Building2, category: "Management", onClick: () => router.push('/super-admin/branch-management/branches') },
          { title: "Fee Vouchers", subtitle: "Challan & Ledger", icon: Receipt, category: "Finance", onClick: () => router.push('/super-admin/fee-vouchers') },
          { title: "Expenses", subtitle: "Bills & Accounts", icon: Wallet, category: "Finance", onClick: () => router.push('/super-admin/expenses') },
          { title: "Reports", subtitle: "Financial & Stats", icon: FileText, category: "Finance", onClick: () => router.push('/super-admin/reports') },
          { title: "Notifications", subtitle: "Alerts & Notices", icon: Bell, category: "System", onClick: () => router.push('/super-admin/notifications') },
        ]}
      />

      {/* Analytics Charts Section (Interactive Tab Selector) */}
      <SuperAdminAnalyticsSection
        selectedBranch={selectedBranch}
        branchPerformance={branchPerformance}
        onRefreshCharts={fetchChartData}
      />
    </div>
  );
}

const SuperAdminDashboardWithAuth = withAuth(SuperAdminDashboard, { requiredRole: ROLES.SUPER_ADMIN });
export default SuperAdminDashboardWithAuth;


