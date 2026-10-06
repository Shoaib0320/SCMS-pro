'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  description, 
  color = "blue",
  loading = false 
}) => {
  const getChangeIcon = (val) => {
    if (val > 0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (val < 0) return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
    return null;
  };

  const getChangeColor = (val) => {
    if (val > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (val < 0) return 'text-rose-600 dark:text-rose-400';
    return 'text-slate-500';
  };

  const colorVariants = {
    blue: "bg-primary/10 text-primary border-primary/20",
    green: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
    purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
    indigo: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
    yellow: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
    emerald: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/40",
    orange: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/40",
    red: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border border-border bg-card">
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {value}
              </h3>
              {change !== undefined && (
                <div className="flex items-center">
                  {getChangeIcon(change)}
                  <span className={cn("text-[11px] font-semibold ml-0.5", getChangeColor(change))}>
                    {Math.abs(change)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={cn("p-2 rounded-lg border flex-shrink-0", colorVariants[color] || colorVariants.blue)}>
            {Icon && <Icon className="w-4 h-4" />}
          </div>
        </div>
        {description && (
          <div className="mt-2 pt-2 border-t border-border/60">
            <p className="text-[11px] font-medium text-muted-foreground truncate">
              {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
