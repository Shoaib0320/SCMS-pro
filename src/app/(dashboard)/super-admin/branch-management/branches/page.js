'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  X,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import dynamic from 'next/dynamic';
import Skeleton, { CardSkeleton, BranchManagementSkeleton } from '@/components/ui/skeleton';

// Branch Components
import BranchCard from '@/components/branch/BranchCard';
import BranchViewModal from '@/components/branch/BranchViewModal';
import BranchFormModal from '@/components/branch/BranchFormModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import StatsCard from '@/components/dashboard/StatsCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

function BranchesPage() {
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBranch, setViewingBranch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
    establishedDate: '',
    status: 'active',
    idCardFormat: 'barcode',
    location: {
      latitude: 33.6844,
      longitude: 73.0479,
    },
    bankAccounts: [
      {
        accountTitle: '',
        serviceName: '',
        accountNo: '',
        iban: '',
        isDefault: true,
      },
    ],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadBranches();
  }, [debouncedSearchTerm, statusFilter]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      let url = '/api/super-admin/branches?limit=100';
      if (debouncedSearchTerm) url += `&search=${debouncedSearchTerm}`;
      if (statusFilter) url += `&is_active=${statusFilter === 'active'}`;
      
      const response = await apiClient.get(url);
      if (response?.data?.branches) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      toast.error('Failed to load branches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'Pakistan',
      postalCode: '',
      establishedDate: '',
      status: 'active',
      idCardFormat: 'barcode',
      location: {
        latitude: 33.6844,
        longitude: 73.0479,
      },
      bankAccounts: [
        {
          accountTitle: '',
          serviceName: '',
          accountNo: '',
          iban: '',
          isDefault: true,
        },
      ],
    });
    setShowModal(true);
  };

  const addBankAccount = () => {
    // Moved to BranchFormModal
  };

  const removeBankAccount = (index) => {
    // Moved to BranchFormModal
  };

  const updateBankAccount = (index, field, value) => {
    // Moved to BranchFormModal
  };

  const handleView = (branch) => {
    setViewingBranch(branch);
    setShowViewModal(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      email: branch.contact?.email || branch.email || '',
      phone: branch.contact?.phone || branch.phone || '',
      address: branch.address?.street || branch.address || '',
      city: branch.address?.city || branch.city || '',
      state: branch.address?.state || branch.state || '',
      country: branch.address?.country || branch.country || 'Pakistan',
      postalCode: branch.address?.zipCode || branch.postalCode || '',
      establishedDate: branch.settings?.establishedDate
        ? format(new Date(branch.settings.establishedDate), 'yyyy-MM-dd')
        : '',
      status: branch.is_active ? 'active' : 'inactive',
      idCardFormat: branch.settings?.idCardFormat || 'barcode',
      location: {
        latitude: branch.location?.latitude || 33.6844,
        longitude: branch.location?.longitude || 73.0479,
      },
      bankAccounts: branch.bankAccounts?.length > 0
        ? branch.bankAccounts
        : [{ accountTitle: '', serviceName: '', accountNo: '', iban: '', isDefault: true }],
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        is_active: formData.status === 'active',
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.postalCode,
        },
        contact: {
          email: formData.email,
          phone: formData.phone,
        },
        location: formData.location,
        bankAccounts: formData.bankAccounts,
        settings: {
          establishedDate: formData.establishedDate,
          idCardFormat: formData.idCardFormat,
        }
      };

      if (editingBranch) {
        await apiClient.put(`/api/super-admin/branches/${editingBranch.id}`, payload);
        toast.success('Branch updated successfully');
      } else {
        await apiClient.post('/api/super-admin/branches', payload);
        toast.success('Branch created successfully');
      }
      
      setShowModal(false);
      loadBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save branch');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      if (!branchToDelete) return;
      await apiClient.delete(`/api/super-admin/branches/${branchToDelete.id}`);
      toast.success('Branch deleted successfully');
      setShowDeleteModal(false);
      setBranchToDelete(null);
      loadBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete branch');
    }
  };

  // Calculate totals - Safely check for mock data vs real data
  const totalStudents = branches.reduce((sum, b) => sum + (b.stats?.students || 0), 0);
  const totalTeachers = branches.reduce((sum, b) => sum + (b.stats?.teachers || 0), 0);
  const totalStaff = branches.reduce((sum, b) => sum + (b.stats?.staff || 0), 0);


  if (loading && branches.length === 0) {
    return (
      <div className="space-y-4">
        <BranchManagementSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader
        title="Branch Management"
        subtitle="Manage all coaching branches, campuses, and operational units"
        onRefresh={loadBranches}
      >
        {branches.length < 3 ? (
          <Button
            onClick={handleAddNew}
            size="sm"
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Branch
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Limit reached (Max 3)</span>
          </div>
        )}
      </DashboardHeader>

      {/* Stats Cards (Compact 4-column Grid matching Dashboard Overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatsCard 
          title="Total Branches"
          value={branches.length}
          icon={Building2}
          description={`${branches.filter(b => b.is_active).length} Active • ${branches.filter(b => !b.is_active).length} Inactive`}
          color="blue"
        />
        <StatsCard 
          title="Total Students"
          value={totalStudents}
          icon={GraduationCap}
          description="Enrolled across branches"
          color="green"
        />
        <StatsCard 
          title="Total Teachers"
          value={totalTeachers}
          icon={UserCheck}
          description="Active faculty members"
          color="purple"
        />
        <StatsCard 
          title="Total Staff"
          value={totalStaff}
          icon={Users}
          description="Support & admin personnel"
          color="orange"
        />
      </div>

      {/* Compact Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search branches by name, city, code..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer min-w-[110px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="text-right flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            {branches.length} {branches.length === 1 ? 'branch' : 'branches'} found
          </span>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="min-h-[300px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {branches.length === 0 ? (
            <div className="col-span-full p-10 rounded-xl border border-dashed border-border bg-card/60 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No branches found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {searchTerm || statusFilter ? 'Try clearing your filters or search term' : 'Create your first branch to get started'}
              </p>
            </div>
          ) : (
            <>
              {loading && branches.length > 0 && (
                <div className="col-span-full mb-1">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>Updating branches...</span>
                  </div>
                </div>
              )}
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={(b) => {
                    setBranchToDelete(b);
                    setShowDeleteModal(true);
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <BranchFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editingBranch={editingBranch}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
      />

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Branch"
          message={`Are you sure you want to delete "${branchToDelete?.name}"? This action cannot be undone and will remove all data associated with this branch.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setBranchToDelete(null);
          }}
        />
      )}

      {/* View Details Modal */}
      <BranchViewModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        branch={viewingBranch}
        onEdit={handleEdit}
      />
    </div>
  );
}

export default withAuth(BranchesPage, { requiredRole: [ROLES.SUPER_ADMIN] });
