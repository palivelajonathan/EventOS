-- ==============================================================================
-- EVENTOS EMERGENCY PRODUCTION MIGRATION
-- Additional Tables & Stored Procedures for Live Event Execution
-- ==============================================================================

-- 1. Ensure external_registration_id on participants table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participants' 
        AND column_name = 'external_registration_id'
    ) THEN
        ALTER TABLE public.participants ADD COLUMN external_registration_id VARCHAR(100);
        CREATE INDEX IF NOT EXISTS idx_participants_ext_reg_id ON public.participants(event_id, external_registration_id);
    END IF;
END $$;

-- 2. Audit Logs Table (Immutable operational actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255),
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 3. Event Documents Table (Event Knowledge Base & RAG)
CREATE TABLE IF NOT EXISTS public.event_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) DEFAULT 'GUIDE',
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_docs_event ON public.event_documents(event_id, document_type);

-- 4. Volunteers Table (Operational Turnstile & Gate Crew)
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'VOLUNTEER' CHECK (role IN ('VOLUNTEER', 'GATE_STAFF')),
    assigned_gate VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'OFFLINE', 'STANDBY')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_volunteers_event_gate ON public.volunteers(event_id, assigned_gate);

-- 4. Enable RLS on newly created tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;

-- Audit logs policy: viewable by org members with role ORGANIZER or ADMIN
CREATE POLICY "Audit logs viewable by organizers"
ON public.audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.organization_members m ON m.org_id = e.org_id
        WHERE e.id = audit_logs.event_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('OWNER', 'ADMIN', 'ORGANIZER')
    )
);

-- Event docs policy: viewable by all authorized staff
CREATE POLICY "Event documents viewable by authorized staff"
ON public.event_documents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.organization_members m ON m.org_id = e.org_id
        WHERE e.id = event_documents.event_id 
        AND m.user_id = auth.uid()
    )
);

-- 5. Atomic Check-In Procedure with Concurrency Protection & Audit Logging
CREATE OR REPLACE FUNCTION public.process_check_in_v2(
    p_event_id UUID,
    p_pass_code VARCHAR,
    p_gate_name VARCHAR,
    p_scanned_by UUID DEFAULT NULL,
    p_device_id VARCHAR DEFAULT NULL,
    p_synced_from_offline BOOLEAN DEFAULT false
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
            'status', 'EVENT INACTIVE',
            'message', 'Event turnstiles are currently deactivated.'
        );
    END IF;

    -- 2. Find Participant with Exclusive Row Lock (SELECT ... FOR UPDATE)
    SELECT * INTO v_participant
    FROM public.participants
    WHERE event_id = p_event_id 
      AND (pass_code = p_pass_code OR external_registration_id = p_pass_code)
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'PARTICIPANT NOT FOUND',
            'message', 'No attendee registration found matching this credential.'
        );
    END IF;

    -- 3. Check for Duplicate Check-In
    IF v_participant.checked_in THEN
        RETURN jsonb_build_object(
            'status', 'ALREADY CHECKED IN',
            'message', 'Participant has already been admitted.',
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
        synced_from_offline,
        created_at
    ) VALUES (
        p_event_id,
        v_participant.id,
        p_gate_name,
        p_scanned_by,
        'VALIDATED',
        15,
        p_synced_from_offline,
        v_now
    ) RETURNING id INTO v_checkin_id;

    -- 6. Insert Audit Log
    INSERT INTO public.audit_logs (
        event_id,
        actor,
        action,
        target,
        details,
        metadata
    ) VALUES (
        p_event_id,
        COALESCE(p_scanned_by::text, 'GATE_STAFF'),
        'CHECK_IN',
        v_participant.pass_code,
        'Admitted at ' || p_gate_name,
        jsonb_build_object('device_id', p_device_id, 'offline_sync', p_synced_from_offline)
    );

    -- 7. Fetch Tier Name
    IF v_participant.tier_id IS NOT NULL THEN
        SELECT name INTO v_tier FROM public.tiers WHERE id = v_participant.tier_id;
    END IF;

    -- 8. Return Success Payload
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

-- Enable Realtime replication for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
