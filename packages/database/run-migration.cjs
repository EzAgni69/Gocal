const postgres = require('postgres');
const { writeFileSync } = require('fs');

async function run() {
    writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Starting...\n');
    let sql;
    try {
        sql = postgres('postgresql://postgres:password@localhost:5434/vanij_db', { max: 1 });
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Connected.\n', { flag: 'a' });
        
        await sql`
            DO $$ BEGIN
                CREATE TYPE card_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        `;
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Enum 1 created.\n', { flag: 'a' });

        await sql`
            DO $$ BEGIN
                CREATE TYPE card_request_rejection_reason AS ENUM ('INCOMPLETE_INFO', 'DUPLICATE', 'INAPPROPRIATE', 'INVALID_BUSINESS', 'OTHER');
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        `;
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Enum 2 created.\n', { flag: 'a' });

        await sql`
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
        `;
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Table created.\n', { flag: 'a' });

        await sql`CREATE INDEX IF NOT EXISTS idx_card_requests_requester ON contact_card_requests(requester_id);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_card_requests_status ON contact_card_requests(status);`;
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Indexes created.\n', { flag: 'a' });

        const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'contact_card_requests'`;
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Verify: ' + JSON.stringify(result) + '\n', { flag: 'a' });

        await sql.end();
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Done.\n', { flag: 'a' });
    } catch(e) {
        writeFileSync('/Users/agni/Developer/Vanij/run_output.txt', 'Error: ' + String(e.stack || e) + '\n', { flag: 'a' });
    }
}
run();
