import { notFound } from "next/navigation";
import { EVENTS_DATA } from "@/data/events";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import fs from "fs";
import path from "path";

export async function generateStaticParams() {
  return EVENTS_DATA.map((event) => ({
    slug: event.slug,
  }));
}

export default async function EventDetailPage({ params }) {
  const resolvedParams = await params;
  const eventData = EVENTS_DATA.find((e) => e.slug === resolvedParams.slug);

  if (!eventData) {
    notFound();
  }

  // Dynamically load all images in the event's directory
  const imagesDir = path.join(process.cwd(), "public", "events", eventData.slug);
  let eventImages = [];
  
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    eventImages = files
      .filter(file => /\.(jpe?g|png|webp|gif)$/i.test(file))
      .map(file => `/events/${eventData.slug}/${file}`);
  }

  const event = { ...eventData, images: eventImages };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-[#1c2450] py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Link href="/events" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {event.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-4xl">{event.title}</h1>
          <div className="flex flex-wrap gap-6 text-blue-100">
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="w-5 h-5 text-sky-400" />
              {event.date}
            </div>
            <div className="flex items-center gap-2 font-medium">
              <MapPin className="w-5 h-5 text-sky-400" />
              {event.location}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">About this Event</h2>
          <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">{event.desc}</p>
        </div>

        {/* Gallery Grid */}
        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          Event Gallery <span className="bg-slate-100 text-slate-600 text-sm py-1 px-3 rounded-full">{event.images.length} Photos</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {event.images.map((img, index) => (
            <div key={index} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 group relative shadow-sm border border-slate-200">
              <img 
                src={img} 
                alt={`${event.title} - Photo ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
