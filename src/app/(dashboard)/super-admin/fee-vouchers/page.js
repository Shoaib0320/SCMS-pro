'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import BranchSelect from '@/components/ui/branch-select';
import { Plus, Search, DollarSign, Trash2, Edit, Eye, ChevronDown, Download, Clock, CheckCircle, XCircle, RefreshCw, AlertTriangle, FileText, User, GraduationCap, Calendar, CreditCard, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TabPanel } from '@/components/ui/tabs';
import Textarea from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Skeleton from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import { generateFeeVoucherPDF, generateFeeReceiptPDF } from '@/lib/pdf-generator';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import SearchableStudentSelect from '@/components/ui/searchable-student-select';
import { getActiveAcademicYear, cn } from '@/lib/utils';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = (() => {
  const current = new Date().getFullYear();
  const list = [];
  for (let y = current; y >= 2020; y--) {
    list.push({ value: String(y), label: String(y) });
  }
  return list;
})();

const ITEMS_PER_PAGE = 10;

const getStatusBadge = (status) => {
  const badges = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
    partial: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
    cancelled: 'bg-secondary text-secondary-foreground border-border',
  };
  return badges[status?.toLowerCase()] || badges.pending;
};

export default function SuperAdminFeeVouchersPage() {
  const { user, loading: authLoading } = useAuth();
  
  // All vouchers loaded once
  const [allVouchers, setAllVouchers] = useState([]);
  
  // Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // View/Edit states
  const [viewingVoucher, setViewingVoucher] = useState(null);
  const [selectedVoucherForPayment, setSelectedVoucherForPayment] = useState(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [grSearch, setGrSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [branchFilter, setBranchFilter] = useState('');
  
  // Pagination state - separate for each tab
  const [pagination, setPagination] = useState({
    all: { page: 1 },
    pending: { page: 1 },
    partial: { page: 1 },
    overdue: { page: 1 },
    paid: { page: 1 },
    cancelled: { page: 1 },
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');
  
  // Form data for generate modal
  const [formData, setFormData] = useState({
    generation_type: 'branch',
    branchId: '',
    academic_year_id: '',
    groupId: '',
    classId: '',
    sectionId: '',
    studentId: '',
    studentIds: [],
    dueDate: '',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    remarks: '',
  });

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount_due: 0,
    due_date: '',
    month: '',
    year: '',
    remarks: '',
    status: 'UNPAID'
  });
  
  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  
  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVoucherId, setDeletingVoucherId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Payment modal states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedGrSearch, setDebouncedGrSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGrSearch(grSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [grSearch]);

  const formatStudent = (student) => {
    const nameRaw = student?.fullName || `${student?.firstName || ''} ${student?.lastName || ''}`;
    const name = (nameRaw || 'Student').trim() || 'Student';
    const registrationNumber = student?.studentProfile?.registrationNumber || student?.registrationNumber || '---';
    const rollNumber = student?.studentProfile?.rollNumber || student?.rollNumber || '---';
    const section = student?.studentProfile?.section || '---';
    const phone = student?.phone || student?.studentProfile?.phone || '';
    const fatherName = student?.studentProfile?.father?.name || student?.details?.academic_info?.father?.name || '';
    const fatherPhone = student?.studentProfile?.father?.phone || student?.details?.academic_info?.father?.phone || '';
    return { name, registrationNumber, rollNumber, section, phone, fatherName, fatherPhone };
  };

  // Load all vouchers once on mount
  useEffect(() => {
    if (authLoading || (!user?.id && !user?._id)) return;
    fetchAllVouchers();
    fetchBranches();
    fetchAcademicYears();
  }, [authLoading, user?.id, user?._id]);

  // Load templates/classes/groups/academic-years when branch changes in form
  useEffect(() => {
    if (formData.branchId) {
      fetchTemplates();
      fetchClasses();
      fetchGroups();
      fetchAcademicYears();
    } else {
      setTemplates([]);
      setClasses([]);
      setGroups([]);
      setAcademicYears([]);
    }
  }, [formData.branchId]);

  useEffect(() => {
    if (formData.branchId || formData.generation_type === 'institute') {
      fetchStudents();
    }
  }, [formData.branchId, formData.generation_type]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentDropdownOpen && !e.target.closest('.student-dropdown-container')) {
        setStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [studentDropdownOpen]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      [activeTab]: { page: 1 }
    }));
  }, [search, grSearch, monthFilter, yearFilter, branchFilter, activeTab]);

  // Fetch all vouchers in one API call
  const fetchAllVouchers = async (searchParams = {}) => {
    try {
      setLoading(true);
      const params = { limit: 10000, ...searchParams };
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.LIST, params);
      
      if (response.success) {
        setAllVouchers(response.data.vouchers || []);
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when GR Search changes
  useEffect(() => {
    if (debouncedGrSearch) {
      fetchAllVouchers({ roll_no: debouncedGrSearch });
    } else {
      fetchAllVouchers();
    }
  }, [debouncedGrSearch]);

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 200 });
      if (res?.success) setBranches(res.data.branches || []);
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const fetchTemplates = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get('/api/fee-templates', { 
        branchId: formData.branchId, 
        limit: 200, 
        status: 'active' 
      });
      if (Array.isArray(res)) setTemplates(res);
      else if (res?.success) setTemplates(res.data.templates || res.data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const fetchGroups = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get('/api/groups', { branch_id: formData.branchId });
      if (Array.isArray(res)) setGroups(res);
      else if (res?.success) setGroups(res.data.groups || res.data || []);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await apiClient.get('/api/academic-years', { branch_id: formData.branchId });
      let years = [];
      if (Array.isArray(res)) years = res;
      else if (res?.academic_years) years = res.academic_years;
      else if (res?.success) years = res.data.academicYears || res.data || [];
      
      setAcademicYears(years);
      
      // Auto-select active academic year
      const activeYear = getActiveAcademicYear(years, res?.current_academic_year || res?.data?.currentAcademicYear);
      if (activeYear) {
        setFormData(prev => {
          if (!prev.academic_year_id) {
            return { ...prev, academic_year_id: activeYear.id };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error loading academic years:', err);
    }
  };

  const fetchClasses = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get('/api/classes', { 
        branch_id: formData.branchId, 
        limit: 200 
      });
      if (Array.isArray(res)) setClasses(res);
      else if (res?.success) setClasses(res.data.classes || res.data || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = { limit: 1000 };
      if (formData.branchId) params.branch_id = formData.branchId;
      if (formData.classId) params.class_id = formData.classId;
      
      const res = await apiClient.get('/api/users/students', params);
      if (Array.isArray(res)) setStudents(res);
      else if (res?.success) setStudents(res.data.students || res.data || []);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const fetchVoucherDetail = async (id) => {
    setViewLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.GET.replace(':id', id));
      if (res?.success) setViewingVoucher(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load voucher');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Client-side filtering and categorization
  const filteredAndCategorizedVouchers = useMemo(() => {
    let filtered = allVouchers;

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase().replace(/\s+/g, '');
      filtered = filtered.filter((voucher) => {
        const s = formatStudent(voucher.studentId);
        const voucherNumber = (voucher.voucherNumber?.toString() || '').toLowerCase().replace(/\s+/g, '');
        const studentName = s.name.toLowerCase().replace(/\s+/g, '');
        const registrationNumber = (s.registrationNumber?.toString() || '').toLowerCase().replace(/\s+/g, '');
        const rollNumber = (s.rollNumber?.toString() || '').toLowerCase().replace(/\s+/g, '');
        const phone = (s.phone?.toString() || '').toLowerCase().replace(/\s+/g, '');
        const fatherName = (s.fatherName?.toString() || '').toLowerCase().replace(/\s+/g, '');
        const fatherPhone = (s.fatherPhone?.toString() || '').toLowerCase().replace(/\s+/g, '');
        
        return voucherNumber.includes(searchLower) ||
               studentName.includes(searchLower) ||
               registrationNumber.includes(searchLower) ||
               rollNumber.includes(searchLower) ||
               phone.includes(searchLower) ||
               fatherName.includes(searchLower) ||
               fatherPhone.includes(searchLower);
      });
    }

    // Apply dedicated GR search filter
    if (grSearch.trim()) {
      const grLower = grSearch.toLowerCase().replace(/\s+/g, '');
      filtered = filtered.filter((voucher) => {
        const s = formatStudent(voucher.studentId);
        const rollNumber = (s.rollNumber?.toString() || '').toLowerCase().replace(/\s+/g, '');
        const regNumber = (s.registrationNumber?.toString() || '').toLowerCase().replace(/\s+/g, '');
        return rollNumber.includes(grLower) || regNumber.includes(grLower);
      });
    }

    // Apply month filter
    if (monthFilter) {
      filtered = filtered.filter(v => v.month?.toString() === monthFilter);
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(v => v.year?.toString() === yearFilter || v.dueDate?.substring(0, 4) === yearFilter);
    }

    // Apply branch filter
    if (branchFilter) {
      filtered = filtered.filter(v => v.branchId?._id === branchFilter || v.branchId === branchFilter);
    }

    // Categorize by status
    return {
      all: filtered,
      pending: filtered.filter(v => v.status === 'pending'),
      partial: filtered.filter(v => v.status === 'partial'),
      overdue: filtered.filter(v => v.status === 'overdue'),
      paid: filtered.filter(v => v.status === 'paid'),
      cancelled: filtered.filter(v => v.status === 'cancelled'),
    };
  }, [allVouchers, search, grSearch, monthFilter, yearFilter, branchFilter]);

  // Statistics
  const statistics = useMemo(() => ({
    all: {
      count: filteredAndCategorizedVouchers.all.length,
      totalAmount: filteredAndCategorizedVouchers.all.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
    pending: {
      count: filteredAndCategorizedVouchers.pending.length,
      totalAmount: filteredAndCategorizedVouchers.pending.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
    partial: {
      count: filteredAndCategorizedVouchers.partial.length,
      totalAmount: filteredAndCategorizedVouchers.partial.reduce((sum, v) => sum + (v.remainingAmount || v.totalAmount || 0), 0)
    },
    overdue: {
      count: filteredAndCategorizedVouchers.overdue.length,
      totalAmount: filteredAndCategorizedVouchers.overdue.reduce((sum, v) => sum + (v.remainingAmount || v.totalAmount || 0), 0)
    },
    paid: {
      count: filteredAndCategorizedVouchers.paid.length,
      totalAmount: filteredAndCategorizedVouchers.paid.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
    cancelled: {
      count: filteredAndCategorizedVouchers.cancelled.length,
      totalAmount: filteredAndCategorizedVouchers.cancelled.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
  }), [filteredAndCategorizedVouchers]);

  // Get paginated vouchers for current tab
  const getPaginatedVouchers = (tabKey) => {
    const vouchers = filteredAndCategorizedVouchers[tabKey] || [];
    const currentPage = pagination[tabKey]?.page || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    return {
      data: vouchers.slice(startIndex, endIndex),
      total: vouchers.length,
      totalPages: Math.ceil(vouchers.length / ITEMS_PER_PAGE),
      currentPage,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, vouchers.length),
    };
  };

  const handlePageChange = (tabKey, newPage) => {
    setPagination(prev => ({
      ...prev,
      [tabKey]: { page: newPage }
    }));
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Reset to page 1 when changing tabs
    setPagination(prev => ({
      ...prev,
      [newTab]: { page: prev[newTab]?.page || 1 }
    }));
  };

  const handleGenerateVouchers = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.dueDate) return toast.error('Please select a due date');
      if (formData.generation_type !== 'institute' && !formData.branchId) return toast.error('Please select a branch');

      const payload = {
        generation_type: formData.generation_type,
        branch_id: formData.branchId,
        academic_year_id: formData.academic_year_id,
        group_id: formData.groupId,
        class_id: formData.classId,
        section_id: formData.sectionId,
        student_id: formData.studentId,
        student_ids: formData.studentIds,
        due_date: formData.dueDate,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        remarks: formData.remarks,
      };

      const res = await apiClient.post('/api/fee-vouchers', payload);
      if (res?.success) {
        toast.success(res.message || 'Fee vouchers generated successfully!');
        setIsGenerateModalOpen(false);
        resetForm();
        fetchAllVouchers(); // Refresh data
      }
    } catch (err) {
      console.error('Error generating vouchers:', err);
      toast.error(err.message || 'Failed to generate vouchers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelVoucher = async (id) => {
    if (!confirm('Are you sure you want to cancel this voucher?')) return;
    
    try {
      const res = await apiClient.put(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.CANCEL.replace(':id', id));
      if (res?.success) {
        toast.success('Voucher cancelled successfully');
        fetchAllVouchers(); // Refresh data
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel voucher');
    }
  };

  const handleDeleteVoucher = (id) => {
    setDeletingVoucherId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVoucher = async () => {
    if (!deletingVoucherId) return;
    try {
      setDeleting(true);
      const res = await apiClient.delete(`/api/fee-vouchers/${deletingVoucherId}`);
      if (res?.success) {
        toast.success('Voucher deleted successfully');
        setIsDeleteModalOpen(false);
        setDeletingVoucherId(null);
        fetchAllVouchers(); 
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete voucher');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditVoucher = (voucher) => {
    setEditingVoucher(voucher);
    setEditFormData({
      amount_due: voucher.amountDue,
      due_date: voucher.dueDate ? voucher.dueDate.substring(0, 10) : '',
      month: voucher.month || '1',
      year: voucher.year || new Date().getFullYear().toString(),
      remarks: voucher.remarks || '',
      status: voucher.status === 'pending' ? 'UNPAID' : (voucher.status === 'paid' ? 'PAID' : 'PARTIAL')
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateVoucher = async (e) => {
    e.preventDefault();
    if (!editingVoucher) return;
    
    try {
      setSubmitting(true);
      const res = await apiClient.put(`/api/fee-vouchers/${editingVoucher.id}`, editFormData);
      if (res?.success) {
        toast.success('Voucher updated successfully');
        setIsEditModalOpen(false);
        setEditingVoucher(null);
        fetchAllVouchers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewVoucher = (id) => {
    setIsViewModalOpen(true);
    fetchVoucherDetail(id);
  };

  const handleDownloadVoucher = async (voucher) => {
    try {
      const pdfBuffer = await generateFeeVoucherPDF(voucher);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FeeVoucher_${voucher.voucherNumber || 'download'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadReceipt = async (voucher) => {
    try {
      if (!voucher.paymentHistory || voucher.paymentHistory.length === 0) {
        toast.error('No payment history available for receipt generation');
        return;
      }
      const pdfBuffer = await generateFeeReceiptPDF(voucher, voucher.paymentHistory);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_${voucher.voucherNumber || 'download'}_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully');
    } catch (err) {
      console.error('Receipt generation error:', err);
      toast.error('Failed to generate receipt');
    }
  };

  const handleOpenManualPayment = (voucher) => {
    setSelectedVoucherForPayment(voucher);
    setPaymentAmount(voucher.remainingAmount?.toString() || voucher.totalAmount?.toString() || '');
    setPaymentRemarks('');
    setIsManualPaymentModalOpen(true);
  };

  const handleManualPayment = async () => {
    if (!selectedVoucherForPayment || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }

    const outstanding = Number(selectedVoucherForPayment.remainingAmount || selectedVoucherForPayment.totalAmount || 0);
    if (parseFloat(paymentAmount) > outstanding) {
      toast.error(`Payment amount exceeds outstanding balance (PKR ${outstanding})`);
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await apiClient.post(
        `/api/fee-vouchers/${selectedVoucherForPayment.id || selectedVoucherForPayment._id}/manual-payment`,
        {
          amount: parseFloat(paymentAmount),
          remarks: paymentRemarks,
          method: 'Cash',
        }
      );

      if (res?.success) {
        toast.success('Payment recorded successfully');
        setIsManualPaymentModalOpen(false);
        setSelectedVoucherForPayment(null);
        setPaymentAmount('');
        setPaymentRemarks('');
        
        if (res.data) {
          setAllVouchers(prev => prev.map(v => (v.id === res.data.id || v._id === res.data._id) ? res.data : v));
        }
        fetchAllVouchers(); 
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const resetForm = () => {
    setFormData({
      branchId: '',
      templateId: '',
      classId: '',
      studentIds: [],
      selectAllStudents: false,
      dueDate: '',
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      remarks: '',
    });
    setTemplates([]);
    setClasses([]);
    setStudents([]);
  };

  // Common table component for consistent UI
  const VoucherTable = ({ vouchers, showExtraColumns = false, tabKey }) => {
    const paginatedData = getPaginatedVouchers(tabKey);
    const displayVouchers = tabKey === 'all' ? paginatedData.data : vouchers;
    
    if (displayVouchers.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">No vouchers found</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Try adjusting filters or generate new fee vouchers</p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Voucher Info</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Student</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Month / Year</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Due Date</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Total</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Paid</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Remaining</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-9 px-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-8 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-8 w-36 rounded" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-5 w-20 rounded" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-5 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-5 w-16 rounded ml-auto" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-5 w-16 rounded ml-auto" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-5 w-16 rounded ml-auto" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-5 w-16 rounded" /></TableCell>
                    <TableCell className="px-3 py-2.5"><Skeleton className="h-7 w-24 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : displayVouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-xs font-medium">
                    No vouchers found for this category.
                  </TableCell>
                </TableRow>
              ) : (
                displayVouchers.map((voucher) => {
                  const s = formatStudent(voucher.studentId);
                  const name = s.name;
                  const registrationNumber = s.registrationNumber;
                  const rollNumber = s.rollNumber;
                  
                  const dueDate = new Date(voucher.dueDate);
                  const today = new Date();
                  const diffTime = today - dueDate;
                  const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <TableRow key={voucher.id || voucher._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-3 py-2.5">
                        <div className="font-mono text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded w-fit">
                          {voucher.voucherNumber}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(voucher.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground truncate max-w-[160px]">{name}</span>
                          <div className="text-[10px] text-muted-foreground bg-secondary/80 border border-border/60 px-1.5 py-0.2 rounded w-fit mt-0.5">
                            GR: {rollNumber} • Reg: {registrationNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {MONTHS.find(m => m.value === voucher.month?.toString())?.label} {voucher.year}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        <div className={cn("text-xs font-medium", tabKey === 'overdue' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-foreground')}>
                          {new Date(voucher.dueDate).toLocaleDateString('en-PK')}
                        </div>
                        {tabKey === 'overdue' && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 px-1.5 py-0.2 rounded w-fit mt-0.5">
                            {daysOverdue}d overdue
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-bold text-xs text-foreground whitespace-nowrap">
                        PKR {(voucher.totalAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        PKR {(voucher.paidAmount ?? voucher.paid_amount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        PKR {(voucher.remainingAmount ?? (Number(voucher.totalAmount ?? voucher.amount_due ?? 0) + Number(voucher.fineAmount ?? voucher.fine_amount ?? 0) - Number(voucher.paidAmount ?? voucher.paid_amount ?? 0))).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", getStatusBadge(voucher.status))}>
                          {voucher.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="flex gap-1 justify-end items-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary" 
                            title="View Voucher" 
                            onClick={() => handleViewVoucher(voucher.id || voucher._id)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-md hover:bg-secondary text-muted-foreground hover:text-indigo-600" 
                            title="Download Voucher" 
                            onClick={() => handleDownloadVoucher(voucher)}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          {voucher.status !== 'paid' && voucher.status !== 'cancelled' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-md hover:bg-secondary text-muted-foreground hover:text-amber-600" 
                                title="Edit Voucher" 
                                onClick={() => handleEditVoucher(voucher)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                                title="Record Manual Payment" 
                                onClick={() => handleOpenManualPayment(voucher)}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500" 
                                title="Cancel Voucher" 
                                onClick={() => handleCancelVoucher(voucher.id || voucher._id)}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400" 
                                title="Delete Voucher" 
                                onClick={() => handleDeleteVoucher(voucher.id || voucher._id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <PaginationControls 
          tabKey={tabKey} 
          paginatedData={paginatedData} 
          onPageChange={handlePageChange} 
        />
      </>
    );
  };

  // Pagination component
  const PaginationControls = ({ tabKey, paginatedData, onPageChange }) => {
    const { total, totalPages, currentPage, startIndex, endIndex } = paginatedData;
    
    if (total <= ITEMS_PER_PAGE) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground font-medium">
          Showing {startIndex} to {endIndex} of {total} vouchers
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg text-xs font-semibold border-border hover:bg-secondary"
            disabled={currentPage === 1}
            onClick={() => onPageChange(tabKey, currentPage - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0 text-xs font-semibold rounded-lg"
                  onClick={() => onPageChange(tabKey, pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg text-xs font-semibold border-border hover:bg-secondary"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(tabKey, currentPage + 1)}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  if (authLoading || (loading && allVouchers.length === 0)) {
    return <FullPageLoader message="Loading fee vouchers..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader
        title="Fee Vouchers"
        subtitle="Manage, generate and track student fee vouchers across all branches"
        onRefresh={fetchAllVouchers}
      >
        <Button 
          onClick={() => { resetForm(); setIsGenerateModalOpen(true); }}
          size="sm"
          className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Vouchers</span>
        </Button>
      </DashboardHeader>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {[
          { key: 'all', title: 'All Vouchers', count: statistics.all.count, amount: statistics.all.totalAmount, icon: FileText, iconBg: 'bg-primary/10 text-primary border-primary/20' },
          { key: 'pending', title: 'Pending', count: statistics.pending.count, amount: statistics.pending.totalAmount, icon: Clock, iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' },
          { key: 'partial', title: 'Partial', count: statistics.partial.count, amount: statistics.partial.totalAmount, icon: CreditCard, iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40' },
          { key: 'overdue', title: 'Overdue', count: statistics.overdue.count, amount: statistics.overdue.totalAmount, icon: AlertTriangle, iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40' },
          { key: 'paid', title: 'Paid', count: statistics.paid.count, amount: statistics.paid.totalAmount, icon: CheckCircle, iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
          { key: 'cancelled', title: 'Cancelled', count: statistics.cancelled.count, amount: statistics.cancelled.totalAmount, icon: XCircle, iconBg: 'bg-secondary text-secondary-foreground border-border' },
        ].map(stat => (
          <Card 
            key={stat.key}
            className={cn(
              "cursor-pointer transition-all duration-200 border bg-card hover:shadow-md rounded-xl p-3 sm:p-3.5 relative overflow-hidden",
              activeTab === stat.key 
                ? "border-primary ring-1 ring-primary/30 shadow-xs bg-primary/[0.02]" 
                : "border-border hover:border-border/80"
            )} 
            onClick={() => handleTabChange(stat.key)}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground truncate uppercase tracking-wider">{stat.title}</span>
              <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0", stat.iconBg)}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {stat.count}
            </div>
            <div className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
              PKR {Number(stat.amount || 0).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-3.5">
        <div className="bg-card rounded-xl p-1 border border-border shadow-xs flex flex-wrap items-center gap-1">
          {[
            { key: 'all', label: 'All Vouchers', count: statistics.all.count },
            { key: 'pending', label: 'Pending', count: statistics.pending.count },
            { key: 'partial', label: 'Partial', count: statistics.partial.count },
            { key: 'overdue', label: 'Overdue', count: statistics.overdue.count },
            { key: 'paid', label: 'Paid', count: statistics.paid.count },
            { key: 'cancelled', label: 'Cancelled', count: statistics.cancelled.count },
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => handleTabChange(tab.key)} 
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === tab.key 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                activeTab === tab.key 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Common Filters */}
        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-3 sm:p-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <Input 
                placeholder="Search name, voucher #..." 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value) setGrSearch('');
                }} 
                icon={Search} 
                className="w-full text-xs"
              />
              <Input 
                placeholder="Search by GR Number..." 
                value={grSearch} 
                onChange={(e) => {
                  setGrSearch(e.target.value);
                  if (e.target.value) setSearch('');
                }} 
                icon={Search} 
                className="w-full text-xs"
              />
              <BranchSelect 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)} 
                includeAll={true}
                className="w-full text-xs"
              />
              <Dropdown 
                placeholder="All Months" 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)} 
                options={[{ value: '', label: 'All Months' }, ...MONTHS]} 
                className="w-full text-xs"
              />
              <Input 
                type="number" 
                placeholder="Year" 
                value={yearFilter} 
                onChange={(e) => setYearFilter(e.target.value)} 
                className="w-full text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tab Panels */}
        <TabPanel value="all" activeTab={activeTab}>
          <Card className="border border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                All Fee Vouchers
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                {statistics.all.count} total
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.all} 
                tabKey="all" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="pending" activeTab={activeTab}>
          <Card className="border border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                Pending Fee Vouchers
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                {statistics.pending.count} pending
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.pending} 
                tabKey="pending" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="partial" activeTab={activeTab}>
          <Card className="border border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                Partially Paid Fee Vouchers
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                {statistics.partial.count} partial
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.partial} 
                tabKey="partial" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="overdue" activeTab={activeTab}>
          <Card className="border border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                Overdue Fee Vouchers
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                {statistics.overdue.count} overdue
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.overdue} 
                tabKey="overdue" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="paid" activeTab={activeTab}>
          <Card className="border border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                Paid Fee Vouchers
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                {statistics.paid.count} paid
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.paid} 
                tabKey="paid" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="cancelled" activeTab={activeTab}>
          <Card className="border border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <div className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                Cancelled Fee Vouchers
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                {statistics.cancelled.count} cancelled
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.cancelled} 
                tabKey="cancelled" 
              />
            </CardContent>
          </Card>
        </TabPanel>
      </div>

      {/* Generate Voucher Modal */}
      <Modal open={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Fee Vouchers" size="lg">
        <form onSubmit={handleGenerateVouchers} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Generation Type *</Label>
              <Dropdown
                value={formData.generation_type}
                onChange={(e) => setFormData(prev => ({ ...prev, generation_type: e.target.value }))}
                options={[
                  { value: 'institute', label: 'Institute Wide (All Branches)' },
                  { value: 'branch', label: 'Branch Wise' },
                  { value: 'group', label: 'Group Wise' },
                  { value: 'class', label: 'Class Wise' },
                  { value: 'single', label: 'Single Student' },
                  { value: 'multi', label: 'Selected Students (Multi)' },
                ]}
              />
            </div>

            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            {formData.generation_type !== 'institute' && (
              <div>
                <Label>Branch *</Label>
                <BranchSelect
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value, academic_year_id: '', groupId: '', classId: '', sectionId: '' }))}
                  branches={branches}
                  placeholder="Select Branch"
                />
              </div>
            )}

            {formData.generation_type !== 'institute' && (
              <div>
                <Label>Academic Year *</Label>
                <Dropdown
                  value={formData.academic_year_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, academic_year_id: e.target.value, groupId: '', classId: '', sectionId: '' }))}
                  options={[
                    { value: '', label: 'Select Academic Year' },
                    ...academicYears.map(ay => ({ value: ay.id || ay._id, label: ay.name })),
                  ]}
                  disabled={!formData.branchId}
                />
              </div>
            )}

            {(formData.generation_type === 'group' || formData.generation_type === 'class') && (
              <div>
                <Label>Group *</Label>
                <Dropdown
                  value={formData.groupId}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value, classId: '', sectionId: '' }))}
                  options={[
                    { value: '', label: 'Select Group' },
                    ...groups.map(g => ({ value: g.id || g._id, label: g.name })),
                  ]}
                  disabled={!formData.branchId}
                />
              </div>
            )}

            {formData.generation_type === 'class' && (
              <div>
                <Label>Class *</Label>
                <Dropdown
                  value={formData.classId}
                  onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value, sectionId: '' }))}
                  options={[
                    { value: '', label: 'Select Class' },
                    ...classes.filter(c => !formData.groupId || c.group_id === formData.groupId || c.group?.id === formData.groupId).map(c => ({ value: c.id || c._id, label: c.name })),
                  ]}
                  disabled={!formData.groupId}
                />
              </div>
            )}

            {(formData.generation_type === 'class') && formData.classId && (
              <div>
                <Label>Section (Optional)</Label>
                <Dropdown
                  value={formData.sectionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
                  options={[
                    { value: '', label: 'All Sections' },
                    ...(classes.find(c => (c.id || c._id) === formData.classId)?.sections || []).map(s => ({ value: s.id || s._id, label: s.name }))
                  ]}
                />
              </div>
            )}

            {formData.generation_type === 'single' && (
              <SearchableStudentSelect
                label="Student"
                value={formData.studentId}
                onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                branchId={formData.branchId}
                disabled={!formData.branchId}
                required
              />
            )}

            {formData.generation_type === 'multi' && (
              <div className="md:col-span-2">
                <SearchableStudentSelect
                  label="Select Students"
                  value={formData.studentIds}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentIds: e.target.value }))}
                  branchId={formData.branchId}
                  disabled={!formData.branchId}
                  isMulti={true}
                  required
                />
              </div>
            )}
            <div>
              <Label>Month</Label>
              <Dropdown
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                options={MONTHS}
              />
            </div>
            <div>
              <Label>Year</Label>
              <Dropdown
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                options={YEARS}
              />
            </div>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Optional remarks..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <ButtonLoader text="Generating..." /> : 'Generate Vouchers'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Voucher Modal */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Voucher Details" size="lg">
        {viewLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : viewingVoucher ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Voucher Number</Label>
                <p className="font-semibold">{viewingVoucher.voucherNumber}</p>
              </div>
              <div>
                <Label className="text-gray-500">Status</Label>
                <p><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(viewingVoucher.status)}`}>
                  {viewingVoucher.status?.toUpperCase()}
                </span></p>
              </div>
              <div>
                <Label className="text-gray-500">Student Name</Label>
                <p className="font-semibold">{formatStudent(viewingVoucher.studentId).name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Registration No / GR No</Label>
                <p className="font-semibold">{formatStudent(viewingVoucher.studentId).registrationNumber} / {formatStudent(viewingVoucher.studentId).rollNumber}</p>
              </div>
              <div>
                <Label className="text-gray-500">Branch</Label>
                <p>{viewingVoucher.branchId?.name || viewingVoucher.branch?.name || '---'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Month / Year</Label>
                <p className="font-semibold">{MONTHS.find(m => m.value === viewingVoucher.month?.toString())?.label} {viewingVoucher.year}</p>
              </div>
              <div>
                <Label className="text-gray-500">Fee Type</Label>
                <p className="font-semibold">{viewingVoucher.feeType || viewingVoucher.fee_type || 'Monthly'}</p>
              </div>
              {(viewingVoucher.feeType === 'Installment' || viewingVoucher.fee_type === 'Installment') && (
                <div>
                  <Label className="text-gray-500">Installment No / Total</Label>
                  <p className="font-semibold">{viewingVoucher.installmentNo} / {viewingVoucher.totalInstallments}</p>
                </div>
              )}
              <div>
                <Label className="text-gray-500">Academic Year</Label>
                <p>{viewingVoucher.academicYear?.name || viewingVoucher.academic_year?.name || '---'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Class / Section</Label>
                <p>{viewingVoucher.class?.name || '---'} {viewingVoucher.section?.name ? ` - ${viewingVoucher.section.name}` : ''}</p>
              </div>
              <div>
                <Label className="text-gray-500">Group</Label>
                <p>{groups.find(g => g.id === viewingVoucher.group || g._id === viewingVoucher.group)?.name || '---'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Total Amount</Label>
                <p className="font-semibold">PKR {viewingVoucher.totalAmount?.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">Due Date</Label>
                <p>{new Date(viewingVoucher.dueDate).toLocaleDateString('en-PK')}</p>
              </div>
              <div>
                <Label className="text-gray-500">Paid Amount</Label>
                <p className="font-semibold text-green-600">PKR {(viewingVoucher.paidAmount || 0).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">Remaining Amount</Label>
                <p className="font-semibold text-blue-600">PKR {(viewingVoucher.remainingAmount || 0).toLocaleString()}</p>
              </div>
            </div>
            {viewingVoucher.paymentHistory?.length > 0 && (
              <div>
                <Label className="text-gray-500 mb-2 block">Payment History</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingVoucher.paymentHistory.map((payment, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(payment.date).toLocaleDateString('en-PK')}</TableCell>
                          <TableCell>PKR {payment.amount?.toLocaleString()}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>{payment.remarks || '---'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
              {viewingVoucher?.paidAmount > 0 && (
                <Button variant="secondary" onClick={() => handleDownloadReceipt(viewingVoucher)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              )}
              <Button onClick={() => handleDownloadVoucher(viewingVoucher)}>
                <Download className="w-4 h-4 mr-2" />
                Download Voucher
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Manual Payment Modal */}
      <Modal open={isManualPaymentModalOpen} onClose={() => setIsManualPaymentModalOpen(false)} title="Record Manual Payment" size="md">
        {selectedVoucherForPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Voucher #:</span>
                  <span className="font-semibold ml-2">{selectedVoucherForPayment.voucherNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Student:</span>
                  <span className="font-semibold ml-2">{formatStudent(selectedVoucherForPayment.studentId).name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-semibold ml-2">PKR {selectedVoucherForPayment.totalAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining:</span>
                  <span className="font-semibold ml-2 text-blue-600">PKR {(selectedVoucherForPayment.remainingAmount || selectedVoucherForPayment.totalAmount)?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Payment Amount (PKR) *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
                placeholder="Optional remarks..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsManualPaymentModalOpen(false)}>Cancel</Button>
              <Button onClick={handleManualPayment} disabled={processingPayment}>
                {processingPayment ? <ButtonLoader text="Processing..." /> : 'Record Payment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          title="Delete Fee Voucher"
          message="Are you sure you want to delete this fee voucher permanently? This action cannot be undone."
          onConfirm={confirmDeleteVoucher}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setDeletingVoucherId(null);
          }}
          isLoading={deleting}
        />
      )}

      {/* Edit Voucher Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Fee Voucher" size="lg">
        {editingVoucher && (
          <form onSubmit={handleUpdateVoucher} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Voucher Number</Label>
                <Input value={editingVoucher.voucherNumber} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Student</Label>
                <Input value={formatStudent(editingVoucher.studentId).name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Amount Due (PKR) *</Label>
                <Input
                  type="number"
                  value={editFormData.amount_due}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, amount_due: e.target.value }))}
                  required
                  disabled={editingVoucher.status === 'paid'}
                />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                  disabled={editingVoucher.status === 'paid'}
                />
              </div>
              <div>
                <Label>Month *</Label>
                <Dropdown
                  value={editFormData.month}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, month: e.target.value }))}
                  options={MONTHS}
                  required
                />
              </div>
              <div>
                <Label>Year *</Label>
                <Input
                  type="number"
                  value={editFormData.year}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, year: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Remarks</Label>
                <Textarea
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional remarks..."
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <ButtonLoader text="Updating..." /> : 'Update Voucher'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
