import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { extractedData } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { extractDataFromPDF, mergeExtractedData } from "./pdfExtraction";
import { generateInvoicePDF } from "./pdfGenerator";
import { generateInvoiceEmailHTML, sendEmail } from "./emailService";
import { processPaymentEmails } from "./paymentProcessing";
import { notifyOwner } from "./_core/notification";
import { generateCertification, generateCertificationPreview } from "./certifications";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Client scheduler procedure (scheduler + admin)
const schedulerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'client_scheduler') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Scheduler access required' });
  }
  return next({ ctx });
});

// Client AP/Office Manager procedure (AP + admin)
const apProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'client_ap') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'AP access required' });
  }
  return next({ ctx });
});

// Field technician procedure (field tech + admin)
const fieldTechProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'field_tech') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Field technician access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    // Create a new project
    create: protectedProcedure
      .input(z.object({
        clientName: z.string(),
        customerNumber: z.string().optional(),
        propertyOwnerName: z.string(),
        address: z.string(),
        billingEmails: z.string().optional(), // JSON string of email array
        isPostConstruction: z.boolean().optional(),
        completionDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createProject({
          clientId: ctx.user.id,
          clientName: input.clientName,
          customerNumber: input.customerNumber || null,
          propertyOwnerName: input.propertyOwnerName,
          address: input.address,
          billingEmails: input.billingEmails || null,
          isPostConstruction: input.isPostConstruction || false,
          completionDate: input.completionDate ? new Date(input.completionDate) : null,
        });
        return { projectId };
      }),

    // Get user's projects (filtered by branch for non-admin users)
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') {
        return await db.getAllProjects();
      } else {
        // Get all user's projects
        const userProjects = await db.getProjectsByClientId(ctx.user.id);
        
        // Get the user's branch from their first project, or return empty if no projects
        if (userProjects.length === 0) return [];
        
        const userBranch = userProjects[0].clientName;
        
        // Filter to only show projects from the same branch
        return userProjects.filter(project => project.clientName === userBranch);
      }
    }),

    // Get project by ID
    getById: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // Check access: admin or project owner
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return project;
      }),

    // Update project
    update: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        propertyOwnerName: z.string().optional(),
        address: z.string().optional(),
        jurisdiction: z.string().optional(),
        permitNumber: z.string().optional(),
        scopeOfWork: z.string().optional(),
        billingEmails: z.string().optional(), // JSON string of email array
        status: z.enum(['pending_verification', 'verified', 'scheduled', 'in_progress', 'inspection_complete', 'invoice_generated', 'completed', 'cancelled']).optional(),
        productionDays: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // Check access
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const { projectId, ...updates } = input;
        await db.updateProject(projectId, updates);
        return { success: true };
      }),

    // Get project with all related data
    getWithDetails: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const attachments = await db.getAttachmentsByProjectId(input.projectId);
        const extractedData = await db.getExtractedDataByProjectId(input.projectId);
        const tasks = await db.getTasksByProjectId(input.projectId);
        
        return {
          project,
          attachments,
          extractedData,
          tasks,
        };
      }),

    // Verify project with extracted data and products
    verify: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        propertyOwnerName: z.string(),
        address: z.string(),
        jurisdiction: z.string().optional(),
        permitNumber: z.string(),
        scopeOfWork: z.string().optional(),
        datePermitIssued: z.string().optional(),
        contractorName: z.string().optional(),
        subdivision: z.string().optional(),
        lot: z.string().optional(),
        block: z.string().optional(),
        detectedProductIds: z.array(z.string()),
        isPostProduction: z.boolean(),
        productionStartDate: z.string().optional(),
        productionEndDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Calculate production days if post-production with dates
        let productionDays = 0;
        if (input.isPostProduction && input.productionStartDate && input.productionEndDate) {
          const startDate = new Date(input.productionStartDate);
          const endDate = new Date(input.productionEndDate);
          productionDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        
        // Update project with verified data
        await db.updateProject(input.projectId, {
          propertyOwnerName: input.propertyOwnerName,
          address: input.address,
          jurisdiction: input.jurisdiction || null,
          permitNumber: input.permitNumber,
          scopeOfWork: input.scopeOfWork || null,
          datePermitIssued: input.datePermitIssued ? new Date(input.datePermitIssued) : null,
          contractorName: input.contractorName || null,
          subdivision: input.subdivision || null,
          lot: input.lot || null,
          block: input.block || null,
          isPostConstruction: input.isPostProduction,
          completionDate: input.productionEndDate ? new Date(input.productionEndDate) : null,
          productionDays,
          status: 'verified',
        });
        
        // Update extracted data with verified products
        const dbInstance = await getDb();
        if (dbInstance) {
          await dbInstance.update(extractedData)
            .set({
              detectedProductIds: JSON.stringify(input.detectedProductIds),
              isVerified: true,
            })
            .where(eq(extractedData.projectId, input.projectId));
        }
        
        return { success: true };
      }),
  }),

  attachments: router({
    // Upload attachment
    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileType: z.enum(['plan', 'permit', 'production_photo']),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Decode base64 and upload to S3
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const fileKey = `projects/${input.projectId}/${input.fileType}/${input.fileName}-${randomSuffix}`;
        
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        const attachmentId = await db.createAttachment({
          projectId: input.projectId,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileType: input.fileType,
          mimeType: input.mimeType,
          fileSize: fileBuffer.length,
        });
        
        return { attachmentId, fileUrl: url };
      }),

    // Extract data from PDF
    extractData: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        attachmentId: z.number() 
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Get attachment
        const attachments = await db.getAttachmentsByProjectId(input.projectId);
        const attachment = attachments.find(a => a.id === input.attachmentId);
        
        if (!attachment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
        }
        
        // Extract data from PDF
        const extractedData = await extractDataFromPDF(attachment.fileUrl);
        
        // Save extracted data
        const dataId = await db.createExtractedData({
          projectId: input.projectId,
          attachmentId: input.attachmentId,
          propertyOwnerName: extractedData.propertyOwnerName,
          address: extractedData.address,
          jurisdiction: extractedData.jurisdiction,
          permitNumber: extractedData.permitNumber,
          datePermitIssued: extractedData.datePermitIssued ? new Date(extractedData.datePermitIssued) : undefined,
          contractorName: extractedData.contractorName,
          subdivision: extractedData.subdivision,
          lot: extractedData.lot,
          block: extractedData.block,
          scopeOfWork: extractedData.scopeOfWork,
        });
        
        return { 
          dataId, 
          extractedData 
        };
      }),

    // Get attachments for a project
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return await db.getAttachmentsByProjectId(input.projectId);
      }),
  }),

  extractedData: router({
    // Create extracted data
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        attachmentId: z.number(),
        propertyOwnerName: z.string().optional(),
        address: z.string().optional(),
        jurisdiction: z.string().optional(),
        permitNumber: z.string().optional(),
        scopeOfWork: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const dataId = await db.createExtractedData(input);
        return { dataId };
      }),

    // Verify extracted data
    verify: protectedProcedure
      .input(z.object({
        dataId: z.number(),
        projectId: z.number(),
        propertyOwnerName: z.string().optional(),
        address: z.string().optional(),
        jurisdiction: z.string().optional(),
        permitNumber: z.string().optional(),
        datePermitIssued: z.string().optional(),
        contractorName: z.string().optional(),
        subdivision: z.string().optional(),
        lot: z.string().optional(),
        block: z.string().optional(),
        scopeOfWork: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Update extracted data as verified
        await db.updateExtractedData(input.dataId, {
          isVerified: true,
          propertyOwnerName: input.propertyOwnerName,
          address: input.address,
          jurisdiction: input.jurisdiction,
          permitNumber: input.permitNumber,
          datePermitIssued: input.datePermitIssued ? new Date(input.datePermitIssued) : undefined,
          contractorName: input.contractorName,
          subdivision: input.subdivision,
          lot: input.lot,
          block: input.block,
          scopeOfWork: input.scopeOfWork,
        });
        
        // Update project with verified data
        await db.updateProject(input.projectId, {
          propertyOwnerName: input.propertyOwnerName,
          address: input.address,
          jurisdiction: input.jurisdiction,
          permitNumber: input.permitNumber,
          datePermitIssued: input.datePermitIssued ? new Date(input.datePermitIssued) : undefined,
          contractorName: input.contractorName,
          subdivision: input.subdivision,
          lot: input.lot,
          block: input.block,
          scopeOfWork: input.scopeOfWork,
          status: 'verified',
        });
        
        return { success: true };
      }),

    // Get extracted data for a project
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return await db.getExtractedDataByProjectId(input.projectId);
      }),
  }),

  tasks: router({
    // Create a task
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        taskType: z.string(),
        scheduledDate: z.date(),
        assignedToId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'field_tech' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const taskId = await db.createTask({
          projectId: input.projectId,
          title: input.taskType,
          description: input.notes,
          scheduledDate: input.scheduledDate,
          fieldTechId: input.assignedToId,
        });
        
        // Update project status to scheduled if it was verified
        if (project.status === 'verified') {
          await db.updateProject(input.projectId, { status: 'scheduled' });
        }
        
        return { taskId };
      }),

    // Get tasks for a project
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return await db.getTasksByProjectId(input.projectId);
      }),

    // Get all tasks (admin only)
    listAll: adminProcedure.query(async () => {
      return await db.getAllTasks();
    }),

    // Get tasks for current user's projects (with project data)
    listForUser: protectedProcedure.query(async ({ ctx }) => {
      let tasks = [];
      
      if (ctx.user.role === 'admin' || ctx.user.role === 'field_tech') {
        tasks = await db.getAllTasks();
      } else {
        // Get user's projects
        const userProjects = await db.getProjectsByClientId(ctx.user.id);
        const projectIds = userProjects.map(p => p.id);
        
        // Get tasks for those projects
        for (const projectId of projectIds) {
          const projectTasks = await db.getTasksByProjectId(projectId);
          tasks.push(...projectTasks);
        }
      }
      
      // Enrich tasks with project data
      const tasksWithProjects = await Promise.all(
        tasks.map(async (task) => {
          const project = await db.getProjectById(task.projectId);
          return {
            ...task,
            project,
          };
        })
      );
      
      return tasksWithProjects;
    }),

    // Assign field tech to task
    assignFieldTech: adminProcedure
      .input(z.object({
        taskId: z.number(),
        fieldTechId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
        }
        
        const project = await db.getProjectById(task.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // Update task with field tech
        await db.updateTask(input.taskId, { fieldTechId: input.fieldTechId });
        
        // Send notification to field tech
        const { notifyTaskAssigned } = await import('./notificationService');
        await notifyTaskAssigned(
          input.fieldTechId,
          input.taskId,
          task.title,
          project.address
        );
        
        return { success: true };
      }),

    // Update task
    update: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        projectId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        scheduledDate: z.string().optional(),
        status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
        fieldTechId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const task = await db.getTaskById(input.taskId);
        if (!task) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
        }
        
        const { taskId, projectId, ...updates } = input;
        const updateData: any = { ...updates };
        if (updates.scheduledDate) {
          updateData.scheduledDate = new Date(updates.scheduledDate);
        }
        
        await db.updateTask(taskId, updateData);
        
        // Send notification if task was updated and has a field tech
        if (task.fieldTechId && (updates.title || updates.scheduledDate || updates.description)) {
          const { notifyTaskUpdated } = await import('./notificationService');
          let changeDesc = '';
          if (updates.scheduledDate) changeDesc = 'Schedule updated';
          else if (updates.title) changeDesc = 'Task details updated';
          else changeDesc = 'Task updated';
          
          await notifyTaskUpdated(
            task.fieldTechId,
            taskId,
            updates.title || task.title,
            changeDesc
          );
        }
        
        return { success: true };
      }),
  }),

  // Project notes router
  projectNotes: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        note: z.string(),
        noteType: z.enum(['general', 'scope_change', 'production', 'conversation']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // Check access
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const noteId = await db.createProjectNote({
          projectId: input.projectId,
          userId: ctx.user.id,
          note: input.note,
          noteType: input.noteType || 'general',
        });
        
        // Create audit trail entry
        await db.createAuditEntry({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'Added note',
          changes: JSON.stringify({ noteType: input.noteType || 'general' }),
        });
        
        return { noteId };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return await db.getProjectNotes(input.projectId);
      }),
  }),

  // Project files router
  projectFiles: router({
    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        fileType: z.enum(['production_photo', 'updated_plan', 'updated_permit', 'pier_log', 'other']),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Decode base64 and upload to S3
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `project-${input.projectId}/files/${input.fileName}-${randomSuffix}`;
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        const fileId = await db.createProjectFile({
          projectId: input.projectId,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileType: input.fileType,
          mimeType: input.mimeType,
          fileSize: fileBuffer.length,
        });
        
        // Create audit trail entry
        await db.createAuditEntry({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: `Uploaded ${input.fileType}`,
          changes: JSON.stringify({ fileName: input.fileName }),
        });
        
        return { fileId, url };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return await db.getProjectFiles(input.projectId);
      }),
  }),

  // Audit trail router
  auditTrail: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        if (ctx.user.role !== 'admin' && project.clientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return await db.getAuditTrail(input.projectId);
      }),
  }),

  // Invoices router (admin and AP only)
  invoices: router({
    create: adminProcedure
      .input(z.object({
        projectId: z.number(),
        invoiceNumber: z.string(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(), // in cents
        })),
        tax: z.number().optional(),
        issuedDate: z.string().optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // Calculate totals
        const subtotal = input.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = input.tax || 0;
        const total = subtotal + tax;
        
        const invoiceId = await db.createInvoice({
          projectId: input.projectId,
          invoiceNumber: input.invoiceNumber,
          subtotal,
          tax,
          total,
          status: 'draft',
          issuedDate: input.issuedDate ? new Date(input.issuedDate) : undefined,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
        
        // Create line items
        for (const item of input.lineItems) {
          await db.createInvoiceLineItem({
            invoiceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          });
        }
        
        // Create audit trail entry
        await db.createAuditEntry({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'Created invoice',
          changes: JSON.stringify({ invoiceNumber: input.invoiceNumber, total }),
        });
        
        return { invoiceId };
      }),

    listAll: apProcedure
      .query(async ({ ctx }) => {
        // Admin can see all invoices
        if (ctx.user.role === 'admin') {
          return await db.getAllInvoices();
        }
        
        // AP users can only see their client's invoices
        if (!ctx.user.client) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User client not set' });
        }
        
        return await db.getInvoicesByClient(ctx.user.client);
      }),

    list: apProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // AP users can only see their client's projects
        if (ctx.user.role === 'client_ap' && project.clientName !== ctx.user.client) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return await db.getInvoicesByProjectId(input.projectId);
      }),

    getDetails: apProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
        }
        
        const project = await db.getProjectById(invoice.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // AP users can only see their client's invoices
        if (ctx.user.role === 'client_ap' && project.clientName !== ctx.user.client) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const lineItems = await db.getInvoiceLineItems(input.invoiceId);
        return { invoice, lineItems };
      }),

    updateStatus: adminProcedure
      .input(z.object({
        invoiceId: z.number(),
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the invoice to access projectId
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
        }

        // Prepare update object
        const updates: any = { status: input.status };
        
        // Automatically set paidDate when marking as paid
        if (input.status === 'paid' && invoice.status !== 'paid') {
          updates.paidDate = new Date();
        }
        
        // Clear paidDate if changing from paid to another status
        if (input.status !== 'paid' && invoice.status === 'paid') {
          updates.paidDate = null;
        }
        
        await db.updateInvoice(input.invoiceId, updates);
        
        // Create audit trail entry
        await db.createAuditEntry({
          projectId: invoice.projectId,
          userId: ctx.user.id,
          action: `Updated invoice status`,
          changes: JSON.stringify({
            invoiceNumber: invoice.invoiceNumber,
            oldStatus: invoice.status,
            newStatus: input.status,
            paidDate: updates.paidDate,
          }),
        });
        
        // Send email when status changes to "sent"
        if (input.status === 'sent' && invoice.status !== 'sent') {
          const project = await db.getProjectById(invoice.projectId);
          if (project && project.billingEmails) {
            try {
              // Parse billing emails from JSON
              const emails = JSON.parse(project.billingEmails) as string[];
              
              if (emails.length > 0) {
                // Generate PDF
                const lineItems = await db.getInvoiceLineItems(input.invoiceId);
                const pdfBuffer = await generateInvoicePDF({
                  invoice,
                  project,
                  lineItems,
                });
                
                // Generate email HTML
                const emailHTML = generateInvoiceEmailHTML({
                  invoiceNumber: invoice.invoiceNumber,
                  clientName: project.clientName,
                  propertyOwnerName: project.propertyOwnerName,
                  address: project.address,
                  total: invoice.total,
                  dueDate: invoice.dueDate,
                });
                
                // Send email with PDF attachment
                const emailSuccess = await sendEmail({
                  to: emails,
                  subject: `Invoice ${invoice.invoiceNumber} - JES Foundation Repair`,
                  html: emailHTML,
                  attachments: [{
                    filename: `invoice-${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                  }],
                });
                
                // Log email delivery
                await db.createEmailLog({
                  invoiceId: input.invoiceId,
                  recipients: project.billingEmails,
                  status: emailSuccess ? 'success' : 'failed',
                  errorMessage: emailSuccess ? null : 'Email delivery failed',
                  sentBy: ctx.user.id,
                });
                
                console.log(`[Invoice] Email sent to ${emails.length} recipient(s) for invoice ${invoice.invoiceNumber}`);
              }
            } catch (emailError) {
              console.error('[Invoice] Failed to send email:', emailError);
              
              // Log failed email attempt
              try {
                await db.createEmailLog({
                  invoiceId: input.invoiceId,
                  recipients: project.billingEmails || '[]',
                  status: 'failed',
                  errorMessage: emailError instanceof Error ? emailError.message : 'Unknown error',
                  sentBy: ctx.user.id,
                });
              } catch (logError) {
                console.error('[Invoice] Failed to log email error:', logError);
              }
              
              // Don't fail the status update if email fails
            }
          }
        }
        
        return { success: true };
      }),

    generatePDF: apProcedure
      .input(z.object({ invoiceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get invoice details
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
        }
        
        const project = await db.getProjectById(invoice.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // AP users can only generate PDFs for their client's invoices
        if (ctx.user.role === 'client_ap' && project.clientName !== ctx.user.client) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const lineItems = await db.getInvoiceLineItems(input.invoiceId);
        
        // Generate PDF
        const pdfBuffer = await generateInvoicePDF({
          invoice,
          project,
          lineItems,
        });
        
        // Convert buffer to base64 for transmission
        const base64PDF = pdfBuffer.toString('base64');
        
        return {
          pdf: base64PDF,
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
        };
      }),
    
    // Get email delivery logs for an invoice
    getEmailLogs: apProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmailLogsByInvoiceId(input.invoiceId);
      }),
    
    // Retry sending invoice email
    retryEmail: apProcedure
      .input(z.object({ invoiceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        
        const project = await db.getProjectById(invoice.projectId);
        if (!project || !project.billingEmails) {
          throw new Error('Project or billing emails not found');
        }
        
        try {
          // Parse billing emails from JSON
          const emails = JSON.parse(project.billingEmails) as string[];
          
          if (emails.length === 0) {
            throw new Error('No billing emails configured');
          }
          
          // Generate PDF
          const lineItems = await db.getInvoiceLineItems(input.invoiceId);
          const pdfBuffer = await generateInvoicePDF({
            invoice,
            project,
            lineItems,
          });
          
          // Generate email HTML
          const emailHTML = generateInvoiceEmailHTML({
            invoiceNumber: invoice.invoiceNumber,
            clientName: project.clientName,
            propertyOwnerName: project.propertyOwnerName,
            address: project.address,
            total: invoice.total,
            dueDate: invoice.dueDate,
          });
          
          // Send email with PDF attachment
          const emailSuccess = await sendEmail({
            to: emails,
            subject: `Invoice ${invoice.invoiceNumber} - JES Foundation Repair`,
            html: emailHTML,
            attachments: [{
              filename: `invoice-${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            }],
          });
          
          // Log retry attempt
          await db.createEmailLog({
            invoiceId: input.invoiceId,
            recipients: project.billingEmails,
            status: emailSuccess ? 'success' : 'failed',
            errorMessage: emailSuccess ? null : 'Email delivery failed',
            sentBy: ctx.user.id,
          });
          
          return { success: emailSuccess };
        } catch (error) {
          // Log failed retry attempt
          await db.createEmailLog({
            invoiceId: input.invoiceId,
            recipients: project.billingEmails || '[]',
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            sentBy: ctx.user.id,
          });
          
          throw error;
        }
      }),
    
    // Process payment emails and update invoice status
    processPayments: adminProcedure
      .mutation(async ({ ctx }) => {
        try {
          // Get payment emails and extract invoice numbers
          const payments = await processPaymentEmails();
          
          const matched: Array<{ invoiceNumber: string; invoiceId: number; amount?: string }> = [];
          const unmatched: Array<{ invoiceNumber: string; emailSubject: string; amount?: string }> = [];
          
          // Try to match each payment with an invoice in the database
          for (const payment of payments) {
            if (payment.invoiceNumber === 'UNKNOWN') {
              unmatched.push({
                invoiceNumber: payment.invoiceNumber,
                emailSubject: payment.emailSubject,
                amount: payment.amount,
              });
              continue;
            }
            
            // Try to find invoice by invoice number
            const invoice = await db.getInvoiceByNumber(payment.invoiceNumber);
            
            if (invoice) {
              // Update invoice to paid status
              await db.updateInvoice(invoice.id, {
                status: 'paid',
                paidDate: new Date(),
              });
              
              matched.push({
                invoiceNumber: payment.invoiceNumber,
                invoiceId: invoice.id,
                amount: payment.amount,
              });
            } else {
              unmatched.push({
                invoiceNumber: payment.invoiceNumber,
                emailSubject: payment.emailSubject,
                amount: payment.amount,
              });
            }
          }
          
          // Send notification to owner with processing summary
          const notificationContent = `
**Payment Processing Summary**

Total Emails Processed: ${payments.length}

**Matched Invoices (${matched.length}):**
${matched.length > 0 ? matched.map(m => `- Invoice ${m.invoiceNumber}${m.amount ? ` ($${m.amount})` : ''}`).join('\n') : 'None'}

**Unmatched Payments (${unmatched.length}):**
${unmatched.length > 0 ? unmatched.map(u => `- ${u.invoiceNumber === 'UNKNOWN' ? 'No invoice number found' : `Invoice ${u.invoiceNumber}`}${u.amount ? ` ($${u.amount})` : ''}\n  Email: ${u.emailSubject}`).join('\n\n') : 'None'}
${unmatched.length > 0 ? '\n⚠️ Please review unmatched payments in the Payment Processing dashboard.' : ''}
          `.trim();
          
          await notifyOwner({
            title: `Payment Processing Complete: ${matched.length} invoices paid`,
            content: notificationContent,
          });
          
          return {
            success: true,
            matched,
            unmatched,
            totalProcessed: payments.length,
          };
        } catch (error) {
          console.error('[Payment Processing] Error:', error);
          throw new Error(`Failed to process payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),
  }),

  // Extraction router
  extraction: router({    getByProject: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        
        const results = await db.select().from(extractedData)
          .where(eq(extractedData.projectId, input.projectId))
          .limit(1);
        
        return results[0] || null;
      }),
  }),

  // Reschedule requests router
  rescheduleRequests: router({
    create: schedulerProcedure
      .input(z.object({
        taskId: z.number(),
        requestType: z.enum(['reschedule', 'cancel']),
        requestedDate: z.string().optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.getTasksByProjectId(0); // Need to get task by ID
        // TODO: Add getTaskById to db.ts
        
        const requestId = await db.createRescheduleRequest({
          taskId: input.taskId,
          requestedBy: ctx.user.id,
          requestType: input.requestType,
          requestedDate: input.requestedDate ? new Date(input.requestedDate) : undefined,
          reason: input.reason,
          status: 'pending',
        });
        
        return { requestId };
      }),

    list: adminProcedure
      .query(async () => {
        return await db.getRescheduleRequests();
      }),

    approve: adminProcedure
      .input(z.object({
        requestId: z.number(),
        approved: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const status = input.approved ? 'approved' : 'rejected';
        await db.updateRescheduleRequest(input.requestId, {
          status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        });
        
        // If approved and it's a reschedule, update the task
        if (input.approved) {
          const requests = await db.getRescheduleRequests();
          const request = requests.find(r => r.id === input.requestId);
          if (request && request.requestType === 'reschedule' && request.requestedDate) {
            await db.updateTask(request.taskId, {
              scheduledDate: request.requestedDate,
            });
          } else if (request && request.requestType === 'cancel') {
            await db.updateTask(request.taskId, {
              status: 'cancelled',
            });
          }
        }
        
        return { success: true };
      }),
  }),

  // Users router (admin only)
  users: router({
    list: adminProcedure
      .query(async () => {
        return await db.getAllUsers();
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'client_scheduler', 'client_ap', 'field_tech']),
        client: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Generate a unique openId for the new user
        const openId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const userId = await db.createManualUser({
          openId,
          name: input.name,
          email: input.email,
          role: input.role,
          client: input.client || null,
        });
        
        return { userId };
      }),

    update: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'client_scheduler', 'client_ap', 'field_tech']),
        client: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUser(input.userId, {
          name: input.name,
          email: input.email,
          role: input.role,
          client: input.client || null,
        });
        
        return { success: true };
      }),
  }),

  // Deliverables router
  deliverables: router({
    // Field tech: Upload deliverable
    upload: fieldTechProcedure
      .input(z.object({
        projectId: z.number(),
        taskId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        deliverableType: z.enum(["report", "photos", "certificate", "other"]),
        fileKey: z.string(),
        fileUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const deliverableId = await db.createDeliverable({
          projectId: input.projectId,
          taskId: input.taskId,
          title: input.title,
          description: input.description,
          deliverableType: input.deliverableType,
          fileKey: input.fileKey,
          fileUrl: input.fileUrl,
          status: "pending",
        });
        
        return { deliverableId };
      }),

    // Field tech: Submit deliverable for review
    submit: fieldTechProcedure
      .input(z.object({ deliverableId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.submitDeliverable(input.deliverableId, ctx.user.id);
        return { success: true };
      }),

    // Get deliverables by task
    listByTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliverablesByTaskId(input.taskId);
      }),

    // Get deliverables by project
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliverablesByProjectId(input.projectId);
      }),

    // Get deliverables by project (alias for consistency with other routers)
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliverablesByProjectId(input.projectId);
      }),

    // Admin: Get pending deliverables
    listPending: adminProcedure
      .query(async () => {
        return await db.getPendingDeliverables();
      }),

    // Admin: Approve deliverable
    approve: adminProcedure
      .input(z.object({
        deliverableId: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateDeliverableStatus(
          input.deliverableId,
          "approved",
          ctx.user.id,
          input.reviewNotes
        );
        return { success: true };
      }),

    // Admin: Request revision
    requestRevision: adminProcedure
      .input(z.object({
        deliverableId: z.number(),
        reviewNotes: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateDeliverableStatus(
          input.deliverableId,
          "needs_revision",
          ctx.user.id,
          input.reviewNotes
        );
        return { success: true };
      }),

    // Admin: Reject deliverable
    reject: adminProcedure
      .input(z.object({
        deliverableId: z.number(),
        rejectionReason: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateDeliverableStatus(
          input.deliverableId,
          "rejected",
          ctx.user.id,
          undefined,
          input.rejectionReason
        );
        return { success: true };
      }),
  }),

  // Request for Information (RFI) router
  rfi: router({
    // Admin: Create RFI
    create: adminProcedure
      .input(z.object({
        projectId: z.number(),
        requestType: z.enum(["production_photos", "updated_plans_permit", "drive_logs", "rdp_statement", "other"]),
        title: z.string(),
        description: z.string(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const roiId = await db.createROI({
          projectId: input.projectId,
          requestedBy: ctx.user.id,
          requestType: input.requestType,
          title: input.title,
          description: input.description,
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          status: "open",
        });
        
        // Notify owner about new RFI
        try {
          await notifyOwner({
            title: "New RFI Created",
            content: `RFI "${input.title}" created for Project #${input.projectId}. Type: ${input.requestType.replace(/_/g, ' ').toUpperCase()}, Priority: ${input.priority.toUpperCase()}${input.dueDate ? `, Due: ${new Date(input.dueDate).toLocaleDateString()}` : ""}`,
          });
        } catch (error) {
          console.error("Failed to send RFI notification:", error);
        }
        
        return { roiId };
      }),

    // Get RFIs by project
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getROIsByProjectId(input.projectId);
      }),

        // Scheduler: Get open RFIs
    listOpen: schedulerProcedure
      .query(async () => {
        return await db.getOpenROIsForScheduler();
      }),

    // Admin: Get all open RFIs
    listAllOpen: adminProcedure
      .query(async () => {
        return await db.getAllOpenROIs();
      }),

    // Scheduler: Respond to RFI
    respond: schedulerProcedure
      .input(z.object({
        roiId: z.number(),
        responseText: z.string(),
        responseAttachments: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get ROI details for notification
        const roi = await db.getROIById(input.roiId);
        
        await db.respondToROI(
          input.roiId,
          ctx.user.id,
          input.responseText,
          input.responseAttachments
        );
        
        // Notify owner about response
        try {
          await notifyOwner({
            title: "RFI Response Received",
            content: `Response received for RFI "${roi?.title || "#" + input.roiId}" from ${ctx.user.name || "scheduler"}. ${input.responseAttachments && input.responseAttachments.length > 0 ? `Includes ${input.responseAttachments.length} attachment(s).` : ""}`,
          });
        } catch (error) {
          console.error("Failed to send RFI response notification:", error);
        }
        
        return { success: true };
      }),

    // Admin: Update RFI status
    updateStatus: adminProcedure
      .input(z.object({
        roiId: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateROIStatus(input.roiId, input.status);
        return { success: true };
      }),

    // Admin: Get all RFIs with client filtering
    listAll: adminProcedure
      .input(z.object({
        client: z.string().optional(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAllROIs(input.client, input.status);
      }),

    // Scheduler: Get RFIs for user's branch
    listForBranch: schedulerProcedure
      .input(z.object({
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getROIsByClient(ctx.user.client!, input.status);
      }),
  }),

  // Notifications router
  notifications: router({
    // Get user notifications
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id);
    }),

    // Get unread count
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),

    // Mark as read
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    // Mark all as read
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // Certification generation
  certifications: router({
    // Generate certification preview
    generatePreview: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        certificationType: z.enum(["as_permitted", "as_built"]),
        fieldChanges: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin and field techs can generate certifications
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'field_tech') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins and field technicians can generate certifications' });
        }
        
        return await generateCertificationPreview(input);
      }),

    // Generate certification document
    generate: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        certificationType: z.enum(["as_permitted", "as_built"]),
        fieldChanges: z.string().optional(),
        previewData: z.object({
          companyName: z.string(),
          companyContact: z.string(),
          propertyOwner: z.string(),
          siteAddress: z.string(),
          contractorName: z.string(),
          scopeOfWork: z.string(),
          inspectedProducts: z.string(),
          buildingCode: z.string(),
          codeYear: z.string(),
          fieldChanges: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin and field techs can generate certifications
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'field_tech') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins and field technicians can generate certifications' });
        }
        
        return await generateCertification(input, ctx.user.id);
      }),

    // Batch generate certifications for multiple projects
    generateBatch: adminProcedure
      .input(z.object({
        projectIds: z.array(z.number()),
        certificationType: z.enum(["as_permitted", "as_built"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const results = [];
        
        for (const projectId of input.projectIds) {
          try {
            const result = await generateCertification(
              {
                projectId,
                certificationType: input.certificationType,
              },
              ctx.user.id
            );
            results.push({ projectId, success: true, url: result.url });
          } catch (error: any) {
            results.push({ projectId, success: false, error: error.message });
          }
        }
        
        return { results };
      }),
  }),

  // Storage operations
  storage: router({
    // Upload file to S3
    uploadFile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
        folder: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const folder = input.folder || 'uploads';
        const fileKey = `${folder}/${timestamp}-${input.fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(
          fileKey,
          buffer,
          input.contentType
        );
        
        return { fileKey, url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
