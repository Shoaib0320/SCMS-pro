"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import NotificationHandler from "@/components/NotificationHandler";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Check if device is mobile and set sidebar open by default
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      setMobileOpen(isMobile);
    };

    // Check on mount
    checkMobile();

    // Listen for window resize
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // if (!loading && !user) {
    //   router.push('/login');
    // }
  }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div className="flex items-center justify-center h-screen">Loading...</div>;
  // }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <NotificationHandler />
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 lg:p-5 bg-background">{children}</main>
      </div>
    </div>
  );
}




