CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('task_assigned','task_updated','task_completed','deliverable_approved','deliverable_rejected','rfi_created','rfi_responded') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`entityType` enum('project','task','deliverable','invoice','rfi'),
	`entityId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsed` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
