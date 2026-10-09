"use client";

import React, { useState, useEffect } from "react";
import { AcademicManagementSkeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Layers, 
  GraduationCap, 
  Layout, 
  BookOpen,
  LayoutDashboard
} from "lucide-react";
import { withAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AcademicYearsContent from "@/components/academic/AcademicYearsContent";
import GroupsContent from "@/components/academic/GroupsContent";
import ClassesContent from "@/components/academic/ClassesContent";
import SectionsContent from "@/components/academic/SectionsContent";
import SubjectsContent from "@/components/academic/SubjectsContent";
import Tabs, { TabPanel } from "@/components/ui/tabs";

function AcademicUnifiedPage() {
  const [activeTab, setActiveTab] = useState("years");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
    return (
      <div className="space-y-4">
        <AcademicManagementSkeleton />
      </div>
    );
  }

  const tabs = [
    { id: "years", label: "Academic Years", icon: Calendar, component: AcademicYearsContent },
    { id: "groups", label: "Groups", icon: Layers, component: GroupsContent },
    { id: "classes", label: "Classes", icon: GraduationCap, component: ClassesContent },
    { id: "sections", label: "Sections", icon: Layout, component: SectionsContent },
    { id: "subjects", label: "Subjects", icon: BookOpen, component: SubjectsContent },
  ];

  const tabConfig = tabs.map(t => ({
    id: t.id,
    label: t.label,
    icon: <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-primary' : ''}`} />
  }));

  const currentTabTitle = `${tabs.find(t => t.id === activeTab)?.label.replace('Academic ', '')} Management`;
  const currentTabSubtitle = 
    activeTab === 'years' ? "Configure and manage global and branch-specific academic timelines." : 
    activeTab === 'groups' ? "Organize study groups and disciplinary categories for better management." :
    activeTab === 'classes' ? "Define class structures and grade levels for student enrollment." :
    activeTab === 'sections' ? "Manage class sections, capacity, and branch assignments." :
    "Configure subjects, courses, and educational curriculum content.";

  return (
    <div className="space-y-4">
      {/* Header */}
      <DashboardHeader
        title={currentTabTitle}
        subtitle={currentTabSubtitle}
      />

      <div className="w-full space-y-4">
        {/* Navigation Tabs Bar */}
        <div className="bg-card rounded-xl shadow-xs border border-border overflow-hidden px-1.5 py-1">
          <Tabs 
            tabs={tabConfig} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
            className="border-none"
          />
        </div>

        {/* Tab Panels */}
        {tabs.map((tab) => (
          <TabPanel 
            key={tab.id} 
            value={tab.id} 
            activeTab={activeTab}
          >
            <div className="bg-card p-3 sm:p-5 rounded-xl shadow-xs border border-border animate-in fade-in duration-300">
              <tab.component />
            </div>
          </TabPanel>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AcademicUnifiedPage, {
  requiredRole: [ROLES.SUPER_ADMIN],
});
