CREATE TABLE `decision_memos` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`recommendation_id` text NOT NULL,
	`markdown` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `decision_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decision_memos_snapshot_idx` ON `decision_memos` (`snapshot_id`);--> statement-breakpoint
CREATE TABLE `decision_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`version` integer NOT NULL,
	`raw_intake_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decision_snapshots_version_idx` ON `decision_snapshots` (`decision_id`,`version`);--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`decision_type` text NOT NULL,
	`current_stage` text NOT NULL,
	`latest_snapshot_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decisions_slug_idx` ON `decisions` (`slug`);--> statement-breakpoint
CREATE TABLE `normalized_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`stage_run_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `decision_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_run_id`) REFERENCES `stage_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `normalized_decisions_snapshot_idx` ON `normalized_decisions` (`snapshot_id`);--> statement-breakpoint
CREATE TABLE `premortem_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`stage_run_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `decision_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_run_id`) REFERENCES `stage_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `premortem_analyses_snapshot_idx` ON `premortem_analyses` (`snapshot_id`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`stage_run_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `decision_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_run_id`) REFERENCES `stage_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_snapshot_idx` ON `recommendations` (`snapshot_id`);--> statement-breakpoint
CREATE TABLE `regret_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`stage_run_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `decision_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_run_id`) REFERENCES `stage_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regret_analyses_snapshot_idx` ON `regret_analyses` (`snapshot_id`);--> statement-breakpoint
CREATE TABLE `stage_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`stage` text NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`input_json` text NOT NULL,
	`output_json` text,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`refusal_reason` text,
	`error_code` text,
	`error_message` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	`superseded_at` text,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `decision_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stage_runs_decision_snapshot_stage_idx` ON `stage_runs` (`decision_id`,`snapshot_id`,`stage`);--> statement-breakpoint
CREATE UNIQUE INDEX `stage_runs_stage_version_idx` ON `stage_runs` (`snapshot_id`,`stage`,`version`);--> statement-breakpoint
CREATE TABLE `synthesis_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`stage_run_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `decision_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_run_id`) REFERENCES `stage_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `synthesis_drafts_snapshot_idx` ON `synthesis_drafts` (`snapshot_id`);