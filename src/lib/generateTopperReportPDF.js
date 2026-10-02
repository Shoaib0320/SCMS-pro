/**
 * generateTopperReportPDF.js — Adamjee Coaching Centre
 * Generates official, print-ready reports:
 * 1. Top 10 Positions Report
 * 2. Complete Result / Merit List
 */

export async function generateTopperReportPDF({
  reportType = "top10", // "top10" | "complete"
  toppers = [],
  students = [],
  items = null,
  meta = {},
}) {
  const jspdfModule = await import("jspdf");
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight; // 182

  const navyColor = [15, 42, 92];     // #0f2a5c
  const textDark = [30, 41, 59];      // #1e293b
  const textMuted = [100, 116, 139];  // #64748b
  const redColor = [220, 38, 38];     // #dc2626
  const greenColor = [16, 185, 129];  // #10b981

  // Resolve list items
  const reportList =
    items !== null
      ? items
      : reportType === "top10"
      ? toppers
      : students.length > 0
      ? students
      : toppers;

  const isTop10 = reportType === "top10";

  // 1. Try to load institute logo
  let logoImg = null;
  try {
    if (typeof window !== "undefined") {
      logoImg = new Image();
      logoImg.src = "/logo.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve; // Continue without logo if failed
      });
    }
  } catch (e) {
    logoImg = null;
  }

  let y = 14;

  // 2. Header: Logo & Institute Title
  if (logoImg && logoImg.width) {
    try {
      doc.addImage(logoImg, "PNG", marginLeft, y, 18, 18);
    } catch (err) {
      console.warn("Could not draw logo:", err);
    }
  }

  // Header Text (Centered)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...navyColor);
  doc.text("ADAMJEE COACHING CENTRE", pageWidth / 2, y + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...textMuted);
  const campusLabel = meta.branchName ? `${meta.branchName}` : "Campus";
  doc.text(campusLabel, pageWidth / 2, y + 12, { align: "center" });

  y += 20;

  // 3. Report Title Banner
  doc.setFillColor(...navyColor);
  doc.roundedRect(marginLeft, y, contentWidth, 9, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const bannerTitle = isTop10
    ? "TOPPERS MERIT REPORT — TOP 10 POSITIONS"
    : "EXAMINATION REPORT — COMPLETE RESULT / MERIT LIST";
  doc.text(bannerTitle, pageWidth / 2, y + 6, { align: "center" });

  y += 13;

  // 4. Metadata Details Box (22mm height for clean 3-line layout)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginLeft, y, contentWidth, 23, 2, 2, "FD");

  doc.setFontSize(8.5);

  const col1X = marginLeft + 6;
  const col2X = marginLeft + 96;

  // Line 1: Month & Class
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navyColor);
  doc.text("Exam Month:", col1X, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text(`${meta.month || "All Months"} ${meta.year || ""}`, col1X + 28, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navyColor);
  doc.text("Selected Class:", col2X, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text(`${meta.className || "All Classes"}`, col2X + 26, y + 5.5);

  // Line 2: Section & Subject
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navyColor);
  doc.text("Section / Stream:", col1X, y + 11.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text(`${meta.sectionName || "Combined Sections"}`, col1X + 28, y + 11.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navyColor);
  doc.text("Subject Scope:", col2X, y + 11.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text(`${meta.subjectName || "All Subjects"}`, col2X + 26, y + 11.5);

  // Line 3: Summary counts & Generated Date
  const totalCount = meta.totalStudents ?? reportList.length;
  const passCount = meta.passCount ?? reportList.filter((r) => r.status === "PASS").length;
  const failCount = meta.failCount ?? reportList.filter((r) => r.status === "FAIL").length;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navyColor);
  doc.text("Candidates:", col1X, y + 17.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text(
    `Total: ${totalCount}  |  Passed: ${passCount}  |  Failed: ${failCount}`,
    col1X + 28,
    y + 17.5
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navyColor);
  doc.text("Generated On:", col2X, y + 17.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  const genDate = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.text(genDate, col2X + 26, y + 17.5);

  y += 28;

  // Helper to format marks without truncating floating marks (e.g. 145.5 stays 145.5, 146 stays 146)
  const formatMarks = (val) => {
    if (val === undefined || val === null) return "0";
    const num = Number(val);
    if (isNaN(num)) return "0";
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  };

  // 5. Build Table Rows
  const tableRows = reportList.map((t) => [
    t.rank || "—",
    t.grNo || "N/A",
    t.name || "N/A",
    t.section || t.classSection || "—",
    formatMarks(t.marksObtained),
    formatMarks(t.totalMarks),
    `${Number(t.percentage).toFixed(2)}%`,
    t.status || "PASS",
  ]);

  // 6. Draw Table with autoTable (Multi-page support)
  autoTable(doc, {
    startY: y,
    margin: { left: marginLeft, right: marginRight, bottom: 20 },
    head: [
      [
        "Rank",
        "GR No",
        "Student Name",
        "Section",
        "Obtained",
        "Total",
        "Percentage",
        "Status",
      ],
    ],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: navyColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: { top: 3, right: 1.5, bottom: 3, left: 1.5 },
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      overflow: "visible",
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 46, halign: "left", fontStyle: "bold" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 24, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 26, halign: "center", fontStyle: "bold" },
      7: { cellWidth: 18, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const rowIdx = data.row.index;
        const currentItem = reportList[rowIdx];
        const isFail = currentItem?.status === "FAIL";
        const rankNum = currentItem?.rankNumber;

        // Top 3 positions highlight (only for passing students)
        if (!isFail && rankNum === 1) {
          // 1st Rank: Light Gold Highlight
          data.cell.styles.fillColor = [254, 243, 199]; // Amber-100
          data.cell.styles.textColor = [120, 53, 15];   // Amber-900
          data.cell.styles.fontStyle = "bold";
        } else if (!isFail && rankNum === 2) {
          // 2nd Rank: Light Silver Highlight
          data.cell.styles.fillColor = [241, 245, 249]; // Slate-100
          data.cell.styles.textColor = [30, 41, 59];    // Slate-800
          data.cell.styles.fontStyle = "bold";
        } else if (!isFail && rankNum === 3) {
          // 3rd Rank: Light Bronze Highlight
          data.cell.styles.fillColor = [255, 237, 213]; // Orange-100
          data.cell.styles.textColor = [154, 52, 18];   // Orange-900
          data.cell.styles.fontStyle = "bold";
        } else if (rowIdx % 2 === 1) {
          data.cell.styles.fillColor = [248, 250, 252];
        }

        // Highlight Status column
        if (data.column.index === 7) {
          if (isFail) {
            data.cell.styles.textColor = redColor;
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [5, 150, 105]; // Emerald-600
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
  });

  // 7. Sign-off Spaces and Summary Block on the final page
  let finalY = doc.lastAutoTable.finalY + 14;

  // Check if enough room for signatures (needs ~35mm above footer margin)
  if (finalY + 36 > pageHeight - 16) {
    doc.addPage();
    finalY = 25;
  }

  // Summary Metrics Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, finalY, contentWidth, 9, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...navyColor);
  const passRate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : 0;
  doc.text(
    `Summary: Total Candidates: ${totalCount}  |  Passed: ${passCount}  |  Failed: ${failCount}  |  Pass Rate: ${passRate}%`,
    pageWidth / 2,
    finalY + 5.5,
    { align: "center" }
  );

  // Signatures
  const sigY = finalY + 24;
  const sigLineLength = 55;

  // Prepared By (Left)
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.line(marginLeft + 12, sigY, marginLeft + 12 + sigLineLength, sigY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...navyColor);
  doc.text("Prepared By", marginLeft + 12 + sigLineLength / 2, sigY + 5, {
    align: "center",
  });

  // Branch Admin / Principal (Right)
  const rightSigX = pageWidth - marginRight - 12 - sigLineLength;
  doc.line(rightSigX, sigY, rightSigX + sigLineLength, sigY);
  doc.text(
    "Branch Admin / Principal",
    rightSigX + sigLineLength / 2,
    sigY + 5,
    { align: "center" }
  );

  // 8. Add Running Page Numbers & Footer to ALL pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const footerLineY = pageHeight - 11;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, footerLineY, pageWidth - marginRight, footerLineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Official computer-generated examination merit report — Adamjee Coaching Centre.",
      marginLeft,
      pageHeight - 6.5
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - marginRight,
      pageHeight - 6.5,
      { align: "right" }
    );
  }

  // 9. Save PDF
  const prefix = isTop10 ? "Top10_Positions" : "Complete_Merit_List";
  const cleanClass = (meta.className || "Class").replace(/[^a-zA-Z0-9]/g, "_");
  const cleanSection = (meta.sectionName || "Combined").replace(/[^a-zA-Z0-9]/g, "_");
  const cleanSubject = (meta.subjectName || "All_Subjects").replace(/[^a-zA-Z0-9]/g, "_");
  const cleanMonth = (meta.month || "Month").replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `${prefix}_${cleanClass}_${cleanSection}_${cleanSubject}_${cleanMonth}_${meta.year || 2026}.pdf`;

  doc.save(fileName);
  return fileName;
}
