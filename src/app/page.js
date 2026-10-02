'use client';
import "./landing.css";
import { ASSETS } from "@/lib/assets";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WelcomeScreen from "@/components/WelcomeScreen";
import PositionHoldersTable from "@/components/PositionHoldersTable";
import { EVENTS_DATA } from "@/data/events";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Award, BookOpen, Calendar, CheckCircle, 
  DollarSign, GraduationCap, Mail, MapPin,
  School, Star, Trophy, UserCheck, Users2, LineChart, Sparkles,
  Target, Zap, Shield, ChevronRight, Play, Monitor,
  Pencil, PenTool, Lightbulb, Compass, Ruler, Calculator, Book,
  Facebook, MessageCircle, Phone
} from "lucide-react";

const STATS = [
  { value: "35", suffix: "+", label: "Years of Educational Excellence" },
  { value: "35", suffix: "", label: "Campuses Across Karachi" },
  { value: "30", suffix: "+", label: "Board Position Holders" },
  { value: "100000", suffix: "s", label: "Of Successful Students" },
];

const FEATURES = [
  { icon: Lightbulb, title: "Concept-Based Learning", desc: "Emphasis on conceptual understanding rather than rote memorization.", color: "from-blue-500 to-cyan-400" },
  { icon: UserCheck, title: "Experienced Faculty", desc: "Highly experienced teachers committed to providing quality education.", color: "from-emerald-500 to-teal-400" },
  { icon: Users2, title: "Small Batch Sizes", desc: "Individual attention ensures better understanding and performance.", color: "from-violet-500 to-purple-400" },
  { icon: Target, title: "Monthly Assessments", desc: "Regular tests help students evaluate their progress and stay prepared.", color: "from-orange-500 to-amber-400" },
  { icon: Shield, title: "Individual Attention", desc: "Personalized academic support to overcome learning challenges.", color: "from-pink-500 to-rose-400" },
  { icon: Monitor, title: "Digital Attendance", desc: "Advanced system for accurate tracking and parent notifications.", color: "from-indigo-500 to-blue-400" },
  { icon: Zap, title: "Modern Environment", desc: "Projectors, digital resources, and CCTV security at select campuses.", color: "from-sky-500 to-cyan-400" },
];

const CAMPUSES_DATA = [
  { 
    id: "campus-12",
    name: "Campus-12 (North Nazimabad)", 
    established: "2004",
    director: "Syed Aman Arshad",
    address: "C-26, Block I, Behind Imam Clinic, 5 Star Chowrangi, North Nazimabad, Karachi.",
    desc: "Offers a disciplined academic environment, experienced faculty, and modern educational facilities, including air-conditioned classrooms. Coaching for the Aga Khan Board curriculum is also provided.",
    img: ASSETS.CAMPUS_12_IMAGE,
    icon: School,
    color: "from-blue-600 to-indigo-700",
    whatsapp: "https://wa.me/923002755421?text=Hello%20SCMS Pro%20Coaching%20Centre%20Campus%2012%2C%20I%20would%20like%20to%20know%20more%20about%20admissions!",
    call: "tel:03002755421",
    facebook: "https://facebook.com/scmspro",
    map: "https://www.google.com/maps/place/SCMS Pro+Coaching+Centre+-+Campus+12/@24.9439253,67.0469434,15z/data=!4m6!3m5!1s0x3eb340807114c837:0x7c1877bc45969bd6!8m2!3d24.9439132!4d67.0469274!16s%2Fg%2F1tcvmrlm!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDcyNi4wIKXMDSoASAFQAw%3D%3D"
  },
  { 
    id: "campus-7",
    name: "Campus-7 (U.P. More)", 
    established: "1999",
    director: "Gulshad Malik",
    address: "A-977, Sector 11-B, U.P. More, North Karachi.",
    desc: "Known for its commitment to quality education, experienced teachers, and a supportive learning atmosphere.",
    img: ASSETS.CAMPUS_7_IMAGE,
    icon: MapPin,
    color: "from-emerald-600 to-teal-700",
    whatsapp: "https://wa.me/923174725902?text=Hello%20SCMS Pro%20Coaching%20Centre%20Campus%207%2C%20I%20would%20like%20to%20know%20more%20about%20admissions!",
    call: "tel:03174725902",
    facebook: "https://facebook.com/scmspro",
    map: "https://www.google.com/maps/place/24%C2%B058'23.5%22N+67%C2%B003'57.7%22E/@24.9731953,67.0660247,16.99z/data=!4m4!3m3!8m2!3d24.9731944!4d67.0660278!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDcyNi4wIKXMDSoASAFQAw%3D%3D"
  },
  { 
    id: "campus-35",
    name: "Campus-35 (Orangi Town)", 
    established: "2023",
    director: "Syed Hasham Uddin Ahmed",
    address: "LS-15, Sector 13/D, Opposite Aziz-e-Millat High School, Orangi Town, Karachi.",
    desc: "Offers concept-based learning, modern classrooms, transport facilities, and merit-based scholarship opportunities for eligible students.",
    img: ASSETS.CAMPUS_35_IMAGE,
    icon: MapPin,
    color: "from-amber-500 to-orange-600",
    whatsapp: "https://wa.me/923158944284?text=Hello%20SCMS Pro%20Coaching%20Centre%20Campus%2035%2C%20I%20would%20like%20to%20know%20more%20about%20admissions!",
    call: "tel:03158944284",
    facebook: "https://facebook.com/scmspro",
    map: "https://www.google.com/maps/place/SCMS Pro+Coaching+Centre+(Orangi+Campus)/@24.9509513,66.9992516,17z/data=!4m6!3m5!1s0x3eb341397a74ba1f:0x6999e522efb5f021!8m2!3d24.9509465!4d67.0018265!16s%2Fg%2F11mdgspc87!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDcyNi4wIKXMDSoASAFQAw%3D%3D"
  },
];

