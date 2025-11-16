# Inspection Tracker TODO

## Database & Backend
- [x] Design database schema for projects, clients, permits, plans, tasks
- [x] Implement file storage for PDF uploads (plans and permits)
- [x] Create tRPC procedures for project CRUD operations
- [x] Implement PDF data extraction using LLM (Property Owner, Address, Jurisdiction, Permit Number, Scope of Work)
- [x] Create tRPC procedures for task management

## Client Interface
- [x] Build project submission form with file upload
- [x] Implement PDF upload and preview functionality
- [x] Create data verification interface for extracted information
- [x] Build inspection scheduling interface (date/time picker)
- [x] Display project list for clients

## Inspection Scheduling & Task Tracking
- [x] Implement task creation with scheduled dates
- [x] Display tasks on project detail page
- [x] Track task status (scheduled, in_progress, completed, cancelled)

## Admin Dashboard
- [x] Build admin dashboard layout
- [x] Create project management interface
- [x] Display all projects with filtering and search
- [x] Show task tracking for scheduled inspections
- [x] Implement project detail view with all attachments

## Testing & Deployment
- [x] Test PDF extraction with sample permits
- [x] Test complete workflow from submission to scheduling
- [x] Verify admin dashboard functionality
- [x] Test role-based access control
- [x] Create deployment checkpoint
## Recent Change Requests
- [x] Make property owner name required on new project submission page
- [x] Add customer number field to new project submission page for client tracking
- [x] Add address validation to Address of Permitted Work field
- [x] Add post-construction checkbox (default: No)
- [x] Add conditional production photos upload field when post-construction is Yes
- [x] Add conditional completion date field when post-construction is Yes
- [x] Add Date Permit Issued, Contractor Name, Subdivision, Lot, Block fields to projects schema
- [x] Update verification page to display new extracted fields
- [x] Update project detail pages to show new fields
- [x] Change client name field to dropdown with three branches
- [x] Implement branch-based access control for client portal
- [x] Filter project lists by client branch
- [x] Update verification workflow to conditionally redirect based on post-construction status
- [x] Skip scheduling for post-construction projects (work already complete)
- [x] Redirect to scheduling page only for non-post-construction projects
- [x] Add status badges to client project list page
- [x] Add status badges to admin project list page
- [x] Style status indicators with appropriate colors
- [x] Fix React setState during render error in Home component
- [x] Install calendar library (FullCalendar or similar)
- [x] Create admin calendar page with drag-and-drop task scheduling
- [x] Create client read-only calendar page
- [x] Add tRPC procedures to update task dates/times
- [x] Implement calendar event rendering for tasks
- [x] Add navigation links to calendar pages
- [x] Add list view for upcoming and current week inspections
- [x] Configure working hours (Mon-Sat 7am-6pm, Sunday locked)
- [x] Update event titles to show property address
- [x] Add hover tooltips with client, jurisdiction, property owner, customer number
- [x] Display property details in list view

## Multi-Role System Restructure
- [x] Update user schema to support four roles: admin, client_scheduler, client_ap, field_tech
- [x] Add branch association to users for client roles
- [x] Create project notes table with timestamps and user tracking
- [x] Create project files table for additional uploads (photos, plans, permits, pier logs)
- [x] Create audit trail/change log table
- [x] Create invoicing tables (line items, status, PDF storage)
- [x] Add production days field to projects
- [x] Add reschedule request workflow tables

## Client Scheduler Interface
- [ ] Build scheduler dashboard with project list filtered by branch
- [ ] Add project detail view with notes, files, and change log
- [ ] Implement file upload for production photos, plans, permits, pier logs
- [ ] Add reschedule request feature with admin notification
- [ ] Add cancel request feature with admin notification
- [ ] Hide all financial data from scheduler view

## Client AP/Office Manager Interface
- [ ] Build AP dashboard with financial focus
- [ ] Display invoice line items and totals
- [ ] Add invoice PDF generation and download
- [ ] Show invoice status tracking
- [ ] Include supplemental project data view
- [ ] Filter by branch

## Field Technician Interface
- [ ] Build mobile-optimized field tech dashboard
- [ ] Show assigned tasks/inspections with project details
- [ ] Add project notes feature for as-built conditions
- [ ] Add production days tracking
- [ ] Add conversation logs feature
- [ ] Integrate Google Maps for navigation
- [ ] Display project location on map

## Notification System
- [ ] Implement admin notifications for reschedule requests
- [ ] Implement field tech notifications for schedule changes
- [ ] Add email notification support

## Phase 1: Admin Interface
- [x] Add tRPC routers for notes, files, audit trail
- [x] Add tRPC routers for invoices and line items
- [x] Add tRPC routers for reschedule requests
- [x] Update AdminProjectDetail with tabs for notes, files, audit trail
- [x] Add notes creation and display
- [x] Add file upload functionality
- [x] Display audit trail/change log
- [ ] Create invoice management page
- [ ] Add reschedule request approval interface
- [ ] Update admin dashboard with reschedule request notifications
- [x] Fix NaN projectId error in AdminProjectDetail when URL parameter is invalid

