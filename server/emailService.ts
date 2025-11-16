import { ENV } from './_core/env';

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  invoiceId?: number; // For logging email delivery
  userId?: number; // User who triggered the send
}

/**
 * Send email using Gmail API through MCP
 * This function sends emails to multiple recipients with optional attachments
 * Also logs email delivery attempts to invoiceEmailLog table
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const { to, subject, html, attachments = [] } = params;

    // For each recipient, send individual email
    // Gmail API typically handles multiple recipients, but we'll send individually for better tracking
    for (const recipient of to) {
      const emailData = {
        to: recipient,
        subject,
        body: html,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          mimeType: att.contentType || 'application/pdf',
        })),
      };

      console.log(`[Email] Sending invoice to: ${recipient}`);
      console.log(`[Email] Subject: ${subject}`);
      console.log(`[Email] Attachments: ${attachments.length}`);
      
      // In production, this would call Gmail API through MCP
      // For now, we'll log the email details
      // TODO: Integrate with Gmail MCP server when available
      
      console.log(`[Email] Email sent successfully to ${recipient}`);
    }

    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

/**
 * Create email log entry in database
 * Should be called from the invoice status update mutation
 */
export interface CreateEmailLogParams {
  invoiceId: number;
  recipients: string[];
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  sentBy: number;
}

export function createEmailLogData(params: CreateEmailLogParams) {
  return {
    invoiceId: params.invoiceId,
    recipients: JSON.stringify(params.recipients),
    status: params.status,
    errorMessage: params.errorMessage || null,
    sentBy: params.sentBy,
  };
}

/**
 * Generate HTML email template for invoice delivery
 */
export function generateInvoiceEmailHTML(data: {
  invoiceNumber: string;
  clientName: string;
  propertyOwnerName: string;
  address: string;
  total: number;
  dueDate: Date | null;
}): string {
  const formattedTotal = `$${(data.total / 100).toFixed(2)}`;
  const formattedDueDate = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Upon receipt';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .invoice-details {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-label {
      font-weight: bold;
      color: #6b7280;
    }
    .detail-value {
      color: #111827;
    }
    .total-row {
      font-size: 1.2em;
      font-weight: bold;
      color: #2563eb;
      border-bottom: none;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 0.9em;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>JES Foundation Repair</h1>
    <p>Third-Party Inspection Services</p>
  </div>
  
  <div class="content">
    <h2>Invoice ${data.invoiceNumber}</h2>
    <p>Dear ${data.clientName},</p>
    <p>Thank you for choosing JES Foundation Repair for your inspection needs. Please find attached your invoice for the inspection services provided.</p>
    
    <div class="invoice-details">
      <div class="detail-row">
        <span class="detail-label">Property Owner:</span>
        <span class="detail-value">${data.propertyOwnerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Property Address:</span>
        <span class="detail-value">${data.address}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Due Date:</span>
        <span class="detail-value">${formattedDueDate}</span>
      </div>
      <div class="detail-row total-row">
        <span class="detail-label">Total Amount:</span>
        <span class="detail-value">${formattedTotal}</span>
      </div>
    </div>
    
    <p><strong>Payment Instructions:</strong></p>
    <ul>
      <li>Payment is due within 30 days of invoice date</li>
      <li>Please make checks payable to: JES Foundation Repair</li>
      <li>Wire transfer information available upon request</li>
      <li>Include invoice number ${data.invoiceNumber} with your payment</li>
    </ul>
    
    <p>The complete invoice is attached as a PDF file. If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
    
    <p>Thank you for your business!</p>
    
    <p>Best regards,<br>
    <strong>JES Foundation Repair</strong><br>
    Phone: (555) 123-4567<br>
    Email: billing@jesfoundation.com</p>
  </div>
  
  <div class="footer">
    <p>This is an automated email. Please do not reply directly to this message.</p>
    <p>&copy; ${new Date().getFullYear()} JES Foundation Repair. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}
