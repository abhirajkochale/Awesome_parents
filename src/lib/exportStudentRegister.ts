import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { admissionApi, paymentApi } from '@/db/api';
import type { AdmissionWithStudent, PaymentWithAdmission } from '@/types';

// ─── Helpers ──────────────────────────────────────────────

/** Sanitize any value — never write null/undefined to a cell */
function safe(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s === 'null' || s === 'undefined') return '';
  return s;
}

/** Format a date string as DD-MM-YYYY, or blank if missing */
function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'dd-MM-yyyy');
  } catch {
    return '';
  }
}

/** Format parent phone numbers according to the spec */
function fmtPhones(student: AdmissionWithStudent['student']): string {
  if (!student) return '';
  const father = safe(student.father_phone);
  const mother = safe(student.mother_phone);
  if (father && mother) return `Father: ${father}, Mother: ${mother}`;
  if (father) return father;
  if (mother) return mother;
  return '';
}

// ─── Styling Constants ────────────────────────────────────

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD6E4F0' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
};

const HEADER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  horizontal: 'center',
  vertical: 'middle',
  wrapText: true,
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

// ─── Main Export Function ─────────────────────────────────

export async function exportStudentRegister(): Promise<void> {
  // 1. Fetch data using existing APIs
  const [admissions, allPayments] = await Promise.all([
    admissionApi.getAllAdmissions(),
    paymentApi.getAllPayments(),
  ]);

  // 2. Group payments by admission_id
  const paymentsByAdmission = new Map<string, PaymentWithAdmission[]>();
  for (const p of allPayments) {
    const list = paymentsByAdmission.get(p.admission_id) || [];
    list.push(p);
    paymentsByAdmission.set(p.admission_id, list);
  }

  // Sort each group by date
  for (const [, list] of paymentsByAdmission) {
    list.sort(
      (a, b) =>
        new Date(a.payment_date || 0).getTime() -
        new Date(b.payment_date || 0).getTime()
    );
  }

  // 3. Determine max number of installments
  let maxPayments = 0;
  for (const [, list] of paymentsByAdmission) {
    if (list.length > maxPayments) maxPayments = list.length;
  }
  // Ensure at least 1 payment group so headers render correctly
  if (maxPayments < 1) maxPayments = 1;

  // ─── Build column layout ────────────────────────────────
  //
  // Fixed columns: A–L (12 cols)
  //   A: Sr No
  //   B: Name
  //   C: Parent Phones
  //   D: Standard & Batch
  //   E: Admission Date
  //   F: Regular Uniform Date
  //   G: Sports Uniform Date
  //   H: Bag Collected
  //   I: Books Collected
  //   J: Total Fees
  //   K: Discount
  //   L: Final Fees
  //
  // Dynamic:  Payment 1 (3 cols), Payment 2 (3 cols), ...

  const FIXED_COL_COUNT = 12;
  const totalCols = FIXED_COL_COUNT + maxPayments * 3;

  // ─── Create workbook & worksheet ────────────────────────

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Student Register');

  // Column widths
  const colWidths: number[] = [
    6,   // A  Sr No
    25,  // B  Name
    35,  // C  Parent Phones
    22,  // D  Standard & Batch
    15,  // E  Admission Date
    18,  // F  Regular Uniform Date
    18,  // G  Sports Uniform Date
    15,  // H  Bag Collected
    15,  // I  Books Collected
    14,  // J  Total Fees
    14,  // K  Discount
    14,  // L  Final Fees
  ];
  // Payment columns
  for (let i = 0; i < maxPayments; i++) {
    colWidths.push(14); // Date
    colWidths.push(12); // Amount
    colWidths.push(12); // Mode
  }

  ws.columns = colWidths.map((w) => ({ width: w }));

  // ─── Row 1: Main Headers ───────────────────────────────


  // Non-grouped columns — merge vertically across Row 1 & Row 2
  const singleHeaders = [
    { col: 1, label: 'Sr No' },
    { col: 2, label: 'Name' },
    { col: 3, label: 'Parent Phones' },
    { col: 4, label: 'Standard & Batch' },
    { col: 5, label: 'Admission Date' },
  ];

  for (const h of singleHeaders) {
    ws.mergeCells(1, h.col, 2, h.col);
    const cell = ws.getCell(1, h.col);
    cell.value = h.label;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = THIN_BORDER;
  }

  // "Uniform" merged over F–G (cols 6–7) in Row 1
  ws.mergeCells(1, 6, 1, 7);
  ws.getCell(1, 6).value = 'Uniform';
  ws.getCell(1, 6).fill = HEADER_FILL;
  ws.getCell(1, 6).font = HEADER_FONT;
  ws.getCell(1, 6).alignment = HEADER_ALIGNMENT;
  ws.getCell(1, 6).border = THIN_BORDER;
  ws.getCell(1, 7).border = THIN_BORDER;

  // Uniform sub-headers in Row 2
  const uniformSubs = ['Regular Uniform Date', 'Sports Uniform Date'];
  uniformSubs.forEach((label, i) => {
    const cell = ws.getCell(2, 6 + i);
    cell.value = label;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = THIN_BORDER;
  });

  // "Materials" merged over H–I (cols 8–9) in Row 1
  ws.mergeCells(1, 8, 1, 9);
  ws.getCell(1, 8).value = 'Materials';
  ws.getCell(1, 8).fill = HEADER_FILL;
  ws.getCell(1, 8).font = HEADER_FONT;
  ws.getCell(1, 8).alignment = HEADER_ALIGNMENT;
  ws.getCell(1, 8).border = THIN_BORDER;
  ws.getCell(1, 9).border = THIN_BORDER;

  // Materials sub-headers in Row 2
  const materialSubs = ['Bag Collected', 'Books Collected'];
  materialSubs.forEach((label, i) => {
    const cell = ws.getCell(2, 8 + i);
    cell.value = label;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = THIN_BORDER;
  });

  // Fee columns — merge vertically across Row 1 & Row 2
  const feeHeaders = [
    { col: 10, label: 'Total Fees' },
    { col: 11, label: 'Discount' },
    { col: 12, label: 'Final Fees' },
  ];

  for (const h of feeHeaders) {
    ws.mergeCells(1, h.col, 2, h.col);
    const cell = ws.getCell(1, h.col);
    cell.value = h.label;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = THIN_BORDER;
  }

  // Payment groups — each "Payment N" merges 3 cols in Row 1
  for (let i = 0; i < maxPayments; i++) {
    const startCol = FIXED_COL_COUNT + 1 + i * 3; // 1-indexed
    const endCol = startCol + 2;

    // Row 1: merged "Payment N"
    ws.mergeCells(1, startCol, 1, endCol);
    const mergedCell = ws.getCell(1, startCol);
    mergedCell.value = `Payment ${i + 1}`;
    mergedCell.fill = HEADER_FILL;
    mergedCell.font = HEADER_FONT;
    mergedCell.alignment = HEADER_ALIGNMENT;
    mergedCell.border = THIN_BORDER;
    // Ensure border on trailing merged cells
    ws.getCell(1, startCol + 1).border = THIN_BORDER;
    ws.getCell(1, endCol).border = THIN_BORDER;

    // Row 2: sub-headers
    const paymentSubs = ['Date', 'Amount', 'Mode'];
    paymentSubs.forEach((label, j) => {
      const cell = ws.getCell(2, startCol + j);
      cell.value = label;
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = HEADER_ALIGNMENT;
      cell.border = THIN_BORDER;
    });
  }

  // ─── Data Rows ─────────────────────────────────────────

  admissions.forEach((adm: AdmissionWithStudent, idx: number) => {
    const student = adm.student;
    const payments = paymentsByAdmission.get(adm.id) || [];

    const rowValues: (string | number)[] = [
      idx + 1,                                                // Sr No
      safe(student?.full_name),                               // Name
      fmtPhones(student),                                     // Parent Phones
      `${safe(student?.class)}${student?.batch_time ? ' ' + student.batch_time : ''}`, // Standard & Batch
      fmtDate(adm.admission_date),                            // Admission Date
      '',                                                     // Regular Uniform Date (placeholder)
      '',                                                     // Sports Uniform Date (placeholder)
      '',                                                     // Bag Collected (placeholder)
      '',                                                     // Books Collected (placeholder)
      adm.total_fee != null ? Number(adm.total_fee) : '',     // Total Fees
      adm.discount_amount != null ? Number(adm.discount_amount) : '', // Discount
      adm.final_fee != null ? Number(adm.final_fee) : (adm.total_fee != null ? Number(adm.total_fee) : ''), // Final Fees
    ];

    // Payment columns
    for (let i = 0; i < maxPayments; i++) {
      const p = payments[i];
      if (p) {
        rowValues.push(fmtDate(p.payment_date)); // Date
        rowValues.push(p.amount != null ? Number(p.amount) : ''); // Amount
        rowValues.push(safe(p.status === 'approved' ? 'Approved' : p.status)); // Mode/status
      } else {
        rowValues.push('', '', '');
      }
    }

    const dataRow = ws.addRow(rowValues);

    // Style each cell in the data row
    for (let c = 1; c <= totalCols; c++) {
      const cell = dataRow.getCell(c);
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', wrapText: true };
    }
  });

  // ─── Freeze header rows ────────────────────────────────

  ws.views = [{ state: 'frozen', ySplit: 2, xSplit: 0 }];

  // ─── Generate & Download ───────────────────────────────

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);

  const dateStr = format(new Date(), 'dd-MM-yyyy');
  const a = document.createElement('a');
  a.href = url;
  a.download = `students_register_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
