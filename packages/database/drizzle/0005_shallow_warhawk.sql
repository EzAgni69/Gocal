ALTER TABLE "vendors" ADD COLUMN "opening_hours" jsonb;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD COLUMN "opening_hours" jsonb;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD COLUMN "pincode" varchar(10);--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD COLUMN "google_direction_link" text;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD COLUMN "main_photo_url" text;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD COLUMN "main_photo_description" text;--> statement-breakpoint
ALTER TABLE "contact_card_requests" ADD COLUMN "gallery_urls" jsonb;--> statement-breakpoint
CREATE INDEX "idx_reviews_vendor" ON "reviews" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("user_id");