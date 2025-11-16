import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PaymentEmail {
  subject: string;
  from: string;
  date: string;
  snippet: string;
  messageId: string;
}

interface ProcessedPayment {
  invoiceNumber: string;
  amount?: string;
  emailSubject: string;
  emailDate: string;
  matched: boolean;
}

/**
 * Search for payment-related emails using Gmail MCP
 */
export async function searchPaymentEmails(): Promise<PaymentEmail[]> {
  try {
    // Search for emails with payment-related keywords
    const query = 'subject:(EFT Payment OR Remittance OR "payment advice") has:attachment';
    
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_search_messages --server gmail --input '${JSON.stringify({ q: query, max_results: 20 })}'`
    );
    
    // Parse the JSON result file path from stdout
    const match = stdout.match(/\/tmp\/manus-mcp\/mcp_result_[a-f0-9]+\.json/);
    if (!match) {
      console.error('[Payment Processing] Could not find result file in output');
      return [];
    }
    
    // Read the JSON file
    const fs = await import('fs/promises');
    const resultData = await fs.readFile(match[0], 'utf-8');
    const result = JSON.parse(resultData);
    
    // Extract email details from the result
    const emails: PaymentEmail[] = [];
    
    if (result.content && Array.isArray(result.content)) {
      for (const item of result.content) {
        if (item.type === 'text' && item.text) {
          // Parse email details from the text content
          const emailPattern = /\*\*Email Details\*\*\s+Subject: (.+?)\s+From: (.+?)\s+.*?Date: (.+?)\s+Message ID: (.+?)\s+.*?\*\*Snippet\*\*\s+(.+?)(?=\*\*|$)/g;
          let match;
          
          while ((match = emailPattern.exec(item.text)) !== null) {
            emails.push({
              subject: match[1].trim(),
              from: match[2].trim(),
              date: match[3].trim(),
              messageId: match[4].trim(),
              snippet: match[5].trim().substring(0, 200),
            });
          }
        }
      }
    }
    
    return emails;
  } catch (error) {
    console.error('[Payment Processing] Error searching payment emails:', error);
    return [];
  }
}

/**
 * Extract invoice numbers from email content
 * Looks for patterns like: Invoice #12345, INV-12345, Invoice: 12345, etc.
 */
export function extractInvoiceNumbers(text: string): string[] {
  const invoiceNumbers: string[] = [];
  
  // Pattern 1: Invoice #XXXXX or Invoice: XXXXX
  const pattern1 = /invoice[:\s#]+([A-Z0-9-]+)/gi;
  const matches1 = Array.from(text.matchAll(pattern1));
  for (const match of matches1) {
    invoiceNumbers.push(match[1]);
  }
  
  // Pattern 2: INV-XXXXX or INV XXXXX
  const pattern2 = /INV[-\s]?([0-9]+)/gi;
  const matches2 = Array.from(text.matchAll(pattern2));
  for (const match of matches2) {
    invoiceNumbers.push(`INV-${match[1]}`);
  }
  
  // Pattern 3: Just numbers after "Invoice" or "Inv"
  const pattern3 = /(?:invoice|inv)[:\s#]*([0-9]{4,})/gi;
  const matches3 = Array.from(text.matchAll(pattern3));
  for (const match of matches3) {
    invoiceNumbers.push(match[1]);
  }
  
  // Remove duplicates and return
  return Array.from(new Set(invoiceNumbers));
}

/**
 * Extract payment amount from email content
 */
export function extractPaymentAmount(text: string): string | null {
  // Pattern: $XXX,XXX.XX or $XXX.XX
  const amountPattern = /\$([0-9,]+\.?[0-9]*)/;
  const match = text.match(amountPattern);
  return match ? match[1] : null;
}

/**
 * Process payment emails and extract invoice information
 */
export async function processPaymentEmails(): Promise<ProcessedPayment[]> {
  const emails = await searchPaymentEmails();
  const processedPayments: ProcessedPayment[] = [];
  
  for (const email of emails) {
    // Combine subject and snippet for invoice number extraction
    const searchText = `${email.subject} ${email.snippet}`;
    const invoiceNumbers = extractInvoiceNumbers(searchText);
    const amount = extractPaymentAmount(searchText);
    
    // Create a processed payment entry for each invoice number found
    for (const invoiceNumber of invoiceNumbers) {
      processedPayments.push({
        invoiceNumber,
        amount: amount || undefined,
        emailSubject: email.subject,
        emailDate: email.date,
        matched: false, // Will be set to true when matched with database invoice
      });
    }
    
    // If no invoice numbers found, still log the email for manual review
    if (invoiceNumbers.length === 0) {
      processedPayments.push({
        invoiceNumber: 'UNKNOWN',
        amount: amount || undefined,
        emailSubject: email.subject,
        emailDate: email.date,
        matched: false,
      });
    }
  }
  
  return processedPayments;
}
