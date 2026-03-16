import { writeFileSync } from 'fs';
import { resolve } from 'path';

const outputPath = resolve(import.meta.dirname || '.', 'migration-result.txt');

// Ensure we write something no matter what
process.on('uncaughtException', (e) => {
    writeFileSync(outputPath, 'UNCAUGHT: ' + e.message + '\n' + e.stack);
    process.exit(1);
});

process.on('unhandledRejection', (e: any) => {
    writeFileSync(outputPath, 'UNHANDLED_REJECTION: ' + String(e?.message || e) + '\n' + (e?.stack || ''));
    process.exit(1);
});

process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5434/vanij_db';

import { db } from './src/db';
import { sql } from 'drizzle-orm';

try {
    await db.execute(sql`
        DO $$ BEGIN
            CREATE TYPE card_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `);

    await db.execute(sql`
        DO $$ BEGIN
            CREATE TYPE card_request_rejection_reason AS ENUM ('INCOMPLETE_INFO', 'DUPLICATE', 'INAPPROPRIATE', 'INVALID_BUSINESS', 'OTHER');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS contact_card_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status card_request_status NOT NULL DEFAULT 'PENDING',
            rejection_reason card_request_rejection_reason,
            rejection_note TEXT,
            reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
            reviewed_at TIMESTAMPTZ,
            plan_type VARCHAR(50) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            business_name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            city VARCHAR(100) NOT NULL,
            address TEXT,
            short_description VARCHAR(500),
            full_description TEXT,
            subscription_plan VARCHAR(20),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_card_requests_requester ON contact_card_requests(requester_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_card_requests_status ON contact_card_requests(status);`);

    const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'contact_card_requests'`);
    writeFileSync(outputPath, 'SUCCESS: ' + JSON.stringify(result));
} catch (e: any) {
    writeFileSync(outputPath, 'ERROR: ' + e.message + '\n' + (e.stack || ''));
}

process.exit(0);
