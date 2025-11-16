import { getDb } from "./db";
import { notifications, pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export type NotificationType = 
  | "task_assigned" 
  | "task_updated" 
  | "task_completed" 
  | "deliverable_approved" 
  | "deliverable_rejected" 
  | "rfi_created" 
  | "rfi_responded";

export type EntityType = "project" | "task" | "deliverable" | "invoice" | "rfi";

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: number;
}

/**
 * Create an in-app notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Notification] Database not available");
      return false;
    }

    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      isRead: false,
    });

    console.log(`[Notification] Created for user ${params.userId}: ${params.title}`);

    // Also attempt to send push notification
    await sendPushNotification(params.userId, params.title, params.message, params.entityType, params.entityId);

    return true;
  } catch (error) {
    console.error("[Notification] Failed to create notification:", error);
    return false;
  }
}

/**
 * Send push notification to all subscribed devices for a user
 */
async function sendPushNotification(
  userId: number,
  title: string,
  message: string,
  entityType?: EntityType,
  entityId?: number
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get all push subscriptions for this user
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) {
      console.log(`[Push] No subscriptions found for user ${userId}`);
      return;
    }

    // In a production environment, you would use web-push library here
    // For now, we'll log the intent
    console.log(`[Push] Would send to ${subs.length} device(s) for user ${userId}`);
    console.log(`[Push] Title: ${title}, Message: ${message}`);

    // TODO: Implement actual web push using web-push library
    // const webpush = require('web-push');
    // for (const sub of subs) {
    //   const pushConfig = {
    //     endpoint: sub.endpoint,
    //     keys: {
    //       p256dh: sub.p256dh,
    //       auth: sub.auth
    //     }
    //   };
    //   await webpush.sendNotification(pushConfig, JSON.stringify({
    //     title,
    //     body: message,
    //     data: { entityType, entityId }
    //   }));
    // }
  } catch (error) {
    console.error("[Push] Failed to send push notification:", error);
  }
}

/**
 * Helper: Notify field tech when task is assigned
 */
export async function notifyTaskAssigned(
  fieldTechId: number,
  taskId: number,
  taskTitle: string,
  projectAddress: string
): Promise<boolean> {
  return createNotification({
    userId: fieldTechId,
    type: "task_assigned",
    title: "New Task Assigned",
    message: `You have been assigned: ${taskTitle} at ${projectAddress}`,
    entityType: "task",
    entityId: taskId,
  });
}

/**
 * Helper: Notify field tech when task is updated
 */
export async function notifyTaskUpdated(
  fieldTechId: number,
  taskId: number,
  taskTitle: string,
  changeDescription: string
): Promise<boolean> {
  return createNotification({
    userId: fieldTechId,
    type: "task_updated",
    title: "Task Updated",
    message: `${taskTitle}: ${changeDescription}`,
    entityType: "task",
    entityId: taskId,
  });
}

/**
 * Helper: Notify field tech when deliverable is approved
 */
export async function notifyDeliverableApproved(
  fieldTechId: number,
  deliverableId: number,
  deliverableTitle: string
): Promise<boolean> {
  return createNotification({
    userId: fieldTechId,
    type: "deliverable_approved",
    title: "Deliverable Approved",
    message: `Your submission "${deliverableTitle}" has been approved`,
    entityType: "deliverable",
    entityId: deliverableId,
  });
}

/**
 * Helper: Notify field tech when deliverable needs revision
 */
export async function notifyDeliverableRejected(
  fieldTechId: number,
  deliverableId: number,
  deliverableTitle: string,
  reason: string
): Promise<boolean> {
  return createNotification({
    userId: fieldTechId,
    type: "deliverable_rejected",
    title: "Deliverable Needs Revision",
    message: `"${deliverableTitle}": ${reason}`,
    entityType: "deliverable",
    entityId: deliverableId,
  });
}
