import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function testPDFGeneration() {
  console.log('Creating test PDF...');
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage([612, 792]);
  const { width, height } = currentPage.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Add title
  currentPage.drawText('CERTIFICATION OF INSPECTION', {
    x: 50,
    y: height - 50,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  // Add some content
  currentPage.drawText('Company Information:', {
    x: 50,
    y: height - 100,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  currentPage.drawText('JES Foundation Repair', {
    x: 50,
    y: height - 120,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  currentPage.drawText('info@jeswork.com | (844) 237-2875', {
    x: 50,
    y: height - 135,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);
  
  // Write to file
  fs.writeFileSync('/home/ubuntu/test-certification.pdf', buffer);
  
  console.log('PDF created successfully!');
  console.log('File size:', buffer.length, 'bytes');
  console.log('File location: /home/ubuntu/test-certification.pdf');
  console.log('First 20 bytes:', buffer.slice(0, 20).toString('hex'));
  console.log('PDF signature check:', buffer.slice(0, 4).toString() === '%PDF' ? 'VALID' : 'INVALID');
}

testPDFGeneration().catch(console.error);
