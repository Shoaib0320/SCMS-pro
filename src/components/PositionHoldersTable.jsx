"use client";

import { Trophy, Medal, Award } from "lucide-react";

const HISTORICAL_POSITIONS = [
  { year: "1995", name: "Sadia Ghani", program: "Inter Pre-Engineering", position: "3rd Position" },
  { year: "1995", name: "Wajiha Noor", program: "Inter Pre-Medical", position: "3rd Position" },
  { year: "1996", name: "Maria Wahab", program: "Inter Pre-Engineering", position: "3rd Position" },
  { year: "1997", name: "Amir Abdul Aziz", program: "Matric Science", position: "1st Position" },
  { year: "1998", name: "Immaduddin", program: "Matric Science", position: "2nd Position" },
  { year: "1999", name: "Amir Abdul Aziz", program: "Inter Pre-Engineering", position: "2nd Position" },
  { year: "2000", name: "Zunaira Shabir", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2001", name: "Rabeya Saeed", program: "Inter Pre-Medical", position: "1st Position" },
  { year: "2002", name: "Rana Naimatullah", program: "Matric Science", position: "2nd Position" },
  { year: "2003", name: "Ghazanfar Ali", program: "Inter Pre-Medical", position: "2nd Position" },
  { year: "2004", name: "Sehrish Afsar", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2005", name: "Rida Khan", program: "Matric Science", position: "3rd Position" },
  { year: "2006", name: "M. Hassam", program: "Inter Pre-Engineering", position: "2nd Position" },
  { year: "2007", name: "Ahmedullah", program: "Inter Pre-Engineering", position: "2nd Position" },
  { year: "2009", name: "Rabiya Rasheed", program: "Inter Pre-Engineering", position: "4th Position" },
  { year: "2010", name: "Irfan Jafri", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2013", name: "S. M. Usman Ali", program: "Matric Science", position: "2nd Position" },
  { year: "2013", name: "Ayesha Nawab", program: "Intermediate Computer Science", position: "3rd Position" },
  { year: "2015", name: "Saira Batool Rizvi", program: "Inter Pre-Medical", position: "4th Position" },
  { year: "2016", name: "M. Muzzammil", program: "Inter Commerce", position: "1st Position" },
  { year: "2017", name: "Syed Usama Minhaj", program: "Inter Pre-Engineering", position: "4th Position" },
  { year: "2018", name: "Hina Khadim", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2019", name: "Adnan Ali Baig", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2019", name: "Hina Khadim", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2020", name: "Muhammad Sohaib", program: "Intermediate Computer Science", position: "2nd Position" },
  { year: "2020", name: "Muhammad Aliyan", program: "Inter Pre-Engineering", position: "5th Position" },
  { year: "2021", name: "Uswa Tahir", program: "Matric Science", position: "1st Position" },
  { year: "2021", name: "Ahila Ali", program: "Inter Pre-Medical", position: "1st Position" },
  { year: "2021", name: "Muhammad Ali", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2022", name: "Syed Hashim", program: "Inter Pre-Medical", position: "4th Position" },
  { year: "2024", name: "Ayesha Ashan", program: "Inter Pre-Engineering", position: "1st Position" },
  { year: "2025", name: "Muhammad Taha", program: "Inter Commerce (Among Boys)", position: "1st Position" },
  { year: "2025", name: "Umar", program: "Intermediate Computer Science", position: "5th Position" },
];

export default function PositionHoldersTable() {
  return (
    <div className="max-w-5xl mx-auto mt-16 px-4">
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#1c2450] via-[#2a3673] to-[#1c2450] p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-32 h-32" />
          </div>
          <h3 className="text-2xl font-bold mb-2 relative z-10 flex items-center justify-center gap-3">
            <Award className="w-7 h-7 text-yellow-400" /> 
            Legacy of Excellence
          </h3>
          <p className="text-blue-100 text-sm font-medium tracking-wide relative z-10">
            BOARD POSITION HOLDERS (1995 – 2025)
          </p>
        </div>
        {/* Intro Text */}
        <div className="p-6 md:p-8 bg-blue-50/30 border-b border-slate-100">
          <h4 className="text-xl font-bold text-[#1c2450] mb-3">Our Journey of Excellence</h4>
          <p className="text-slate-600 mb-3 leading-relaxed text-sm md:text-base">
            For over three decades, SCMS Pro Coaching System has consistently helped students transform their dreams into achievements. Every Board Position represents years of hard work, dedicated teaching, disciplined preparation, and the strong partnership between students, parents, and faculty.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm md:text-base">
            Our educational philosophy focuses on understanding concepts, building confidence, and preparing students not only for examinations but also for future academic and professional success.
          </p>
        </div>

        {/* Table Container with Custom Scrollbar */}
        <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f8fafc' }}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
              <tr>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Year</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Student Name</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Program</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {HISTORICAL_POSITIONS.map((record, index) => {
                // Determine icon and color based on position
                let PosIcon = null;
                let colorClass = "text-slate-600";
                let bgClass = "bg-slate-50/50";
                
                if (record.position.includes("1st")) {
                  PosIcon = Trophy;
                  colorClass = "text-amber-500 font-bold";
                  bgClass = "bg-amber-50 border-amber-100";
                } else if (record.position.includes("2nd")) {
                  PosIcon = Medal;
                  colorClass = "text-slate-400 font-bold";
                } else if (record.position.includes("3rd")) {
                  PosIcon = Medal;
                  colorClass = "text-amber-700 font-bold"; // bronze
                }

                return (
                  <tr key={`${record.year}-${record.name}-${index}`} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                        {record.year}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {record.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {record.program}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-transparent ${bgClass}`}>
                        {PosIcon && <PosIcon className={`w-4 h-4 ${colorClass}`} />}
                        <span className={`text-sm ${colorClass}`}>
                          {record.position}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          A continuous tradition of producing top-tier students across Karachi boards.
        </div>
      </div>
    </div>
  );
}
