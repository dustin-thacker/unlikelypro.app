CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` enum('plan','permit') NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extractedData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`attachmentId` int NOT NULL,
	`propertyOwnerName` varchar(255),
	`address` text,
	`jurisdiction` varchar(255),
	`permitNumber` varchar(255),
	`scopeOfWork` text,
	`isVerified` boolean NOT NULL DEFAULT false,
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extractedData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`propertyOwnerName` varchar(255),
	`address` text NOT NULL,
	`jurisdiction` varchar(255),
	`permitNumber` varchar(255),
	`scopeOfWork` text,
	`status` enum('pending_verification','verified','scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending_verification',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`scheduledDate` datetime,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
