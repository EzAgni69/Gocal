CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vendor_tags" (
	"vendor_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_tags_vendor_id_tag_id_pk" PRIMARY KEY("vendor_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "home_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "vendor_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "wishlist_items" ALTER COLUMN "product_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "place_data" jsonb;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN "product_data" jsonb;--> statement-breakpoint
ALTER TABLE "vendor_tags" ADD CONSTRAINT "vendor_tags_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_tags" ADD CONSTRAINT "vendor_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_cards" ADD CONSTRAINT "home_cards_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_vendor_tags_vendor" ON "vendor_tags" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_tags_tag" ON "vendor_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_home_cards_vendor" ON "home_cards" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_home_cards_active" ON "home_cards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_home_cards_order" ON "home_cards" USING btree ("display_order");