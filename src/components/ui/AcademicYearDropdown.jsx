'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import Dropdown from './dropdown';
import { getActiveAcademicYear } from '@/lib/utils';

/**
 * Reusable Academic Year Dropdown Component
 * Fetches academic years based on user role and branch
 * 
 * @param {string} value - Selected academic year ID
 * @param {function} onChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Whether the field is required
 * @param {string} branchId - Optional branch ID (for super-admin to filter)
 * @param {boolean} showCurrent - Whether to show "Current" indicator
 * @param {boolean} filterByBranch - Whether to filter by branch (default: false for super-admin)
 */
export default function AcademicYearDropdown({
  value,
  onChange,
  placeholder = 'Select Academic Year',
  required = false,
  branchId = null,
  showCurrent = true,
  disabled = false,
  className = '',
  filterByBranch = false,
}) {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAcademicYears = async () => {
      try {
        setLoading(true);
        let response;

        if (branchId && filterByBranch) {
          response = await apiClient.get(`/api/academic-years?branch_id=${branchId}&limit=100`);
        } else {
          response = await apiClient.get('/api/academic-years');
        }

        const yearsData =
          response.academic_years ||
          response.data?.academicYears ||
          (Array.isArray(response) ? response : response.data || []);

        if (!isMounted) return;
        setAcademicYears(yearsData);

        const activeYear = getActiveAcademicYear(
          yearsData,
          response.current_academic_year || response.data?.currentAcademicYear
        );

        if (activeYear && !value && onChange) {
          onChange({ target: { value: activeYear.id || activeYear._id } });
        }
      } catch (error) {
        console.error('Error loading academic years:', error);
        if (isMounted) setAcademicYears([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAcademicYears();

    return () => {
      isMounted = false;
    };
  }, [branchId, filterByBranch]);

  // Format options for dropdown
  const options = academicYears.map((year) => ({
    value: year.id || year._id,
    label: `${year.name || year.yearName || ''}${(year.is_current || year.isCurrent) && showCurrent ? ' (Current)' : ''}`,
  }));

  // Add empty option if not required
  if (!required && options.length > 0) {
    options.unshift({ value: '', label: placeholder });
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 h-10 rounded-lg ${className}`}>
        <div className="px-4 py-2 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
