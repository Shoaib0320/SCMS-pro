//src/components/Sidebar.jsx
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Receipt,
  School,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/* ===================== MENU CONFIG ===================== */

const ROLE_MENUS = {
  super_admin: [
    {
      category: "Management",
      items: [
        { name: "Dashboard", path: "/super-admin", icon: LayoutDashboard },
        { name: "Branches", path: "/super-admin/branch-management/branches", icon: Building2 },
      ],
    },
    {
      category: "Personnel",
      isCollapsible: true,
      items: [
        { name: "Admins", path: "/super-admin/user-management/administrators", icon: ShieldCheck },
        { name: "Staff", path: "/super-admin/staff", icon: UserCog },
        { name: "Teachers", path: "/super-admin/teacher-management/teachers", icon: Users },
      ],
    },
    {
      category: "Academic",
      isCollapsible: true,
      items: [
        { name: "Academics", path: "/super-admin/academic", icon: GraduationCap },
        { name: "Timetable", path: "/super-admin/timetable", icon: Clock },
        { name: "Exams", path: "/super-admin/exams", icon: FileText },
      ],
    },
    {
      category: "Students",
      items: [
        { name: "Student List", path: "/super-admin/student-management/students", icon: Users },
      ],
    },
    {
      category: "Finance",
      isCollapsible: true,
      items: [
        { name: "Fee Vouchers", path: "/super-admin/fee-vouchers", icon: Receipt },
        { name: "Expenses", path: "/super-admin/expenses", icon: Wallet },
        { name: "Finance Reports", path: "/super-admin/reports", icon: BarChart3 },
      ],
    },
    {
      category: "Attendance",
      isCollapsible: true,
      items: [
        { name: "Student Attendance", path: "/super-admin/attendance", icon: QrCode },
        { name: "Staff Attendance", path: "/super-admin/staff-attendance", icon: UserCheck },
        { name: "Leaves", path: "/super-admin/leaves", icon: Calendar },
      ],
    },
    {
      category: "System",
      items: [
        { name: "Notifications", path: "/super-admin/notifications", icon: Sparkles },
      ],
    },
  ],

  branch_admin: [
    {
      category: "Overview",
      items: [
        { name: "Dashboard", path: "/branch-admin", icon: LayoutDashboard },
      ],
    },
    {
      category: "Academic",
      isCollapsible: true,
      items: [
        { name: "Academics", path: "/branch-admin/academic", icon: GraduationCap },
        { name: "Timetable", path: "/branch-admin/timetable", icon: Clock },
        { name: "Exams", path: "/branch-admin/exams", icon: FileText },
        { name: "Assignments", path: "/branch-admin/assignments", icon: FolderOpen },
      ],
    },
    {
      category: "Staff & Students",
      isCollapsible: true,
      items: [
        { name: "Staff", path: "/branch-admin/staff", icon: Users },
        { name: "Students", path: "/branch-admin/students", icon: Users },
        { name: "Teachers", path: "/branch-admin/teachers", icon: Users },
      ],
    },
    {
      category: "Attendance",
      isCollapsible: true,
      items: [
        { name: "Student Attendance", path: "/branch-admin/attendance", icon: QrCode },
        { name: "Staff Attendance", path: "/branch-admin/staff-attendance", icon: UserCheck },
        { name: "Leaves", path: "/branch-admin/leaves", icon: Calendar },
      ],
    },
    {
      category: "Finance",
      isCollapsible: true,
      items: [
        { name: "Fee Vouchers", path: "/branch-admin/fee-vouchers", icon: Receipt },
        { name: "Expenses", path: "/branch-admin/expenses", icon: Wallet },
        { name: "Finance Reports", path: "/branch-admin/reports", icon: BarChart3 },
      ],
    },
    {
      category: "System",
      items: [
        { name: "Notifications", path: "/branch-admin/notifications", icon: Sparkles },
      ],
    },
  ],

  teacher: [
    {
      category: "Overview",
      items: [{ name: "Dashboard", path: "/teacher", icon: LayoutDashboard }],
    },
    {
      category: "Academic",
      isCollapsible: true,
      items: [
        { name: "My Classes", path: "/teacher/classes", icon: School },
        { name: "Exams", path: "/teacher/exams", icon: Calendar },
        { name: "Self Attendance", path: "/teacher/self-attendance", icon: UserCheck },
      ],
    },
    {
      category: "Account",
      items: [
        { name: "Profile", path: "/teacher/profile", icon: UserCog },
      ],
    },
  ],

  student: [
    {
      category: "Overview",
      items: [{ name: "Dashboard", path: "/student", icon: LayoutDashboard }],
    },
    {
      category: "Academics",
      isCollapsible: true,
      items: [
        { name: "Assignments", path: "/student/assignments", icon: FolderOpen },
        { name: "Submissions", path: "/student/submissions", icon: FileText },
      ],
    },
    {
      category: "Account",
      items: [
        { name: "Profile", path: "/profile", icon: Users },
      ],
    },
  ],
};

