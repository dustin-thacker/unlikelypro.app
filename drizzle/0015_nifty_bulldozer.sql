CREATE TABLE `requestsForInformation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','responded','resolved','cancelled') NOT NULL DEFAULT 'open',
	`dueDate` datetime,
	`respondedBy` int,
	`respondedAt` timestamp,
	`responseText` text,
	`responseAttachments` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requestsForInformation_id` PRIMARY KEY(`id`)
);
