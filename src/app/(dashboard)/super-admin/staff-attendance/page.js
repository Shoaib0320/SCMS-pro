'use client';

import StaffAttendanceManager from '@/components/attendance/StaffAttendanceManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Briefcase } from 'lucide-react';

export default function SuperAdminStaffAttendancePage() {
    return (
        <div className="space-y-4">
            <DashboardHeader
                title="Staff Attendance Management"
                subtitle="Track and manage daily attendance, shifts, and leaves for faculty and administrative staff across all branches"
            />

            <StaffAttendanceManager isBranchAdmin={false} />
        </div>
    );
}
