CREATE TABLE `auditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`changes` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` int NOT NULL,
	`total` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`invoiceNumber` varchar(100) NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`subtotal` int NOT NULL,
	`tax` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`pdfUrl` text,
	`issuedDate` datetime,
	`dueDate` datetime,
	`paidDate` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `projectFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` enum('production_photo','updated_plan','updated_permit','pier_log','other') NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`note` text NOT NULL,
	`noteType` enum('general','scope_change','production','conversation') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rescheduleRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`requestType` enum('reschedule','cancel') NOT NULL,
	`currentDate` datetime,
	`requestedDate` datetime,
	`reason` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rescheduleRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','client_scheduler','client_ap','field_tech') NOT NULL DEFAULT 'client_scheduler';--> statement-breakpoint
ALTER TABLE `projects` ADD `productionDays` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `branch` varchar(255);