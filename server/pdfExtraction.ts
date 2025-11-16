import { invokeLLM } from "./_core/llm";

/**
 * Extract data from PDF files (permits and plans) using LLM
 */
export interface ExtractedPDFData {
  propertyOwnerName?: string;
  address?: string;
  jurisdiction?: string;
  permitNumber?: string;
  scopeOfWork?: string;
  datePermitIssued?: string;
  subdivision?: string;
  lot?: string;
  block?: string;
  contractorName?: string;
  detectedProductIds?: string[]; // Auto-detected product IDs from scope of work
  quantitativeDetails?: {
    squareFeet?: string;
    linearFeet?: string;
    length?: string;
    width?: string;
    depth?: string;
    spacing?: string;
    depthFromGrade?: string;
    heightFromSlab?: string;
  };
  componentDetails?: {
    pierFootingDepth?: string;
    materials?: string;
    stoneDepth?: string;
    concreteThickness?: string;
    pushPierBrackets?: string;
    torque?: string;
  };
}

export async function extractDataFromPDF(fileUrl: string): Promise<ExtractedPDFData> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured data from construction permits, building plans, engineer calculations, and manufacturer specification sheets. 

Extract the following key information:
- Property Owner Name
- Address of Permitted Work
- Jurisdiction
- Permit Number
- Date Permit was Issued
- Subdivision, Lot, Block
- Contractor Name
- Scope of Work (with quantitative details like Square Feet, Linear Feet, length, width, depth, spacing, depth from grade, height from slab)
- Component details (pier footing depth, materials used, #57 stone depth, concrete thickness, push pier brackets, torque)

Return the data in JSON format. If a field is not found, omit it from the response.`
        },
        {
          role: "user",
          content: [
            {
              type: "file_url",
              file_url: {
                url: fileUrl,
                mime_type: "application/pdf"
              }
            },
            {
              type: "text",
              text: "Please extract all relevant data from this document."
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "permit_data_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              propertyOwnerName: { type: "string", description: "Name of the property owner" },
              address: { type: "string", description: "Address of the permitted work" },
              jurisdiction: { type: "string", description: "Jurisdiction or authority issuing the permit" },
              permitNumber: { type: "string", description: "Permit number or ID" },
              datePermitIssued: { type: "string", description: "Date the permit was issued" },
              subdivision: { type: "string", description: "Subdivision name" },
              lot: { type: "string", description: "Lot number" },
              block: { type: "string", description: "Block number" },
              contractorName: { type: "string", description: "Name of the contractor" },
              scopeOfWork: { type: "string", description: "Detailed scope of work description" },
              quantitativeDetails: {
                type: "object",
                properties: {
                  squareFeet: { type: "string", description: "Square feet measurement" },
                  linearFeet: { type: "string", description: "Linear feet measurement" },
                  length: { type: "string", description: "Length measurement" },
                  width: { type: "string", description: "Width measurement" },
                  depth: { type: "string", description: "Depth measurement" },
                  spacing: { type: "string", description: "Spacing measurement" },
                  depthFromGrade: { type: "string", description: "Depth from grade measurement" },
                  heightFromSlab: { type: "string", description: "Height from slab measurement" }
                },
                required: [],
                additionalProperties: false
              },
              componentDetails: {
                type: "object",
                properties: {
                  pierFootingDepth: { type: "string", description: "Pier footing depth" },
                  materials: { type: "string", description: "Materials used" },
                  stoneDepth: { type: "string", description: "#57 stone depth" },
                  concreteThickness: { type: "string", description: "Concrete thickness" },
                  pushPierBrackets: { type: "string", description: "Push pier brackets specification" },
                  torque: { type: "string", description: "Torque specification" }
                },
                required: [],
                additionalProperties: false
              }
            },
            required: [],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from LLM");
    }

    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const extractedData: ExtractedPDFData = JSON.parse(contentString);
    
    // Match products from scope of work
    const { matchProductsFromText } = await import("../shared/productsAndServices");
    const detectedProductIds = extractedData.scopeOfWork 
      ? matchProductsFromText(extractedData.scopeOfWork)
      : [];
    
    // Flatten the data for easier use
    const result: ExtractedPDFData = {
      propertyOwnerName: extractedData.propertyOwnerName,
      address: extractedData.address,
      jurisdiction: extractedData.jurisdiction,
      permitNumber: extractedData.permitNumber,
      scopeOfWork: extractedData.scopeOfWork,
      datePermitIssued: extractedData.datePermitIssued,
      subdivision: extractedData.subdivision,
      lot: extractedData.lot,
      block: extractedData.block,
      contractorName: extractedData.contractorName,
      detectedProductIds,
      quantitativeDetails: extractedData.quantitativeDetails,
      componentDetails: extractedData.componentDetails,
    };

    return result;
  } catch (error) {
    console.error("Error extracting data from PDF:", error);
    throw new Error("Failed to extract data from PDF");
  }
}

/**
 * Merge extracted data from multiple PDFs (plans and permits)
 * Prioritizes non-empty values and combines scope of work details
 */
export function mergeExtractedData(dataArray: ExtractedPDFData[]): ExtractedPDFData {
  const merged: ExtractedPDFData = {};
  const allProductIds: Set<string> = new Set();
  
  for (const data of dataArray) {
    // Collect all detected product IDs
    if (data.detectedProductIds) {
      data.detectedProductIds.forEach(id => allProductIds.add(id));
    }
    // Merge top-level fields (prefer non-empty values)
    if (data.propertyOwnerName && !merged.propertyOwnerName) merged.propertyOwnerName = data.propertyOwnerName;
    if (data.address && !merged.address) merged.address = data.address;
    if (data.jurisdiction && !merged.jurisdiction) merged.jurisdiction = data.jurisdiction;
    if (data.permitNumber && !merged.permitNumber) merged.permitNumber = data.permitNumber;
    if (data.datePermitIssued && !merged.datePermitIssued) merged.datePermitIssued = data.datePermitIssued;
    if (data.subdivision && !merged.subdivision) merged.subdivision = data.subdivision;
    if (data.lot && !merged.lot) merged.lot = data.lot;
    if (data.block && !merged.block) merged.block = data.block;
    if (data.contractorName && !merged.contractorName) merged.contractorName = data.contractorName;
    
    // Combine scope of work
    if (data.scopeOfWork) {
      if (!merged.scopeOfWork) {
        merged.scopeOfWork = data.scopeOfWork;
      } else {
        merged.scopeOfWork += "\n\n" + data.scopeOfWork;
      }
    }
    
    // Merge quantitative details
    if (data.quantitativeDetails) {
      if (!merged.quantitativeDetails) merged.quantitativeDetails = {};
      Object.assign(merged.quantitativeDetails, data.quantitativeDetails);
    }
    
    // Merge component details
    if (data.componentDetails) {
      if (!merged.componentDetails) merged.componentDetails = {};
      Object.assign(merged.componentDetails, data.componentDetails);
    }
  }
  
  // Add all detected product IDs
  if (allProductIds.size > 0) {
    merged.detectedProductIds = Array.from(allProductIds);
  }
  
  return merged;
}