## Phase 2: Client Scheduler Interface
- [ ] Create SchedulerDashboard page with branch-filtered project list
- [ ] Create SchedulerProjectDetail page with full project information
- [ ] Add file upload capability for production photos, updated plans/permits, pier logs
- [ ] Add notes creation for scope changes, production details, conversations
- [ ] Implement reschedule request submission form
- [ ] Create scheduler calendar view (read-only with reschedule requests)
- [ ] Update App.tsx with scheduler routes
- [ ] Add role-based navigation for client_scheduler users

## Phase 2: Client Scheduler Interface
- [x] Create products and inspection services data structures
- [x] Build product-to-service mapping logic
- [x] Enhance PDF extraction to detect products from scope of work
- [x] Create SchedulerNewProject page (property owner, customer number, PDF uploads)
- [x] Create SchedulerVerifyProject page with product checklist and service display
- [x] Implement dynamic service calculation when products change
- [x] Add in-production vs post-production workflow split
- [x] Build post-production flow (production photos, date range)
- [x] Build in-production flow (schedule on-site inspection)
- [x] Add verify procedure to projects router
- [x] Update extractedData schema with detectedProductIds
- [x] Implement production date handling for CSI products
- [x] Update routes for scheduler role
- [x] Add scheduler dashboard with branch-filtered projects
- [x] Create SchedulerScheduleInspection page for in-production projects
- [x] Add scheduler calendar view integration
- [x] Fix NaN projectId error in ScheduleInspection page

## Phase 3: Field Technician Mobile Interface
- [x] Create FieldTechDashboard with mobile-optimized layout
- [x] Build project list view for assigned inspections
- [x] Update tasks.listForUser to include proje- [x] Add Google Maps integration for project locations
- [x] Implement "Navigate to Site" functionality
- [x] Create project detail view with all relevant information
- [x] Add production day tracking interface
- [x] Implement photo upload functionality
- [x] Add field notes capability
- [x] Update routes for field tech roleation
- [ ] Add mobile-responsive design for all field tech pages

## Phase 4: Invoice Management System
- [ ] Create invoice generation interface for admins
- [ ] Implement three-tier pricing calculation (TPI/CSI/PSI)
- [ ] Build line item management for invoices
- [ ] Add invoice status tracking (draft, sent, paid, overdue)
- [ ] Generate PDF invoices for download
- [ ] Create invoice list view with search and filters
- [ ] Add payment tracking and history

## Phase 5: AP Manager Interface
- [ ] Create AP Manager dashboard with financial focus
- [ ] Display invoices with payment status
- [ ] Show project data supplemental to financial view
- [ ] Add financial reporting and analytics
- [ ] Implement invoice download functionality
- [ ] Filter and search invoices by client, status, date range

## Phase 6: User Management System
- [ ] Create user management interface for admins
- [ ] Build user creation form with role selection
- [ ] Implement branch assignment for client roles
- [ ] Add user list with search and filters
- [ ] Build user edit and deactivation functionality
- [ ] Add role-based permission display
- [ ] Implement user invitation system

## Phase 4: Invoice Management System
- [ ] Review existing invoice schema and procedures
- [ ] Create invoice generation interface for admins
- [ ] Implement automatic line item calculation based on pricing logic
- [ ] Add invoice status tracking (draft, sent, paid, overdue)
- [ ] Build PDF invoice generation functionality
- [ ] Add invoice list view with filtering and search
- [ ] Create invoice detail/edit page

## Phase 5: Client AP Manager Interface
- [ ] Create AP Manager dashboard with financial overview
- [ ] Build invoice list view filtered by branch
- [ ] Add payment status tracking and history
- [ ] Implement downloadable PDF invoices
- [ ] Add financial reporting views
- [ ] Create project cost summary views
- [ ] Update routes for AP manager role

## Phase 6: User Management System
- [ ] Create user management interface for admins
- [ ] Build user list view with role filtering
- [ ] Add user creation form with role and branch selection
- [ ] Implement user edit functionality
- [ ] Add user deactivation/deletion
- [ ] Build role-based permission display
- [ ] Add user activity logging

## Role-Switching Test System
- [x] Create database seed script for test user accounts
- [x] Add test users for each role (admin, client_scheduler, client_ap, field_tech)
- [x] Build role switcher component for development/testing
- [x] Implement role-based home page routing
- [x] Update Home component with automatic role-based redirects
- [x] Add role indicator in navigation/header
- [ ] Create test data (sample projects, tasks, invoices)
- [ ] Document login credentials and workflows for each role

## Invoice List Backend (Phase 1 Completion)
- [x] Add getAllInvoices function to db.ts with project join
- [x] Add getInvoicesByBranch function for branch-filtered queries
- [x] Add listAll procedure to invoices router with role-based access
- [x] Update AdminInvoices page to use listAll procedure
- [x] Implement invoice filtering by status and search
- [x] Add stats calculation for dashboard metrics

## Client AP Manager Interface (Phase 2 Completion)
- [x] Create APDashboard page with financial overview
- [x] Add branch-filtered invoice list (automatic via backend)
- [x] Implement financial stats cards (total revenue, pending, paid this month, overdue)
- [x] Add invoice search and status filtering
- [x] Create APInvoiceDetail page for viewing invoice details
- [x] Display line items with totals breakdown
- [x] Add PDF download functionality
- [x] Update App.tsx with AP routes (/ap, /ap/invoices/:id)
- [x] Update Home.tsx to route client_ap users to AP dashboard