const POSITION_HOLDERS = [
  { rank: 1, name: "Ahila Ali", grade: "Inter Pre-Medical", score: "1st", subject: "Board Position 2021", bg: "from-sky-400 to-blue-600", photo: ASSETS.ACHIEVER_AHILA_ALI },
  { rank: 2, name: "Muhammad Ali", grade: "Inter Pre-Engineering", score: "1st", subject: "Board Position 2021", bg: "from-violet-400 to-purple-600", photo: ASSETS.ACHIEVER_MUHAMMAD_ALI },
  { rank: 3, name: "Amna Ashan", grade: "Inter Pre-Engineering", score: "1st", subject: "Board Position 2024", bg: "from-slate-400 to-slate-600", photo: ASSETS.ACHIEVER_AMNA_ASHAN },
  { rank: 4, name: "Ubaid Hashmi", grade: "Inter Pre-Medical", score: "4th", subject: "Board Position 2022", bg: "from-orange-400 to-amber-600", photo: ASSETS.ACHIEVER_UBAID_HASHMI },
  { rank: 5, name: "Muhammad Umer", grade: "Inter Computer Science", score: "5th", subject: "Board Position 2025", bg: "from-yellow-400 to-orange-500", photo: ASSETS.ACHIEVER_MUHAMMAD_UMER },
  { rank: 6, name: "Mohammad Ali", grade: "Inter Commerce", score: "1st", subject: "Board Position 2025", bg: "from-blue-400 to-indigo-600", photo: ASSETS.ACHIEVER_MUHAMMAD_ALI_COMMERCE },
  { rank: 1, name: "Uswa Tahir", grade: "Matric Science", score: "1st", subject: "Board Position 2021", bg: "from-pink-400 to-rose-600", photo: ASSETS.ACHIEVER_USWA_TAHIR },
];

const TESTIMONIALS = [
  { quote: "Best coaching centre in Karachi. My child's result improved dramatically!", name: "Sara Malik", role: "Parent of Class 10 student", avatar: "SM" },
  { quote: "The parent portal keeps us updated daily. Attendance and fees — all in one place.", name: "Omar Qureshi", role: "Parent of Class 8 student", avatar: "OQ" },
  { quote: "Teachers are highly qualified and the management system is excellent.", name: "Nadia Khan", role: "Parent of Class 12 student", avatar: "NK" },
  { quote: "QR attendance is brilliant. I get instant SMS when my child reaches campus.", name: "Ahmed Raza", role: "Parent of Class 9 student", avatar: "AR" },
];

