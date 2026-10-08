-- ==============================================================================
-- EVENTOS PASS DELIVERY NOTIFICATIONS MIGRATION
-- Production-Safe Idempotent Delivery Tracking for Email & WhatsApp
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('EMAIL', 'WHATSAPP')),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
    provider VARCHAR(100) NOT NULL,
    template_id VARCHAR(100),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON public.notification_logs(event_id, notification_type, status);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON public.notification_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notification_logs(recipient);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only organizers and admins can view notification logs
CREATE POLICY "Notification logs viewable by organizers"
ON public.notification_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.organization_members m ON m.org_id = e.org_id
        WHERE e.id = notification_logs.event_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('OWNER', 'ADMIN', 'ORGANIZER')
    )
);

-- Realtime publication for delivery dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;
