CREATE TYPE "public"."card_request_rejection_reason" AS ENUM('INCOMPLETE_INFO', 'DUPLICATE', 'INAPPROPRIATE', 'INVALID_BUSINESS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."card_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "translations" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"source_hash" varchar(255) NOT NULL,
	"source_text" text NOT NULL,
	"target_lang" varchar(10) NOT NULL,
	"translated_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_card_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"status" "card_request_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" "card_request_rejection_reason",
	"rejection_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"plan_type" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"business_name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"address" text,
	"short_description" varchar(500),
	"full_description" text,
	"subscription_plan" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "plan_type" varchar(50) DEFAULT 'card_website' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD CONSTRAINT "contact_card_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD CONSTRAINT "contact_card_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_card_requests_requester" ON "contact_card_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_card_requests_status" ON "contact_card_requests" USING btree ("status");