const ADMISSION_STEPS = [
  { step: "01", title: "Admission Form", text: "Collect and fill the admission form from the campus.", icon: ChevronRight },
  { step: "02", title: "Document Submission", text: "Submit previous mark sheets and two passport-sized photographs.", icon: ChevronRight },
  { step: "03", title: "Fee Payment", text: "Pay admission and first month's fee at the campus desk.", icon: ChevronRight },
  { step: "04", title: "Orientation & ID", text: "Attend orientation and receive your student ID card.", icon: ChevronRight },
];

const PROGRAMS = [
  { 
    title: "Matric Programs", 
    desc: "Science Group", 
    icon: Book,
    courses: [
      "Class IX Science",
      "Class X Science"
    ]
  },
  { 
    title: "Intermediate Programs", 
    desc: "Pre-Engineering, Pre-Medical, CS & Commerce", 
    icon: GraduationCap,
    courses: [
      "First Year Pre-Engineering",
      "Second Year Pre-Engineering",
      "First Year Pre-Medical",
      "Second Year Pre-Medical",
      "First Year Computer Science",
      "Second Year Computer Science",
      "First Year Commerce",
      "Second Year Commerce"
    ]
  },
  { 
    title: "Entry Test Prep", 
    desc: "Specialized preparation", 
    icon: Target,
    courses: [
      "MDCAT",
      "ECAT",
      "NED University Entry Test",
      "IBA Admission Test",
      "FAST Admission Test",
      "NUST Admission Test"
    ]
  },
];

