# CoCo POps - User Roles Documentation

This document defines the four user roles in the CoCo POps system, their access levels, and intended use cases.

## Role Overview

The system has two primary interface types:

1. **Internal Blackhouse Interfaces** (admin, field_tech)
2. **External Client Interfaces** (client_scheduler, client_ap)

## Role Definitions

### 1. Admin (Internal Blackhouse)

**Purpose**: Full system administration and management

**Access Level**: Complete access to all features

**Primary Responsibilities**:
- Manage all inspection projects across all branches
- Create and manage invoices
- Process payments and financial data
- Manage user accounts
- View and manage all tasks and deliverables
- Access all reports and analytics

**Key Features**:
- Dashboard with system-wide statistics
- Project management (create, edit, verify, schedule)
- Invoice creation and management
- Payment processing
- User management
- Calendar view of all inspections
- Audit trail access

**Typical User**: Blackhouse office manager or system administrator

---

### 2. Field Tech (Internal Blackhouse)

**Purpose**: Mobile-focused interface for field technicians performing inspections

**Access Level**: Task and deliverable management only

**Primary Responsibilities**:
- View assigned inspection tasks
- Update task status (in progress, completed)
- Upload deliverables (photos, reports)
- Add notes to projects
- View project details related to their tasks

**Restrictions**:
- **NO access to financial information** (invoices, payments, pricing)
- Cannot create or edit projects
- Cannot schedule inspections
- Cannot manage users

**Key Features**:
- Task list dashboard
- Task detail view with project information
- Deliverable upload interface
- Mobile-optimized UI
- Photo capture and upload

**Typical User**: Field inspection technician working on-site

---

### 3. Client Scheduler (External Client)

**Purpose**: Client-side project and task management

**Access Level**: Project submission and updates only

**Primary Responsibilities**:
- Submit new inspection projects
- Upload plans and permits
- Verify extracted project information
- Respond to ROI (Request for Information) from Blackhouse
- Update project details when requested
- View project status and progress

**Restrictions**:
- **NO access to financial information** (invoices, payments, pricing)
- Cannot see other clients' projects (branch-filtered)
- Cannot manage users
- Cannot process payments

**Key Features**:
- Project submission dashboard
- Document upload (plans, permits)
- AI-assisted data extraction
- Project verification interface
- Status tracking
- ROI response interface

**Typical User**: Client's project coordinator or scheduler

---

### 4. Client AP / Office Manager (External Client)

**Purpose**: Financial management for client organization

**Access Level**: Financial information only

**Primary Responsibilities**:
- View invoices for their organization
- Download invoice PDFs
- Track payment status
- Review financial summaries
- Monitor overdue invoices

