'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, RotateCcw, Clock, Building2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardFilterPopover({
  selectedTimeRange = '30days',
  onTimeRangeChange,
  selectedBranch = 'all',
  onBranchChange,
  branches = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const timeRangeOptions = [
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: '1year', label: '1 Year' },
  ];

  const hasActiveFilters = selectedTimeRange !== '30days' || selectedBranch !== 'all';

  const handleReset = () => {
    if (onTimeRangeChange) onTimeRangeChange('30days');
    if (onBranchChange) onBranchChange('all');
  };

  const activeBranchName =
    selectedBranch === 'all'
      ? 'All Branches'
      : branches.find((b) => String(b.id) === String(selectedBranch))?.name || 'Selected Branch';

  const activeTimeLabel =
    timeRangeOptions.find((t) => t.value === selectedTimeRange)?.label || selectedTimeRange;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 px-2.5 sm:px-3 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5",
          isOpen
            ? "border-primary bg-primary/10 text-primary"
            : hasActiveFilters
            ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
            : "border-border bg-card hover:bg-secondary text-foreground"
        )}
        title="Filter Dashboard"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Filters</span>
        {hasActiveFilters && (
          <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </Button>

      {/* Popover Box */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-popover border border-border rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border mb-2.5">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-xs font-bold text-foreground">Dashboard Filters</h3>
            </div>
            <div className="flex items-center gap-1">
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-secondary"
                  title="Reset to default"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Time Range Filter */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Clock className="w-3 h-3 text-primary" />
                <span>Time Period</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {timeRangeOptions.map((opt) => {
                  const isSelected = selectedTimeRange === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onTimeRangeChange && onTimeRangeChange(opt.value)}
                      className={cn(
                        "h-7 px-1 rounded-md text-xs font-medium transition-all text-center",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Branch Filter */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Building2 className="w-3 h-3 text-primary" />
                <span>Branch</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => onBranchChange && onBranchChange(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Badge */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                {activeTimeLabel} • {activeBranchName}
              </span>
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsOpen(false)}
                className="h-6 px-2.5 text-[11px] font-semibold rounded-md"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
