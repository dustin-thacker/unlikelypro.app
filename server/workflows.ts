/**
 * Comprehensive Status Workflows
 * 
 * This file defines the status workflows for all entities in the system,
 * including valid transitions and role-based permissions.
 */

export type UserRole = 'admin' | 'scheduler' | 'field_tech' | 'client_ap';

// Project Status Workflow
export type ProjectStatus = 
  | 'draft'           // Initial state - project created but not verified
  | 'verified'        // Client information verified
  | 'scheduled'       // Inspection scheduled
  | 'in_progress'     // Field tech working on inspection
  | 'inspection_complete' // Inspection done, awaiting deliverables
  | 'invoiced'        // Invoice created and sent
  | 'paid'            // Invoice paid
  | 'closed';         // Project completed and closed

export const projectWorkflow = {
  statuses: ['draft', 'verified', 'scheduled', 'in_progress', 'inspection_complete', 'invoiced', 'paid', 'closed'] as const,
  
  transitions: {
    draft: ['verified'],
    verified: ['scheduled', 'draft'],
    scheduled: ['in_progress', 'verified'],
    in_progress: ['inspection_complete', 'scheduled'],
    inspection_complete: ['invoiced', 'in_progress'],
    invoiced: ['paid', 'inspection_complete'],
    paid: ['closed'],
    closed: [], // Terminal state
  } as Record<ProjectStatus, ProjectStatus[]>,
  
  permissions: {
    draft: ['admin', 'scheduler'],
    verified: ['admin', 'scheduler'],
    scheduled: ['admin', 'scheduler'],
    in_progress: ['admin', 'field_tech'],
    inspection_complete: ['admin', 'field_tech'],
    invoiced: ['admin'],
    paid: ['admin', 'client_ap'],
    closed: ['admin'],
  } as Record<ProjectStatus, UserRole[]>,
  
  notifications: {
    verified: { roles: ['scheduler'], message: 'Project verified and ready for scheduling' },
    scheduled: { roles: ['field_tech'], message: 'New inspection scheduled' },
    in_progress: { roles: ['scheduler', 'admin'], message: 'Inspection started' },
    inspection_complete: { roles: ['admin'], message: 'Inspection completed, ready for invoicing' },
    invoiced: { roles: ['client_ap'], message: 'New invoice created' },
    paid: { roles: ['admin'], message: 'Invoice payment received' },
    closed: { roles: ['admin', 'scheduler'], message: 'Project closed' },
  } as Record<ProjectStatus, { roles: UserRole[]; message: string }>,
};

// Task Status Workflow
export type TaskStatus =
  | 'pending'      // Task created, not yet assigned
  | 'assigned'     // Assigned to field tech
  | 'in_progress'  // Field tech working on it
  | 'completed'    // Field tech marked as done
  | 'verified';    // Admin/scheduler verified completion

export const taskWorkflow = {
  statuses: ['pending', 'assigned', 'in_progress', 'completed', 'verified'] as const,
  
  transitions: {
    pending: ['assigned'],
    assigned: ['in_progress', 'pending'],
    in_progress: ['completed', 'assigned'],
    completed: ['verified', 'in_progress'],
    verified: [], // Terminal state
  } as Record<TaskStatus, TaskStatus[]>,
  
  permissions: {
    pending: ['admin', 'scheduler'],
    assigned: ['admin', 'scheduler'],
    in_progress: ['admin', 'field_tech'],
    completed: ['admin', 'field_tech'],
    verified: ['admin', 'scheduler'],
  } as Record<TaskStatus, UserRole[]>,
  
  notifications: {
    assigned: { roles: ['field_tech'], message: 'New task assigned to you' },
    in_progress: { roles: ['scheduler'], message: 'Task started' },
    completed: { roles: ['admin', 'scheduler'], message: 'Task completed, needs verification' },
    verified: { roles: ['field_tech'], message: 'Task verified' },
  } as Record<TaskStatus, { roles: UserRole[]; message: string }>,
};

// Deliverable Status Workflow
export type DeliverableStatus =
  | 'pending'      // Deliverable required but not started
  | 'in_progress'  // Field tech working on it
  | 'submitted'    // Submitted for review
  | 'approved'     // Approved by admin/scheduler
  | 'rejected';    // Rejected, needs revision

export const deliverableWorkflow = {
  statuses: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'] as const,
  
  transitions: {
    pending: ['in_progress'],
    in_progress: ['submitted', 'pending'],
    submitted: ['approved', 'rejected'],
    approved: [], // Terminal state
    rejected: ['in_progress'], // Can be revised
  } as Record<DeliverableStatus, DeliverableStatus[]>,
  
  permissions: {
    pending: ['admin', 'scheduler', 'field_tech'],
    in_progress: ['admin', 'field_tech'],
    submitted: ['admin', 'field_tech'],
    approved: ['admin', 'scheduler'],
    rejected: ['admin', 'scheduler'],
  } as Record<DeliverableStatus, UserRole[]>,
  
  notifications: {
    in_progress: { roles: ['scheduler'], message: 'Deliverable work started' },
    submitted: { roles: ['admin', 'scheduler'], message: 'Deliverable submitted for review' },
    approved: { roles: ['field_tech'], message: 'Deliverable approved' },
    rejected: { roles: ['field_tech'], message: 'Deliverable rejected, needs revision' },
  } as Record<DeliverableStatus, { roles: UserRole[]; message: string }>,
};

// Invoice Status Workflow
export type InvoiceStatus =
  | 'draft'     // Invoice created but not sent
  | 'sent'      // Sent to client
  | 'viewed'    // Client viewed the invoice
  | 'paid'      // Payment received
  | 'overdue';  // Past due date

export const invoiceWorkflow = {
  statuses: ['draft', 'sent', 'viewed', 'paid', 'overdue'] as const,
  
  transitions: {
    draft: ['sent'],
    sent: ['viewed', 'paid', 'overdue'],
    viewed: ['paid', 'overdue'],
    paid: [], // Terminal state
    overdue: ['paid'],
  } as Record<InvoiceStatus, InvoiceStatus[]>,
  
  permissions: {
    draft: ['admin'],
    sent: ['admin'],
    viewed: ['admin', 'client_ap'],
    paid: ['admin', 'client_ap'],
    overdue: ['admin'],
  } as Record<InvoiceStatus, UserRole[]>,
  
  notifications: {
    sent: { roles: ['client_ap'], message: 'New invoice sent' },
    viewed: { roles: ['admin'], message: 'Invoice viewed by client' },
    paid: { roles: ['admin'], message: 'Invoice payment received' },
    overdue: { roles: ['admin', 'client_ap'], message: 'Invoice is overdue' },
  } as Record<InvoiceStatus, { roles: UserRole[]; message: string }>,
};

/**
 * Validate if a status transition is allowed
 */
export function isTransitionValid<T extends string>(
  workflow: { transitions: Record<T, T[]> },
  fromStatus: T,
  toStatus: T
): boolean {
  const allowedTransitions = workflow.transitions[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Check if a user role has permission to change to a specific status
 */
export function hasPermission<T extends string>(
  workflow: { permissions: Record<T, UserRole[]> },
  status: T,
  userRole: UserRole
): boolean {
  const allowedRoles = workflow.permissions[status];
  return allowedRoles.includes(userRole);
}

/**
 * Get notification configuration for a status
 */
export function getNotificationConfig<T extends string>(
  workflow: { notifications: Record<T, { roles: UserRole[]; message: string }> },
  status: T
): { roles: UserRole[]; message: string } | undefined {
  return workflow.notifications[status];
}
