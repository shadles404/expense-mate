import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceSettings, InvoiceExpenseItem } from '@/types/invoice';
import { format } from 'date-fns';

interface GenerateInvoiceParams {
  settings: InvoiceSettings | null;
  projectTitle: string;
  invoiceNumber: string;
  clientName: string;
  invoiceDate: Date;
  dueDate: Date | null;
  expenses: InvoiceExpenseItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  partialPaidAmount?: number;
  remainingBalance?: number;
  customHeaders?: string[];
  customRowMapper?: (exp: InvoiceExpenseItem) => string[];
}

export function generateInvoicePdf(params: GenerateInvoiceParams): jsPDF {
  const {
    settings,
    projectTitle,
    invoiceNumber,
    clientName,
    invoiceDate,
    dueDate,
    expenses,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    partialPaidAmount = 0,
    remainingBalance,
  } = params;

  const calculatedBalance = remainingBalance ?? Math.max(0, total - partialPaidAmount);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ── Header Row: Company name (left) + "INVOICE" (right) ──
  let yPos = 16;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - marginRight, yPos, { align: 'right' });

  doc.setFontSize(13);
  doc.text(settings?.company_name || 'Your Company', marginLeft, yPos);

  // ── Company details (left) + Invoice meta box (right) ──
  yPos += 7;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  const companyStartY = yPos;
  if (settings?.company_address) {
    settings.company_address.split('\n').forEach(line => {
      doc.text(line, marginLeft, yPos);
      yPos += 4;
    });
  }
  if (settings?.company_phone) {
    doc.text(`Phone: ${settings.company_phone}`, marginLeft, yPos);
    yPos += 4;
  }
  if (settings?.company_email) {
    doc.text(`Email: ${settings.company_email}`, marginLeft, yPos);
    yPos += 4;
  }

  // Invoice info box (right-aligned, same vertical area)
  const boxW = 62;
  const boxX = pageWidth - marginRight - boxW;
  const boxY = companyStartY - 3;
  const boxH = dueDate ? 28 : 22;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

  let metaY = boxY + 5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice #:', boxX + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNumber, boxX + boxW - 4, metaY, { align: 'right' });

  metaY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', boxX + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(format(invoiceDate, 'MMM dd, yyyy'), boxX + boxW - 4, metaY, { align: 'right' });

  if (dueDate) {
    metaY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Due:', boxX + 4, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(format(dueDate, 'MMM dd, yyyy'), boxX + boxW - 4, metaY, { align: 'right' });
  }

  // ── Divider ──
  yPos = Math.max(yPos, boxY + boxH) + 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 5;

  // ── Project & Client ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Project:', marginLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(projectTitle, marginLeft + 24, yPos);

  if (clientName) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', marginLeft, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, marginLeft + 24, yPos);
  }

  // ── Table ──
  yPos += 8;

  const defaultRowMapper = (exp: InvoiceExpenseItem) => [
    exp.no.toString(),
    exp.description,
    exp.quantity.toString(),
    `$${exp.price.toFixed(2)}`,
    `$${exp.amount.toFixed(2)}`,
  ];

  const rowMapper = params.customRowMapper || defaultRowMapper;
  const tableData = expenses.map(rowMapper);
  const headers = params.customHeaders || ['No', 'Description', 'Qty', 'Price', 'Amount'];

  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    theme: 'striped',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 32 },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || yPos + 30;

  // ── Totals (right-aligned block) ──
  let totalsY = finalY + 6;
  const totalsX = pageWidth - marginRight - 70;
  const valX = pageWidth - marginRight;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`$${subtotal.toFixed(2)}`, valX, totalsY, { align: 'right' });

  if (settings?.tax_enabled && taxAmount > 0) {
    totalsY += 5;
    doc.text(`Tax (${settings.tax_rate}%):`, totalsX, totalsY);
    doc.text(`$${taxAmount.toFixed(2)}`, valX, totalsY, { align: 'right' });
  }

  if (discountAmount > 0) {
    totalsY += 5;
    doc.text('Discount:', totalsX, totalsY);
    doc.text(`-$${discountAmount.toFixed(2)}`, valX, totalsY, { align: 'right' });
  }

  // Grand Total
  totalsY += 6;
  doc.setDrawColor(180, 180, 180);
  doc.line(totalsX, totalsY - 2, valX, totalsY - 2);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', totalsX, totalsY + 3);
  doc.text(`$${total.toFixed(2)}`, valX, totalsY + 3, { align: 'right' });

  // Partial Payment
  if (partialPaidAmount > 0) {
    totalsY += 8;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('Paid:', totalsX, totalsY);
    doc.text(`-$${partialPaidAmount.toFixed(2)}`, valX, totalsY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  // Remaining Balance
  totalsY += 6;
  doc.setDrawColor(180, 180, 180);
  doc.line(totalsX, totalsY - 2, valX, totalsY - 2);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  if (calculatedBalance > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(22, 163, 74);
  }
  doc.text('Balance:', totalsX, totalsY + 3);
  doc.text(`$${calculatedBalance.toFixed(2)}`, valX, totalsY + 3, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // ── Footer Section ──
  let footerY = totalsY + 16;

  // Check if footer content would overflow — add page if needed
  const estimatedFooterHeight =
    (settings?.default_payment_terms ? 12 : 0) +
    (settings?.thank_you_message ? 10 : 0) +
    (settings?.include_signature_line ? 20 : 0);

  if (footerY + estimatedFooterHeight > pageHeight - 10) {
    doc.addPage();
    footerY = 20;
  }

  if (settings?.default_payment_terms) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', marginLeft, footerY);
    doc.setFont('helvetica', 'normal');
    footerY += 4;
    doc.text(settings.default_payment_terms, marginLeft, footerY);
    footerY += 8;
  }

  if (settings?.thank_you_message) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text(settings.thank_you_message, pageWidth / 2, footerY, { align: 'center' });
    footerY += 10;
  }

  if (settings?.include_signature_line) {
    const sigCount = settings.signature_count || 1;
    const sigDetails = settings.signature_details || [];
    const sigWidth = contentWidth / sigCount;

    footerY += 6;

    for (let i = 0; i < sigCount; i++) {
      const xStart = marginLeft + i * sigWidth;
      const lineWidth = sigWidth - 14;

      doc.setDrawColor(150, 150, 150);
      doc.line(xStart, footerY, xStart + lineWidth, footerY);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');

      const detail = sigDetails[i];
      if (detail?.name) {
        doc.text(detail.name, xStart, footerY + 4);
      }
      if (detail?.title) {
        doc.text(detail.title, xStart, footerY + 8);
      }
      if (!detail?.name && !detail?.title) {
        doc.text('Authorized Signature', xStart, footerY + 4);
      }
    }
  }

  return doc;
}
