"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X, ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/lib/assets";

const mainNavLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#features", label: "Features" },
  { href: "/#admissions", label: "Admissions" },
  { href: "/#contact", label: "Contact" },
];

const campusLinks = [
  { href: "/#position-holders", label: "Achievers" },
  { href: "/#campuses", label: "Campuses" },
  { href: "/events", label: "Events" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileCampusOpen, setMobileCampusOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 bg-white ${
        isScrolled ? "shadow-sm border-b border-slate-200" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/#home" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-100 shadow-sm">
            <Image
              src="/logo.png"
              alt="SCMS Pro logo"
              fill
              className="object-contain p-1 bg-white"
              sizes="48px"
              priority
            />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              SCMS Pro
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f2a5c]">
              Coaching Centre
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {mainNavLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 hover:text-[#0f2a5c] transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {/* Campus Life Dropdown */}
          <div className="relative group py-2">
            <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#0f2a5c] transition-colors cursor-pointer">
              Campus Life
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                {campusLinks.map((subItem) => (
                  <Link
                    key={subItem.label}
                    href={subItem.href}
                    className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#0f2a5c] transition-colors"
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href={ASSETS.PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium">
              <Download className="h-4 w-4 mr-2 text-[#0f2a5c]" />
              Play Store
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-[#0f2a5c] hover:bg-[#1e3a8a] text-white font-medium shadow-sm transition-colors">
              Login
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((c) => !c)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors lg:hidden"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`border-t border-slate-200 bg-white transition-all duration-300 lg:hidden ${
          isOpen ? "max-h-screen opacity-100 pb-5" : "max-h-0 overflow-hidden opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col px-4 pt-4 gap-1">
          {mainNavLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#0f2a5c] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Campus Life Collapsible */}
          <div className="flex flex-col">
            <button
              onClick={() => setMobileCampusOpen(!mobileCampusOpen)}
              className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#0f2a5c] transition-colors text-left"
            >
              <span>Campus Life</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileCampusOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`pl-4 overflow-hidden transition-all duration-200 ${mobileCampusOpen ? "max-h-40 opacity-100 py-1" : "max-h-0 opacity-0"}`}>
              {campusLinks.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#0f2a5c] transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    setMobileCampusOpen(false);
                  }}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 px-2">
            <Link href={ASSETS.PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer" className="w-full" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium">
                <Download className="h-4 w-4 mr-2 text-[#0f2a5c]" />
                Get on Play Store
              </Button>
            </Link>
            <Link href="/login" className="w-full" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-center bg-[#0f2a5c] hover:bg-[#1e3a8a] text-white font-medium shadow-sm transition-colors">
                Login <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}