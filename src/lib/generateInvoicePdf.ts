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
  } = params;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header Section
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 20, yPos, { align: 'right' });

  // Company Info (Left side)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const companyName = settings?.company_name || 'Your Company';
  doc.text(companyName, 20, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (settings?.company_address) {
    const addressLines = settings.company_address.split('\n');
    addressLines.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
  }
  
  if (settings?.company_phone) {
    doc.text(`Phone: ${settings.company_phone}`, 20, yPos);
    yPos += 5;
  }
  
  if (settings?.company_email) {
    doc.text(`Email: ${settings.company_email}`, 20, yPos);
    yPos += 5;
  }

  yPos = Math.max(yPos, 50);
  
  // Invoice Info Box
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 90, 35, 70, 35, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', pageWidth - 85, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNumber, pageWidth - 85, 48);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', pageWidth - 85, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(format(invoiceDate, 'MMM dd, yyyy'), pageWidth - 85, 61);
  
  if (dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', pageWidth - 45, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(format(dueDate, 'MMM dd, yyyy'), pageWidth - 45, 61);
  }

  // Project & Client Info
  yPos = 80;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Project:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(projectTitle, 50, yPos);
  
  if (clientName) {
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, 50, yPos);
  }

  // Expense Table
  yPos += 15;
  
  const tableData = expenses.map(exp => [
    exp.no.toString(),
    exp.description,
    exp.quantity.toString(),
    `$${exp.price.toFixed(2)}`,
    `$${exp.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Description', 'Qty', 'Price', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

  // Totals Section
  let totalsY = finalY + 10;
  const totalsX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
  
  if (settings?.tax_enabled && taxAmount > 0) {
    totalsY += 7;
    doc.text(`Tax (${settings.tax_rate}%):`, totalsX, totalsY);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
  }
  
  if (discountAmount > 0) {
    totalsY += 7;
    doc.text('Discount:', totalsX, totalsY);
    doc.text(`-$${discountAmount.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
  }
  
  // Grand Total
  totalsY += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, totalsY - 3, pageWidth - 20, totalsY - 3);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', totalsX, totalsY + 4);
  doc.text(`$${total.toFixed(2)}`, pageWidth - 20, totalsY + 4, { align: 'right' });

  // Footer Section
  let footerY = totalsY + 30;
  
  if (settings?.default_payment_terms) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', 20, footerY);
    doc.setFont('helvetica', 'normal');
    footerY += 5;
    doc.text(settings.default_payment_terms, 20, footerY);
    footerY += 10;
  }
  
  if (settings?.thank_you_message) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(settings.thank_you_message, pageWidth / 2, footerY, { align: 'center' });
    footerY += 15;
  }
  
  if (settings?.include_signature_line) {
    footerY += 10;
    doc.setDrawColor(150, 150, 150);
    doc.line(20, footerY, 80, footerY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signature', 20, footerY + 5);
  }

  return doc;
}
