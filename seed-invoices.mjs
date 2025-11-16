import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { projects, invoices, invoiceLineItems } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seedInvoices() {
  console.log("Starting invoice seeding...");

  try {
    // Get all projects
    const allProjects = await db.select().from(projects);
    console.log(`Found ${allProjects.length} projects`);

    if (allProjects.length === 0) {
      console.log("No projects found. Please create projects first.");
      return;
    }

    // Create sample invoices for the first 3 projects
    const projectsToInvoice = allProjects.slice(0, 3);

    for (let i = 0; i < projectsToInvoice.length; i++) {
      const project = projectsToInvoice[i];
      console.log(`\nCreating invoice for project ${project.id}: ${project.address}`);

      // Check if invoice already exists for this project
      const existingInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.projectId, project.id));

      if (existingInvoices.length > 0) {
        console.log(`  Invoice already exists for project ${project.id}, skipping...`);
        continue;
      }

      // Generate invoice number
      const invoiceNumber = `INV-2025-${String(1000 + i).padStart(4, "0")}`;

      // Create different types of invoices for testing
      let lineItemsData = [];
      let subtotal = 0;

      if (i === 0) {
        // TPI Invoice - Third-Party Inspection
        console.log("  Creating TPI invoice...");
        lineItemsData = [
          {
            description: "Third-Party Inspection - Push Piers (4 units)",
            quantity: 4,
            unitPrice: 30000, // $300.00 per unit
          },
          {
            description: "Third-Party Inspection - Helical Piers (6 units)",
            quantity: 6,
            unitPrice: 30000,
          },
        ];
      } else if (i === 1) {
        // CSI Invoice - Continuous Special Inspection
        console.log("  Creating CSI invoice...");
        lineItemsData = [
          {
            description: "Continuous Special Inspection - Push Piers",
            quantity: 1,
            unitPrice: 40000, // $400.00 base
          },
          {
            description: "Production Day Inspection (3 days)",
            quantity: 3,
            unitPrice: 60000, // $600.00 per day
          },
        ];
      } else {
        // PSI Invoice - Periodic Special Inspection
        console.log("  Creating PSI invoice...");
        lineItemsData = [
          {
            description: "Periodic Special Inspection - Wall Pins",
            quantity: 1,
            unitPrice: 40000, // $400.00 base
          },
          {
            description: "Additional Components (multiplier: 1.5x)",
            quantity: 1,
            unitPrice: 20000, // Additional $200.00
          },
        ];
      }

      // Calculate subtotal
      subtotal = lineItemsData.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // Calculate tax (6% for example)
      const tax = Math.round(subtotal * 0.06);
      const total = subtotal + tax;

      // Determine status and dates based on invoice type
      let status, issuedDate, dueDate, paidDate;
      const now = new Date();

      if (i === 0) {
        // First invoice: paid
        status = "paid";
        issuedDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        dueDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
        paidDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      } else if (i === 1) {
        // Second invoice: sent (pending payment)
        status = "sent";
        issuedDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        dueDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days from now
        paidDate = null;
      } else {
        // Third invoice: overdue
        status = "overdue";
        issuedDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
        dueDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago (past due)
        paidDate = null;
      }

      // Create invoice
      const invoiceResult = await db.insert(invoices).values({
        projectId: project.id,
        invoiceNumber,
        subtotal,
        tax,
        total,
        status,
        issuedDate,
        dueDate,
        paidDate,
      });

      const invoiceId = invoiceResult[0].insertId;
      console.log(`  Created invoice ${invoiceNumber} with ID ${invoiceId}`);
      console.log(`  Status: ${status}, Total: $${(total / 100).toFixed(2)}`);

      // Create line items
      for (const item of lineItemsData) {
        await db.insert(invoiceLineItems).values({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        });
        console.log(`    Added line item: ${item.description}`);
      }
    }

    console.log("\n✅ Invoice seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding invoices:", error);
    throw error;
  }
}

seedInvoices()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
