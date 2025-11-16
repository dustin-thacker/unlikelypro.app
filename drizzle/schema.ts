import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "client_scheduler", "client_ap", "field_tech"]).default("client_scheduler").notNull(),
  client: varchar("client", { length: 255 }), // For client roles: Manassas - JES, Baltimore - JES, North Haven - Groundworks
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - stores inspection project information
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  projectNumber: varchar("projectNumber", { length: 50 }).unique(), // Auto-generated internal project number (e.g., PRJ-2025-0001)
  clientId: int("clientId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  customerNumber: varchar("customerNumber", { length: 255 }),
  propertyOwnerName: varchar("propertyOwnerName", { length: 255 }).notNull(),
  address: text("address").notNull(),
  billingEmails: text("billingEmails"), // JSON array of email addresses for invoice delivery
  jurisdiction: varchar("jurisdiction", { length: 255 }),
  permitNumber: varchar("permitNumber", { length: 255 }),
  datePermitIssued: datetime("datePermitIssued"),
  contractorName: varchar("contractorName", { length: 255 }),
  subdivision: varchar("subdivision", { length: 255 }),
  lot: varchar("lot", { length: 100 }),
  block: varchar("block", { length: 100 }),
  scopeOfWork: text("scopeOfWork"),
  isPostConstruction: boolean("isPostConstruction").default(false).notNull(),
  completionDate: datetime("completionDate"),
  productionDays: int("productionDays").default(0),
  status: mysqlEnum("status", [
    "draft",
    "pending_verification",
    "verified",
    "scheduled",
    "in_progress",
    "inspection_complete",
    "invoice_generated",
    "invoiced",
    "paid",
    "closed",
    "completed",
    "cancelled"
  ]).default("draft").notNull(),
  certificationType: mysqlEnum("certificationType", ["as_permitted", "as_built"]),
  certificationGeneratedAt: timestamp("certificationGeneratedAt"),
  certificationFileKey: varchar("certificationFileKey", { length: 512 }),
  certificationFileUrl: text("certificationFileUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Attachments table - stores PDF files (plans and permits)
 */
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: mysqlEnum("fileType", ["plan", "permit", "production_photo"]).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

/**
 * Extracted data table - stores LLM-extracted information from PDFs
 */
export const extractedData = mysqlTable("extractedData", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  attachmentId: int("attachmentId").notNull(),
  propertyOwnerName: varchar("propertyOwnerName", { length: 255 }),
  address: text("address"),
  jurisdiction: varchar("jurisdiction", { length: 255 }),
  permitNumber: varchar("permitNumber", { length: 255 }),
  datePermitIssued: datetime("datePermitIssued"),
  contractorName: varchar("contractorName", { length: 255 }),
  subdivision: varchar("subdivision", { length: 255 }),
  lot: varchar("lot", { length: 100 }),
  block: varchar("block", { length: 100 }),
  scopeOfWork: text("scopeOfWork"),
  detectedProductIds: text("detectedProductIds"), // JSON array of product IDs
  isVerified: boolean("isVerified").default(false).notNull(),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
});

export type ExtractedData = typeof extractedData.$inferSelect;
export type InsertExtractedData = typeof extractedData.$inferInsert;

/**
 * Tasks table - stores inspection scheduling and tracking
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledDate: datetime("scheduledDate"),
  fieldTechId: int("fieldTechId"), // Assigned field technician
  status: mysqlEnum("status", [
    "pending",
    "scheduled",
    "assigned",
    "in_progress",
    "completed",
    "verified",
    "cancelled"
  ]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Project notes table - stores notes added by users
 */
export const projectNotes = mysqlTable("projectNotes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  note: text("note").notNull(),
  noteType: mysqlEnum("noteType", ["general", "scope_change", "production", "conversation", "field_changes"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectNote = typeof projectNotes.$inferSelect;
export type InsertProjectNote = typeof projectNotes.$inferInsert;

/**
 * Project files table - additional file uploads beyond initial plans/permits
 */
export const projectFiles = mysqlTable("projectFiles", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: mysqlEnum("fileType", ["production_photo", "updated_plan", "updated_permit", "pier_log", "other"]).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;

/**
 * Audit trail table - tracks all changes to projects
 */
export const auditTrail = mysqlTable("auditTrail", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  changes: text("changes"), // JSON string of before/after values
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;

/**
 * Deliverables table - tracks inspection deliverables (reports, photos, etc.)
 */
export const deliverables = mysqlTable("deliverables", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  taskId: int("taskId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deliverableType: mysqlEnum("deliverableType", ["report", "photos", "certificate", "other"]).notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: text("fileUrl"),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "submitted",
    "approved",
    "needs_revision",
    "rejected"
  ]).default("pending").notNull(),
  submittedBy: int("submittedBy"),
  submittedAt: timestamp("submittedAt"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;

/**
 * Request for Information (RFI) table - tracks information requests from admins to schedulers
 */
export const requestsForInformation = mysqlTable("requestsForInformation", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  requestedBy: int("requestedBy").notNull(),
  requestType: mysqlEnum("requestType", [
    "production_photos",
    "updated_plans_permit",
    "drive_logs",
    "rdp_statement",
    "other"
  ]).default("other").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  dueDate: datetime("dueDate"),
  respondedBy: int("respondedBy"),
  respondedAt: timestamp("respondedAt"),
  responseText: text("responseText"),
  responseAttachments: text("responseAttachments"), // JSON array of file URLs
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RequestForInformation = typeof requestsForInformation.$inferSelect;
export type InsertRequestForInformation = typeof requestsForInformation.$inferInsert;

/**
 * Invoices table - financial tracking
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "paid", "overdue"]).default("draft").notNull(),
  subtotal: int("subtotal").notNull(), // Store in cents
  tax: int("tax").default(0).notNull(),
  total: int("total").notNull(),
  pdfUrl: text("pdfUrl"),
  issuedDate: datetime("issuedDate"),
  dueDate: datetime("dueDate"),
  paidDate: datetime("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice line items table
 */
export const invoiceLineItems = mysqlTable("invoiceLineItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: text("description").notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: int("unitPrice").notNull(), // Store in cents
  total: int("total").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

/**
 * Reschedule requests table - tracks client requests to change schedule
 */
export const rescheduleRequests = mysqlTable("rescheduleRequests", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  requestedBy: int("requestedBy").notNull(),
  requestType: mysqlEnum("requestType", ["reschedule", "cancel"]).notNull(),
  currentDate: datetime("currentDate"),
  requestedDate: datetime("requestedDate"),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RescheduleRequest = typeof rescheduleRequests.$inferSelect;
export type InsertRescheduleRequest = typeof rescheduleRequests.$inferInsert;

/**
 * Invoice Email Log table - tracks email delivery for invoices
 */
export const invoiceEmailLog = mysqlTable("invoiceEmailLog", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  recipients: text("recipients").notNull(), // JSON array of email addresses
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentBy: int("sentBy").notNull(), // User ID who triggered the send
});

export type InvoiceEmailLog = typeof invoiceEmailLog.$inferSelect;
export type InsertInvoiceEmailLog = typeof invoiceEmailLog.$inferInsert;

/**
 * Status History table - tracks all status changes for audit trail
 */
export const statusHistory = mysqlTable("statusHistory", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["project", "task", "deliverable", "invoice"]).notNull(),
  entityId: int("entityId").notNull(),
  oldStatus: varchar("oldStatus", { length: 100 }),
  newStatus: varchar("newStatus", { length: 100 }).notNull(),
  changedBy: int("changedBy").notNull(),
  reason: text("reason"),
  metadata: text("metadata"), // JSON for additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StatusHistory = typeof statusHistory.$inferSelect;
export type InsertStatusHistory = typeof statusHistory.$inferInsert;

/**
 * Notifications table - stores in-app notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["task_assigned", "task_updated", "task_completed", "deliverable_approved", "deliverable_rejected", "rfi_created", "rfi_responded"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  entityType: mysqlEnum("entityType", ["project", "task", "deliverable", "invoice", "rfi"]),
  entityId: int("entityId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Push subscriptions table - stores web push notification subscriptions
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsed: timestamp("lastUsed").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Relations
 */
export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(users, {
    fields: [projects.clientId],
    references: [users.id],
  }),
  attachments: many(attachments),
  extractedData: many(extractedData),
  tasks: many(tasks),
  notes: many(projectNotes),
  files: many(projectFiles),
  auditTrail: many(auditTrail),
  invoices: many(invoices),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  project: one(projects, {
    fields: [attachments.projectId],
    references: [projects.id],
  }),
}));

export const extractedDataRelations = relations(extractedData, ({ one }) => ({
  project: one(projects, {
    fields: [extractedData.projectId],
    references: [projects.id],
  }),
  attachment: one(attachments, {
    fields: [extractedData.attachmentId],
    references: [attachments.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  rescheduleRequests: many(rescheduleRequests),
}));

export const projectNotesRelations = relations(projectNotes, ({ one }) => ({
  project: one(projects, {
    fields: [projectNotes.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectNotes.userId],
    references: [users.id],
  }),
}));

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectFiles.userId],
    references: [users.id],
  }),
}));

export const auditTrailRelations = relations(auditTrail, ({ one }) => ({
  project: one(projects, {
    fields: [auditTrail.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [auditTrail.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  lineItems: many(invoiceLineItems),
  emailLogs: many(invoiceEmailLog),
}));

export const invoiceEmailLogRelations = relations(invoiceEmailLog, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceEmailLog.invoiceId],
    references: [invoices.id],
  }),
  sentByUser: one(users, {
    fields: [invoiceEmailLog.sentBy],
    references: [users.id],
  }),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const rescheduleRequestsRelations = relations(rescheduleRequests, ({ one }) => ({
  task: one(tasks, {
    fields: [rescheduleRequests.taskId],
    references: [tasks.id],
  }),
  requestedByUser: one(users, {
    fields: [rescheduleRequests.requestedBy],
    references: [users.id],
  }),
}));
