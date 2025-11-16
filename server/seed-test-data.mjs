import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function seedTestUsers() {
  console.log("Seeding test users...");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Test Admin User
    await connection.execute(`
      INSERT INTO users (openId, name, email, role, branch, loginMethod, createdAt, updatedAt, lastSignedIn)
      VALUES ('test-admin-001', 'Test Admin', 'admin@test.com', 'admin', NULL, 'test', NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role)
    `);

    // Test Client Scheduler - Manassas
    await connection.execute(`
      INSERT INTO users (openId, name, email, role, branch, loginMethod, createdAt, updatedAt, lastSignedIn)
      VALUES ('test-scheduler-manassas', 'Sarah Johnson (Scheduler)', 'scheduler.manassas@test.com', 'client_scheduler', 'Manassas - JES Foundation Repair', 'test', NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch=VALUES(branch)
    `);

    // Test Client Scheduler - Baltimore
    await connection.execute(`
      INSERT INTO users (openId, name, email, role, branch, loginMethod, createdAt, updatedAt, lastSignedIn)
      VALUES ('test-scheduler-baltimore', 'Mike Chen (Scheduler)', 'scheduler.baltimore@test.com', 'client_scheduler', 'Baltimore - JES Foundation Repair', 'test', NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch=VALUES(branch)
    `);

    // Test Client AP Manager - Manassas
    await connection.execute(`
      INSERT INTO users (openId, name, email, role, branch, loginMethod, createdAt, updatedAt, lastSignedIn)
      VALUES ('test-ap-manassas', 'Linda Martinez (AP Manager)', 'ap.manassas@test.com', 'client_ap', 'Manassas - JES Foundation Repair', 'test', NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch=VALUES(branch)
    `);

    // Test Field Technician
    await connection.execute(`
      INSERT INTO users (openId, name, email, role, branch, loginMethod, createdAt, updatedAt, lastSignedIn)
      VALUES ('test-fieldtech-001', 'James Wilson (Field Tech)', 'fieldtech@test.com', 'field_tech', NULL, 'test', NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role)
    `);

    console.log("✓ Test users created successfully");
    console.log("\nTest User Credentials:");
    console.log("========================");
    console.log("Admin: admin@test.com");
    console.log("Scheduler (Manassas): scheduler.manassas@test.com");
    console.log("Scheduler (Baltimore): scheduler.baltimore@test.com");
    console.log("AP Manager (Manassas): ap.manassas@test.com");
    console.log("Field Tech: fieldtech@test.com");
    console.log("========================\n");

  } catch (error) {
    console.error("Error seeding test users:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function seedSampleProject() {
  console.log("Seeding sample project...");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Get the scheduler user ID
    const [schedulerRows] = await connection.execute(
      "SELECT id FROM users WHERE openId = 'test-scheduler-manassas' LIMIT 1"
    );
    
    if (schedulerRows.length === 0) {
      console.log("Scheduler user not found, skipping sample project");
      return;
    }

    const schedulerId = schedulerRows[0].id;

    // Create sample project
    const [projectResult] = await connection.execute(`
      INSERT INTO projects (
        clientId, clientName, customerNumber, propertyOwnerName, address,
        jurisdiction, permitNumber, scopeOfWork, status, isPostConstruction,
        productionDays, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      schedulerId,
      'Manassas - JES Foundation Repair',
      'CUST-2025-001',
      'John & Mary Smith',
      '123 Foundation Lane, Manassas, VA 20110',
      'Prince William County',
      'PERMIT-2025-12345',
      'Foundation repair with helical piers and waterproofing system installation',
      'verified',
      0,
      0
    ]);

    const projectId = projectResult.insertId;

    // Add extracted data
    await connection.execute(`
      INSERT INTO extractedData (
        projectId, propertyOwnerName, address, jurisdiction, permitNumber,
        scopeOfWork, datePermitIssued, contractorName, subdivision, lot, block,
        detectedProductIds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId,
      'John & Mary Smith',
      '123 Foundation Lane, Manassas, VA 20110',
      'Prince William County',
      'PERMIT-2025-12345',
      'Foundation repair with helical piers and waterproofing system installation',
      '2025-01-15',
      'JES Foundation Repair',
      'Meadowbrook Estates',
      '45',
      'B',
      JSON.stringify(['helical_pier_288', 'drain_tile_basement', 'sump_pump'])
    ]);

    // Create sample task
    await connection.execute(`
      INSERT INTO tasks (
        projectId, title, description, scheduledDate, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      projectId,
      'Foundation Pier Inspection',
      'Inspect helical pier installation and waterproofing system',
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      'scheduled'
    ]);

    console.log(`✓ Sample project created (ID: ${projectId})`);

  } catch (error) {
    console.error("Error seeding sample project:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    await seedTestUsers();
    await seedSampleProject();
    console.log("\n✓ All test data seeded successfully!");
  } catch (error) {
    console.error("Failed to seed test data:", error);
    process.exit(1);
  }
}

main();
