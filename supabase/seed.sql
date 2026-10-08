-- ==============================================================================
-- EVENTOS DEMO SEED DATA (Dynamite 2026 Demonstration Cluster)
-- Execute this file ONLY in development or staging environments to populate
-- the complete demonstration dataset.
-- ==============================================================================

-- 1. Demo Organization
INSERT INTO public.organizations (id, name, slug, billing_tier)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Dynamite Events Collective',
    'org_dynamite',
    'ENTERPRISE'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Demo Event: DYNAMITE 2026
INSERT INTO public.events (
    id,
    org_id,
    slug,
    name,
    tagline,
    description,
    venue_name,
    venue_address,
    city,
    date_start,
    date_end,
    status,
    capacity,
    offline_mesh_enabled
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'dynamite-2026',
    'DYNAMITE 2026',
    'Hyderabad''s Multi-College Student Experience',
    'The premier technical and cultural summit uniting 14+ university campuses across Telangana.',
    'Begumpet Exhibition Concourse',
    'Airport Road, Begumpet, Hyderabad, Telangana 500016',
    'Hyderabad',
    '2026-10-08 09:00:00+05:30',
    '2026-10-08 20:00:00+05:30',
    'LIVE',
    1500,
    true
) ON CONFLICT (org_id, slug) DO NOTHING;

-- 3. Ticket Tiers
INSERT INTO public.tiers (id, event_id, name, description, price, currency, capacity, allocated, color_accent)
VALUES
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'VIP', 'Front-row arena, speaker lounge access', 1299.00, 'INR', 150, 150, '#8083ff'),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'ALL-ACCESS', 'Full conference floor & technical workshops', 649.00, 'INR', 600, 580, '#4cd7f6'),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', 'HACKER', '24h Hackathon annex access and power pod', 499.00, 'INR', 500, 480, '#6be794'),
    ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 'DELEGATE', 'College representative and student council badge', 649.00, 'INR', 250, 200, '#c0c1ff')
ON CONFLICT DO NOTHING;

-- 4. Ingress Gates / Turnstiles
INSERT INTO public.gates (id, event_id, name, category, capacity_limit, status)
VALUES
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 'Gate 01 • Main Arena', 'PRIMARY ENTRANCE', 450, 'NEAR_CAPACITY'),
    ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', 'Gate 02 • North Turnstiles', 'SECONDARY ACCESS', 500, 'OPTIMAL'),
    ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000002', 'Hall 02 • Hackathon Annex', 'RESTRICTED PASS', 300, 'NEAR_CAPACITY')
ON CONFLICT DO NOTHING;

-- 5. Seed Participants
INSERT INTO public.participants (
    id,
    event_id,
    tier_id,
    pass_code,
    name,
    email,
    phone,
    college,
    roll_number,
    sha256_hash,
    checked_in,
    check_in_time,
    check_in_gate
) VALUES
    ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'DYN-88912', 'Aryan Varma', 'aryan.varma@cbit.ac.in', '+91 98490 12345', 'CBIT Hyderabad', '1601-22-733-042', '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', true, '2026-10-08 10:42:15+05:30', 'Gate 01 • Main Arena'),
    ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'DYN-88913', 'Priya Sundaram', 'priya.s@vasavi.edu.in', '+91 97000 54321', 'Vasavi College', '1602-23-737-015', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', true, '2026-10-08 10:42:12+05:30', 'Gate 02 • North Turnstiles'),
    ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000013', 'DYN-88914', 'Karthik Reddy', 'karthik.r@vnrvjiet.in', '+91 99887 65432', 'VNR VJIET', '22071A0589', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', true, '2026-10-08 10:42:08+05:30', 'Gate 01 • Main Arena'),
    ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000014', 'DYN-88915', 'Sana Sheikh', 'sana.sheikh@osmania.ac.in', '+91 98112 34567', 'Osmania Univ', '1005-22-733-102', '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', true, '2026-10-08 10:41:59+05:30', 'Gate 02 • North Turnstiles'),
    ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000013', 'DYN-88916', 'Rahul Nambiar', 'f20220194@hyderabad.bits-pilani.ac.in', '+91 97234 56789', 'BITS Pilani Hyd', '2022A7PS0194H', 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', true, '2026-10-08 10:41:43+05:30', 'Hall 02 • Hackathon Annex'),
    ('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'DYN-88917', 'Divya Teja', 'cs22btech11005@iith.ac.in', '+91 99441 23456', 'IIT Hyderabad', 'CS22BTECH11005', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', false, NULL, NULL)
ON CONFLICT (event_id, pass_code) DO NOTHING;

-- 6. Check-Ins
INSERT INTO public.check_ins (event_id, participant_id, gate_name, status, latency_ms, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000031', 'Gate 01 • Main Arena', 'VALIDATED', 18, '2026-10-08 10:42:15+05:30'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000032', 'Gate 02 • North Turnstiles', 'VALIDATED', 22, '2026-10-08 10:42:12+05:30'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000033', 'Gate 01 • Main Arena', 'VALIDATED', 15, '2026-10-08 10:42:08+05:30'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000034', 'Gate 02 • North Turnstiles', 'VALIDATED', 19, '2026-10-08 10:41:59+05:30'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000035', 'Hall 02 • Hackathon Annex', 'VALIDATED', 14, '2026-10-08 10:41:43+05:30')
ON CONFLICT DO NOTHING;

-- 7. Sessions
INSERT INTO public.sessions (
    id,
    event_id,
    title,
    track,
    stage,
    speaker_name,
    speaker_title,
    speaker_org,
    speaker_avatar,
    start_time,
    end_time,
    capacity,
    enrolled,
    is_live_now
) VALUES
    ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000002', 'Keynote: Architectural Shifts in Autonomous Agent Networks', 'KEYNOTE', 'Main Arena (Hall 01)', 'Dr. Vikram Sethi', 'Principal Research Lead', 'NeuralScale AI Labs', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', '2026-10-08 10:00:00+05:30', '2026-10-08 11:15:00+05:30', 800, 780, true),
    ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000002', 'Hackathon Sprint: Micro-Chain Architecture on Edge Nodes', 'AI & AGENTS', 'Lab Stage B (Hall 02)', 'Ananya Rao', 'Distributed Systems Architect', 'Aether Protocol', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', '2026-10-08 11:30:00+05:30', '2026-10-08 13:00:00+05:30', 350, 342, false),
    ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000002', 'Founder Playbook: Scaling From College Fest to Multi-Tenant SaaS', 'FOUNDERS', 'Auditorium Delta', 'Rohan Singhal', 'Co-Founder & CEO', 'EventOS Systems', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', '2026-10-08 14:00:00+05:30', '2026-10-08 15:30:00+05:30', 400, 395, false)
ON CONFLICT DO NOTHING;

-- 8. Sample Certificates
INSERT INTO public.certificates (
    id,
    event_id,
    participant_id,
    certificate_number,
    credential_type,
    sha256_hash,
    issued_at
) VALUES
    ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000031', 'CERT-DYN-2026-88912', 'HONORS', '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', '2026-10-08 12:15:00+05:30'),
    ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000032', 'CERT-DYN-2026-88913', 'PARTICIPATION', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026-10-08 12:14:00+05:30')
ON CONFLICT (certificate_number) DO NOTHING;
