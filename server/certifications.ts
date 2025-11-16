import { getDb } from "./db";
import { projects, projectNotes, attachments, tasks, deliverables } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface CertificationData {
  projectId: number;
  certificationType: "as_permitted" | "as_built";
  fieldChanges?: string;
  previewData?: {
    companyName: string;
    companyContact: string;
    propertyOwner: string;
    siteAddress: string;
    contractorName: string;
    scopeOfWork: string;
    inspectedProducts: string;
    buildingCode: string;
    codeYear: string;
    fieldChanges?: string;
  };
}

/**
 * Generate a preview of certification data for editing
 */
export async function generateCertificationPreview(data: Omit<CertificationData, 'previewData'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get project details
  const project = await db.select().from(projects).where(eq(projects.id, data.projectId)).limit(1);
  if (!project || project.length === 0) {
    throw new Error("Project not found");
  }
  const projectData = project[0];

  // Get all tasks for the project
  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, data.projectId));

  // Get permit and plan attachments
  const projectAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.projectId, data.projectId));

  // Use LLM to extract and structure certification data
  const prompt = `Extract certification information from this project data:

Project Details:
- Address: ${projectData.address}
- Property Owner: ${projectData.propertyOwnerName}
- Customer Number: ${projectData.customerNumber}
- Jurisdiction: ${projectData.jurisdiction}
- Permit Number: ${projectData.permitNumber}
- Client: ${projectData.clientName}
- Contractor: ${projectData.contractorName || "Not specified"}
- Scope: ${projectData.scopeOfWork || "Foundation inspection"}

Tasks Completed:
${projectTasks.map(t => `- ${t.title}: ${t.status}`).join('\n')}

${data.fieldChanges ? `Field Changes:\n${data.fieldChanges}\n\n` : ''}

Provide a structured response with:
1. Company name (use "JES Foundation Repair" as default)
2. Company contact info (use "info@jeswork.com | (844) 237-2875" as default)
3. Property owner name
4. Site address
5. Contractor name
6. Brief scope of work description
7. Inspected products with quantities and specifications
8. Building code reference (default: "ICC International Building Code, Virginia State Building Code")
9. Code year (default: "2021")
${data.certificationType === 'as_built' ? '10. Field changes summary' : ''}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a construction certification specialist. Extract and format certification data clearly and professionally." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "certification_preview",
        strict: true,
        schema: {
          type: "object",
          properties: {
            companyName: { type: "string" },
            companyContact: { type: "string" },
            propertyOwner: { type: "string" },
            siteAddress: { type: "string" },
            contractorName: { type: "string" },
            scopeOfWork: { type: "string" },
            inspectedProducts: { type: "string" },
            buildingCode: { type: "string" },
            codeYear: { type: "string" },
            ...(data.certificationType === 'as_built' ? { fieldChanges: { type: "string" } } : {}),
          },
          required: ["companyName", "companyContact", "propertyOwner", "siteAddress", "contractorName", "scopeOfWork", "inspectedProducts", "buildingCode", "codeYear"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== 'string') throw new Error("Failed to generate preview");

  return JSON.parse(content);
}

/**
 * Generate a certification document for a project
 */
export async function generateCertification(data: CertificationData, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get project details
  const project = await db.select().from(projects).where(eq(projects.id, data.projectId)).limit(1);
  if (!project || project.length === 0) {
    throw new Error("Project not found");
  }
  const projectData = project[0];

  // Get all tasks for the project
  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, data.projectId));

  // Get permit and plan attachments
  const projectAttachments = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.projectId, data.projectId),
        // Get both permit and plan PDFs
      )
    );

  // If "as_built", save field changes to project notes
  if (data.certificationType === "as_built" && data.fieldChanges) {
    await db.insert(projectNotes).values({
      projectId: data.projectId,
      userId,
      note: data.fieldChanges,
      noteType: "field_changes",
    });
  }

  // Get all field changes notes for as_built certifications
  let fieldChangesNotes: string[] = [];
  if (data.certificationType === "as_built") {
    const notes = await db
      .select()
      .from(projectNotes)
      .where(
        and(
          eq(projectNotes.projectId, data.projectId),
          eq(projectNotes.noteType, "field_changes")
        )
      );
    fieldChangesNotes = notes.map((n) => n.note);
  }

  // Parse PDFs and extract information using LLM
  const extractedInfo = await extractProjectInformation(projectAttachments, projectData);

  // Generate certification document using LLM
  const certificationContent = await generateCertificationDocument({
    project: projectData,
    extractedInfo,
    tasks: projectTasks,
    certificationType: data.certificationType,
    fieldChanges: fieldChangesNotes,
    previewData: data.previewData,
  });

  // Convert to PDF and upload to S3
  console.log('[Certification] Generating PDF from content, length:', certificationContent.length);
  const pdfBuffer = await generatePDF(certificationContent);
  console.log('[Certification] PDF buffer created, size:', pdfBuffer.length, 'bytes');
  console.log('[Certification] PDF signature:', pdfBuffer.slice(0, 4).toString());
  
  // Extract owner last name from full name
  const ownerLastName = projectData.propertyOwnerName?.split(' ').pop() || 'Unknown';
  
  // Get existing certifications count for version number
  const existingCerts = await db
    .select()
    .from(deliverables)
    .where(
      and(
        eq(deliverables.projectId, data.projectId),
        eq(deliverables.deliverableType, 'certificate')
      )
    );
  const versionNumber = existingCerts.length + 1;
  
  // Create descriptive filename: Address_OwnerLastName_CustomerNumber_v1.pdf
  const addressPart = projectData.address.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const customerPart = projectData.customerNumber || projectData.projectNumber || projectData.id;
  const fileName = `${addressPart}_${ownerLastName}_${customerPart}_v${versionNumber}.pdf`;
  const { url, key } = await storagePut(
    `certifications/${fileName}`,
    pdfBuffer,
    "application/pdf"
  );

  // Update project with certification info
  await db
    .update(projects)
    .set({
      certificationType: data.certificationType,
      certificationGeneratedAt: new Date(),
      certificationFileKey: key,
      certificationFileUrl: url,
    })
    .where(eq(projects.id, data.projectId));

  // Create deliverable entry
  await db.insert(deliverables).values({
    projectId: data.projectId,
    title: `${data.certificationType === "as_built" ? "As-Built" : "As-Permitted"} Certification`,
    description: `Official certification document for project ${projectData.projectNumber || projectData.id}`,
    deliverableType: "certificate",
    fileKey: key,
    fileUrl: url,
    status: "approved",
    submittedBy: userId,
    submittedAt: new Date(),
  });

  return {
    url,
    certificationType: data.certificationType,
  };
}

/**
 * Extract project information from PDFs using LLM
 */
async function extractProjectInformation(
  attachments: any[],
  project: any
): Promise<any> {
  // If no attachments, use project data directly
  if (!attachments || attachments.length === 0) {
    return {
      propertyOwner: project.propertyOwnerName,
      address: project.address,
      contractor: project.contractorName,
      scopeOfWork: project.scopeOfWork,
      permitNumber: project.permitNumber,
      jurisdiction: project.jurisdiction,
    };
  }

  // For now, return project data
  // TODO: Implement PDF parsing with LLM in future iteration
  return {
    propertyOwner: project.propertyOwnerName,
    address: project.address,
    contractor: project.contractorName,
    scopeOfWork: project.scopeOfWork,
    permitNumber: project.permitNumber,
    jurisdiction: project.jurisdiction,
  };
}

/**
 * Generate certification document content using LLM
 */
async function generateCertificationDocument(data: {
  project: any;
  extractedInfo: any;
  tasks: any[];
  certificationType: "as_permitted" | "as_built";
  fieldChanges: string[];
  previewData?: {
    companyName: string;
    companyContact: string;
    propertyOwner: string;
    siteAddress: string;
    contractorName: string;
    scopeOfWork: string;
    inspectedProducts: string;
    buildingCode: string;
    codeYear: string;
    fieldChanges?: string;
  };
}): Promise<string> {
  const currentYear = new Date().getFullYear();
  const buildingCodeYear = currentYear - 3; // Use 3-year-old code as standard

  // Use preview data if provided, otherwise use extracted info
  const certData = data.previewData || {
    companyName: "JES Foundation Repair",
    companyContact: "info@jeswork.com | (844) 237-2875",
    propertyOwner: data.extractedInfo.propertyOwner,
    siteAddress: data.extractedInfo.address,
    contractorName: data.extractedInfo.contractor || "N/A",
    scopeOfWork: data.extractedInfo.scopeOfWork || "Foundation repair and stabilization",
    inspectedProducts: data.tasks.map((t, i) => `${i + 1}. ${t.title} - ${t.status}`).join("\n"),
    buildingCode: "ICC International Building Code, Virginia State Building Code",
    codeYear: String(currentYear - 3),
    fieldChanges: data.fieldChanges.join("\n\n"),
  };

  const prompt = `Generate a professional certification document for a foundation inspection project.

