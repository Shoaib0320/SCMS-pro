'use client';

import React from 'react';
import { Building2, MapPin, Phone, Mail, Eye, Edit, Trash2, Users, GraduationCap, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const BranchCard = ({ branch, onView, onEdit, onDelete }) => {
  const city = branch.address?.city || branch.city || 'N/A';
  const phone = branch.contact?.phone || branch.phone || 'N/A';
  const email = branch.contact?.email || branch.email || 'N/A';
  const studentsCount = branch.stats?.students || 0;
  const teachersCount = branch.stats?.teachers || 0;
  const staffCount = branch.stats?.staff || 0;

  return (
    <div className="group rounded-xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Card Header (Themed) */}
      <div className="bg-primary/95 text-primary-foreground p-3 sm:p-3.5 flex items-start justify-between gap-2 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary-foreground/80 flex-shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-primary-foreground truncate leading-tight">
              {branch.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-primary-foreground/15 text-primary-foreground/90 uppercase tracking-wider">
              {branch.code}
            </span>
            <span className="text-[11px] text-primary-foreground/75 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {city}
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={cn(
            "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border shadow-xs flex-shrink-0",
            branch.is_active
              ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/40"
              : "bg-rose-500/20 text-rose-100 border-rose-400/40"
          )}
        >
          {branch.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Contact Information (Compact) */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 truncate">
            <Phone className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
            <span className="truncate">{phone}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        </div>

        {/* Key Metrics Segment (Organized & Compact) */}
        <div className="pt-2 border-t border-border/60 grid grid-cols-3 gap-1.5">
          <div className="p-1.5 rounded-lg bg-secondary/50 border border-border/50 text-center">
            <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{studentsCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5 truncate">Students</p>
          </div>
          <div className="p-1.5 rounded-lg bg-secondary/50 border border-border/50 text-center">
            <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{teachersCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5 truncate">Teachers</p>
          </div>
          <div className="p-1.5 rounded-lg bg-secondary/50 border border-border/50 text-center">
            <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{staffCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5 truncate">Staff</p>
          </div>
        </div>

        {/* Action Buttons (Compact & Sleek) */}
        <div className="pt-2 border-t border-border/60 flex items-center gap-1.5">
          <button
            onClick={() => onView(branch)}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold text-foreground bg-secondary/70 hover:bg-secondary hover:text-primary rounded-lg border border-border transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
            <span>View Details</span>
          </button>
          
          <button
            onClick={() => onEdit(branch)}
            className="h-8 w-8 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-colors cursor-pointer"
            title="Edit Branch"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(branch)}
            className="h-8 w-8 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 rounded-lg border border-rose-200 dark:border-rose-800/40 transition-colors cursor-pointer"
            title="Delete Branch"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchCard;
