import React from "react";
import { format } from "date-fns";

const StudentReportPrintable = React.forwardRef(({ 
  student, 
  reportData,
  branchInfo,
  monthName,
  isPreview = false
}, ref) => {
  if (!student || !reportData) return null;

  const {
    batch,
    className,
    section,
    examMarks, // Array of { subject, sec, testNo, testDate, type, obtained, total, percentage, remarks }
    grandTotalObtained,
    grandTotalMax,
    overallPercentage,
    grade,
    prevMonthSummary, // { obtained, total, percentage, grade }
    attendanceSummary // { totalDays, presentDays }
  } = reportData;

  const rollNo = student.details?.academic_info?.roll_no || student.registration_no || student.roll_no || "N/A";
  const studentName = student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || "N/A";

  const rootClass = isPreview 
    ? "bg-white text-black p-6 w-full h-full min-w-[700px]" 
    : "print-area bg-white text-black p-8 hidden print:block";

  return (
    <div ref={ref} className={rootClass} style={{ width: "100%", margin: "0 auto", fontSize: "12px", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
         <div className="w-24 h-24 bg-slate-200 flex items-center justify-center rounded-full overflow-hidden">
            <img src="/logo.png" alt="Adamjee Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none' }} />
         </div>
         <div className="text-center flex-1">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-blue-900" style={{ color: "#0f2a5c" }}>Adamjee Coaching Center</h1>
            <p className="text-sm font-semibold mt-1">{branchInfo?.name}</p>
            <p className="text-xs text-gray-600">{branchInfo?.address}</p>
         </div>
         <div className="w-24 h-24"></div>
      </div>

      {/* Marks Statement Title */}
      <div className="bg-gray-300 text-center font-bold py-1 mb-1 border border-black uppercase text-sm">
        MARKS STATEMENT
      </div>
      <div className="text-center font-semibold text-xs mb-4">
        Academic Session: {batch}
      </div>

      {/* Student Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
           <div className="flex mb-1"><span className="font-bold w-32">Student GR #:</span> <span>{rollNo}</span></div>
           <div className="flex mb-1"><span className="font-bold w-32">Student Name:</span> <span>{studentName}</span></div>
           <div className="flex mb-1"><span className="font-bold w-32">Student Type:</span> <span>STND</span></div>
        </div>
        <div>
           <div className="flex mb-1"><span className="font-bold w-32">Class:</span> <span>{className || "N/A"}</span></div>
           <div className="flex mb-1"><span className="font-bold w-32">Month:</span> <span>{monthName}</span></div>
           <div className="flex mb-1"><span className="font-bold w-32">Statement:</span> <span>Exam</span></div>
        </div>
      </div>

      {/* Marks Table */}
      <table className="w-full mb-2 border-collapse text-xs text-left" style={{ borderTop: "2px solid black", borderBottom: "2px solid black" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid black" }}>
            <th className="py-2 font-bold">Subject</th>
            <th className="py-2 font-bold text-center">Sec.</th>
            <th className="py-2 font-bold text-center">Test #</th>
            <th className="py-2 font-bold text-center">Test Date</th>
            <th className="py-2 font-bold text-center">Type</th>
            <th className="py-2 font-bold text-center">Obtained</th>
            <th className="py-2 font-bold text-center">Total</th>
            <th className="py-2 font-bold text-center">%Age</th>
            <th className="py-2 font-bold text-center">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {examMarks?.map((mark, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1.5">{mark.subject}</td>
              <td className="py-1.5 text-center">{mark.sec || section || "A"}</td>
              <td className="py-1.5 text-center">{mark.testNo || "0 / 1"}</td>
              <td className="py-1.5 text-center">{mark.testDate}</td>
              <td className="py-1.5 text-center">{mark.type || "Monthly"}</td>
              <td className="py-1.5 text-center">{mark.obtained.toFixed(1)}</td>
              <td className="py-1.5 text-center">{mark.total.toFixed(1)}</td>
              <td className="py-1.5 text-center">{mark.percentage.toFixed(1)}</td>
              <td className="py-1.5 text-center">{mark.remarks}</td>
            </tr>
          ))}
          {(!examMarks || examMarks.length === 0) && (
            <tr><td colSpan="9" className="py-4 text-center italic">No marks data found for this month</td></tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-between font-bold text-xs mb-4" style={{ borderBottom: "2px dashed black", paddingBottom: "4px" }}>
         <div>Grand Total: {grandTotalMax?.toFixed(1) || 0}</div>
         <div>Total Obtained: {grandTotalObtained?.toFixed(1) || 0}</div>
         <div>Percentage: {overallPercentage?.toFixed(2) || 0} %</div>
      </div>

      {/* Summaries & Grade Box */}
      <div className="flex justify-between items-start mb-8 gap-4">
         {/* Attendance Summary */}
         <div className="border border-dashed border-black rounded-lg p-3 flex-1 max-w-xs">
            <div className="text-center font-bold mb-2 text-xs uppercase">Attendance Summary</div>
            <div className="flex justify-between text-xs mb-1">
               <span>Total Days:</span>
               <span className="font-bold">{attendanceSummary?.totalDays || "-"}</span>
            </div>
            <div className="flex justify-between text-xs">
               <span>Present Days:</span>
               <span className="font-bold">{attendanceSummary?.presentDays || "-"}</span>
            </div>
         </div>

         {/* Grade Box */}
         <div className="border-2 border-black p-4 text-center bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[120px]">
            <div className="font-bold uppercase text-xs">Grade</div>
            <div className="text-4xl font-extrabold mt-1">{grade || "-"}</div>
         </div>
      </div>

      {/* Bar Chart */}
      {examMarks && examMarks.length > 0 && (
         <div className="border border-black p-4 mt-8 pt-8 relative">
            <div className="absolute -left-6 top-1/2 -rotate-90 font-bold text-xs">Marks</div>
            
            {(() => {
              const maxChartVal = Math.max(...examMarks.map(m => m.total), 50);
              const step = Math.ceil(maxChartVal / 10);
              const yAxisValues = Array.from({length: 11}, (_, i) => i * step).reverse();
              const actualMax = yAxisValues[0] || 100;

              return (
                <div className="flex items-end h-64 border-l border-b border-black pt-4 pl-4 gap-8">
                   {/* Y-axis labels */}
                   <div className="absolute left-2 flex flex-col justify-between h-64 text-[9px] -ml-2" style={{ bottom: "15px" }}>
                      {yAxisValues.map(v => (
                         <div key={v} className="flex items-center w-6 justify-end h-0 relative">
                            <span className="mr-1 relative -top-1.5">{v}</span>
                            <div className="w-full absolute left-6 border-t border-gray-300" style={{ width: "650px", zIndex: -1 }}></div>
                         </div>
                      ))}
                   </div>

                   {/* Bars */}
                   {examMarks.map((mark, i) => {
                      const colors = ["#0066cc", "#cc0000", "#e6e600", "#33cc33", "#00cccc", "#cc00cc", "#ff9900"];
                      const color = colors[i % colors.length];
                      
                      const totalHeightPct = Math.min((mark.total / actualMax) * 100, 100);
                      const obtainedHeightPct = Math.min((mark.obtained / mark.total) * 100, 100);

                      return (
                         <div key={i} className="flex flex-col items-center flex-1 relative group h-full justify-end">
                            {/* Total Marks background bar */}
                            <div className="w-8 md:w-10 relative flex items-end justify-center" style={{ height: `${totalHeightPct}%` }}>
                               <div className="absolute inset-0 border border-black border-dashed opacity-30" style={{ backgroundColor: color }}></div>
                               <span className="absolute -top-4 text-[9px] font-bold text-gray-500">{mark.total.toFixed(0)}</span>
                               
                               {/* Obtained Marks foreground bar */}
                               <div 
                                  className="w-full relative shadow-[2px_0px_0px_0px_rgba(0,0,0,0.5)] border border-black transition-all"
                                  style={{ height: `${obtainedHeightPct}%`, backgroundColor: color }}
                               >
                                  {/* 3D Top effect */}
                                  <div className="absolute -top-1.5 -left-[1px] w-full h-3 border border-black skew-x-[-45deg] origin-bottom-left" style={{ backgroundColor: color, filter: "brightness(1.2)" }}></div>
                                  {/* 3D Right effect */}
                                  <div className="absolute top-[-5px] -right-1.5 w-1.5 h-full border border-black skew-y-[-45deg] origin-top-left" style={{ backgroundColor: color, filter: "brightness(0.8)" }}></div>
                                  
                                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black opacity-80 z-10">
                                     {mark.obtained.toFixed(0)}
                                  </span>
                               </div>
                            </div>
                            <span className="text-[9px] font-bold mt-2 text-center w-20 truncate break-words absolute -bottom-6">{mark.subject}</span>
                         </div>
                      );
                   })}
                </div>
              );
            })()}
         </div>
      )}
      
      {/* Print Specific Global Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10mm !important;
            box-sizing: border-box;
          }
          @page {
            size: A4;
            margin: 0mm;
          }
        }
      `}} />
    </div>
  );
});

StudentReportPrintable.displayName = "StudentReportPrintable";
export default StudentReportPrintable;