## Sample Data Creation
- [ ] Create sample invoices for existing projects
- [ ] Test invoice generation with TPI pricing
- [ ] Test invoice generation with CSI pricing
- [ ] Test invoice generation with PSI pricing
- [ ] Verify invoice list displays correctly
- [ ] Test AP Manager dashboard with sample data

## User Management System
- [ ] Create AdminUserManagement page with user list
- [ ] Add user creation form with role selection
- [ ] Add branch assignment for client roles
- [ ] Implement user edit functionality
- [ ] Add user deactivation capability
- [ ] Create backend procedures for user CRUD operations
- [ ] Add routes for user management pages

## Invoice Status Update Workflow
- [ ] Add status update buttons to AdminInvoices page
- [ ] Create invoice status update modal/dialog
- [ ] Add automatic date tracking (paidDate when marked as paid)
- [ ] Update invoice detail pages with status change capability
- [ ] Add audit trail entries for status changes
- [ ] Test status workflow (draft → sent → paid)

## Sample Invoice Creation (Completed)
- [x] Create sample invoices for existing projects
- [x] Test invoice generation with TPI pricing
- [x] Test invoice generation with CSI pricing
- [x] Test invoice generation with PSI pricing
- [x] Create invoices with different statuses (paid, sent, overdue)
- [x] Add line items with proper calculations

## User Management System (Completed)
- [x] Create AdminUserManagement page with user list
- [x] Add user creation form with role selection
- [x] Add branch assignment for client roles
- [x] Implement user edit functionality
- [x] Create backend procedures for user CRUD operations (list, create, update)
- [x] Add routes for user management pages
- [x] Add user management link to admin sidebar
- [x] Display user stats (total, admins, schedulers, field techs)
- [x] Add search and role filtering

## Invoice Status Update Workflow (Completed)
- [x] Add status update dropdown menu to AdminInvoices page
- [x] Create status update mutation with refetch
- [x] Add automatic paidDate tracking when marked as paid
- [x] Clear paidDate when changing from paid to another status
- [x] Add audit trail entries for status changes
- [x] Display all status options (draft, sent, paid, overdue, cancelled)
- [x] Disable current status in dropdown menu

## PDF Invoice Generation Feature
- [ ] Create PDF generation utility using PDFKit or similar
- [ ] Design professional invoice template layout
- [ ] Add company branding (logo, name, contact info)
- [ ] Include invoice details (number, dates, status)
- [ ] Display line items table with quantities and prices
- [ ] Show totals breakdown (subtotal, tax, total)
- [ ] Add payment terms and instructions
- [ ] Create backend endpoint for PDF generation
- [ ] Add download button to AdminInvoices page
- [ ] Add download button to APInvoiceDetail page
- [ ] Test PDF generation with sample invoices

## PDF Generation Backend (Completed)
- [x] Install pdfkit and types
- [x] Create PDF generation utility using PDFKit
- [x] Design professional invoice template layout
- [x] Add company branding (name, contact info)
- [x] Include invoice details (number, dates, status)
- [x] Display line items table with quantities and prices
- [x] Show totals breakdown (subtotal, tax, total)
- [x] Add payment terms and instructions
- [x] Create backend endpoint for PDF generation (generatePDF)
- [x] Add role-based access control for PDF generation

## PDF Download UI (Completed)
- [x] Add download button to AdminInvoices page with icon
- [x] Add download button to APInvoiceDetail page
- [x] Implement base64 to blob conversion for PDF download
- [x] Add loading states during PDF generation
- [x] Add success/error toast notifications
- [x] Handle PDF download with proper filename

## Invoice System Enhancements

### Database Schema Updates
- [ ] Add auto-generated internal project number field to projects table
- [ ] Add client billing email addresses (JSON array) to projects table
- [ ] Update invoice PDF template to include permit address, property owner, customer number
- [ ] Add deliverables table with status workflow
- [ ] Update project status enum with comprehensive workflow states
- [ ] Update task status enum with comprehensive workflow states
- [ ] Update invoice status enum if needed

### Invoice References Enhancement
- [ ] Update PDF generator to include permit address on invoice
- [ ] Update PDF generator to include property owner name on invoice
- [ ] Update PDF generator to include customer number on invoice
- [ ] Update PDF generator to include internal project number
- [ ] Test PDF generation with all new fields

### Multi-Email Invoice Delivery
- [ ] Create email service utility for sending invoices
- [ ] Add client email management UI in project creation/edit
- [ ] Implement automatic email sending when invoice status changes to "sent"
- [ ] Create email template for invoice delivery
- [ ] Add email delivery tracking/logging
- [ ] Test email delivery to multiple recipients

### Automated Payment Processing
- [ ] Set up dedicated email inbox for remittance PDFs
- [ ] Create email webhook/polling service
- [ ] Build PDF text extraction for remittance documents
- [ ] Implement invoice number parsing from remittance PDFs
- [ ] Create automatic invoice status update logic
- [ ] Add audit trail for automated payment updates
- [ ] Test remittance processing workflow

