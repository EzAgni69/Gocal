DO $$ BEGIN
    CREATE TYPE card_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE card_request_rejection_reason AS ENUM ('INCOMPLETE_INFO', 'DUPLICATE', 'INAPPROPRIATE', 'INVALID_BUSINESS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_card_requests_requester ON contact_card_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_card_requests_status ON contact_card_requests(status);
