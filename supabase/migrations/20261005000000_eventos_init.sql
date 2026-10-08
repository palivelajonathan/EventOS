-- ==============================================================================
-- EVENTOS CLOUD DATABASE SCHEMA
-- Multi-Tenant SaaS Platform for Modern Events
-- PostgreSQL 15+ / Supabase Schema with RLS, Realtime & Atomic Concurrency
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    billing_tier VARCHAR(50) DEFAULT 'PRO' CHECK (billing_tier IN ('FREE', 'PRO', 'ENTERPRISE')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Organization Memberships (RBAC)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'ORGANIZER' CHECK (role IN ('OWNER', 'ADMIN', 'ORGANIZER', 'GATE_STAFF', 'VOLUNTEER')),
    assigned_gate VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (org_id, user_id)
);

-- 4. Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    slug VARCHAR(120) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    description TEXT,
    venue_name VARCHAR(255),
    venue_address TEXT,
    city VARCHAR(100) DEFAULT 'Hyderabad',
    date_start TIMESTAMPTZ NOT NULL,
    date_end TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'LIVE' CHECK (status IN ('DRAFT', 'PUBLISHED', 'LIVE', 'CONCLUDED')),
    capacity INTEGER DEFAULT 1500,
    offline_mesh_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (org_id, slug)
);

-- 5. Ticket Tiers / Passes
CREATE TABLE IF NOT EXISTS public.tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    capacity INTEGER DEFAULT 500,
    allocated INTEGER DEFAULT 0,
    color_accent VARCHAR(50) DEFAULT '#8083ff',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Gates / Turnstiles
CREATE TABLE IF NOT EXISTS public.gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'PRIMARY ENTRANCE' CHECK (category IN ('PRIMARY ENTRANCE', 'SECONDARY ACCESS', 'RESTRICTED PASS')),
    capacity_limit INTEGER DEFAULT 500,
    status VARCHAR(50) DEFAULT 'OPTIMAL' CHECK (status IN ('OPTIMAL', 'STANDBY', 'NEAR_CAPACITY')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (event_id, name)
);

-- 7. Participants / Registrations
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES public.tiers(id) ON DELETE SET NULL,
    pass_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    college VARCHAR(255),
    roll_number VARCHAR(100),
    sha256_hash CHAR(64) NOT NULL,
    checked_in BOOLEAN DEFAULT false,
    check_in_time TIMESTAMPTZ,
    check_in_gate VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (event_id, pass_code),
    UNIQUE (event_id, sha256_hash),
    UNIQUE (event_id, email)
);

