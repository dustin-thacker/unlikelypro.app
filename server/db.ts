import { eq, desc, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  notifications, 
  pushSubscriptions,
  projects, 
  attachments, 
  extractedData, 
  tasks,
  projectNotes,
  projectFiles,
  auditTrail,
  invoices,
  invoiceLineItems,
  rescheduleRequests,
  deliverables,
  InsertDeliverable,
  requestsForInformation,
  InsertRequestForInformation,
  InsertProject,
  InsertAttachment,
  InsertExtractedData,
  InsertTask,
  InsertProjectNote,
  InsertProjectFile,
  InsertAuditTrail,
  InsertInvoice,
  InsertInvoiceLineItem,
  InsertRescheduleRequest
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Project queries
async function generateProjectNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the latest project number
  const latestProjects = await db
    .select({ projectNumber: projects.projectNumber })
    .from(projects)
    .where(sql`${projects.projectNumber} IS NOT NULL`)
    .orderBy(desc(projects.id))
    .limit(1);
  
  const currentYear = new Date().getFullYear();
  let nextNumber = 1;
  
  if (latestProjects.length > 0 && latestProjects[0].projectNumber) {
    // Extract number from format PRJ-YYYY-NNNN
    const match = latestProjects[0].projectNumber.match(/PRJ-(\d{4})-(\d{4})/);
    if (match) {
      const year = parseInt(match[1]);
      const num = parseInt(match[2]);
      
      // If same year, increment; if new year, reset to 1
      if (year === currentYear) {
        nextNumber = num + 1;
      }
    }
  }
  
  // Format: PRJ-2025-0001
  return `PRJ-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Auto-generate project number if not provided
  if (!project.projectNumber) {
    project.projectNumber = await generateProjectNumber();
  }
  
  const result = await db.insert(projects).values(project);
  return result[0].insertId;
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function updateProject(projectId: number, updates: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set(updates).where(eq(projects.id, projectId));
}

// Attachment queries
export async function createAttachment(attachment: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(attachments).values(attachment);
  return result[0].insertId;
}

export async function getAttachmentsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(attachments).where(eq(attachments.projectId, projectId));
}

// Extracted data queries
export async function createExtractedData(data: InsertExtractedData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(extractedData).values(data);
  return result[0].insertId;
}

export async function getExtractedDataByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(extractedData).where(eq(extractedData.projectId, projectId));
}

export async function updateExtractedData(dataId: number, updates: Partial<InsertExtractedData>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(extractedData).set(updates).where(eq(extractedData.id, dataId));
}

// Task queries
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function getTaskById(taskId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTasksByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(tasks.scheduledDate);
}

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).orderBy(tasks.scheduledDate);
}

export async function updateTask(taskId: number, updates: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
}

// Project notes queries
export async function createProjectNote(note: InsertProjectNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectNotes).values(note);
  return result[0].insertId;
}

export async function getProjectNotes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projectNotes).where(eq(projectNotes.projectId, projectId)).orderBy(desc(projectNotes.createdAt));
}

// Project files queries
export async function createProjectFile(file: InsertProjectFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectFiles).values(file);
  return result[0].insertId;
}

export async function getProjectFiles(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId)).orderBy(desc(projectFiles.uploadedAt));
}

// Audit trail queries
export async function createAuditEntry(entry: InsertAuditTrail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(auditTrail).values(entry);
  return result[0].insertId;
}

export async function getAuditTrail(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: auditTrail.id,
      projectId: auditTrail.projectId,
      userId: auditTrail.userId,
      action: auditTrail.action,
      changes: auditTrail.changes,
      timestamp: auditTrail.timestamp,
      userName: users.name,
    })
    .from(auditTrail)
    .leftJoin(users, eq(auditTrail.userId, users.id))
    .where(eq(auditTrail.projectId, projectId))
    .orderBy(desc(auditTrail.timestamp));
}

// Invoice queries
export async function createInvoice(invoice: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoices).values(invoice);
  return result[0].insertId;
}

export async function getInvoicesByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(invoices).where(eq(invoices.projectId, projectId)).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(invoiceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInvoice(invoiceId: number, updates: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(invoices).set(updates).where(eq(invoices.id, invoiceId));
}

// Invoice line items queries
export async function createInvoiceLineItem(lineItem: InsertInvoiceLineItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoiceLineItems).values(lineItem);
  return result[0].insertId;
}

export async function getInvoiceLineItems(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
}

// Reschedule requests queries
export async function createRescheduleRequest(request: InsertRescheduleRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(rescheduleRequests).values(request);
  return result[0].insertId;
}

export async function getRescheduleRequests(taskId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (taskId) {
    return await db.select().from(rescheduleRequests).where(eq(rescheduleRequests.taskId, taskId)).orderBy(desc(rescheduleRequests.createdAt));
  }
  
  return await db.select().from(rescheduleRequests).orderBy(desc(rescheduleRequests.createdAt));
}

export async function updateRescheduleRequest(requestId: number, updates: Partial<InsertRescheduleRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(rescheduleRequests).set(updates).where(eq(rescheduleRequests.id, requestId));
}

export async function getAllInvoices() {
  const db = await getDb();
  if (!db) return [];
  
  // Join invoices with projects to get client and project information
  const result = await db
    .select({
      id: invoices.id,
      projectId: invoices.projectId,
      invoiceNumber: invoices.invoiceNumber,
      subtotal: invoices.subtotal,
      tax: invoices.tax,
      total: invoices.total,
      status: invoices.status,
      issuedDate: invoices.issuedDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      pdfUrl: invoices.pdfUrl,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      // Project information
      clientName: projects.clientName,
      address: projects.address,
      propertyOwnerName: projects.propertyOwnerName,
      customerNumber: projects.customerNumber,
    })
    .from(invoices)
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .orderBy(desc(invoices.createdAt));
  
  return result;
}

export async function getInvoicesByClient(client: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Join invoices with projects and filter by client (clientName)
  const result = await db
    .select({
      id: invoices.id,
      projectId: invoices.projectId,
      invoiceNumber: invoices.invoiceNumber,
      subtotal: invoices.subtotal,
      tax: invoices.tax,
      total: invoices.total,
      status: invoices.status,
      issuedDate: invoices.issuedDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      pdfUrl: invoices.pdfUrl,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      // Project information
      clientName: projects.clientName,
      address: projects.address,
      propertyOwnerName: projects.propertyOwnerName,
      customerNumber: projects.customerNumber,
    })
    .from(invoices)
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .where(eq(projects.clientName, client))
    .orderBy(desc(invoices.createdAt));
  
  return result;
}

// User management queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createManualUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values(user);
  return result[0].insertId;
}

export async function updateUser(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(updates).where(eq(users.id, userId));
}

// ============================================
// Invoice Email Log Functions
// ============================================

export async function createEmailLog(data: {
  invoiceId: number;
  recipients: string; // JSON string
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string | null;
  sentBy: number;
}) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    console.warn("[Database] Cannot create email log: database not available");
    return;
  }

  const { invoiceEmailLog } = await import("../drizzle/schema");
  await dbInstance.insert(invoiceEmailLog).values(data);
}

export async function getEmailLogsByInvoiceId(invoiceId: number) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    console.warn("[Database] Cannot get email logs: database not available");
    return [];
  }

  const { invoiceEmailLog, users } = await import("../drizzle/schema");
  const result = await dbInstance
    .select({
      id: invoiceEmailLog.id,
      invoiceId: invoiceEmailLog.invoiceId,
      recipients: invoiceEmailLog.recipients,
      sentAt: invoiceEmailLog.sentAt,
      status: invoiceEmailLog.status,
      errorMessage: invoiceEmailLog.errorMessage,
      sentBy: invoiceEmailLog.sentBy,
      sentByName: users.name,
    })
    .from(invoiceEmailLog)
    .leftJoin(users, eq(invoiceEmailLog.sentBy, users.id))
    .where(eq(invoiceEmailLog.invoiceId, invoiceId))
    .orderBy(desc(invoiceEmailLog.sentAt));

  return result;
}

export async function getInvoiceByNumber(invoiceNumber: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(invoices)
    .where(eq(invoices.invoiceNumber, invoiceNumber))
    .limit(1);
  
  return result[0] || null;
}

// ==================== Deliverables ====================

export async function createDeliverable(data: InsertDeliverable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(deliverables).values(data);
  return result[0].insertId;
}

export async function getDeliverablesByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(deliverables).where(eq(deliverables.taskId, taskId));
}

export async function getDeliverablesByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(deliverables).where(eq(deliverables.projectId, projectId));
}

export async function getDeliverableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(deliverables).where(eq(deliverables.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDeliverableStatus(
  id: number,
  status: string,
  reviewedBy?: number,
  reviewNotes?: string,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {
    status,
    reviewedAt: new Date(),
  };
  
  if (reviewedBy !== undefined) updateData.reviewedBy = reviewedBy;
  if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes;
  if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
  
  await db.update(deliverables).set(updateData).where(eq(deliverables.id, id));
}

export async function submitDeliverable(id: number, submittedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(deliverables).set({
    status: "submitted",
    submittedBy,
    submittedAt: new Date(),
  }).where(eq(deliverables.id, id));
}

export async function getPendingDeliverables() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(deliverables).where(eq(deliverables.status, "submitted"));
}

// ==================== Requests for Information ====================

export async function createROI(data: InsertRequestForInformation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(requestsForInformation).values(data);
  return result[0].insertId;
}

export async function getROIsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(requestsForInformation)
    .where(eq(requestsForInformation.projectId, projectId))
    .orderBy(desc(requestsForInformation.createdAt));
}

export async function getROIById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(requestsForInformation)
    .where(eq(requestsForInformation.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOpenROIsForScheduler() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(requestsForInformation)
    .where(eq(requestsForInformation.status, "open"))
    .orderBy(desc(requestsForInformation.createdAt));
}

export async function respondToROI(
  id: number,
  respondedBy: number,
  responseText: string,
  responseAttachments?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(requestsForInformation).set({
    status: "in_progress",
    respondedBy,
    respondedAt: new Date(),
    responseText,
    responseAttachments: responseAttachments ? JSON.stringify(responseAttachments) : null,
  }).where(eq(requestsForInformation.id, id));
}

export async function updateROIStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (status === "resolved") {
    updateData.resolvedAt = new Date();
  }
  
  await db.update(requestsForInformation).set(updateData)
    .where(eq(requestsForInformation.id, id));
}

export async function getAllOpenROIs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(requestsForInformation)
    .where(eq(requestsForInformation.status, "open"))
    .orderBy(desc(requestsForInformation.createdAt));
}

export async function getAllROIs(client?: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Join with projects to get client information
  let query = db.select()
    .from(requestsForInformation)
    .leftJoin(projects, eq(requestsForInformation.projectId, projects.id));
  
  const conditions = [];
  if (client) {
    conditions.push(eq(projects.clientName, client));
  }
  if (status) {
    conditions.push(eq(requestsForInformation.status, status as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const results = await query.orderBy(desc(requestsForInformation.createdAt));
  
  // Map results to include project info
  return results.map(row => ({
    ...row.requestsForInformation,
    projectAddress: row.projects?.address,
    projectClient: row.projects?.clientName,
    propertyOwnerName: row.projects?.propertyOwnerName,
  }));
}

export async function getROIsByClient(client: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Join with projects to filter by client
  const conditions = [eq(projects.clientName, client)];
  if (status) {
    conditions.push(eq(requestsForInformation.status, status as any));
  }
  
  const results = await db.select()
    .from(requestsForInformation)
    .leftJoin(projects, eq(requestsForInformation.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(desc(requestsForInformation.createdAt));
  
  // Map results to include project info
  return results.map(row => ({
    ...row.requestsForInformation,
    projectAddress: row.projects?.address,
    propertyOwnerName: row.projects?.propertyOwnerName,
  }));
}

// ========================================
// Notification Functions
// ========================================

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

// Alias for consistency
export const getUserNotifications = getNotificationsForUser;

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId));
  
  return result.filter(n => !n.isRead).length;
}

// Push subscription functions
export async function savePushSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return;
  
  // Check if subscription already exists
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);
  
  if (existing.length > 0) {
    // Update last used
    await db
      .update(pushSubscriptions)
      .set({ lastUsed: new Date() })
      .where(eq(pushSubscriptions.id, existing[0].id));
  } else {
    // Insert new subscription
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent || null,
    });
  }
}

export async function removePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}
