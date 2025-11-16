ALTER TABLE `projectNotes` MODIFY COLUMN `noteType` enum('general','scope_change','production','conversation','field_changes') NOT NULL DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `projects` ADD `certificationType` enum('as_permitted','as_built');--> statement-breakpoint
ALTER TABLE `projects` ADD `certificationGeneratedAt` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD `certificationFileKey` varchar(512);--> statement-breakpoint
ALTER TABLE `projects` ADD `certificationFileUrl` text;