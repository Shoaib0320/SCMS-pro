'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  Users, Plus, Search, Edit, Trash2, Phone, Mail,
  Calendar, GraduationCap, Award, FileText, Eye,
  UserCheck, UserX, Clock, Building2, X, RotateCcw
} from 'lucide-react';
import Modal from '@/components/ui/modal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import BranchSelect from '@/components/ui/branch-select';
import FullPageLoader from '@/components/ui/full-page-loader';
import TeacherForm from '@/components/teacher/teacher-form';
import UserDetailModal from '@/components/modals/UserDetailModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import UserManagementTable from '@/components/common/UserManagementTable';
import Skeleton from '@/components/ui/skeleton';

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [fullPageLoading, setFullPageLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
  });

  useEffect(() => {
    fetchTeachers();
  }, [searchTerm, selectedBranch, selectedStatus, selectedDesignation]);

  useEffect(() => {
    fetchTeacherStats();
  }, [selectedBranch]);

  useEffect(() => {
    fetchBranches();
    fetchDepartments();
    fetchClasses();
    fetchSubjects();
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await apiClient.get('/api/academic-years');
      if (response?.academic_years) {
        setAcademicYears(response.academic_years);
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      const params = new URLSearchParams({
        limit: '500',
        status: 'all',
        ...(selectedBranch && { branchId: selectedBranch }),
      });
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.LIST}?${params}`);
      if (response?.success) {
        const list = response.data || [];
        const total = list.length;
        const active = list.filter(t => t.is_active === true || t.status === 'active').length;
        const onLeave = list.filter(t => t.status === 'on_leave' || t.details?.teacher?.status === 'on_leave').length;
        const terminated = list.filter(t => t.is_active === false || t.status === 'terminated' || t.details?.teacher?.status === 'terminated').length;

        setStats({ total, active, onLeave, terminated });
      }
    } catch (error) {
      console.error('Failed to fetch teacher stats:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100', // Still fetch a good batch for client-side filtering/slicing or keep server-side
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branchId: selectedBranch }),
        status: selectedStatus || 'all',
        ...(selectedDesignation && { designation: selectedDesignation }),
      });

      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.LIST}?${params}`);
      if (response?.success) {
        const list = response.data || [];
        setTeachers(list);
      }
    } catch (error) {
      toast.error('Failed to fetch teachers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST}?limit=200`);
      if (response?.success) {
        setBranches(response.data?.branches || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST}?limit=200`);
      if (response?.success) {
        setDepartments(response.data?.departments || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST}?limit=200`);
      if (response?.success) {
        setClasses(response.data?.classes || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.SUBJECTS.LIST}?limit=200`);
      if (response?.success) {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleDelete = async (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;

    setFullPageLoading(true);
    setShowDeleteModal(false);

    try {
      const response = await apiClient.delete(API_ENDPOINTS.SUPER_ADMIN.TEACHERS.DELETE.replace(':id', teacherToDelete.id));
      if (response.success) {
        toast.success('Teacher deleted successfully');
        fetchTeachers();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete teacher');
      console.error(error);
    } finally {
      setFullPageLoading(false);
      setTeacherToDelete(null);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setShowModal(true);
  };

  const handleView = (teacher) => {
    setViewingTeacher(teacher);
    setShowViewModal(true);
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
  };

  const handleSuccess = () => {
    fetchTeachers();
    handleCloseModal();
  };

  return (
    <div className="space-y-4">
      {fullPageLoading && <FullPageLoader message="Processing..." />}
      
      {/* Header */}
      <DashboardHeader
        title="Teacher Management"
        subtitle="Manage academic faculty, assignments, and campus allocations"
        onRefresh={() => {
          fetchTeachers();
          fetchTeacherStats();
        }}
      >
        <Button
          onClick={handleAddNew}
          size="sm"
          className="h-8 px-3 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Teacher
        </Button>
      </DashboardHeader>

      {/* Stats Cards (Compact 4-column Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatsCard 
          title="Total Teachers"
          value={stats.total || teachers.length}
          icon={Users}
          description="Academic faculty"
          color="blue"
        />
        <StatsCard 
          title="Active Faculty"
          value={stats.active}
          icon={UserCheck}
          description="Actively teaching"
          color="green"
        />
        <StatsCard 
          title="On Leave"
          value={stats.onLeave}
          icon={Clock}
          description="Approved leaves"
          color="orange"
        />
        <StatsCard 
          title="Terminated / Inactive"
          value={stats.terminated}
          icon={UserX}
          description="Deactivated records"
          color="red"
        />
      </div>

      {/* Compact Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone, employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {(searchTerm || selectedBranch || (selectedStatus && selectedStatus !== 'active')) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch('');
                setSelectedStatus('active');
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Counter Badge */}
        <div className="text-right flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            {teachers.length} {teachers.length === 1 ? 'teacher' : 'teachers'} listed
          </span>
        </div>
      </div>

      {/* Teachers Table Card */}
      <Card className="border border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <UserManagementTable
            data={teachers.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={async (teacher) => {
              try {
                const formData = new FormData();
                formData.append('data', JSON.stringify({
                  is_active: !teacher.is_active,
                  status: !teacher.is_active ? 'active' : 'inactive'
                }));

                const response = await apiClient.put(
                  API_ENDPOINTS.SUPER_ADMIN.TEACHERS.UPDATE.replace(':id', teacher.id), 
                  formData
                );
                
                if (response.success) {
                  toast.success(`Teacher ${!teacher.is_active ? 'activated' : 'deactivated'} successfully`);
                  fetchTeachers();
                  fetchTeacherStats();
                }
              } catch (error) {
                toast.error('Failed to update status');
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {Math.ceil(teachers.length / pagination.limit) > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">
            Showing <span className="font-bold text-primary">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-bold text-primary">{Math.min(pagination.page * pagination.limit, teachers.length)}</span> of {teachers.length} teachers
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="h-7 px-3 text-xs"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(Math.ceil(teachers.length / pagination.limit))].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={pagination.page === i + 1 ? "default" : "outline"}
                  size="sm"
                  className={`w-7 h-7 p-0 text-xs ${pagination.page === i + 1 ? 'font-semibold' : ''}`}
                  onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(teachers.length / pagination.limit)}
              className="h-7 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Teacher Form Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        size="xl"
        footer={null}
      >
        <TeacherForm
          userRole="SUPER_ADMIN"
          currentBranchId={null}
          editingTeacher={editingTeacher}
          branches={branches}
          departments={departments}
          classes={classes}
          subjects={subjects}
          academicYears={academicYears}
          onSuccess={handleSuccess}
          onClose={handleCloseModal}
        />
      </Modal>

      {/* Teacher View Modal */}
      <UserDetailModal
        user={viewingTeacher}
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingTeacher(null);
        }}
      />

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Teacher"
          message={`Are you sure you want to delete ${teacherToDelete?.first_name} ${teacherToDelete?.last_name}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setTeacherToDelete(null);
          }}
        />
      )}
    </div>
  );
}