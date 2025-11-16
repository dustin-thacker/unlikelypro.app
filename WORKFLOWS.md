# Inspection Tracker - Status Workflows Documentation

This document defines the comprehensive status workflows for all entities in the Inspection Tracker system. These workflows ensure proper state transitions, role-based permissions, and automated notifications throughout the inspection lifecycle.

## Overview

The system tracks four main entities with their own status workflows:
- **Projects**: Overall inspection project lifecycle
- **Tasks**: Individual inspection tasks assigned to field technicians
- **Deliverables**: Reports, photos, and certificates submitted by field techs
- **Invoices**: Financial tracking and payment processing

## Project Status Workflow

### States

1. **draft** - Initial state when project is created
2. **pending_verification** - Legacy state (backward compatibility)
3. **verified** - Client information verified and complete
4. **scheduled** - Inspection date/time scheduled
5. **in_progress** - Field technician actively working on inspection
6. **inspection_complete** - Inspection finished, awaiting deliverables
7. **invoice_generated** - Legacy state (backward compatibility)
8. **invoiced** - Invoice created and sent to client
9. **paid** - Invoice payment received
10. **closed** - Project completed and archived
11. **completed** - Legacy state (backward compatibility)
12. **cancelled** - Project cancelled

### Allowed Transitions

```
draft → verified
verified → scheduled, draft
scheduled → in_progress, verified
in_progress → inspection_complete, scheduled
inspection_complete → invoiced, in_progress
invoiced → paid, inspection_complete
paid → closed
closed → (terminal state)
```

### Role Permissions

- **draft, verified, scheduled**: Admin, Scheduler
- **in_progress, inspection_complete**: Admin, Field Tech
- **invoiced**: Admin
- **paid**: Admin, Client AP
- **closed**: Admin

### Notifications

- **verified**: Notify schedulers - "Project verified and ready for scheduling"
- **scheduled**: Notify field techs - "New inspection scheduled"
- **in_progress**: Notify schedulers and admins - "Inspection started"
- **inspection_complete**: Notify admins - "Inspection completed, ready for invoicing"
- **invoiced**: Notify client AP - "New invoice created"
- **paid**: Notify admins - "Invoice payment received"
- **closed**: Notify admins and schedulers - "Project closed"

## Task Status Workflow

### States

1. **pending** - Task created, not yet assigned
2. **scheduled** - Legacy state (backward compatibility)
3. **assigned** - Assigned to specific field technician
4. **in_progress** - Field tech actively working on task
5. **completed** - Field tech marked task as done
6. **verified** - Admin/scheduler verified completion
7. **cancelled** - Task cancelled

### Allowed Transitions

```
pending → assigned
assigned → in_progress, pending
in_progress → completed, assigned
completed → verified, in_progress
verified → (terminal state)
```

### Role Permissions

- **pending, assigned**: Admin, Scheduler
- **in_progress, completed**: Admin, Field Tech
- **verified**: Admin, Scheduler

### Notifications

- **assigned**: Notify field tech - "New task assigned to you"
- **in_progress**: Notify schedulers - "Task started"
- **completed**: Notify admins and schedulers - "Task completed, needs verification"
- **verified**: Notify field tech - "Task verified"

## Deliverable Status Workflow

### States

1. **pending** - Deliverable required but not started
2. **in_progress** - Field tech working on it
3. **submitted** - Submitted for admin/scheduler review
4. **approved** - Approved by admin/scheduler
5. **rejected** - Rejected, needs revision

### Allowed Transitions

```
pending → in_progress
in_progress → submitted, pending
submitted → approved, rejected
approved → (terminal state)
rejected → in_progress (can be revised)
```

### Role Permissions

- **pending**: Admin, Scheduler, Field Tech
- **in_progress, submitted**: Admin, Field Tech
- **approved, rejected**: Admin, Scheduler

### Notifications