/* ===================== SIDEBAR ===================== */
export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  /* ---------- Persisted States ---------- */
  const [isOpen, setIsOpen] = useState(true);
  const [expanded, setExpanded] = useState({
    Management: true,
    Overview: true,
    Academic: true,
    Personnel: false,
    Finance: false,
    Attendance: false,
    "Staff & Students": true,
    Academics: true,
  });

  /* ---------- Restore sidebar state ---------- */
  useEffect(() => {
    try {
      const savedOpen = localStorage.getItem("sidebar-open");
      const savedExpanded = localStorage.getItem("sidebar-expanded");

      if (savedOpen !== null) setIsOpen(savedOpen === "true");
      if (savedExpanded) setExpanded((prev) => ({ ...prev, ...JSON.parse(savedExpanded) }));
    } catch {
      // Ignore storage errors
    }
  }, []);

  /* ---------- Save sidebar state ---------- */
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-open", isOpen);
      localStorage.setItem("sidebar-expanded", JSON.stringify(expanded));
    } catch {
      // Ignore storage errors
    }
  }, [isOpen, expanded]);

  const role = (user?.role || "student").toLowerCase();
  const menus = useMemo(() => ROLE_MENUS[role] || ROLE_MENUS.student, [role]);

  /* ---------- Auto expand active section ---------- */
  useEffect(() => {
    menus.forEach((group) => {
      if (
        group.items.some(
          (item) =>
            pathname === item.path ||
            (item.name !== 'Dashboard' && pathname.startsWith(item.path + "/"))
        )
      ) {
        setExpanded((prev) => ({
          ...prev,
          [group.category]: true,
        }));
      }
    });
  }, [pathname, menus]);

  if (!user) return null;

  const toggleSection = (key) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  /* ===================== UI ===================== */
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed md:sticky left-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
          "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-[var(--sidebar-text)]",
          "top-0 h-screen shadow-sm",
          isOpen ? "w-60" : "w-[68px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header / Logo Section (Compact: h-14) */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-[var(--sidebar-border)] flex-shrink-0">
          {isOpen ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-bold text-sm tracking-tight text-foreground truncate leading-none">
                  SCMS <span className="text-primary">Pro</span>
                </h2>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                  Management
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
            </div>
          )}

          {isOpen && (
            <Button
              size="icon"
              variant="ghost"
              className="hidden md:flex h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
              title="Collapse sidebar"
            >
              <Menu size={16} />
            </Button>
          )}
        </div>

        {/* User Card (Compact) */}
        {isOpen && (
          <div className="px-3 pt-2.5 pb-1 flex-shrink-0">
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border">
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.fullName?.[0] || user.name?.[0] || "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-background"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user.fullName || user.name || "User"}
                </p>
                <p className="text-[10px] font-medium text-primary uppercase tracking-wider truncate">
                  {role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List (High Density, Scroll-Minimized) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3 custom-sidebar-scrollbar">
          {menus.map((group) => {
            const open = expanded[group.category] !== false;
            const hasActive = group.items.some(
              (i) => pathname === i.path || (i.name !== 'Dashboard' && pathname.startsWith(i.path + "/"))
            );

            return (
              <div key={group.category} className="space-y-0.5">
                {isOpen && (
                  <button
                    onClick={() => group.isCollapsible && toggleSection(group.category)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                      group.isCollapsible ? "cursor-pointer hover:text-primary" : "cursor-default",
                      hasActive ? "text-primary" : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    <span>{group.category}</span>
                    {group.isCollapsible && (
                      <ChevronRight
                        size={11}
                        className={cn("transition-transform duration-200", open && "rotate-90")}
                      />
                    )}
                  </button>
                )}

                {(!group.isCollapsible || open || !isOpen) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.path ||
                        (item.name !== 'Dashboard' && pathname.startsWith(item.path + "/"));

                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          scroll={false}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100",
                            !isOpen && "justify-center px-0 h-9 w-9 mx-auto"
                          )}
                        >
                          <Icon
                            size={16}
                            className={cn(
                              "flex-shrink-0 transition-transform duration-150",
                              !isActive && "group-hover:scale-105 group-hover:text-primary"
                            )}
                          />
                          {isOpen && <span className="truncate">{item.name}</span>}

                          {/* Collapsed Tooltip */}
                          {!isOpen && (
                            <div className="fixed left-[76px] px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 shadow-md pointer-events-none">
                              {item.name}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Toggle (Desktop Collapsed) */}
        {!isOpen && (
          <div className="p-2 flex justify-center border-t border-[var(--sidebar-border)] flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
              onClick={() => setIsOpen(true)}
              title="Expand sidebar"
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* Footer / Sign Out (Compact: h-9) */}
        <div className="border-t border-[var(--sidebar-border)] p-2 flex-shrink-0 space-y-1">
          {mobileOpen && (
            <Button
              variant="ghost"
              onClick={() => setMobileOpen(false)}
              className="w-full flex md:hidden items-center justify-start gap-2 px-2.5 h-8 text-xs text-muted-foreground hover:text-foreground font-medium rounded-md"
            >
              <X size={15} />
              <span>Close Menu</span>
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "group w-full h-8 rounded-md text-xs text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 font-medium transition-colors",
              isOpen ? "justify-start px-2.5" : "justify-center px-0"
            )}
            title={!isOpen ? "Sign Out" : undefined}
          >
            <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" />
            {isOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>

        <style jsx global>{`
          .custom-sidebar-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.25);
            border-radius: 10px;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(15, 42, 92, 0.4);
          }
        `}</style>
      </aside>
    </>
  );
}