**Restrictions**:
- **NO access to project management features**
- Cannot create or edit projects
- Cannot schedule inspections
- Cannot see project details beyond what's on invoices
- Cannot manage users
- Branch-filtered (only see their organization's invoices)

**Key Features**:
- Financial dashboard with revenue metrics
- Invoice list with search and filters
- Invoice detail view
- PDF download
- Payment status tracking
- Overdue invoice alerts

**Typical User**: Client's accounts payable manager or office manager

---

## Access Control Matrix

| Feature | Admin | Field Tech | Client Scheduler | Client AP |
|---------|-------|------------|------------------|-----------|
| **Projects** |
| Create projects | ✅ | ❌ | ✅ | ❌ |
| View all projects | ✅ | ❌ | ❌ | ❌ |
| View own branch projects | ✅ | ✅ | ✅ | ❌ |
| Edit projects | ✅ | ❌ | ✅ | ❌ |
| Verify projects | ✅ | ❌ | ✅ | ❌ |
| Schedule inspections | ✅ | ❌ | ❌ | ❌ |
| **Tasks** |
| View all tasks | ✅ | ❌ | ❌ | ❌ |
| View assigned tasks | ✅ | ✅ | ❌ | ❌ |
| Update task status | ✅ | ✅ | ❌ | ❌ |
| **Deliverables** |
| Upload deliverables | ✅ | ✅ | ❌ | ❌ |
| Review deliverables | ✅ | ❌ | ❌ | ❌ |
| Approve/reject | ✅ | ❌ | ❌ | ❌ |
| **Financial** |
| View invoices | ✅ | ❌ | ❌ | ✅ |
| Create invoices | ✅ | ❌ | ❌ | ❌ |
| Download invoice PDFs | ✅ | ❌ | ❌ | ✅ |
| Process payments | ✅ | ❌ | ❌ | ❌ |
| View pricing | ✅ | ❌ | ❌ | ✅ |
| **Administration** |
| User management | ✅ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |
| Audit trail | ✅ | ❌ | ❌ | ❌ |

## Branch Filtering

All non-admin roles are filtered by their assigned branch:

- **Field Tech**: Only sees tasks for projects in their branch
- **Client Scheduler**: Only sees projects for their organization (branch)
- **Client AP**: Only sees invoices for their organization (branch)

Branch is set during user creation and stored in the `users.branch` field.

## Technical Implementation

### Backend Access Control

Role-based procedures in `server/routers.ts`:

```typescript
// Admin-only access
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

// Scheduler access (admin + client_scheduler)
const schedulerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'client_scheduler') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

// AP access (admin + client_ap)
const apProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'client_ap') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

// Field tech access (admin + field_tech)
const fieldTechProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'field_tech') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});
```

### Frontend Navigation

Role-based routing in `client/src/pages/Home.tsx`:

```typescript
if (user.role === 'admin') {
  setLocation("/admin");
} else if (user.role === 'client_scheduler') {
  setLocation("/scheduler/projects");
} else if (user.role === 'client_ap') {
  setLocation("/ap");
} else if (user.role === 'field_tech') {
  setLocation("/field-tech");
}
```

Menu items filtered by role in `client/src/components/DashboardLayout.tsx`:

```typescript
const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", roles: ["admin"] },
  { icon: Calendar, label: "Calendar", path: "/admin/calendar", roles: ["admin"] },
  { icon: FileText, label: "Invoices", path: "/admin/invoices", roles: ["admin", "client_ap"] },
  { icon: Users, label: "User Management", path: "/admin/user-management", roles: ["admin"] },
  { icon: Mail, label: "Payment Processing", path: "/admin/payment-processing", roles: ["admin"] },
];
```

## Security Considerations

1. **Backend Enforcement**: All access control is enforced at the backend level. Frontend restrictions are for UX only.

2. **Branch Isolation**: Non-admin users can only access data for their assigned branch.

3. **Financial Data Protection**: Field techs and schedulers have zero access to financial endpoints.

4. **Audit Trail**: All actions are logged with user ID for accountability.

5. **Role Validation**: User role is validated on every protected procedure call.

## Common Scenarios

### Scenario 1: New Project Submission
1. Client scheduler logs in
2. Creates new project with plans/permits
3. AI extracts data
4. Scheduler verifies information
5. Admin receives notification
6. Admin schedules inspection
7. Field tech receives task assignment

### Scenario 2: Invoice Payment
1. Admin creates invoice after inspection
2. Invoice automatically emailed to client AP
3. Client AP logs in and views invoice
4. Client AP downloads PDF
5. Payment processed externally
6. Remittance email triggers auto-update
7. Admin receives payment notification

### Scenario 3: Field Inspection
1. Field tech logs in on mobile device
2. Views assigned tasks for the day
3. Navigates to job site
4. Updates task status to "in progress"
5. Completes inspection
6. Uploads photos and report
7. Marks task as completed
8. Admin reviews and approves deliverables

## Related Files

- `drizzle/schema.ts` - User role enum definition
- `server/routers.ts` - Backend access control procedures
- `client/src/pages/Home.tsx` - Role-based routing
- `client/src/components/DashboardLayout.tsx` - Role-based navigation
- `client/src/pages/Admin.tsx` - Admin dashboard
- `client/src/pages/FieldTechDashboard.tsx` - Field tech dashboard
- `client/src/pages/SchedulerDashboard.tsx` - Scheduler dashboard
- `client/src/pages/APDashboard.tsx` - AP dashboard