- **in_progress**: Notify schedulers - "Deliverable work started"
- **submitted**: Notify admins and schedulers - "Deliverable submitted for review"
- **approved**: Notify field tech - "Deliverable approved"
- **rejected**: Notify field tech - "Deliverable rejected, needs revision"

## Invoice Status Workflow

### States

1. **draft** - Invoice created but not sent
2. **sent** - Sent to client via email
3. **viewed** - Client viewed the invoice
4. **paid** - Payment received
5. **overdue** - Past due date

### Allowed Transitions

```
draft → sent
sent → viewed, paid, overdue
viewed → paid, overdue
paid → (terminal state)
overdue → paid
```

### Role Permissions

- **draft, sent, overdue**: Admin
- **viewed**: Admin, Client AP
- **paid**: Admin, Client AP

### Notifications

- **sent**: Notify client AP - "New invoice sent"
- **viewed**: Notify admins - "Invoice viewed by client"
- **paid**: Notify admins - "Invoice payment received"
- **overdue**: Notify admins and client AP - "Invoice is overdue"

## Status History Tracking

All status changes are automatically logged in the `statusHistory` table with:
- Entity type and ID
- Old and new status values
- User who made the change
- Timestamp
- Optional reason and metadata

This provides a complete audit trail for compliance and troubleshooting.

## Implementation Notes

### Current Status

- **Schema**: All status enums include both new workflow states and legacy states for backward compatibility
- **Tables**: Projects, Tasks, Deliverables, Invoices, and StatusHistory tables are defined
- **Validation**: Workflow validation functions are defined in `server/workflows.ts`
- **Notifications**: Notification infrastructure is in place via `notifyOwner()` function

### Future Implementation

To fully implement these workflows:

1. **Add status validation middleware** to all status update mutations
2. **Implement role-based permission checks** before allowing status changes
3. **Add automated notifications** when status changes occur
4. **Create status history logging** for all status updates
5. **Build UI components** showing workflow progress and allowed transitions
6. **Add status change reason** input for important transitions
7. **Implement automatic status transitions** (e.g., sent → overdue based on due date)

### Migration Strategy

For existing data with legacy status values:

1. Keep legacy status values in enum for backward compatibility
2. Gradually migrate data to new status values through admin tools
3. Update UI to show both old and new status values during transition
4. Remove legacy values once all data is migrated

## API Usage Examples

### Validating Status Transitions

```typescript
import { projectWorkflow, isTransitionValid } from './workflows';

// Check if transition is valid
const canTransition = isTransitionValid(
  projectWorkflow,
  'verified',
  'scheduled'
); // returns true

const invalidTransition = isTransitionValid(
  projectWorkflow,
  'draft',
  'paid'
); // returns false
```

### Checking Permissions

```typescript
import { projectWorkflow, hasPermission } from './workflows';

// Check if user role can set status
const canSetStatus = hasPermission(
  projectWorkflow,
  'invoiced',
  'admin'
); // returns true

const cannotSetStatus = hasPermission(
  projectWorkflow,
  'invoiced',
  'field_tech'
); // returns false
```

### Logging Status Changes

```typescript
import { statusHistory } from '../drizzle/schema';

// Log status change
await db.insert(statusHistory).values({
  entityType: 'project',
  entityId: projectId,
  oldStatus: 'verified',
  newStatus: 'scheduled',
  changedBy: userId,
  reason: 'Inspection scheduled for next week',
  metadata: JSON.stringify({ scheduledDate: '2025-11-15' }),
});
```

## Benefits

1. **Data Integrity**: Prevents invalid status transitions
2. **Accountability**: Complete audit trail of all changes
3. **Automation**: Automated notifications keep stakeholders informed
4. **Security**: Role-based permissions ensure proper access control
5. **Visibility**: Clear workflow progress for all users
6. **Compliance**: Audit trail meets regulatory requirements

## Related Files

- `server/workflows.ts` - Workflow definitions and validation functions
- `drizzle/schema.ts` - Database schema with status enums
- `server/routers.ts` - API endpoints for status updates
- `server/db.ts` - Database query functions
