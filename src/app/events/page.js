"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, MapPin, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { EVENTS_DATA } from "@/data/events";

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-[#1c2450] py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <p className="text-sky-300 font-medium tracking-widest uppercase text-sm mb-4">Campus Life</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Events & Activities</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg leading-relaxed">
            Discover the vibrant campus life at SCMS Pro Coaching System. We believe in holistic development through sports, celebrations, and academic seminars.
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-grow max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EVENTS_DATA.map((event) => (
            <Link href={`/events/${event.slug}`} key={event.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 group hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col block">
              <div className="relative h-56 overflow-hidden">
                <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur text-[#1c2450] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {event.category}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{event.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">{event.desc}</p>
                
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {event.location}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
