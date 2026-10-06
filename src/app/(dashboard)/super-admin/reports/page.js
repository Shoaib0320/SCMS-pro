'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import FullPageLoader from '@/components/ui/full-page-loader';
import Dropdown from '@/components/ui/dropdown';
import DatePicker from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { 
  FileDown, 
  Filter, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  PieChart as PieChartIcon, 
  Activity,
  Download,
  Search,
  RefreshCw,
  Building2,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export default function SuperAdminReportsPage() {
  const [reportType, setReportType] = useState('monthly'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches, setBranches] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settlementSearch, setSettlementSearch] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedBranch, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (res.success) {
        setBranches(res.data?.branches || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: reportType,
        branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
        ...(reportType === 'custom' && { startDate, endDate })
      };
      
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.REPORTS.FINANCIAL, params);
      
      if (res.success) {
        setReportData(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch global reports');
      }
    } catch (error) {
      console.error('Global report error:', error);
      toast.error('Connection error while fetching global reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSettlement = () => {
    if (!reportData || !reportData.recentSettlements?.length) {
      toast.error('No transactions to download');
      return;
    }

    const doc = new jsPDF();
    const branchName = selectedBranch === 'all' ? 'All Branches' : (branches.find(b => b.id === selectedBranch)?.name || 'Branch');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('SCMS Pro Coaching System', 105, 15, { align: 'center' });
    
    doc.setFontSize(13);
    doc.setTextColor(100, 116, 139);
    doc.text(`Global Financial Settlement - ${branchName}`, 105, 24, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    
    // Summary line
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 36, 190, 36);
    
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Report Period: ${reportType.toUpperCase()}`, 20, 44);
    doc.text(`Total Revenue: Rs. ${Number(reportData.summary?.totalRevenue || 0).toLocaleString()}`, 20, 51);
    doc.text(`Total Expenses: Rs. ${Number(reportData.summary?.totalExpenses || 0).toLocaleString()}`, 115, 51);
    doc.text(`Net Profit: Rs. ${Number(reportData.summary?.netProfit || 0).toLocaleString()}`, 20, 58);
    
    // Table
    const tableData = reportData.recentSettlements.map(item => [
      item.date,
      item.description,
      item.type.charAt(0).toUpperCase() + item.type.slice(1),
      item.branchName || 'N/A',
      `${item.type === 'revenue' ? '+' : '-'} Rs. ${item.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Description', 'Type', 'Branch', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`Global_Settlement_${branchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Global report downloaded');
  };

  const filteredSettlements = (reportData?.recentSettlements || []).filter(item => {
    if (!settlementSearch) return true;
    const q = settlementSearch.toLowerCase();
    return (
      item.description?.toLowerCase().includes(q) ||
      item.branchName?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      item.date?.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader
        title="Global Finance Reports"
        subtitle="Consolidated financial analytics, settlements, and cross-branch audits"
        onRefresh={fetchReport}
      >
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 rounded-lg border-border hover:bg-secondary text-xs font-semibold gap-1.5"
          onClick={handleDownloadSettlement}
          disabled={!reportData || !reportData.recentSettlements?.length}
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Export PDF</span>
        </Button>
      </DashboardHeader>

      {/* Global Filter Toolbar */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-3 sm:p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center">
            {/* Branch selector */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Branch Scope
              </label>
              <Dropdown
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={[
                  { value: 'all', label: 'All Branches' },
                  ...branches.map(b => ({ value: b.id, label: b.name }))
                ]}
                placeholder="Choose Branch"
                className="w-full"
              />
            </div>

            {/* Period selector */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Period
              </label>
              <div className="flex bg-secondary/60 p-1 rounded-xl border border-border/60 h-[40px] items-center">
                {['daily', 'weekly', 'monthly', 'custom'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReportType(t)}
                    className={cn(
                      "flex-1 h-7 text-xs font-semibold rounded-lg transition-all capitalize",
                      reportType === t 
                        ? "bg-card text-foreground shadow-xs border border-border/80" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Pickers */}
            {reportType === 'custom' ? (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Start Date
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="From Date"
                    disableFuture={false}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                    End Date
                  </label>
                  <DatePicker
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="To Date"
                    disableFuture={false}
                  />
                </div>
              </>
            ) : (
              <div className="hidden lg:col-span-2 lg:flex items-center justify-end text-xs text-muted-foreground font-medium pr-2">
                Showing consolidated metrics for {reportType} view
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && !reportData ? (
        <div className="py-12 flex justify-center">
          <FullPageLoader message="Loading financial reports..." />
        </div>
      ) : reportData ? (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            <StatsCard 
              title="Global Revenue" 
              value={`PKR ${Number(reportData.summary?.totalRevenue || 0).toLocaleString()}`}
              change={reportData.summary?.revenueGrowth !== undefined ? Number(reportData.summary.revenueGrowth) : undefined}
              icon={DollarSign}
              description="Consolidated across all branches"
              color="green"
            />
            <StatsCard 
              title="Global Expenses" 
              value={`PKR ${Number(reportData.summary?.totalExpenses || 0).toLocaleString()}`}
              change={reportData.summary?.expenseChange !== undefined ? Number(reportData.summary.expenseChange) : undefined}
              icon={TrendingDown}
              description="Operational spending across units"
              color="red"
            />
            <StatsCard 
              title="Net Profit" 
              value={`PKR ${Number(reportData.summary?.netProfit || 0).toLocaleString()}`}
              icon={TrendingUp}
              description="Revenue surplus after expenses"
              color="blue"
            />
            <StatsCard 
              title="Fee Arrears" 
              value={`PKR ${Number(reportData.summary?.pendingFees || 0).toLocaleString()}`}
              icon={Activity}
              description="Uncollected pending vouchers"
              color="yellow"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
            {/* Revenue Trends */}
            <Card className="lg:col-span-2 border border-border bg-card shadow-xs flex flex-col justify-between">
              <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    Financial Performance Trends
                  </CardTitle>
                  <span className="text-[11px] font-semibold text-muted-foreground">Revenue vs Expenses</span>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-4 flex-1">
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                      />
                      <Tooltip 
                        formatter={(val) => `PKR ${Number(val).toLocaleString()}`}
                        contentStyle={{ 
                          backgroundColor: 'var(--card, #fff)', 
                          borderColor: 'var(--border, #e2e8f0)', 
                          borderRadius: '0.5rem', 
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                      <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} name="Expense" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expenses By Category Donut */}
            <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
              <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <PieChartIcon className="w-3.5 h-3.5" />
                    </div>
                    Global Expenses
                  </CardTitle>
                  <span className="text-[11px] font-semibold text-muted-foreground">Category Share</span>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-4 flex-1 flex items-center justify-center">
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.expensesByCategory || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {(reportData.expensesByCategory || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val) => `PKR ${Number(val).toLocaleString()}`}
                        contentStyle={{ 
                          backgroundColor: 'var(--card, #fff)', 
                          borderColor: 'var(--border, #e2e8f0)', 
                          borderRadius: '0.5rem', 
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branch-wise Performance Bar Chart */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  Branch-wise Financial Comparison
                </CardTitle>
                <span className="text-[11px] font-semibold text-muted-foreground">Revenue vs Operational Expense</span>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4">
              <div className="h-[270px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.branchWiseData || []} margin={{ top: 10, right: 10, left: 0, bottom: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    />
                    <Tooltip 
                      formatter={(val) => `PKR ${Number(val).toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: 'var(--card, #fff)', 
                        borderColor: 'var(--border, #e2e8f0)', 
                        borderRadius: '0.5rem', 
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue (PKR)" />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense (PKR)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Global Financial Settlement Table */}
          <Card className="border border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  Global Financial Settlement
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Consolidated transactions audit log across branches
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-64">
                  <Input 
                    placeholder="Search transactions..." 
                    value={settlementSearch}
                    onChange={(e) => setSettlementSearch(e.target.value)}
                    icon={Search}
                    className="h-8 text-xs"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5 rounded-lg border-border hover:bg-secondary text-xs flex-shrink-0" 
                  onClick={handleDownloadSettlement}
                  title="Download Global Report"
                >
                  <FileDown className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Date</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Description</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Type</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Branch</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettlements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
                          <p className="font-medium">No transactions found for this period</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSettlements.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {item.date}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">
                            {item.description}
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize",
                              item.type === 'revenue' 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40" 
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                            )}>
                              {item.type}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span>{item.branchName || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn(
                            "px-3 py-2.5 text-xs font-bold text-right",
                            item.type === 'revenue' 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-rose-600 dark:text-rose-400"
                          )}>
                            {item.type === 'revenue' ? '+' : '-'} PKR {Number(item.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
