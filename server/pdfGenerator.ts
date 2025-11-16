import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

interface InvoiceData {
  invoice: {
    id: number;
    invoiceNumber: string;
    issuedDate: Date | null;
    dueDate: Date | null;
    paidDate: Date | null;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
  };
  project: {
    projectNumber: string | null;
    clientName: string;
    address: string;
    propertyOwnerName: string;
    permitNumber: string | null;
    customerNumber: string | null;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header - Company Info
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('JES Foundation Repair', 50, 50);
      
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Third-Party Inspection Services', 50, 80)
        .text('Phone: (555) 123-4567', 50, 95)
        .text('Email: billing@jesfoundation.com', 50, 110);

      // Invoice Title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice Details Box
      const invoiceBoxTop = 140;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice Number:', 400, invoiceBoxTop)
        .font('Helvetica')
        .text(data.invoice.invoiceNumber, 500, invoiceBoxTop);

      // Project Number
      if (data.project.projectNumber) {
        doc
          .font('Helvetica-Bold')
          .text('Project Number:', 400, invoiceBoxTop + 15)
          .font('Helvetica')
          .text(data.project.projectNumber, 500, invoiceBoxTop + 15);
      }

      const dateOffset = data.project.projectNumber ? 15 : 0;
      
      doc
        .font('Helvetica-Bold')
        .text('Date Issued:', 400, invoiceBoxTop + 15 + dateOffset)
        .font('Helvetica')
        .text(
          data.invoice.issuedDate
            ? format(new Date(data.invoice.issuedDate), 'MMM d, yyyy')
            : 'N/A',
          500,
          invoiceBoxTop + 15 + dateOffset
        );

      doc
        .font('Helvetica-Bold')
        .text('Due Date:', 400, invoiceBoxTop + 30 + dateOffset)
        .font('Helvetica')
        .text(
          data.invoice.dueDate
            ? format(new Date(data.invoice.dueDate), 'MMM d, yyyy')
            : 'N/A',
          500,
          invoiceBoxTop + 30 + dateOffset
        );

      doc
        .font('Helvetica-Bold')
        .text('Status:', 400, invoiceBoxTop + 45 + dateOffset)
        .font('Helvetica')
        .text(
          data.invoice.status.toUpperCase(),
          500,
          invoiceBoxTop + 45 + dateOffset
        );

      if (data.invoice.paidDate) {
        doc
          .font('Helvetica-Bold')
          .text('Paid Date:', 400, invoiceBoxTop + 60 + dateOffset)
          .font('Helvetica')
          .text(
            format(new Date(data.invoice.paidDate), 'MMM d, yyyy'),
            500,
            invoiceBoxTop + 60 + dateOffset
          );
      }

      // Bill To Section
      const billToTop = invoiceBoxTop;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, billToTop);

      let billToLine = billToTop + 20;
      
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.project.clientName, 50, billToLine);
      
      billToLine += 15;
      doc.text(`Property Owner: ${data.project.propertyOwnerName}`, 50, billToLine);
      
      billToLine += 15;
      doc.text(`Property Address: ${data.project.address}`, 50, billToLine);
      
      if (data.project.customerNumber) {
        billToLine += 15;
        doc.text(`Customer #: ${data.project.customerNumber}`, 50, billToLine);
      }
      
      if (data.project.permitNumber) {
        billToLine += 15;
        doc.text(`Permit #: ${data.project.permitNumber}`, 50, billToLine);
      }

      // Line Items Table
      const tableTop = 280;
      const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Total'];
      const colWidths = [280, 60, 80, 80];
      const colPositions = [50, 330, 390, 470];

      // Table Header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#333333');

      tableHeaders.forEach((header, i) => {
        doc.text(header, colPositions[i], tableTop, {
          width: colWidths[i],
          align: i === 0 ? 'left' : 'right',
        });
      });

      // Header underline
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Line Items
      let yPosition = tableTop + 25;
      doc.font('Helvetica').fillColor('#000000');

      data.lineItems.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.text(item.description, colPositions[0], yPosition, {
          width: colWidths[0],
          align: 'left',
        });

        doc.text(item.quantity.toString(), colPositions[1], yPosition, {
          width: colWidths[1],
          align: 'right',
        });

        doc.text(
          `$${(item.unitPrice / 100).toFixed(2)}`,
          colPositions[2],
          yPosition,
          { width: colWidths[2], align: 'right' }
        );

        doc.text(
          `$${(item.total / 100).toFixed(2)}`,
          colPositions[3],
          yPosition,
          { width: colWidths[3], align: 'right' }
        );

        yPosition += 25;
      });

      // Totals Section
      yPosition += 10;
      const totalsX = 390;

      // Subtotal
      doc
        .font('Helvetica')
        .text('Subtotal:', totalsX, yPosition, { width: 80, align: 'left' })
        .text(`$${(data.invoice.subtotal / 100).toFixed(2)}`, 470, yPosition, {
          width: 80,
          align: 'right',
        });

      yPosition += 20;

      // Tax
      doc
        .text('Tax:', totalsX, yPosition, { width: 80, align: 'left' })
        .text(`$${(data.invoice.tax / 100).toFixed(2)}`, 470, yPosition, {
          width: 80,
          align: 'right',
        });

      yPosition += 20;

      // Total line
      doc
        .strokeColor('#333333')
        .lineWidth(1)
        .moveTo(totalsX, yPosition - 5)
        .lineTo(550, yPosition - 5)
        .stroke();

      // Total
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL:', totalsX, yPosition, { width: 80, align: 'left' })
        .text(`$${(data.invoice.total / 100).toFixed(2)}`, 470, yPosition, {
          width: 80,
          align: 'right',
        });

      // Payment Terms
      yPosition += 50;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text('PAYMENT TERMS:', 50, yPosition);

      yPosition += 20;

      doc
        .font('Helvetica')
        .fillColor('#000000')
        .text('Payment is due within 30 days of invoice date.', 50, yPosition)
        .text('Please make checks payable to: JES Foundation Repair', 50, yPosition + 15)
        .text('Wire transfer information available upon request.', 50, yPosition + 30);

      // Footer
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(
          'Thank you for your business!',
          50,
          750,
          { align: 'center', width: 500 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