### Status Workflows
- [ ] Define Project status workflow (pending_verification → verified → scheduled → in_progress → inspection_complete → invoice_generated → completed)
- [ ] Define Task status workflow (pending → scheduled → in_progress → completed → cancelled)
- [ ] Define Deliverable status workflow (pending → in_progress → review → approved → delivered)
- [ ] Define Invoice status workflow (draft → sent → paid → overdue → cancelled)
- [ ] Update UI to reflect proper status transitions
- [ ] Add status validation in backend procedures

## Database Schema Updates (Completed)
- [x] Add auto-generated internal project number field to projects table
- [x] Add client billing email addresses (JSON array) to projects table
- [x] Update project status enum with comprehensive workflow states
- [x] Create project number generation function (PRJ-YYYY-NNNN format)
- [x] Push schema changes to database

## PDF Template Enhancement (Completed)
- [x] Update PDF generator interface to include projectNumber and customerNumber
- [x] Add project number to invoice PDF header
- [x] Add property owner name to bill-to section
- [x] Add property address (permit address) to bill-to section
- [x] Add customer number to bill-to section
- [x] Add permit number to bill-to section
- [x] Adjust layout spacing for additional fields

## Multi-Email Invoice Delivery (Completed)
- [x] Create email service utility for sending invoices
- [x] Create HTML email template for invoice delivery
- [x] Implement automatic email sending when invoice status changes to "sent"
- [x] Add PDF attachment to email
- [x] Support multiple recipient emails from project.billingEmails
- [x] Add error handling for email failures (don't block status update)
- [x] Add logging for email delivery tracking

Note: Client email management UI needs to be added to project creation/edit forms

## Billing Email Management UI
- [ ] Find project creation form component
- [ ] Add billing emails input field with add/remove functionality
- [ ] Add email validation
- [ ] Update form submission to include billing emails as JSON
- [ ] Find project editing form component
- [ ] Add billing emails management to edit form
- [ ] Test adding/removing emails in both forms
- [ ] Test invoice email delivery with configured addresses

## Project Creation Form (Completed)
- [x] Add billing emails state management
- [x] Add billingEmails to backend create procedure
- [x] Create billing email UI with add/remove functionality
- [x] Add email validation (regex pattern)
- [x] Add duplicate email prevention
- [x] Update form submission to send billing emails as JSON
- [x] Add visual feedback with list display

## Project Editing Form (Completed)
- [x] Add billingEmails to projects.update input schema
- [x] Add billing emails state management to AdminProjectDetail
- [x] Create billing email display section with Mail icon
- [x] Add Edit/Save toggle button
- [x] Implement email list display with badges
- [x] Add email editing UI with add/remove functionality
- [x] Add email validation and duplicate prevention
- [x] Update project mutation to save billing emails

## Email Delivery Tracking Feature
- [ ] Create invoiceEmailLog table in database schema
- [ ] Add fields: invoiceId, recipients (JSON), sentAt, status, errorMessage
- [ ] Push database schema changes
- [ ] Update email service to log all delivery attempts
- [ ] Create database functions for email log operations
- [ ] Add tRPC procedures for fetching email delivery history
- [ ] Build email delivery history UI component
- [ ] Add email history tab/section to invoice detail pages
- [ ] Display delivery timeline with status indicators
- [ ] Test email tracking with real invoice sends

## Email Tracking Schema (Completed)
- [x] Create invoiceEmailLog table in database schema
- [x] Add fields: id, invoiceId, recipients (JSON), sentAt, status, errorMessage, sentBy
- [x] Add relations for invoiceEmailLog to invoices and users
- [x] Push database schema changes successfully

## Email Service Logging (Completed)
- [x] Add createEmailLog function to db.ts
- [x] Add getEmailLogsByInvoiceId function to db.ts with user join
- [x] Update invoice status mutation to log email delivery attempts
- [x] Log both successful and failed email sends
- [x] Include error messages for failed attempts
- [x] Add tRPC procedure invoices.getEmailLogs for fetching logs

## Email Delivery History UI (Completed)
- [x] Create EmailDeliveryHistory component
- [x] Display email logs with status indicators (success/failed/pending icons)
- [x] Show recipients list for each delivery
- [x] Display sent timestamp in readable format
- [x] Show user who triggered the send
- [x] Display error messages for failed attempts
- [x] Add summary statistics (total, successful, failed)
- [x] Integrate EmailDeliveryHistory into APInvoiceDetail page

## Email Retry Mechanism
- [ ] Create retryEmail tRPC procedure in invoices router
- [ ] Fetch invoice and project details for retry
- [ ] Generate PDF and email HTML for retry
- [ ] Send email with same parameters as original
- [ ] Log retry attempt in invoiceEmailLog table
- [ ] Add retry button to EmailDeliveryHistory component
- [ ] Show loading state during retry
- [ ] Display success/error toast after retry
- [ ] Refresh email logs after successful retry
- [ ] Test retry mechanism with failed emails

## Backend Retry Procedure (Completed)
- [x] Create retryEmail tRPC procedure in invoices router
- [x] Fetch invoice and project details for retry
- [x] Generate PDF and email HTML for retry
- [x] Send email with same parameters as original
- [x] Log retry attempt in invoiceEmailLog table
- [x] Handle errors and log failed retry attempts

## Retry Button UI (Completed)
- [x] Add retry button to EmailDeliveryHistory component header
- [x] Implement handleRetry function with mutation
- [x] Show loading state with spinning icon during retry
- [x] Display success toast after successful retry
- [x] Display error toast after failed retry
- [x] Refresh email logs after retry to show new entry
- [x] Disable button during retry operation

## Automated Remittance Processing
- [x] Test Gmail MCP integration for reading emails
- [ ] Create payment processing service using Gmail MCP
- [ ] Search for emails with "EFT Payment" or "Remittance" in subject
- [ ] Extract invoice numbers from email content using regex
- [ ] Create processPaymentEmail tRPC procedure
- [ ] Match invoice numbers to database invoices
- [ ] Update matched invoices to paid status with payment date
- [ ] Build admin UI for payment processing
- [ ] Add "Check for Payments" button to trigger processing
- [ ] Display processing results (matched/unmatched invoices)
- [ ] Test with real remittance emails

## Payment Processing Service (Completed)
- [x] Create payment processing service using Gmail MCP
- [x] Search for emails with "EFT Payment" or "Remittance" in subject
- [x] Extract invoice numbers from email content using regex
- [x] Extract payment amounts from email content
- [x] Handle multiple invoice patterns (Invoice #, INV-, etc.)
- [x] Fix TypeScript compilation errors

## Payment Processing Procedure (Completed)
- [x] Create processPayments tRPC procedure
- [x] Match invoice numbers to database invoices
- [x] Update matched invoices to paid status with payment date
- [x] Add getInvoiceByNumber function to db.ts
- [x] Return matched and unmatched results for UI display

## Admin Payment Processing UI (Completed)
- [x] Create AdminPaymentProcessing page
- [x] Add "Check for Payments" button to trigger processing
- [x] Display matched invoices with success indicators
- [x] Display unmatched payments for manual review
- [x] Show processing summary statistics
- [x] Add route to App.tsx
- [x] Add menu item to DashboardLayout sidebar

## Scheduled Payment Processing
- [ ] Create cron expression for 6pm Eastern Time daily
- [ ] Set up scheduled task using schedule tool
- [ ] Create task prompt for payment processing
- [ ] Add admin notification for processing results
- [ ] Include summary of matched and unmatched invoices
- [ ] Test scheduled task execution

## Scheduled Task Created (Completed)
- [x] Create cron expression for 6pm Eastern Time daily (0 0 18 * * *)
- [x] Set up scheduled task using schedule tool
- [x] Create comprehensive task prompt for payment processing
- [x] Include playbook with implementation details
- [x] Configure daily repeat at 6pm

## Admin Notifications (Completed)
- [x] Add notifyOwner import to routers.ts
- [x] Create notification content with processing summary
- [x] Include matched invoices list with amounts
- [x] Include unmatched payments list with email subjects
- [x] Add warning for unmatched payments
- [x] Send notification after processing completes

## Comprehensive Status Workflows
- [ ] Define Project status workflow (draft → verified → scheduled → in_progress → inspection_complete → invoiced → paid → closed)
- [ ] Define Task status workflow (pending → assigned → in_progress → completed → verified)
- [ ] Define Deliverable status workflow (pending → in_progress → submitted → approved → rejected)
- [ ] Define Invoice status workflow (draft → sent → viewed → paid → overdue)
- [ ] Update database schema with new status enums
- [ ] Create workflow validation service
- [ ] Implement role-based transition permissions
- [ ] Add automated notifications for status changes
- [ ] Update UI components with new statuses
- [ ] Add status change history tracking

## Comprehensive Status Workflows (Completed)
- [x] Define Project status workflow with legacy states for backward compatibility
- [x] Define Task status workflow with legacy states
- [x] Define Deliverable status workflow
- [x] Define Invoice status workflow
- [x] Update database schema with new status enums
- [x] Create deliverables table
- [x] Create statusHistory table for audit trail
- [x] Create workflow validation service (workflows.ts)
- [x] Document comprehensive workflows in WORKFLOWS.md
- [ ] Implement status validation middleware (future)
- [ ] Add role-based permission checks (future)
- [ ] Add automated notifications for status changes (future)
- [ ] Build UI components showing workflow progress (future)

## User Role Audit and Fix
- [ ] Review current role definitions in schema
- [ ] Audit all backend procedures for role-based access
- [ ] Identify where field_tech can see financial data (should be blocked)
- [ ] Identify where client_scheduler can see financial data (should be blocked)
- [ ] Fix Home.tsx routing logic for correct role separation
- [ ] Remove invoice/financial access from field tech routes
- [ ] Remove invoice/financial access from client scheduler routes
- [ ] Ensure client_ap only sees financial data, not project management
- [ ] Update DashboardLayout navigation based on roles
- [ ] Test each role's access and visibility

## Role Audit Results (Completed)
- [x] Schema roles are correct: admin, client_scheduler, client_ap, field_tech
- [x] Backend has proper role procedures (adminProcedure, schedulerProcedure, apProcedure, fieldTechProcedure)
- [x] Identified issues: DashboardLayout shows all menus to all roles
- [x] Identified issues: No explicit blocking of financial routes for field_tech/scheduler

## Role Separation Fix (Completed)
- [x] Backend access control verified - all invoice procedures use apProcedure
- [x] DashboardLayout menu items filtered by role
- [x] Field tech pages contain no financial data
- [x] Scheduler pages contain no financial data
- [x] AP dashboard only shows financial information
- [x] Created comprehensive ROLES.md documentation

## Deliverables Approval System
- [ ] Update deliverables table schema with approval fields
- [ ] Add status enum: pending_review, approved, needs_revision, rejected
- [ ] Add reviewedBy, reviewedAt, reviewNotes fields
- [ ] Create deliverable upload backend procedure
- [ ] Create deliverable review/approval backend procedure
- [ ] Create deliverable revision request backend procedure
- [ ] Build field tech upload interface with file picker
- [ ] Integrate S3 storage for deliverable files
- [ ] Build admin deliverables review page
- [ ] Add approval/rejection actions with notes
- [ ] Add revision request functionality
- [ ] Show deliverable status in task detail views
- [ ] Add notifications for approval/rejection
- [ ] Test complete approval workflow

## Deliverables Schema Update (Completed)
- [x] Added needs_revision status to deliverables enum
- [x] Added reviewNotes field for detailed feedback
- [x] Pushed database schema changes successfully

## Deliverables Backend (Completed)
- [x] Added deliverable database functions to db.ts
- [x] Created deliverables router with upload, submit, approve, reject, requestRevision procedures
- [x] Implemented role-based access (field tech upload, admin review)

## Field Tech Upload Interface (Completed)
- [x] Created DeliverableUpload component with file picker
- [x] Integrated S3 storage upload functionality
- [x] Added deliverable type selection (report, photos, certificate, other)
- [x] Implemented submit for review functionality
- [x] Added to FieldTechTaskDetail page

## Admin Review Interface (Completed)
- [x] Created AdminDeliverables page with pending deliverables list
- [x] Implemented approve, request revision, and reject actions
- [x] Added review dialog with notes/reason inputs
- [x] Added route and menu item to navigation
- [x] Integrated with backend procedures

## Request for Information (ROI) Workflow
- [ ] Create ROI database table schema
- [ ] Add fields: projectId, requestedBy, title, description, dueDate, status, priority
- [ ] Add response fields: respondedBy, respondedAt, responseText, attachments
- [ ] Create ROI backend procedures (create, list, respond, close)
- [ ] Build admin ROI creation form
- [ ] Build admin ROI management page
- [ ] Add ROI status indicators to project detail pages
- [ ] Build client scheduler ROI response interface
- [ ] Add file upload for ROI responses
- [ ] Implement deadline tracking and overdue indicators
- [ ] Add notifications for new ROIs and responses
- [ ] Test complete ROI workflow

## ROI Backend (Completed)
- [x] Created requestsForInformation table with priority and deadline tracking
- [x] Added ROI database functions to db.ts
- [x] Created ROI router with create, respond, updateStatus procedures
- [x] Implemented role-based access (admin create, scheduler respond)

## Admin ROI Interface (Completed)
- [x] Created AdminROI page with ROI list and status management
- [x] Implemented create ROI dialog with project selection
- [x] Added priority levels and due date tracking
- [x] Implemented status badges and overdue indicators
- [x] Added route and menu item to navigation

## Scheduler ROI Interface (Completed)
- [x] Created SchedulerROI page with open ROI list
- [x] Implemented respond dialog with file upload
- [x] Added overdue indicators and priority badges
- [x] Integrated S3 file upload for attachments
- [x] Added route and menu item to navigation

## ROI Notifications (Completed)
- [x] Added notification when admin creates new ROI
- [x] Added notification when scheduler responds to ROI
- [x] Notifications include ROI title, priority, and due date
- [x] Response notifications include attachment count

## Rename ROI to RFI
- [ ] Rename backend router from 'roi' to 'rfi'
- [ ] Update all procedure names and references
- [ ] Update UI labels from "ROI" to "RFI"
- [ ] Rename AdminROI.tsx to AdminRFI.tsx
- [ ] Rename SchedulerROI.tsx to SchedulerRFI.tsx
- [ ] Update menu labels and navigation
- [ ] Update variable names (roi → rfi, roiId → rfiId)
- [ ] Update comments and documentation
- [ ] Test RFI workflow after renaming

## Rename ROI to RFI (Completed)
- [x] Renamed backend router from 'roi' to 'rfi'
- [x] Updated all procedure names and references
- [x] Updated UI labels from "ROI" to "RFI"
- [x] Renamed AdminROI.tsx to AdminRFI.tsx
- [x] Renamed SchedulerROI.tsx to SchedulerRFI.tsx
- [x] Updated menu labels and navigation
- [x] Updated variable names (roi → rfi, roiId → rfiId)
- [x] Updated comments and documentation
- [x] Tested RFI workflow after renaming

## Mobile-Optimized Field Tech Interface
- [ ] Create PWA manifest.json with app icons and metadata
- [ ] Set up service worker for offline caching
- [ ] Configure workbox for cache strategies
- [ ] Update FieldTechTaskDetail with mobile-optimized layout
- [ ] Increase button sizes and touch targets (min 44px)
- [ ] Simplify navigation for mobile use
- [ ] Add camera capture component with device camera access
- [ ] Implement GPS location tagging for photos
- [ ] Create offline task storage using IndexedDB
- [ ] Add sync indicator showing online/offline status
- [ ] Implement background sync for pending uploads
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

## PWA Infrastructure (Completed)
- [x] Created PWA manifest.json with app metadata
- [x] Set up service worker with offline caching strategies
- [x] Added PWA meta tags to index.html
- [x] Created service worker registration utility
- [x] Integrated SW registration in main.tsx
- [x] Added persistent storage request

## Mobile-Optimized UI (Completed)
- [x] Created FieldTechTaskDetailMobile component
- [x] Implemented large touch targets (48px+ buttons)
- [x] Added simplified mobile layout
- [x] Integrated camera capture functionality
- [x] Added GPS location tagging
- [x] Created photo preview grid
- [x] Added mobile route to App.tsx

## Field Tech Notification System
- [ ] Create notifications database table
- [ ] Add push subscription storage table
- [ ] Set up Web Push notification infrastructure
- [ ] Create notification service utility
- [ ] Add notification triggers when tasks are assigned
- [ ] Add notification triggers when tasks are updated
- [ ] Build in-app notification center component
- [ ] Add notification badge to field tech dashboard
- [ ] Implement push notification subscription flow
- [ ] Add notification preferences for field techs
- [ ] Test push notifications on mobile devices
- [ ] Add notification history and read status tracking

## Notification Schema (Completed)
- [x] Created notifications table with type, title, message, entity reference
- [x] Created pushSubscriptions table for web push endpoints
- [x] Pushed database schema changes successfully

## Notification Service Backend (Completed)
- [x] Created notificationService.ts with helper functions
- [x] Added notification database functions to db.ts
- [x] Added assignFieldTech mutation with notification trigger
- [x] Added notification trigger to task update mutation
- [x] Imported notification helpers in routers.ts

## In-App Notification Center (Completed)
- [x] Created NotificationCenter component with bell icon and badge
- [x] Added notifications router with list, unreadCount, markAsRead, markAllAsRead
- [x] Integrated NotificationCenter into DashboardLayout mobile header
- [x] Added real-time notification display with mark as read functionality
- [x] Implemented scroll area for notification list with empty state

## Vite HMR WebSocket Fix
- [x] Update vite.config.ts to configure correct WebSocket URL (wss protocol, port 443)
- [x] Add host configuration to HMR settings
- [x] Test HMR connection after adding host

## Admin Dashboard Enhancement
- [x] Make admin dashboard status cards clickable with links to filtered list pages
- [x] Link project status cards to projects list with status filter
- [x] Link invoice status cards to invoices list with status filter

## 7-Day Calendar Strip View
- [x] Add 7-day calendar strip component to admin dashboard
- [x] Show 2 previous days, current day, and 5 upcoming days
- [x] Display all tasks for each day in the strip
- [x] Add visual indicators for task status and count
- [x] Make tasks clickable to navigate to project details

## Project Display Layout Reorganization
- [x] Reorganize project list display to prioritize address as first line
- [x] Consolidate Property Owner + Customer Number on same line
- [x] Consolidate Jurisdiction + Permit Number on same line
- [x] Display Branch on its own line
- [x] Display Created Date on its own line
- [x] Apply consistent layout across all project list views (Admin, Scheduler dashboards)

## Dashboard Status Count Expansion
- [x] Add Projects status count row to admin dashboard
- [x] Add Tasks status count row to admin dashboard
- [x] Add Deliverables status count row to admin dashboard
- [x] Add Invoices status count row to admin dashboard
- [x] Make all status cards clickable to navigate to filtered lists
- [x] Order rows as: Projects, Tasks, Deliverables, Invoices

## Status Trend Indicators
- [x] Calculate week-over-week changes for all status metrics
- [x] Add trend indicators (arrows and numbers) to project status cards
- [x] Add trend indicators to task status cards
- [x] Add trend indicators to deliverable status cards
- [x] Add trend indicators to invoice status cards
- [x] Color code trends (green for improvements, red for concerns)

## Bug Fixes
- [x] Fix 7-day calendar showing 8 days instead of 7
- [x] Exclude Sundays from calendar view (show only Mon-Sat)
- [x] Fix "process is not defined" error from server-side imports in client
- [x] Fix Vite HMR WebSocket connection error

## Persistent Sidebar State
- [x] Implement cookie reading to load sidebar collapse state
- [x] Load sidebar state on DashboardLayout mount
- [x] Ensure state persists across all screens and browser sessions

## Projects Page Layout Update
- [x] Apply consistent information hierarchy to projects page
- [x] Use address as primary information (first line)
- [x] Match dashboard layout: Property Owner + Customer Number on same line
- [x] Match dashboard layout: Jurisdiction + Permit Number on same line
- [x] Display Client name and Created Date on separate lines

## Calendar Day Count Fix
- [x] Fix 7-day calendar showing 8 days instead of 7
- [x] Ensure exactly 7 weekdays (Mon-Sat) are displayed

## Dashboard Status Sections Redesign
- [x] Redesign status sections to be more compact
- [x] Reduce vertical space taken by status cards
- [x] Maintain all status metrics visibility
- [x] Keep clickable functionality for filtering
- [x] Preserve trend indicators

## Modify Action Pill
- [x] Change branding pill text to "Submit a New Request"
- [x] Show pill only on client/scheduler interface
- [x] Link pill to new project request page

## Certification Generation System
- [x] Add certification type field to projects (as_permitted, as_built)
- [x] Add field changes tracking to project notes
- [x] Create certification generation UI for admin and field technicians
- [x] Implement "As Permitted" vs "As Built" selection dialog
- [x] Add field changes input form for "As Built" certifications
- [x] Write field changes to project notes as "Field Changes"
- [x] Parse Permit PDF and Plans PDF to extract project details
- [x] Generate 1-page certification document with:
  - [x] Company name and contact info
  - [x] Property owner name
  - [x] Site address
  - [x] Contractor name
  - [x] Permitted scope of work
  - [x] Inspected products (quantity, spacing, etc)
  - [x] Certification statement (ICC Building Code, State Code, year)
  - [x] Field changes integration for "As Built" certifications
- [x] Add certification download/view functionality
- [x] Store generated certification in deliverables
- [x] Add "Generate Certification" button to AdminProjectDetail page
- [ ] Add "Generate Certification" button to field technician task detail page

## Deliverables UI
- [x] Add Deliverables tab to AdminProjectDetail page
- [x] Display list of all project deliverables (certifications, reports, photos)
- [x] Show deliverable status, type, and submission date
- [x] Add download button for each deliverable
- [x] Add deliverables.list procedure to backend

## Certification Preview and Batch Generation
- [ ] Create certification preview modal component
- [ ] Add inline editing fields for certification content (company info, scope, products, etc)
- [ ] Display preview of certification before final generation
- [ ] Allow users to edit and regenerate preview
- [ ] Add batch selection UI to admin dashboard project list
- [ ] Implement batch certification generation backend procedure
- [ ] Add progress indicator for batch operations
- [ ] Generate and download all certifications as ZIP file

## Bug Fixes
- [x] Fix Vite HMR WebSocket connection error

## Project Detail Page Reorganization
- [ ] Add deliverables section to Overview tab
- [ ] Reorder tabs: Overview, Tasks, Notes, Files, Audit Trail
- [ ] Add "Add Task" button to Tasks tab
- [ ] Restructure Files tab with categories:
  - [ ] Deliverables
  - [ ] Drive Logs
  - [ ] Production Photos
  - [ ] Plan Revisions
  - [ ] Permit Revisions
  - [ ] RDP Statements
  - [ ] Plans
  - [ ] Permit
- [ ] Update Audit Trail to display user information for each change

## Add Task Functionality
- [x] Create AddTaskDialog component with form fields
- [x] Add task type selection dropdown
- [ ] Add scheduled date/time picker
- [x] Add field technician assignment dropdown
- [x] Add optional notes field
- [x] Create backend task creation procedure
- [x] Integrate dialog into AdminProjectDetail "Add Task" button
- [x] Add task creation to field tech mobile interface
- [ ] Test task creation from both admin and field tech interfaces

## RFI System Restructure
- [x] Update RFI schema to include status field (open, in_progress, resolved, closed)
- [x] Add common request type field with predefined options
- [x] Create RFI tab component for AdminProjectDetail page
- [x] Create RFI tab component for SchedulerProjectDetail page
- [x] Build master AdminRFIList page with branch filtering and status breakdown
- [x] Build master SchedulerRFIList page filtered by user's branch
- [x] Update RFI creation forms with common request dropdown
- [x] Add status update functionality for RFIs
- [x] Update backend procedures for RFI filtering by branch and status
- [x] Remove old standalone RFI pages (AdminRFI, SchedulerRFI)
- [x] Update sidebar navigation to link to master RFI lists
- [ ] Test RFI creation, status updates, and filtering across roles

## PDF Download Security Error Fix
- [x] Investigate PDF deliverable download security error
- [x] Implement proper file serving mechanism (fetch + blob download)
- [x] Apply fix to AdminProjectDetail, ProjectDetail, and AdminDeliverables pages
- [ ] Test PDF downloads after publishing to production

## PDF Deliverable Corruption Fix
- [x] Investigate PDF generation code in certification procedures
- [x] Implement proper PDF generation with pdf-lib
- [x] Fix PDF download to handle binary data correctly
- [ ] Test generated PDFs can be opened without corruption

## Deliverable Naming and Timestamps
- [x] Update certification filename to include address, owner last name, customer number, version
- [x] Show time along with date for deliverable submission timestamps
- [ ] Apply consistent naming pattern across all deliverable types

## Bulk Certification Generation
- [x] Create bulk certification backend endpoint that processes multiple projects
- [x] Add project selection checkboxes to admin dashboard project list
- [x] Create bulk action toolbar with "Generate Certifications" button
- [x] Show progress indicator during bulk generation
- [x] Display summary of successful/failed generations
- [x] Add ability to select certification type (as_permitted/as_built) for batch
- [x] Filter to only show completed projects eligible for certification

## Rename Branch to Client
- [ ] Update database schema: rename branch column to client in users and projects tables
- [ ] Update backend queries and procedures to use client terminology
- [ ] Update frontend UI labels (forms, tables, filters, navigation)
- [ ] Update RFI system references (branch filtering → client filtering)
- [ ] Update user management references
- [ ] Update project detail pages
- [ ] Search and replace all "branch" references in code comments and documentation
