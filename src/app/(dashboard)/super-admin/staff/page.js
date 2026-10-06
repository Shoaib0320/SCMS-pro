"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Filter,
  UserCheck,
  UserX,
  Building2,
  X,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import Modal from '@/components/ui/modal';
import AddStaffModal from '@/components/modals/AddStaffModal';
import FullPageLoader from '@/components/ui/full-page-loader';
import Dropdown from '@/components/ui/dropdown';
import { toast } from 'sonner';
import UserManagementTable from '@/components/common/UserManagementTable';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import UserDetailModal from '@/components/modals/UserDetailModal';
import AdminChangeUserPasswordModal from '@/components/modals/AdminChangeUserPasswordModal';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'All Status', value: 'all' },
];

export default function SuperAdminStaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [branches, setBranches] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // Load staff
  const loadStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', statusFilter || 'active');
      if (branchFilter && branchFilter !== 'all') params.append('branchId', branchFilter);
      const url = `${API_ENDPOINTS.SUPER_ADMIN.STAFF.LIST}?${params.toString()}`;
      const response = await apiClient.get(url);
      if (response.success) {
        setStaff(response.data);
        setFilteredStaff(response.data);
      }
    } catch (error) {
      console.error('Load staff error:', error);
      toast.error(error.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  // Load branches for filter
  const loadBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (response.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Load branches error:', error);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [statusFilter, branchFilter]);

  useEffect(() => {
    loadBranches();
  }, []);

  // Filter staff
  useEffect(() => {
    let filtered = [...staff];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        (s.first_name + ' ' + s.last_name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.registration_no?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(s => s.is_active === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(s => s.is_active === false);
    }

    // Branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(s => s.branch_id === branchFilter);
    }

    setFilteredStaff(filtered);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  }, [searchQuery, statusFilter, branchFilter, staff]);

  // Paginated data
  const paginatedStaff = filteredStaff.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );
  const totalPages = Math.ceil(filteredStaff.length / pagination.limit);

  // Handle add staff
  const handleAddStaff = () => {
    setShowAddModal(true);
  };

  // Handle edit staff
  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  // Handle view staff
  const handleViewStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowViewModal(true);
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffMember) => {
    setStaffToDelete(staffMember);
    setShowDeleteModal(true);
  };

  const handleChangePassword = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowPasswordModal(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      setLoading(true);
      const endpoint = API_ENDPOINTS.SUPER_ADMIN.STAFF.DELETE.replace(':id', staffToDelete.id);
      const response = await apiClient.delete(endpoint);
      if (response.success) {
        toast.success('Staff deleted successfully');
        loadStaff();
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      toast.error(error.message || 'Failed to delete staff');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setStaffToDelete(null);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (staffMember) => {
    try {
      const endpoint = API_ENDPOINTS.SUPER_ADMIN.STAFF.UPDATE.replace(':id', staffMember.id);
      
      // Staff API supports both JSON and FormData.
      // Using JSON here as it's simpler for a status toggle and supported by the API.
      const response = await apiClient.put(endpoint, {
        is_active: !staffMember.is_active,
        status: !staffMember.is_active ? 'active' : 'inactive'
      });
      
      if (response.success) {
        toast.success(`Staff ${!staffMember.is_active ? 'activated' : 'deactivated'} successfully`);
        loadStaff();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Download QR code
  const handleDownloadQR = (staffMember) => {
    if (staffMember.qr_code_url) {
      window.open(staffMember.qr_code_url, '_blank');
    } else {
      toast.error('QR code not available');
    }
  };


  const activeCount = staff.filter((s) => s.is_active === true).length;
  const inactiveCount = staff.filter((s) => s.is_active === false).length;
  const branchesCount = new Set(staff.map((s) => s.branch_id).filter(Boolean)).size;

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader
        title="Staff Management"
        subtitle="Manage all institutional staff members across branches"
        onRefresh={loadStaff}
      >
        <Button
          onClick={handleAddStaff}
          size="sm"
          className="h-8 px-3 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Staff
        </Button>
      </DashboardHeader>

      {/* Stats Cards (Compact 4-column Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatsCard 
          title="Total Staff"
          value={staff.length}
          icon={Users}
          description="Institutional workforce"
          color="blue"
        />
        <StatsCard 
          title="Active Staff"
          value={activeCount}
          icon={UserCheck}
          description="Operational accounts"
          color="green"
        />
        <StatsCard 
          title="Inactive Staff"
          value={inactiveCount}
          icon={UserX}
          description="Suspended / disabled"
          color="red"
        />
        <StatsCard 
          title="Assigned Branches"
          value={branchesCount || branches.length}
          icon={Building2}
          description="Branch deployments"
          color="purple"
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
              placeholder="Search by name, email, registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div className="w-full sm:w-44">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Clear filters button if active */}
          {(searchQuery || branchFilter !== 'all' || statusFilter !== 'active') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setBranchFilter('all');
                setStatusFilter('active');
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
            {filteredStaff.length} of {staff.length} {filteredStaff.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {/* Staff Table Card */}
      <Card className="border border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <UserManagementTable
            data={paginatedStaff}
            loading={loading}
            onView={handleViewStaff}
            onEdit={handleEditStaff}
            onDelete={handleDeleteStaff}
            onToggleStatus={handleToggleStatus}
            onChangePassword={handleChangePassword}
          />
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">
            Showing <span className="font-bold text-primary">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-bold text-primary">{Math.min(pagination.page * pagination.limit, filteredStaff.length)}</span> of {filteredStaff.length} members
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
              {[...Array(totalPages)].map((_, i) => (
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
              disabled={pagination.page >= totalPages}
              className="h-7 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Staff"
          message={`Are you sure you want to delete ${staffToDelete?.first_name} ${staffToDelete?.last_name}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setStaffToDelete(null);
          }}
        />
      )}

      {/* Add/Edit Staff Modal */}
      {(showAddModal || showEditModal) && (
        <AddStaffModal
          open={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedStaff(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedStaff(null);
            loadStaff();
          }}
          staffMember={selectedStaff}
          branches={branches}
          role="SUPER_ADMIN"
        />
      )}

      {/* View Staff Modal */}
      <UserDetailModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        user={selectedStaff}
        title="Staff Profile Overview"
      />

      {/* Change Password Modal */}
      <AdminChangeUserPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSelectedStaff(null);
        }}
        userToEdit={selectedStaff}
        userRole="staff"
        adminRole="SUPER_ADMIN"
      />
    </div>
  );
}

