import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KeyIcon } from 'lucide-react';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
};

export const generateSalarySlipPDF = async (payroll, employee) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Colors from the image
  const tealColor = [0, 153, 168]; // Primary Teal
  const textBlack = [30, 30, 30];
  const borderGray = [220, 220, 220];

  // --- 1. THE MODERN HEADER (Exact Image Style) ---
  doc.setFillColor(...tealColor);
  doc.rect(0, 0, 210, 45, 'F'); // Top bar

  // Drawing the white diagonal shape like in the image
  doc.setFillColor(255, 255, 255);
  doc.triangle(90, 45, 120, 0, 120, 45, 'F');
  doc.rect(120, 0, 90, 45, 'F');

  // Coaching Logo Icon (Geometric rectangles for a modern look)
  doc.setFillColor(255, 255, 255);
  doc.rect(20, 15, 3, 12, 'F');
  doc.rect(25, 10, 3, 17, 'F');
  doc.rect(30, 18, 3, 9, 'F');

  // Coaching Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SCMS PRO', 40, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fulfilling Your Educational Needs', 40, 28);

  // PAYSLIP Text (Right Aligned Teal)
  doc.setTextColor(...tealColor);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 195, 30, { align: 'right' });

  // --- 2. EMPLOYEE INFORMATION ---
  let yPos = 60;
  doc.setTextColor(...textBlack);
  doc.setFontSize(20);
  doc.text('EMPLOYEE INFORMATION:', 105, yPos, { align: 'center' });

  yPos += 15;
  const designation = employee.role === 'teacher' ? (employee.teacherProfile?.designation || 'Teacher') : (employee.staffProfile?.role || 'Staff');
  const employeeId = employee.teacherProfile?.employeeId || employee.staffProfile?.employeeId || 'N/A';

  doc.setFontSize(11);
  // Left Side
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employee.firstName} ${employee.lastName}`, 58, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Position:', 20, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(designation, 58, yPos + 8);

  // Right Side
  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', 115, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employeeId, 150, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', 115, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.role.replace('_', ' ').toUpperCase(), 150, yPos + 8);

  // --- 3. SALARY BREAKDOWN TABLE ---
  yPos += 22;
  const formatMoney = (amount) => `PKR${Math.round(amount || 0).toLocaleString()}`;

  // Extra Info (Email + Branch) - more compact
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Email:', 20, yPos + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.email || 'N/A', 58, yPos + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Branch:', 115, yPos + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(payroll.branchId?.name || 'N/A', 150, yPos + 12);

  // Build table rows dynamically - only show fields with value > 0
  const tableRows = [];
  
  // Earnings section
  if (payroll.basicSalary > 0) {
    tableRows.push(['Basic Salary', formatMoney(payroll.basicSalary)]);
  }
  if (payroll.allowances?.houseRent > 0) {
    tableRows.push(['House Rent Allowance', formatMoney(payroll.allowances.houseRent)]);
  }
  if (payroll.allowances?.medical > 0) {
    tableRows.push(['Medical Allowance', formatMoney(payroll.allowances.medical)]);
  }
  if (payroll.allowances?.transport > 0) {
    tableRows.push(['Transport Allowance', formatMoney(payroll.allowances.transport)]);
  }
  if (payroll.allowances?.other > 0) {
    tableRows.push(['Other Allowances', formatMoney(payroll.allowances.other)]);
  }
  
  // Gross Salary (always show)
  tableRows.push(['Gross Salary', formatMoney(payroll.grossSalary)]);
  
  // Deductions section
  if (payroll.deductions?.tax > 0) {
    tableRows.push(['Tax', formatMoney(payroll.deductions.tax)]);
  }
  if (payroll.deductions?.providentFund > 0) {
    tableRows.push(['Provident Fund', formatMoney(payroll.deductions.providentFund)]);
  }
  if (payroll.deductions?.insurance > 0) {
    tableRows.push(['Insurance', formatMoney(payroll.deductions.insurance)]);
  }
  if (payroll.deductions?.other > 0) {
    tableRows.push(['Other Deductions', formatMoney(payroll.deductions.other)]);
  }
  
  // Absent deduction (only if > 0)
  const absentDeduction = payroll.attendanceDeduction?.calculatedDeduction || 0;
  if (absentDeduction > 0) {
    tableRows.push([
      `Absent Deduction (${payroll.attendanceDeduction?.absentDays || 0} days)`,
      formatMoney(absentDeduction)
    ]);
  }
  
  // Total Deductions (always show if > 0)
  if (payroll.totalDeductions > 0) {
    tableRows.push(['Total Deductions', formatMoney(payroll.totalDeductions)]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 30, 30], 
      textColor: 255, 
      fontSize: 12, 
      fontStyle: 'bold', 
      halign: 'left',
      cellPadding: 4
    },
    bodyStyles: { 
      fontSize: 10, 
      cellPadding: 5, 
      textColor: [50, 50, 50] 
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 20, right: 20 },
    didParseCell: (data) => {
      // Bold the "Gross Salary" and "Total Deductions" rows
      const description = data.row.raw?.[0];
      if (description === 'Gross Salary' || description === 'Total Deductions') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
      }
    }
  });

  // --- 4. FOOTER INFO (Bank & Signature Side-by-Side) ---
  yPos = doc.lastAutoTable.finalY + 10;

  // NET SALARY HIGHLIGHT (Teal Box)
  doc.setFillColor(...tealColor);
  doc.rect(20, yPos, 100, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NET SALARY', 25, yPos + 10);
  doc.text(formatMoney(payroll.netSalary), 115, yPos + 10, { align: 'right' });

  // Bank Info (Right of Net Salary)
  const bank = employee.teacherProfile?.bankAccount;
  doc.setTextColor(...textBlack);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details:', 130, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bank?.bankName || 'N/A'}`, 130, yPos + 9);
  doc.text(`A/C: ${bank?.accountNumber || 'N/A'}`, 130, yPos + 13);

  yPos += 83;

  // Bottom Row: Paid Date & Signature
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Paid on: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 20, yPos);

  // Signature Section
  doc.text('Prepared by:', 140, yPos - 5);
  doc.setFontSize(18);
  doc.setFont('courier', 'bolditalic'); // Signature font effect
  doc.text('Benjamin', 140, yPos + 3); 
  doc.line(140, yPos + 5, 185, yPos + 5); // Signature line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Benjamin Shah', 140, yPos + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('HR Manager', 140, yPos + 15);

  // Bottom Teal Strip
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...tealColor);
  doc.rect(0, pageHeight - 15, 80, 15, 'F');
  doc.triangle(80, pageHeight, 80, pageHeight - 15, 100, pageHeight, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('computer-generated document', 10, pageHeight - 6);
  doc.setTextColor(150, 150, 150);
  doc.text('© SCMS Pro System', 195, pageHeight - 6, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
};

export const generateFeeVoucherPDF = async (voucher, user) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  const tealColor = [0, 153, 168];
  const textBlack = [30, 30, 30];
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  const copyWidth = pageWidth / 2;
  const copies = ['BRANCH COPY', 'PARENT / STUDENT COPY'];

  const branchName = user?.branch?.name || user?.details?.branch_name || 'SCMS PRO';

  const studentName = voucher.studentId?.fullName || 
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'N/A';
  const rollNo = voucher.studentId?.rollNumber || 'N/A';
  const className = voucher.class?.name || 'N/A';
  const sectionName = voucher.section?.name || 'N/A';
  const issueDate = new Date().toLocaleDateString('en-PK');
  const dueDate = voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK') : 'N/A';

  const feeType = voucher.feeType || voucher.fee_type || 'Monthly';
  const totalAmt = Number(voucher.totalAmount || voucher.amountDue || 0);
  const paidAmt = Number(voucher.paidAmount || 0);
  const remainingAmt = Number(voucher.remainingAmount !== undefined ? voucher.remainingAmount : (totalAmt - paidAmt));

  // Try to load logo
  let logoImg = null;
  try {
    logoImg = new Image();
    logoImg.src = "/logo.png";
    await new Promise((res, rej) => {
      logoImg.onload = res;
      logoImg.onerror = rej;
    });
  } catch (e) {
    logoImg = null;
  }

  const formatMoney = (amount) => `PKR ${Math.round(amount || 0).toLocaleString('en-PK')}`;

  copies.forEach((copyTitle, index) => {
    const startX = index * copyWidth;
    const padding = 6;
    const innerWidth = copyWidth - (padding * 2);

    // Draw dashed line separator between copies
    if (index > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineDash([2, 2], 0);
      doc.line(startX, 10, startX, pageHeight - 10);
      doc.setLineDash([], 0); // reset
    }

    // Header Background
    doc.setFillColor(...tealColor);
    doc.rect(startX + padding, padding, innerWidth, 22, 'F');

    // Logo
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', startX + padding + 2, padding + 2, 18, 18);
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    // Trucate branch name if too long
    const shortBranchName = doc.splitTextToSize(branchName, innerWidth - 50)[0] || branchName;
    doc.text(shortBranchName, startX + padding + 22, padding + 8);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Fee Voucher', startX + padding + 22, padding + 13);
    
    // Copy Title Badge
    doc.setFillColor(255, 255, 255);
    const badgeWidth = index === 1 ? 38 : 26;
    doc.rect(startX + padding + innerWidth - badgeWidth - 2, padding + 7, badgeWidth, 6, 'F');
    doc.setTextColor(...tealColor);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(copyTitle, startX + padding + innerWidth - (badgeWidth/2) - 2, padding + 11, { align: 'center' });

    // Details Section
    let yPos = padding + 28;
    doc.setTextColor(...textBlack);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Voucher No:', startX + padding, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(voucher.voucherNumber || '---', startX + padding + 20, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', startX + padding + innerWidth - 35, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(issueDate, startX + padding + innerWidth - 15, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', startX + padding + innerWidth - 35, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(231, 76, 60);
    doc.text(dueDate, startX + padding + innerWidth - 15, yPos);
    doc.setTextColor(...textBlack);

    yPos += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(startX + padding, yPos, startX + padding + innerWidth, yPos);
    yPos += 5;

    // Student Info
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', startX + padding, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(studentName, startX + padding + 12, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', startX + padding, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${className} (${sectionName})`, startX + padding + 12, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('GR No:', startX + padding + innerWidth - 35, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(rollNo, startX + padding + innerWidth - 15, yPos);

    yPos += 8;
    
    // Fee Table
    const tableRows = [];
    tableRows.push(['Fee Type', feeType]);
    tableRows.push(['Month/Year', `${getMonthName(voucher.month)} ${voucher.year}`]);
    if (feeType === 'Installment') tableRows.push(['Installment', `${voucher.installmentNo} of ${voucher.totalInstallments}`]);
    tableRows.push(['Total Amount', formatMoney(totalAmt)]);
    if (paidAmt > 0) tableRows.push(['Paid Amount', formatMoney(paidAmt)]);
    tableRows.push(['Balance Due', formatMoney(remainingAmt)]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: startX + padding },
      tableWidth: innerWidth,
      head: [['Description', 'Amount']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [...tealColor], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: innerWidth - 30 },
        1: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.raw[0] === 'Balance Due' && data.section === 'body') {
          data.cell.styles.textColor = [231, 76, 60];
          data.cell.styles.fillColor = [253, 242, 240];
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Footer Signatures
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textBlack);
    doc.text('____________________', startX + padding + 5, yPos);
    doc.text('Cashier / Officer', startX + padding + 12, yPos + 4);

    doc.text('____________________', startX + padding + innerWidth - 35, yPos);
    doc.text('Depositor Sign', startX + padding + innerWidth - 26, yPos + 4);

    // Note
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Note: This is a computer generated voucher.', startX + padding, pageHeight - 8);
  });

  return Buffer.from(doc.output('arraybuffer'));
};
export const generateFeeReceiptPDF = async (voucher, paymentHistory = [], user) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  const tealColor = [0, 153, 168]; 
  const textBlack = [30, 30, 30];

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  const copyWidth = pageWidth / 2;
  const copies = ['BRANCH COPY', 'PARENT / STUDENT COPY'];

  const branchName = user?.branch?.name || user?.details?.branch_name || 'SCMS PRO';

  const receiptDate = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  const receiptTime = new Date().toLocaleTimeString('en-PK');
  const studentName = voucher.studentId?.fullName || 
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'N/A';
  const rollNo = voucher.studentId?.rollNumber || 'N/A';
  const className = voucher.class?.name || 'N/A';
  const sectionName = voucher.section?.name || 'N/A';
  const formatMoney = (amount) => `PKR ${Math.round(amount || 0).toLocaleString('en-PK')}`;

  const tableRows = paymentHistory.map(payment => [
    new Date(payment.date || payment.createdAt).toLocaleDateString('en-PK'),
    payment.method || payment.paymentMethod || 'Cash',
    payment.remarks || payment.transactionId || '---',
    formatMoney(payment.amount)
  ]);
  const totalAmt = Number(voucher.totalAmount || voucher.amountDue || 0);
  const totalPaid = paymentHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const balanceDue = Math.max(0, totalAmt - totalPaid);

  // Try to load logo
  let logoImg = null;
  try {
    logoImg = new Image();
    logoImg.src = "/logo.png";
    await new Promise((res, rej) => {
      logoImg.onload = res;
      logoImg.onerror = rej;
    });
  } catch (e) {
    logoImg = null;
  }

  copies.forEach((copyTitle, index) => {
    const startX = index * copyWidth;
    const padding = 10;
    const innerWidth = copyWidth - (padding * 2);

    if (index > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineDash([2, 2], 0);
      doc.line(startX, 10, startX, pageHeight - 10);
      doc.setLineDash([], 0); 
    }

    // Header 
    doc.setFillColor(...tealColor);
    doc.rect(startX + padding, padding, innerWidth, 22, 'F');
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', startX + padding + 2, padding + 2, 18, 18);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const shortBranchName = doc.splitTextToSize(branchName, innerWidth - 50)[0] || branchName;
    doc.text(shortBranchName, startX + padding + 22, padding + 8);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Fee Receipt', startX + padding + 22, padding + 13);
    
    // Copy Title Badge
    doc.setFillColor(255, 255, 255);
    const badgeWidth = index === 1 ? 38 : 26;
    doc.rect(startX + padding + innerWidth - badgeWidth - 2, padding + 7, badgeWidth, 6, 'F');
    doc.setTextColor(...tealColor);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(copyTitle, startX + padding + innerWidth - (badgeWidth/2) - 2, padding + 11, { align: 'center' });

    let yPos = padding + 28;
    
    doc.setTextColor(...textBlack);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Voucher No:', startX + padding, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(voucher.voucherNumber || '---', startX + padding + 20, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', startX + padding + innerWidth - 45, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${receiptDate} ${receiptTime}`, startX + padding + innerWidth - 35, yPos);

    yPos += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(startX + padding, yPos, startX + padding + innerWidth, yPos);
    yPos += 5;

    // Student Info
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', startX + padding, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(studentName, startX + padding + 12, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', startX + padding, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${className} (${sectionName})`, startX + padding + 12, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('GR No:', startX + padding + innerWidth - 45, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(rollNo, startX + padding + innerWidth - 20, yPos);

    yPos += 8;

    // Table
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Method', 'Remarks', 'Amount']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: tealColor, textColor: 255, fontSize: 8, fontStyle: 'bold', cellPadding: 2 },
      bodyStyles: { fontSize: 7, cellPadding: 2, textColor: textBlack },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      },
      margin: { 
        left: startX + padding, 
        right: pageWidth - (startX + copyWidth) + padding 
      },
      tableWidth: innerWidth,
      didDrawPage: function (data) {
        // No-op
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    
    // Total Amount
    doc.setFillColor(245, 245, 245);
    doc.rect(startX + padding, finalY, innerWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('TOTAL VOUCHER AMOUNT:', startX + padding + 2, finalY + 4.5);
    doc.text(formatMoney(totalAmt), startX + padding + innerWidth - 2, finalY + 4.5, { align: 'right' });

    // Total Paid
    doc.setFillColor(240, 240, 240);
    doc.rect(startX + padding, finalY + 6, innerWidth, 6, 'F');
    doc.setTextColor(...textBlack);
    doc.text('TOTAL PAID:', startX + padding + 2, finalY + 10.5);
    doc.setTextColor(...tealColor);
    doc.text(formatMoney(totalPaid), startX + padding + innerWidth - 2, finalY + 10.5, { align: 'right' });

    // Balance Due
    doc.setFillColor(balanceDue > 0 ? 255 : 240, balanceDue > 0 ? 240 : 255, 240); // Light red if due, light green if cleared
    doc.rect(startX + padding, finalY + 12, innerWidth, 6, 'F');
    doc.setTextColor(balanceDue > 0 ? 200 : 39, balanceDue > 0 ? 0 : 174, balanceDue > 0 ? 0 : 96); // Red if due, Green if cleared
    doc.text('BALANCE DUE:', startX + padding + 2, finalY + 16.5);
    doc.text(formatMoney(balanceDue), startX + padding + innerWidth - 2, finalY + 16.5, { align: 'right' });

    // Footer Signatures
    const footerY = pageHeight - 20;
    doc.setTextColor(...textBlack);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    doc.setDrawColor(150, 150, 150);
    doc.line(startX + padding + 10, footerY - 4, startX + padding + 45, footerY - 4);
    doc.text('Accounts Officer', startX + padding + 27.5, footerY, { align: 'center' });

    doc.line(startX + padding + innerWidth - 45, footerY - 4, startX + padding + innerWidth - 10, footerY - 4);
    doc.text('Depositor Sign', startX + padding + innerWidth - 27.5, footerY, { align: 'center' });
  });

  return Buffer.from(doc.output('arraybuffer'));
};