-- 8. Check-In High-Velocity Telemetry Logs
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    gate_name VARCHAR(100) NOT NULL,
    scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'VALIDATED' CHECK (status IN ('VALIDATED', 'DENIED', 'FLAGGED')),
    latency_ms INTEGER DEFAULT 18,
    synced_from_offline BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Sessions & Stages
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    track VARCHAR(100) DEFAULT 'KEYNOTE',
    stage VARCHAR(100) NOT NULL,
    speaker_name VARCHAR(255) NOT NULL,
    speaker_title VARCHAR(255),
    speaker_org VARCHAR(255),
    speaker_avatar TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER DEFAULT 500,
    enrolled INTEGER DEFAULT 0,
    is_live_now BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Certificates (Cryptographically Verified Records)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    credential_type VARCHAR(100) DEFAULT 'PARTICIPATION' CHECK (credential_type IN ('PARTICIPATION', 'HONORS', 'HACKATHON_WINNER', 'SPEAKER')),
    sha256_hash CHAR(64) NOT NULL,
    pdf_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    revoked BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Feedback Submissions
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    category VARCHAR(100) DEFAULT 'GENERAL',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR SUB-MILLISECOND LOOKUPS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_participants_event_lookup ON public.participants(event_id, checked_in);
CREATE INDEX IF NOT EXISTS idx_participants_pass_code ON public.participants(event_id, pass_code);
CREATE INDEX IF NOT EXISTS idx_participants_sha256 ON public.participants(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_participants_email ON public.participants(event_id, email);
CREATE INDEX IF NOT EXISTS idx_check_ins_event_gate ON public.check_ins(event_id, gate_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_participant ON public.check_ins(participant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_event_time ON public.sessions(event_id, start_time);
CREATE INDEX IF NOT EXISTS idx_certificates_hash ON public.certificates(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_num ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- ==============================================================================
-- ATOMIC CONCURRENT CHECK-IN STORED PROCEDURE
-- Prevents double-scanning race conditions across simultaneous volunteer scanners
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_check_in(
    p_event_id UUID,
    p_pass_code VARCHAR,
    p_gate_name VARCHAR,
    p_scanned_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_status VARCHAR;
    v_participant RECORD;
    v_tier RECORD;
    v_checkin_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Check Event Existence and Active Status
    SELECT status INTO v_event_status
    FROM public.events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'EVENT NOT ACTIVE',
            'message', 'Event does not exist.'
        );
    END IF;

    IF v_event_status NOT IN ('LIVE', 'PUBLISHED') THEN
        RETURN jsonb_build_object(
            'status', 'EVENT NOT ACTIVE',
            'message', 'Event is currently not active for check-in.'
        );
    END IF;

    -- 2. Find Participant with Exclusive Row Lock (SELECT ... FOR UPDATE)
    SELECT * INTO v_participant
    FROM public.participants
    WHERE event_id = p_event_id AND pass_code = p_pass_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'PARTICIPANT NOT FOUND',
            'message', 'No attendee registration found matching this pass code.'
        );
    END IF;

    -- 3. Check for Duplicate Check-In
    IF v_participant.checked_in THEN
        RETURN jsonb_build_object(
            'status', 'ALREADY CHECKED IN',
            'message', 'Participant has already passed through turnstiles.',
            'participant', jsonb_build_object(
                'id', v_participant.id,
                'name', v_participant.name,
                'pass_code', v_participant.pass_code,
                'college', v_participant.college,
                'check_in_time', v_participant.check_in_time,
                'check_in_gate', v_participant.check_in_gate
            )
        );
    END IF;

    -- 4. Mark Participant Checked In
    UPDATE public.participants
    SET 
        checked_in = true,
        check_in_time = v_now,
        check_in_gate = p_gate_name
    WHERE id = v_participant.id;

    -- 5. Insert Immutable Telemetry Log
    INSERT INTO public.check_ins (
        event_id,
        participant_id,
        gate_name,
        scanned_by,
        status,
        latency_ms,
        created_at
    ) VALUES (
        p_event_id,
        v_participant.id,
        p_gate_name,
        p_scanned_by,
        'VALIDATED',
        18,
        v_now
    ) RETURNING id INTO v_checkin_id;

    -- 6. Fetch Tier Info if available
    IF v_participant.tier_id IS NOT NULL THEN
        SELECT name INTO v_tier FROM public.tiers WHERE id = v_participant.tier_id;
    END IF;

    -- 7. Return Success Payload
    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'message', 'Access granted.',
        'checkin_id', v_checkin_id,
        'participant', jsonb_build_object(
            'id', v_participant.id,
            'name', v_participant.name,
            'email', v_participant.email,
            'pass_code', v_participant.pass_code,
            'college', v_participant.college,
            'tier', COALESCE(v_tier.name, 'GENERAL'),
            'check_in_time', v_now,
            'check_in_gate', p_gate_name
        )
    );
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation verified by org_id and auth.uid()
-- ==============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies (for landing, schedule, public verification)
CREATE POLICY "Public events are viewable by anyone"
ON public.events FOR SELECT USING (status IN ('PUBLISHED', 'LIVE', 'CONCLUDED'));

CREATE POLICY "Public tiers are viewable by anyone"
ON public.tiers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = tiers.event_id AND status IN ('PUBLISHED', 'LIVE', 'CONCLUDED'))
);

CREATE POLICY "Public sessions are viewable by anyone"
ON public.sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = sessions.event_id AND status IN ('PUBLISHED', 'LIVE', 'CONCLUDED'))
);

CREATE POLICY "Certificates are publicly verifiable by anyone"
ON public.certificates FOR SELECT USING (true);

-- 2. Organization Members Access Policies (Strict Tenant Isolation)
CREATE POLICY "Org members can view their organizations"
ON public.organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = organizations.id AND user_id = auth.uid())
);

CREATE POLICY "Org members can manage their events"
ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = events.org_id AND user_id = auth.uid())
);

CREATE POLICY "Org members can view tiers"
ON public.tiers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organization_members m ON m.org_id = e.org_id
    WHERE e.id = tiers.event_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view gates"
ON public.gates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organization_members m ON m.org_id = e.org_id
    WHERE e.id = gates.event_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view and update participants"
ON public.participants FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organization_members m ON m.org_id = e.org_id
    WHERE e.id = participants.event_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Gate staff and volunteers can log check-ins"
ON public.check_ins FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organization_members m ON m.org_id = e.org_id
    WHERE e.id = check_ins.event_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can manage sessions"
ON public.sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organization_members m ON m.org_id = e.org_id
    WHERE e.id = sessions.event_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can manage certificates"
ON public.certificates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organization_members m ON m.org_id = e.org_id
    WHERE e.id = certificates.event_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can read feedback"
ON public.feedback FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organization_members m ON m.org_id = e.org_id
    WHERE e.id = feedback.event_id AND m.user_id = auth.uid()
  )
);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
