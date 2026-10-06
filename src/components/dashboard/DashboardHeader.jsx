'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const DashboardHeader = ({ 
  title, 
  subtitle, 
  onRefresh, 
  children 
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5 pb-1.5 border-b border-border/50">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-xs font-medium truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-shrink-0">
        {children}
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            variant="outline"
            size="sm"
            className="h-8 px-2.5 sm:px-3 rounded-lg border-border hover:bg-secondary transition-colors text-xs font-semibold"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
