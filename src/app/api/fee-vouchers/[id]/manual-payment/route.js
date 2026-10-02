import { NextResponse } from 'next/server';
import { FeeVoucher } from '@/backend/models/postgres';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/constants/roles';
import { Op } from 'sequelize';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user || ![ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const paymentAmount = Number(body.amount);
    const paymentMethod = body.method || 'Cash';
    const remarks = body.remarks || '';

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount.' }, { status: 400 });
    }

    const voucher = await FeeVoucher.findByPk(id);
    if (!voucher) {
      return NextResponse.json({ success: false, error: 'Voucher not found.' }, { status: 404 });
    }

    if (voucher.status === 'PAID') {
      return NextResponse.json({ success: false, error: 'Voucher is already fully paid.' }, { status: 400 });
    }

    const totalDue = Number(voucher.amount_due) + Number(voucher.fine_amount || 0);
    const currentPaid = Number(voucher.paid_amount || 0);
    const outstanding = totalDue - currentPaid;

    if (paymentAmount > outstanding) {
      return NextResponse.json({ 
        success: false, 
        error: `Payment amount (PKR ${paymentAmount}) exceeds outstanding balance (PKR ${outstanding}).` 
      }, { status: 400 });
    }

    // Update calculations
    const newPaidAmount = currentPaid + paymentAmount;
    const newStatus = newPaidAmount >= totalDue ? 'PAID' : 'PARTIAL';
    
    const history = Array.isArray(voucher.payment_history) ? [...voucher.payment_history] : [];
    history.push({
      amount: paymentAmount,
      date: new Date().toISOString(),
      method: paymentMethod,
      remarks: remarks,
      recordedBy: user.id || user._id
    });

    await voucher.update({
      paid_amount: newPaidAmount,
      status: newStatus,
      payment_history: history,
      paid_date: newStatus === 'PAID' ? new Date().toISOString().substring(0, 10) : null
    });

    // Sync & Recalculate subsequent vouchers for this student
    // When prior month arrears (e.g. July) are cleared, update subsequent vouchers (e.g. August)
    // so net_amount (amount_due) is reduced down to reflect that July's debt no longer exists.
    try {
      const studentAllVouchers = await FeeVoucher.findAll({
        where: {
          student_id: voucher.student_id,
          status: { [Op.ne]: 'CANCELLED' },
        },
        order: [['due_date', 'ASC'], ['created_at', 'ASC']],
      });

      let rollingPendingArrears = 0;
      for (const v of studentAllVouchers) {
        let vBase = Number(v.amount_due || 0);
        if (v.remarks && v.remarks.includes('Base Fee: PKR')) {
          const match = v.remarks.match(/Base Fee: PKR\s*(\d+(\.\d+)?)/);
          if (match) vBase = Number(match[1]);
        }
        const vPaid = Number(v.paid_amount || 0);

        if (v.id !== voucher.id && v.status !== 'PAID') {
          const updatedNetDue = vBase + rollingPendingArrears;
          if (Number(v.amount_due) !== updatedNetDue) {
            await v.update({
              amount_due: updatedNetDue,
              remarks: (rollingPendingArrears > 0 
                ? `Base Fee: PKR ${vBase} | Prior Arrears: PKR ${rollingPendingArrears}. ` 
                : `Base Fee: PKR ${vBase}. `),
            });
          }
        }

        const vPending = Math.max(0, vBase - vPaid);
        rollingPendingArrears += vPending;
      }
    } catch (syncErr) {
      console.warn('Could not sync subsequent vouchers arrears:', syncErr.message);
    }

    await voucher.reload();

    const json = voucher.toJSON();
    const formattedVoucher = {
      _id: json.id,
      id: json.id,
      voucherNumber: json.voucher_no,
      amountDue: Number(json.amount_due) || 0,
      totalAmount: Number(json.amount_due) || 0,
      paidAmount: Number(json.paid_amount) || 0,
      remainingAmount: (Number(json.amount_due) + Number(json.fine_amount || 0)) - Number(json.paid_amount || 0),
      fineAmount: Number(json.fine_amount) || 0,
      dueDate: json.due_date,
      paidDate: json.paid_date,
      status: newStatus.toLowerCase() === 'unpaid' ? 'pending' : newStatus.toLowerCase(),
      feeType: json.fee_type,
      installmentNo: json.installment_no,
      totalInstallments: json.total_installments,
      month: json.month || json.due_date?.substring(5, 7) || '1',
      year: json.due_date ? json.due_date.substring(0, 4) : new Date().getFullYear().toString(),
      remarks: json.remarks,
      createdAt: json.created_at,
      updatedAt: json.updated_at,
      paymentHistory: history,
    };

    return NextResponse.json({ 
      success: true, 
      message: `Payment of PKR ${paymentAmount} recorded successfully.`,
      data: formattedVoucher 
    });
  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
