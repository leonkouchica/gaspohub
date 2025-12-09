import jsPDF from 'jspdf';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes?: string;
}

export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = '#dc2626';
  const textColor = '#171717';
  const mutedColor = '#737373';

  // Header
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 26);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${data.invoiceNumber}`, pageWidth - 20, 20, { align: 'right' });
  doc.text(`Date: ${data.date}`, pageWidth - 20, 28, { align: 'right' });

  // Company Info
  doc.setTextColor(textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PhotoPro Marketplace', 20, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor);
  doc.text('Your Photography Marketplace', 20, 62);
  doc.text('support@photopro.com', 20, 68);

  // Customer Info
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', pageWidth - 80, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor);
  doc.text(data.customerName, pageWidth - 80, 62);
  doc.text(data.customerEmail, pageWidth - 80, 68);
  
  if (data.shippingAddress) {
    doc.text(data.shippingAddress.street, pageWidth - 80, 74);
    doc.text(
      `${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}`,
      pageWidth - 80,
      80
    );
    doc.text(data.shippingAddress.country, pageWidth - 80, 86);
  }

  // Table Header
  const tableTop = 100;
  doc.setFillColor('#f5f5f5');
  doc.rect(15, tableTop, pageWidth - 30, 10, 'F');
  
  doc.setTextColor(textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 20, tableTop + 7);
  doc.text('Qty', 110, tableTop + 7, { align: 'center' });
  doc.text('Unit Price', 140, tableTop + 7, { align: 'right' });
  doc.text('Total', pageWidth - 20, tableTop + 7, { align: 'right' });

  // Table Body
  doc.setFont('helvetica', 'normal');
  let yPosition = tableTop + 18;
  
  data.items.forEach((item) => {
    doc.setTextColor(textColor);
    doc.text(item.name.substring(0, 40), 20, yPosition);
    doc.text(item.quantity.toString(), 110, yPosition, { align: 'center' });
    doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPosition, { align: 'right' });
    doc.text(`$${item.total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    
    // Draw line
    doc.setDrawColor('#e5e5e5');
    doc.line(15, yPosition + 4, pageWidth - 15, yPosition + 4);
    
    yPosition += 12;
  });

  // Totals
  const totalsY = yPosition + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor);
  doc.text('Subtotal:', 140, totalsY, { align: 'right' });
  doc.setTextColor(textColor);
  doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
  
  if (data.tax !== undefined) {
    doc.setTextColor(mutedColor);
    doc.text('Tax:', 140, totalsY + 8, { align: 'right' });
    doc.setTextColor(textColor);
    doc.text(`$${data.tax.toFixed(2)}`, pageWidth - 20, totalsY + 8, { align: 'right' });
  }
  
  // Total
  const totalY = data.tax !== undefined ? totalsY + 20 : totalsY + 12;
  doc.setFillColor(primaryColor);
  doc.rect(120, totalY - 5, pageWidth - 135, 12, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', 140, totalY + 3, { align: 'right' });
  doc.text(`$${data.total.toFixed(2)}`, pageWidth - 20, totalY + 3, { align: 'right' });

  // Notes
  if (data.notes) {
    doc.setTextColor(textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, totalY + 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor);
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, totalY + 33);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setTextColor(mutedColor);
  doc.setFontSize(8);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('PhotoPro Marketplace - www.photopro.com', pageWidth / 2, footerY + 6, { align: 'center' });

  // Save
  doc.save(`invoice-${data.invoiceNumber}.pdf`);
}