**Company Information:**
${certData.companyName}
${certData.companyContact}

**Project Information:**
- Property Owner: ${certData.propertyOwner}
- Site Address: ${certData.siteAddress}
- Contractor: ${certData.contractorName}
- Permit Number: ${data.extractedInfo.permitNumber || "N/A"}
- Jurisdiction: ${data.extractedInfo.jurisdiction || "N/A"}

**Scope of Work:**
${certData.scopeOfWork}

**Inspected Products:**
${certData.inspectedProducts}

**Certification Type:** ${data.certificationType === "as_built" ? "As-Built" : "As-Permitted"}

${
  data.certificationType === "as_built" && certData.fieldChanges
    ? `**Field Changes:**\n${certData.fieldChanges}`
    : ""
}

Generate a formal, single-page certification document in HTML format that includes:
1. Company letterhead with contact information
2. Document title: "CERTIFICATION OF INSPECTION"
3. Project details section
4. Scope of work description
5. List of inspected products/systems with quantities and specifications
6. Certification statement that references:
   - ICC International Building Code ${buildingCodeYear}
   - State Building Code compliance
   - ${data.certificationType === "as_built" ? "As-Built conditions with field modifications" : "As-Permitted conditions"}
7. Inspector signature line with date
8. Professional stamp/seal placeholder

