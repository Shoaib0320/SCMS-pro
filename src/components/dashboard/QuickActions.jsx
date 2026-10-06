'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const QuickActions = ({ title = "Quick Actions", actions = [] }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  // Extract categories if available
  const categories = ['all', ...new Set(actions.map((a) => a.category).filter(Boolean))];

  const filteredActions = activeCategory === 'all'
    ? actions
    : actions.filter((a) => a.category === activeCategory);

  return (
    <Card className="border border-border bg-card shadow-xs">
      <CardContent className="p-3 sm:p-4 space-y-2.5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider leading-none">
                {title}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Fast shortcuts to frequently used modules
              </p>
            </div>
          </div>

          {/* Optional Category Pills if more than 1 category exists */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-sidebar-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
          {filteredActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="group relative flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/70 bg-card hover:bg-secondary/60 hover:border-primary/40 hover:shadow-xs transition-all duration-150 cursor-pointer text-center min-w-0"
                title={action.title}
              >
                {/* Icon Container */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-150 group-hover:scale-105",
                    action.bgColor || "bg-primary/10",
                    action.color || "text-primary"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                </div>

                {/* Title */}
                <span className="text-[11px] font-semibold text-foreground mt-1.5 truncate w-full group-hover:text-primary transition-colors">
                  {action.title}
                </span>

                {/* Subtitle / Category Hint */}
                {action.subtitle && (
                  <span className="text-[9px] text-muted-foreground truncate w-full mt-0.5 font-medium">
                    {action.subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
