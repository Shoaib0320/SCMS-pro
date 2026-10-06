//src/app/(dashboard)/super-admin/expenses/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Building2, 
  DollarSign, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PieChart as PieChartIcon, 
  BarChart3, 
  RefreshCw, 
  SlidersHorizontal, 
  FileText,
  FilterX
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS, buildUrl } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const EXPENSE_CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export default function SuperAdminExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    receipt_url: '',
    status: 'pending',
    branch_id: '',
    rejection_reason: '',
    payment_reference: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchBranches();
  }, [search, categoryFilter, statusFilter, branchFilter, pagination.page]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(branchFilter && { branch_id: branchFilter }),
      };
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.LIST, params);
      if (response.success) {
        setExpenses(response.data.expenses || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        }));
      } else {
        toast.error(response.error || 'Failed to load expenses');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (res.success) setBranches(res.data.branches || []);
    } catch (error) {
      console.error('Failed to fetch branches', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category || !formData.date || !formData.branch_id) {
      toast.warning('Please fill all required fields (including branch)');
      return;
    }
    if (parseFloat(formData.amount) < 0) {
      toast.warning('Amount must be positive');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        vendor_name: formData.vendor_name || undefined,
        receipt_url: formData.receipt_url || undefined,
        status: formData.status,
        branch_id: formData.branch_id,
        rejection_reason: formData.rejection_reason,
        payment_reference: formData.payment_reference,
      };

      if (isEditMode) {
        const url = buildUrl(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.UPDATE, { id: currentExpense.id });
        const response = await apiClient.put(url, payload);
        if (response.success) {
          toast.success('Expense updated');
          setIsModalOpen(false);
          fetchExpenses();
        } else {
          toast.error(response.error || 'Update failed');
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.CREATE, payload);
        if (response.success) {
          toast.success('Expense created');
          setIsModalOpen(false);
          fetchExpenses();
        } else {
          toast.error(response.error || 'Creation failed');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    setFormData({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || 'other',
      date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
      vendor_name: expense.vendor_name || '',
      receipt_url: expense.receipt_url || '',
      status: expense.status || 'pending',
      branch_id: expense.branch_id || '',
      rejection_reason: expense.rejection_reason || '',
      payment_reference: expense.payment_reference || '',
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense permanently?')) return;
    try {
      const url = buildUrl(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.DELETE, { id });
      const response = await apiClient.delete(url);
      if (response.success) {
        toast.success('Expense deleted');
        fetchExpenses();
      } else {
        toast.error(response.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Error deleting expense');
    }
  };

  const handleAddNew = () => {
    setCurrentExpense(null);
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      vendor_name: '',
      receipt_url: '',
      status: 'pending',
      branch_id: '',
      rejection_reason: '',
      payment_reference: '',
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setBranchFilter('');
  };

  const hasActiveFilters = Boolean(search || categoryFilter || statusFilter || branchFilter);

  // Charts & calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.amount), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0);
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
  });
  const chartData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40';
      case 'approved':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  if (loading && expenses.length === 0) return <FullPageLoader message="Loading expenses..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader
        title="Expenses Tracking"
        subtitle="Monitor, verify and track operational expenses across all branches"
        onRefresh={fetchExpenses}
      >
        <Button 
          onClick={handleAddNew}
          size="sm"
          className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </Button>
      </DashboardHeader>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatsCard 
          title="Total Expenses"
          value={`PKR ${totalExpenses.toLocaleString()}`}
          icon={Receipt}
          description="Across all loaded records"
          color="blue"
        />
        <StatsCard 
          title="Paid Out"
          value={`PKR ${paidExpenses.toLocaleString()}`}
          icon={CheckCircle2}
          description={`${expenses.filter(e => e.status === 'paid').length} expenses fully settled`}
          color="green"
        />
        <StatsCard 
          title="Pending Approval"
          value={`PKR ${pendingExpenses.toLocaleString()}`}
          icon={Clock}
          description={`${expenses.filter(e => e.status === 'pending').length} items awaiting action`}
          color="yellow"
        />
        <StatsCard 
          title="Total Count"
          value={pagination.total.toString()}
          icon={Building2}
          description={`Tracked in ${branches.length} branches`}
          color="indigo"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <PieChartIcon className="w-3.5 h-3.5" />
                </div>
                Expenses by Category
              </CardTitle>
              <span className="text-[11px] font-semibold text-muted-foreground">Distribution</span>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 flex-1 flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No expense data available for chart
              </div>
            ) : (
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      innerRadius={48}
                      paddingAngle={3}
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />
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
                    <Legend 
                      verticalAlign="bottom" 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                Category Breakdown
              </CardTitle>
              <span className="text-[11px] font-semibold text-muted-foreground">Volume in PKR</span>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 flex-1 flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No expense data available for chart
              </div>
            ) : (
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
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
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Amount (PKR)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-3 sm:p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <Input 
              placeholder="Search title, vendor..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              icon={Search} 
              className="w-full"
            />
            <Dropdown 
              placeholder="All Categories" 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)} 
              options={[{ value: '', label: 'All Categories' }, ...EXPENSE_CATEGORIES]} 
            />
            <Dropdown 
              placeholder="All Statuses" 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]} 
            />
            <div className="flex gap-2">
              <Dropdown 
                placeholder="All Branches" 
                value={branchFilter} 
                onChange={e => setBranchFilter(e.target.value)} 
                options={[{ value: '', label: 'All Branches' }, ...branches.map(b => ({ value: b.id, label: b.name }))]} 
                className="flex-1"
              />
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 px-2.5 rounded-lg border-border hover:bg-secondary text-xs flex-shrink-0"
                  title="Clear Filters"
                >
                  <FilterX className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table Card */}
      <Card className="border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              Expense Records
            </CardTitle>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
              {pagination.total} total
            </span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Exp #</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Title</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Branch</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Category</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Amount</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Date</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Status</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
                      <p className="text-xs font-medium">No expenses found</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Try adjusting your filters or add a new expense</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map(exp => (
                    <TableRow key={exp.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-3 py-2.5">
                        <span className="font-mono text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                          {exp.expense_number}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 font-medium text-xs text-foreground max-w-[200px] truncate" title={exp.title}>
                        <div>{exp.title}</div>
                        {exp.vendor_name && (
                          <div className="text-[10px] text-muted-foreground truncate">{exp.vendor_name}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="truncate">{exp.branch?.name || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-secondary text-secondary-foreground border border-border">
                          {exp.category}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs font-bold text-foreground text-right">
                        PKR {Number(exp.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", getStatusBadge(exp.status))}>
                          {exp.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(exp)}
                            title="Edit Expense"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                            onClick={() => handleDelete(exp.id)}
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-border/50">
              <div className="text-xs text-muted-foreground font-medium">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} expenses
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 rounded-lg text-xs font-semibold border-border hover:bg-secondary"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} 
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <div className="text-xs font-semibold px-2">
                  {pagination.page} / {pagination.totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 rounded-lg text-xs font-semibold border-border hover:bg-secondary"
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} 
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? 'Edit Expense' : 'Add Expense'} 
        size="lg" 
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-lg text-xs font-semibold" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <ButtonLoader /> : (isEditMode ? 'Update Expense' : 'Create Expense')}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Title *</label>
            <input 
              name="title" 
              value={formData.title} 
              onChange={handleInputChange} 
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="e.g. Electricity Bill July"
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Brief details or remarks..."
              rows={2} 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Amount (PKR) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="amount" 
                value={formData.amount} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="0.00"
                required 
                min="0" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category *</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Date *</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Vendor Name</label>
              <input 
                type="text" 
                name="vendor_name" 
                value={formData.vendor_name} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="Vendor or payee"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Receipt URL (optional)</label>
            <input 
              type="url" 
              name="receipt_url" 
              value={formData.receipt_url} 
              onChange={handleInputChange} 
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Branch *</label>
              <select 
                name="branch_id" 
                value={formData.branch_id} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                required
              >
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {formData.status === 'rejected' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Rejection Reason</label>
              <textarea 
                name="rejection_reason" 
                value={formData.rejection_reason} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                rows={2} 
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Payment Reference</label>
            <input 
              type="text" 
              name="payment_reference" 
              value={formData.payment_reference} 
              onChange={handleInputChange} 
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Cheque / Transfer # (if paid)"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}