${
  data.certificationType === "as_built"
    ? "IMPORTANT: Prioritize the field changes over the original permitted scope in the certification. Clearly note deviations and modifications."
    : "Certify that all work was completed exactly as permitted with no deviations."
}

Format the output as clean, professional HTML that can be converted to PDF. Use proper formatting, spacing, and professional language.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a professional technical writer specializing in construction and inspection certifications. Generate formal, legally compliant certification documents.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === 'string' ? content : "";
}

/**
 * Convert HTML content to PDF
 */
async function generatePDF(htmlContent: string): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage([612, 792]); // Letter size (8.5" x 11")
  const { width, height } = currentPage.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Strip HTML tags for plain text rendering
  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };
  
  const plainText = stripHtml(htmlContent);
  const lines = plainText.split('\n').filter(line => line.trim());
  
  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 14;
  const maxWidth = width - (margin * 2);
  
  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(' ');
    const wrappedLines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth > maxWidth && currentLine) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      wrappedLines.push(currentLine);
    }
    
    return wrappedLines;
  };
  
  // Render text lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Detect headers (lines in all caps or starting with certain keywords)
    const isHeader = line === line.toUpperCase() || 
                     line.startsWith('CERTIFICATION') || 
                     line.includes('Company Information') ||
                     line.includes('Project Information');
    
    const fontSize = isHeader ? 12 : 10;
    const currentFont = isHeader ? fontBold : font;
    
    // Wrap long lines
    const wrappedLines = wrapText(line, maxWidth, fontSize);
    
    for (const wrappedLine of wrappedLines) {
      // Add new page if needed
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
      }
      
      currentPage.drawText(wrappedLine, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= lineHeight;
    }
    
    // Add extra spacing after headers
    if (isHeader) {
      yPosition -= 5;
    }
  }
  
  // Save the PDF and return as buffer
  const pdfBytes = await pdfDoc.save();
  // pdfBytes is already a Uint8Array, convert to Buffer properly
  return Buffer.from(pdfBytes.buffer, pdfBytes.byteOffset, pdfBytes.byteLength);
}
