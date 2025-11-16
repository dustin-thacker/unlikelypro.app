CREATE TABLE `invoiceEmailLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`recipients` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentBy` int NOT NULL,
	CONSTRAINT `invoiceEmailLog_id` PRIMARY KEY(`id`)
);
