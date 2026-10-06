'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Dropdown from '@/components/ui/dropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserPlus, 
  Calendar, 
  Building2, 
  FileText, 
  FilterX, 
  Users, 
  UserCheck, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import ButtonLoader from '@/components/ui/button-loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import { cn } from '@/lib/utils';

export default function SuperAdminLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form states for new leave
  const [userType, setUserType] = useState('student');
  const [formBranch, setFormBranch] = useState('');
  const [formStudent, setFormStudent] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchLeaves();
  }, []);

  useEffect(() => {
    filterLeavesData();
  }, [leaves, selectedBranch, statusFilter]);

  useEffect(() => {
    if (formBranch) {
      fetchUsersByType(formBranch, userType);
    } else {
      setStudents([]);
    }
  }, [formBranch, userType]);

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/branches');
      setBranches(response.data.branches || []);
    } catch (error) {
      toast.error('Failed to load branches');
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/leave-requests');
      if (response.success) {
        setLeaves(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByType = async (branchId, type) => {
    try {
      setLoadingStudents(true);
      if (type === 'student') {
        const response = await apiClient.get('/api/users/students', { branch_id: branchId });
        setStudents(response.data?.students || response.data || response || []);
      } else {
        const response = await apiClient.get('/api/users/staff', { branchId: branchId, allStaff: 'true' });
        setStudents(response.data?.staff || response.data || response || []);
      }
    } catch (error) {
      toast.error(`Failed to load ${type}s`);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filterLeavesData = () => {
    let updated = [...leaves];
    if (selectedBranch) {
      updated = updated.filter(leave => leave.branch_id === selectedBranch);
    }
    if (statusFilter !== 'ALL') {
      updated = updated.filter(leave => leave.status === statusFilter);
    }
    setFilteredLeaves(updated);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await apiClient.patch(`/api/leave-requests/${id}`, { status: newStatus });
      if (response.success) {
        toast.success(`Leave request ${newStatus.toLowerCase()} successfully`);
        fetchLeaves();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!formStudent || !formStartDate || !formEndDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        student_id: formStudent,
        branch_id: formBranch,
        start_date: formStartDate,
        end_date: formEndDate,
        reason: formReason,
      };

      const response = await apiClient.post('/api/leave-requests', payload);
      if (response.success) {
        toast.success('Leave request submitted');
        setIsModalOpen(false);
        // Clear form
        setFormStudent('');
        setFormStartDate('');
        setFormEndDate('');
        setFormReason('');
        fetchLeaves();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedBranch('');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = Boolean(selectedBranch || statusFilter !== 'ALL');

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader
        title="Leave Management"
        subtitle="Manage and process student and staff leave requests across all branches"
        onRefresh={fetchLeaves}
      >
        <Button 
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Manual Mark Leave</span>
        </Button>
      </DashboardHeader>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatsCard 
          title="Total Requests"
          value={leaves.length.toString()}
          icon={FileText}
          description="Consolidated across all branches"
          color="blue"
        />
        <StatsCard 
          title="Pending Review"
          value={pendingCount.toString()}
          icon={Clock}
          description="Awaiting admin approval"
          color="yellow"
        />
        <StatsCard 
          title="Approved Leaves"
          value={approvedCount.toString()}
          icon={CheckCircle}
          description="Authorized time off records"
          color="green"
        />
        <StatsCard 
          title="Rejected"
          value={rejectedCount.toString()}
          icon={XCircle}
          description="Denied leave applications"
          color="red"
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-3 sm:p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Branch Scope
              </label>
              <Dropdown
                name="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={[
                  { value: '', label: 'All Branches' },
                  ...branches.map(b => ({ value: b.id || b._id, label: b.name }))
                ]}
                placeholder="Choose Branch"
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-primary" /> Status Filter
              </label>
              <div className="flex gap-2 items-center">
                <Dropdown
                  name="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'PENDING', label: 'Pending Only' },
                    { value: 'APPROVED', label: 'Approved Only' },
                    { value: 'REJECTED', label: 'Rejected Only' },
                  ]}
                  className="w-full text-xs flex-1"
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

            <div className="hidden lg:col-span-2 lg:flex items-center justify-end text-xs text-muted-foreground font-medium pr-2">
              Showing {filteredLeaves.length} of {leaves.length} records
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileText className="w-3.5 h-3.5" />
              </div>
              Leave Requests Log
            </CardTitle>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
              {filteredLeaves.length} records
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <ButtonLoader />
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">No leave requests found</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Try adjusting your filters or register a manual leave</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Applicant Name</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Reg #</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Date Range</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Reason</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Status</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((leave) => (
                    <TableRow key={leave.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-3 py-2.5 font-medium text-xs text-foreground">
                        {leave.student ? `${leave.student.first_name} ${leave.student.last_name}` : 'Unknown Applicant'}
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <span className="font-mono text-xs font-semibold text-muted-foreground bg-secondary/80 border border-border/60 px-1.5 py-0.5 rounded">
                          {leave.student?.registration_no || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{leave.start_date} to {leave.end_date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-xs truncate" title={leave.reason}>
                        {leave.reason || 'No reason provided'}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", getStatusBadge(leave.status))}>
                          {leave.status?.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right whitespace-nowrap">
                        {leave.status === 'PENDING' ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 rounded-md text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40"
                              onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 rounded-md text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800/40"
                              onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Leave Request Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Manual Leave Registration"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-lg text-xs font-semibold" onClick={handleCreateLeave} disabled={submitting}>
              {submitting ? <ButtonLoader /> : 'Register Leave'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateLeave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Branch *</label>
            <Dropdown
              name="formBranch"
              value={formBranch}
              onChange={(e) => setFormBranch(e.target.value)}
              options={branches.map(b => ({ value: b.id || b._id, label: b.name }))}
              placeholder="Select Branch"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">User Type *</label>
            <Dropdown
              name="userType"
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setFormStudent('');
              }}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'staff', label: 'Staff (Teachers & Staff)' }
              ]}
              placeholder="Select User Type"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {userType === 'student' ? 'Student *' : 'Staff *'}
            </label>
            <Dropdown
              name="formStudent"
              value={formStudent}
              onChange={(e) => setFormStudent(e.target.value)}
              options={students.length === 0 && formBranch ? [{ value: '', label: `${branches.find(b => b.id === formBranch || b._id === formBranch)?.name || 'Branch'} ${userType === 'student' ? 'Students' : 'Staff'} Not Found` }] : students.map(s => ({ value: s.id, label: `${s.first_name || s.fullName} ${s.last_name || ''} (${userType === 'student' ? s.registration_no || 'No Reg' : s.role || 'Staff'})` }))}
              placeholder={
                loadingStudents 
                  ? 'Loading users...' 
                  : !formBranch 
                    ? `Select branch first` 
                    : students.length === 0 
                      ? `${branches.find(b => b.id === formBranch || b._id === formBranch)?.name || 'Branch'} ${userType === 'student' ? 'Students' : 'Staff'} Not Found` 
                      : userType === 'student' 
                        ? 'Select Student' 
                        : 'Select Staff'
              }
              disabled={!formBranch || loadingStudents}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Start Date *</label>
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">End Date *</label>
              <Input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Reason / Remarks</label>
            <Input
              placeholder="Write leave reason or remarks..."
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
