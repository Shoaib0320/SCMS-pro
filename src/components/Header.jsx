//src/components/Header.jsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  ChevronDown, 
  Menu as MenuIcon, 
  X, 
  Settings, 
  LogOut, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header({ mobileOpen, setMobileOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    const userRole = user?.role?.toUpperCase();
    const rolePath = userRole?.toLowerCase().replace("_", "-");
    router.push(`/${rolePath}/profile`);
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Get page title based on pathname
  const getPageTitle = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return "Dashboard Overview";
    
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
  }, [pathname]);

  const getBreadcrumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getUserInitials = () => {
    const name = user?.fullName || user?.name || "User";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border transition-colors">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        
        {/* Left Section: Title & Breadcrumbs */}
        <div className="flex flex-col min-w-0">
           <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
              <Link href="/" className="hover:text-primary transition-colors">SCMS Pro</Link>
              <ChevronDown className="w-2 h-2 -rotate-90" />
              <span className="text-foreground/70">{getBreadcrumbs[0]}</span>
           </div>
           <div className="flex items-center gap-2.5">
             <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {getPageTitle}
             </h1>
             {user?.branch?.name && (
               <span className="hidden sm:inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border-primary/20">
                 {user.branch.name}
               </span>
             )}
           </div>
        </div>

        {/* Center Section: Spacer */}
        <div className="flex-1" />

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 rounded-lg hover:bg-secondary transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4 text-foreground" /> : <MenuIcon className="w-4 h-4 text-foreground" />}
          </Button>

          {/* Quick Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-1">
             <NotificationBell />
          </div>

          <div className="w-px h-6 bg-border mx-0.5 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary/80 transition-all border border-transparent hover:border-border group"
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
                  {getUserInitials()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-background" />
              </div>

              <div className="hidden md:flex flex-col text-left">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {user?.fullName || "User Account"}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {user?.role?.replace("_", " ")}
                  </span>
                  <ChevronDown className={cn(
                    "w-2.5 h-2.5 text-muted-foreground transition-transform duration-200",
                    isDropdownOpen && "rotate-180"
                  )} />
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                
                <div className="px-3.5 py-2 border-b border-border">
                   <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Signed in as</p>
                   <p className="text-xs font-semibold text-foreground truncate">{user?.email}</p>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full gap-2.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span>My Profile</span>
                  </button>

                  <button
                    className="flex items-center w-full gap-2.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <span>Account Settings</span>
                  </button>
                </div>

                <div className="px-1 pt-1 border-t border-border mt-1">
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