function useCounter(end, isVisible) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const target = parseInt(end);
    let start = 0;
    const dur = 2000;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(target * ease));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(target);
    };
    requestAnimationFrame(tick);
  }, [isVisible, end]);
  return val;
}

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function StatCard({ value, suffix, label }) {
  const [ref, inView] = useInView();
  const count = useCounter(value, inView);
  return (
    <div ref={ref} className="lp-stat-card">
      <div className="lp-stat-number">{count}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function ScrollSection({ children, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`lp-scroll-section ${inView ? "lp-scroll-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentAchiever, setCurrentAchiever] = useState(0);
  const [testimonialPaused, setTestimonialPaused] = useState(false);
  const [achieverPaused, setAchieverPaused] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    if (testimonialPaused) return;
    const iv = setInterval(() => setCurrentTestimonial(p => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(iv);
  }, [testimonialPaused]);

  useEffect(() => {
    if (achieverPaused) return;
    const iv = setInterval(() => setCurrentAchiever(p => (p + 1) % POSITION_HOLDERS.length), 3500);
    return () => clearInterval(iv);
  }, [achieverPaused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSent(true);
    setContactForm({ name: "", phone: "", message: "" });
    setTimeout(() => setFormSent(false), 5000);
  };

  return (
    <div className="lp-root">
      <div className="lp-main-layout-wrapper lp-layout-visible">
        <Navbar />

        <section id="home" className="relative flex flex-col items-center justify-center md:min-h-[calc(100vh-80px)] px-4 pt-10 pb-16 md:py-20 text-center overflow-hidden bg-slate-50">
          
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm mb-8">
              <School className="w-4 h-4 text-[#0f2a5c]" />
              <span>Since 1989 | Excellence in Education</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Building Bright Futures Through <br className="hidden md:block" />
              <span className="text-[#0f2a5c]">Quality Education</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed mb-10">
              For more than 35 years, SCMS Pro Coaching System has been dedicated to empowering students through concept-based learning and academic excellence. Since founded in 1989, we have built a strong reputation for helping students achieve outstanding results in Matric and Intermediate examinations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
              <Link href="/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-[#0f2a5c] hover:bg-[#1e3a8a] text-white rounded-xl shadow-md transition-all">
                  Apply for Admission <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#campuses" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-[#0f2a5c] rounded-xl shadow-sm transition-all">
                  <MapPin className="w-5 h-5 mr-2" /> Explore Our Campuses
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 w-full max-w-4xl px-2 sm:px-0">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center p-3 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f2a5c] mb-1 sm:mb-2">{s.value}{s.suffix}</span>
                  <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wide text-center">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ── NEWS TICKER ── */}
      <div className="lp-news-ticker">
        <div className="lp-ticker-label">Updates</div>
        <div className="lp-ticker-wrap">
          <div className="lp-ticker-track">
            <span className="lp-ticker-item">🌟 Admissions Open for <strong>Session 2026</strong>. Register Now!</span>
            <span className="lp-ticker-item">🚀 <strong>95% Pass Rate</strong> in Board Exams.</span>
            <span className="lp-ticker-item">💡 New <strong>AI-Driven Analytics</strong> introduced for parents.</span>
            <span className="lp-ticker-item">📢 Next Campus 12 Grand Seminar on <strong>28th May</strong>.</span>
            {/* Duplicated for seamless loop */}
            <span className="lp-ticker-item">🌟 Admissions Open for <strong>Session 2026</strong>. Register Now!</span>
            <span className="lp-ticker-item">🚀 <strong>95% Pass Rate</strong> in Board Exams.</span>
            <span className="lp-ticker-item">💡 New <strong>AI-Driven Analytics</strong> introduced for parents.</span>
            <span className="lp-ticker-item">📢 Next Campus 12 Grand Seminar on <strong>28th May</strong>.</span>
          </div>
        </div>
      </div>

      {/* ── ABOUT SCMS PRO COACHING SYSTEM ── */}P
      <section id="about" className="lp-section lp-about-section">
        <ScrollSection className="lp-about-grid">
          <div className="lp-about-visual px-2 md:px-0">
            <div className="relative">
              <div className="rounded-[2rem] overflow-hidden border-4 md:border-8 border-white shadow-[0_25px_50px_rgba(0,0,0,0.1)]">
                <img src={ASSETS.DIRECTOR_IMAGE} alt="SCMS Pro Directors" className="w-full h-[350px] md:h-[550px] object-cover" />
              </div>
              <div className="absolute bottom-4 right-2 md:bottom-12 md:-right-8 bg-[#0f2a5c] text-white rounded-[1.25rem] p-3 md:p-5 text-center shadow-[0_8px_32px_rgba(15,42,92,0.4)]">
                <span className="block text-xl md:text-3xl font-extrabold leading-none">1989</span>
                <span className="block text-[10px] md:text-[13px] font-semibold opacity-90 mt-1">Established</span>
              </div>
            </div>
          </div>
          <div className="lp-about-text">
            <p className="lp-eyebrow">About Us</p>
            <h2 className="lp-section-heading">SCMS Pro<br /><span className="text-[#0f2a5c]">Centre</span></h2>
            <p className="lp-body-text">
              SCMS Pro Coaching System is one of Pakistan&apos;s trusted coaching institutions, committed to providing quality education through concept-based learning and academic excellence. Established in 1989 by <strong>Syed Kamran Rasool Qadri</strong> and <strong>Syed Nouman Ahmed</strong>, the institution has played a significant role in shaping the academic future of thousands of students.
            </p>
            <p className="lp-body-text mt-4">
              Over the decades, SCMS Pro Coaching System has expanded into a well-recognized educational network with multiple campuses across Karachi. Our dedicated faculty, disciplined learning environment, and commitment to student success have earned the trust of both students and parents. We believe that education is not simply about preparing students for examinations—it is about developing critical thinking, confidence, discipline, and the ability to succeed in every walk of life.
            </p>
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Target className="w-5 h-5 text-blue-500" /> Our Mission</h3>
                <p className="text-slate-600 mt-2">Our mission is to empower students through concept-based learning, academic excellence, and quality education while helping them to build their wisdom, knowledge, confidence, and skills necessary for lifelong success.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Compass className="w-5 h-5 text-blue-500" /> Our Vision</h3>
                <p className="text-slate-600 mt-2">Our vision is to be one of Pakistan&apos;s most trusted coaching institutions by empowering students through quality education, innovation, and continuous academic excellence.</p>
              </div>
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats-section">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section id="features" className="lp-section bg-white">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Why Choose Us</p>
            <h2 className="lp-section-heading">Why SCMS Pro<br /><span className="text-[#0f2a5c]">Coaching Centre?</span></h2>
            <p className="lp-section-desc">We emphasize conceptual understanding rather than rote memorization, enabling students to develop strong academic foundations and problem-solving skills.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon bg-slate-100 text-[#0f2a5c]">
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </ScrollSection>
      </section>

      {/* ── PROGRAMS ── */}
      <section id="programs" className="lp-section bg-slate-50">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Our Programs</p>
            <h2 className="lp-section-heading">Academic<br /><span className="text-[#0f2a5c]">Offerings</span></h2>
            <p className="lp-section-desc">SCMS Pro Coaching System offers comprehensive coaching for Matric, Intermediate, and Entry Test preparation.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 items-start">
            {PROGRAMS.map((p) => (
              <div key={p.title} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 shrink-0">
                  <p.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">{p.desc}</p>
                <ul className="space-y-3">
                  {p.courses.map((course, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="leading-tight pt-0.5">{course}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollSection>
      </section>

      {/* ── CAMPUSES ── */}
      <section id="campuses" className="lp-section bg-white">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Our Network</p>
            <h2 className="lp-section-heading">Our<br /><span className="text-[#0f2a5c]">Campuses</span></h2>
            <p className="lp-section-desc">SCMS Pro Coaching System proudly serves students through multiple campuses across Karachi. This website provides information about our following campuses:</p>
          </div>
          <div className="max-w-6xl mx-auto px-4 grid gap-8 md:grid-cols-3">
            {CAMPUSES_DATA.map((campus) => (
              <div key={campus.id} className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-900/10">
                <div className="p-6 pb-2 border-b border-slate-100 bg-slate-50">
                  <div className="flex flex-col gap-2 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{campus.name}</h3>
                    <div className="self-start bg-white border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Est. {campus.established}
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start gap-3 mb-4 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                    <span>{campus.address}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-4 text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Director: {campus.director}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">
                    {campus.desc}
                  </p>
                  
                  {/* Social & Contact Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-auto">
                    <a href={campus.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex justify-center items-center gap-1.5 px-2 h-10 rounded-xl border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors whitespace-nowrap">
                      <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
                    </a>
                    <a href={campus.call} className="flex-1 inline-flex justify-center items-center gap-1.5 px-2 h-10 rounded-xl border border-blue-200 bg-blue-50 text-[13px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors whitespace-nowrap">
                      <Phone className="w-4 h-4 shrink-0" /> Call
                    </a>
                    <a href={campus.map} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center w-10 h-10 shrink-0 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-colors" title="Google Maps">
                      <MapPin className="w-4 h-4" />
                    </a>
                    <a href={campus.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center w-10 h-10 shrink-0 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors" title="Facebook">
                      <Facebook className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollSection>
      </section>

      {/* ── POSITION HOLDERS CAROUSEL ── */}
      <section id="position-holders" className="lp-section lp-achievers-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Position Holders</p>
            <h2 className="lp-section-heading">Our Star<br /><span className="text-[#0f2a5c]">Achievers 2025</span></h2>
            <p className="lp-section-desc">Celebrating the outstanding students who made SCMS Pro proud this year.</p>
          </div>
          <div className="lp-ph-carousel-wrap"
            onMouseEnter={() => setAchieverPaused(true)}
            onMouseLeave={() => setAchieverPaused(false)}
          >
            <div className="lp-ph-carousel">
              {POSITION_HOLDERS.map((p, i) => {
                const total = POSITION_HOLDERS.length;
                const offset = (i - currentAchiever + total) % total;
                const isCenter = offset === 0;
                const isPrev = offset === total - 1;
                const isNext = offset === 1;
                const isFarPrev = offset === total - 2;
                const isFarNext = offset === 2;
                return (
                  <div
                    key={p.name}
                    className={`lp-ph-card ${isCenter ? "lp-ph-center" : isPrev ? "lp-ph-prev" : isNext ? "lp-ph-next" : isFarPrev ? "lp-ph-far-prev" : isFarNext ? "lp-ph-far-next" : "lp-ph-hidden"}`}
                    onClick={() => setCurrentAchiever(i)}
                  >
                    <div className="lp-achiever-avatar bg-slate-100 text-[#0f2a5c]">
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <>
                          {p.rank === 1 && <Trophy className="h-8 w-8 text-white" />}
                          {p.rank !== 1 && <span className="lp-achiever-rank">#{p.rank}</span>}
                        </>
                      )}
                    </div>
                    {p.rank === 1 && (
                      <div className="lp-achiever-crown">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>Top Achiever</span>
                      </div>
                    )}
                    <h3 className="lp-achiever-name">{p.name}</h3>
                    <p className="lp-achiever-grade">{p.grade}</p>
                    <div className="lp-achiever-score">{p.score}</div>
                    <p className="lp-achiever-subject">{p.subject}</p>
                  </div>
                );
              })}
            </div>
            <div className="lp-ph-dots">
              {POSITION_HOLDERS.map((_, i) => (
                <button key={i} onClick={() => setCurrentAchiever(i)} className={`lp-dot ${i === currentAchiever ? "lp-dot-active" : ""}`} />
              ))}
            </div>
          </div>
          
          <PositionHoldersTable />
        </ScrollSection>
      </section>

      {/* ── FACILITIES & SERVICES ── */}
      <section className="lp-section bg-white">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Campus Life</p>
            <h2 className="lp-section-heading">Facilities &<br /><span className="text-[#0f2a5c]">Student Services</span></h2>
            <p className="lp-section-desc">Experience a vibrant and enriching environment designed to support your academic journey.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto px-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><School className="w-6 h-6 text-blue-600" /> Facilities</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Well-equipped, air-conditioned classrooms</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Comfortable seating arrangements</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Separate washrooms for boys and girls</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Clean drinking water facilities</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Dedicated multimedia rooms for interactive learning</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> CCTV surveillance for student safety</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><UserCheck className="w-6 h-6 text-blue-600" /> Student Services</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Strict discipline and academic monitoring</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Regular feedback to parents</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Backup electricity to ensure uninterrupted classes</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Comprehensive study notes and resources</li>
                <li className="flex items-start gap-3 text-slate-600"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> Pick-and-drop facility available for students</li>
              </ul>
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ── EVENTS TEASER ── */}
      <section className="lp-section bg-slate-50">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Campus Life</p>
            <h2 className="lp-section-heading">Recent<br /><span className="text-[#0f2a5c]">Events</span></h2>
            <p className="lp-section-desc">Glimpses of our vibrant campus activities, celebrations, and academic seminars.</p>
          </div>
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 mb-12">
            {EVENTS_DATA.slice(0, 3).map((ev) => (
              <Link href={`/events/${ev.slug}`} key={ev.slug} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 group relative block">
                <div className="h-48 overflow-hidden relative">
                  <img src={ev.thumbnail} alt={ev.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-amber-400 text-xs font-bold mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {ev.date}</p>
                    <h3 className="text-white font-bold leading-tight">{ev.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/events" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#0f2a5c] text-white font-bold hover:bg-[#1e3a8a] shadow-sm transition-all">
              View All Events <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </ScrollSection>
      </section>

      {/* ── ADMISSIONS ── */}
      <section id="admissions" className="lp-section lp-admissions-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Admissions & Scholarships</p>
            <h2 className="lp-section-heading">Join SCMS Pro<br /><span className="text-[#0f2a5c]">Today</span></h2>
            <p className="lp-section-desc">Admissions are now open for the 2026 academic year. Secure your seat today and explore our scholarship opportunities!</p>
          </div>
          <div className="lp-steps-grid">
            {ADMISSION_STEPS.map((s) => (
              <div key={s.step} className="lp-step-card">
                <div className="lp-step-number">{s.step}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-text">{s.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 bg-blue-50 rounded-3xl p-8 max-w-5xl mx-auto border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-slate-800">Scholarship Programs</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h4 className="font-bold text-slate-800 mb-2">Need-Based</h4>
                <p className="text-sm text-slate-600">Financial assistance for deserving students.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h4 className="font-bold text-slate-800 mb-2">Merit-Based</h4>
                <p className="text-sm text-slate-600">Up to 100% off for board position holders.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h4 className="font-bold text-slate-800 mb-2">Special Discounts</h4>
                <p className="text-sm text-slate-600">Special fee concessions for Orphans and Hafiz-e-Quran.</p>
              </div>
            </div>
          </div>
          <div className="lp-admissions-cta">
            <Link href="/login">
              <Button className="bg-[#0f2a5c] hover:bg-[#1e3a8a] text-white px-8 py-6 text-lg rounded-xl shadow-md transition-all">
                Apply Now <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </ScrollSection>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="lp-section lp-contact-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Contact Us</p>
            <h2 className="lp-section-heading">Get in Touch<br /><span className="text-[#0f2a5c]">With Our Team</span></h2>
          </div>
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-16 max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col gap-6">
                
                {/* Campus 12 */}
                <div className="lp-contact-card-premium">
                  <div className="lp-contact-icon-box bg-[#0f2a5c] text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="lp-contact-card-content">
                    <span className="lp-contact-card-label">Campus 12 (North Nazimabad)</span>
                    <a href="https://www.google.com/maps/search/?api=1&query=SCMS Pro+Coaching+Center+Campus+12+North+Nazimabad+Karachi" target="_blank" rel="noopener noreferrer" className="lp-contact-card-text mb-1 hover:text-[#0f2a5c] block transition-colors">C-26, Block I, Behind Imam Clinic, 5 Star Chowrangi, Karachi</a>
                    <a href="https://wa.me/923002755421" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-green-600 block transition-colors">☎ 0300-2755421 | 021-36633586</a>
                    <a href="mailto:campus12@scmspro.com" className="text-sm font-medium text-slate-700 hover:text-blue-600 block transition-colors">campus12@scmspro.com</a>
                  </div>
                </div>

                {/* Campus 7 */}
                <div className="lp-contact-card-premium">
                  <div className="lp-contact-icon-box bg-emerald-600 text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="lp-contact-card-content">
                    <span className="lp-contact-card-label">Campus 7 (U.P. More)</span>
                    <a href="https://www.google.com/maps/search/?api=1&query=SCMS Pro+Coaching+Center+Campus+7+U.P.+More+Karachi" target="_blank" rel="noopener noreferrer" className="lp-contact-card-text mb-1 hover:text-emerald-600 block transition-colors">A-977, Sector 11-B, U.P. More, North Karachi, Karachi</a>
                    <a href="https://wa.me/923174725902" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-green-600 block transition-colors">☎ 0317-4725902 | 021-36985445</a>
                    <a href="mailto:campus7@scmspro.com" className="text-sm font-medium text-slate-700 hover:text-blue-600 block transition-colors">campus7@scmspro.com</a>
                  </div>
                </div>

                {/* Campus 35 */}
                <div className="lp-contact-card-premium">
                  <div className="lp-contact-icon-box bg-purple-600 text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="lp-contact-card-content">
                    <span className="lp-contact-card-label">Campus 35 (Orangi Town)</span>
                    <a href="https://www.google.com/maps/search/?api=1&query=SCMS Pro+Coaching+Center+Campus+35+Orangi+Town+Karachi" target="_blank" rel="noopener noreferrer" className="lp-contact-card-text mb-1 hover:text-purple-600 block transition-colors">Opp. Aziz-e-Millat High School, 11-1/2, Orangi Town, Karachi</a>
                    <a href="https://wa.me/923158944284" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-green-600 block transition-colors">☎ 0315-8944284</a>
                    <a href="mailto:campus35@scmspro.com" className="text-sm font-medium text-slate-700 hover:text-blue-600 block transition-colors">campus35@scmspro.com</a>
                  </div>
                </div>

              </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="lp-contact-form-premium">
              <div className="lp-contact-form-header">
                <h3 className="lp-contact-form-title">Send a Message</h3>
                <p className="lp-contact-form-subtext">Have questions? We&apos;ll reply within 24 hours.</p>
              </div>
              {formSent && (
                <div className="lp-form-success">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span>Message sent! We&apos;ll contact you soon.</span>
                </div>
              )}
              <div className="lp-form-group">
                <label className="lp-form-label">Full Name</label>
                <input
                  className="lp-form-input"
                  type="text"
                  placeholder="Your Name"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm(p => ({...p, name: e.target.value}))}
                />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Phone Number</label>
                <input
                  className="lp-form-input"
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  value={contactForm.phone}
                  onChange={e => setContactForm(p => ({...p, phone: e.target.value}))}
                />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Message</label>
                <textarea
                  className="lp-form-input lp-form-textarea"
                  placeholder="How can we help you?"
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={e => setContactForm(p => ({...p, message: e.target.value}))}
                />
              </div>
              <Button type="submit" className="bg-[#0f2a5c] hover:bg-[#1e3a8a] text-white w-full justify-center py-6">
                Send Message <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>
        </ScrollSection>
      </section>
      <Footer />
      </div>
    </div>
  );
}
