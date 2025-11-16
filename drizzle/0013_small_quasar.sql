CREATE TABLE `statusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('project','task','deliverable','invoice') NOT NULL,
	`entityId` int NOT NULL,
	`oldStatus` varchar(100),
	`newStatus` varchar(100) NOT NULL,
	`changedBy` int NOT NULL,
	`reason` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `statusHistory_id` PRIMARY KEY(`id`)
);
