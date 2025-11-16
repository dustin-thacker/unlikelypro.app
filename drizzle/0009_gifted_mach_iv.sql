ALTER TABLE `projects` MODIFY COLUMN `status` enum('pending_verification','verified','scheduled','in_progress','inspection_complete','invoice_generated','completed','cancelled') NOT NULL DEFAULT 'pending_verification';--> statement-breakpoint
ALTER TABLE `projects` ADD `projectNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `billingEmails` text;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_projectNumber_unique` UNIQUE(`projectNumber`);