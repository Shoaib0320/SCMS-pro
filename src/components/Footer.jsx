'use client';

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, ArrowUpRight, Download } from "lucide-react";
import { ASSETS } from "@/lib/assets";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "Admissions", href: "/#admissions" },
  { label: "Contact Us", href: "/#contact" },
];

const supportLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Account Delete Policy", href: "/delete-account-policy" },
  { label: "Student Login", href: "/login" },
  { label: "Staff Login", href: "/login" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          
          {/* Column 1: Brand details (Col span 4) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1">
                <Image
                  src="/logo.png"
                  alt="Adamjee Coaching logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight block">
                  Adamjee Coaching
                </span>
              </div>
            </Link>
            
            <p className="text-sm leading-relaxed text-slate-400">
              Empowering future leaders through academic excellence, cutting-edge technology, and modern coaching methodologies.
            </p>

            {/* <div className="flex gap-4">
              {[
                { icon: Facebook, href: "https://facebook.com" },
                { icon: Twitter, href: "https://twitter.com" },
                { icon: Instagram, href: "https://instagram.com" },
                { icon: Linkedin, href: "https://linkedin.com" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Social Link"
                  className="text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div> */}
            
            <div className="mt-2">
              <a href={ASSETS.PLAY_STORE_LINK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white">
                <Download className="h-4 w-4 text-amber-500" />
                Get it on Play Store
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (Col span 2) */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Navigation
            </h3>
            <ul className="mt-6 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors hover:text-amber-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources (Col span 3) */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Resources & Policies
            </h3>
            <ul className="mt-6 space-y-3">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors hover:text-amber-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact details (Col span 3) */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Contact Desk
              </h3>
              <div className="mt-6 space-y-5 text-sm">
                
                {/* Campus 12 */}
                <div>
                  <h4 className="text-slate-200 font-medium mb-1">Campus 12 (North Nazimabad)</h4>
                  <a href="https://wa.me/923002755421" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors"><Phone className="h-3.5 w-3.5" /> 0300-2755421</a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Adamjee+Coaching+Center+Campus+12+North+Nazimabad+Karachi" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-slate-400 mt-1 hover:text-amber-500 transition-colors"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>5 Star Chowrangi, Karachi</span></a>
                </div>

                {/* Campus 7 */}
                <div>
                  <h4 className="text-slate-200 font-medium mb-1">Campus 7 (U.P. More)</h4>
                  <a href="https://wa.me/923174725902" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors"><Phone className="h-3.5 w-3.5" /> 0317-4725902</a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Adamjee+Coaching+Center+Campus+7+U.P.+More+Karachi" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-slate-400 mt-1 hover:text-amber-500 transition-colors"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>Sector 11-B, North Karachi</span></a>
                </div>

                {/* Campus 35 */}
                <div>
                  <h4 className="text-slate-200 font-medium mb-1">Campus 35 (Orangi Town)</h4>
                  <a href="https://wa.me/923158944284" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors"><Phone className="h-3.5 w-3.5" /> 0315-8944284</a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Adamjee+Coaching+Center+Campus+35+Orangi+Town+Karachi" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-slate-400 mt-1 hover:text-amber-500 transition-colors"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>Opp. Aziz-e-Millat High School</span></a>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Adamjee Coaching Campus 12. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Powered by</span>
            <a
              href="https://globiumclouds.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-400 hover:text-amber-500 transition-colors"
            >
              Globium Clouds
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
