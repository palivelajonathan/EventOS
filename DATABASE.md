# EventOS Database Architecture & Schema Specification

**EventOS** uses PostgreSQL 15+ hosted on Supabase as its primary relational data store.

---

## 1. Schema Diagram & Relationships

```
organizations (id, name, slug)
  │ 1:N
  ├── organization_members (org_id, user_id, role)
  └── events (id, org_id, name, slug, start_date, end_date, venue)
        │ 1:N
        ├── tiers (id, event_id, name, price, capacity)
        ├── sessions (id, event_id, title, stage, time_slot, speaker_name)
        ├── gates (id, event_id, name, status, capacity_limit)
        ├── participants (id, event_id, tier_id, name, email, pass_code, qr_hash, checked_in)
        │     │ 1:1
        │     ├── check_ins (id, event_id, participant_id, gate_id, scanned_by, check_in_time)
        │     └── certificates (id, event_id, participant_id, certificate_number, hash, pdf_url)
        └── webhooks (id, event_id, target_url, secret, events, active)
```

---

## 2. Table Catalog

### `organizations`
Multi-tenant root container.
- `id` (UUID/TEXT, PK)
- `name` (TEXT)
- `slug` (TEXT, UNIQUE)
- `created_at` (TIMESTAMPTZ)

### `organization_members`
RBAC association mapping users to organizations.
- `id` (UUID/TEXT, PK)
- `organization_id` (FK -> `organizations.id`)
- `user_id` (TEXT / Supabase `auth.users.id`)
- `role` (TEXT: `ORGANIZER`, `ADMIN`, `VOLUNTEER`, `GATE_STAFF`)
- `assigned_event_id` (FK -> `events.id`, NULLable, restricts staff to single event)

### `events`
Event profile and operational settings.
- `id` (TEXT, PK, e.g. `evt_dynamite2026`)
- `organization_id` (FK -> `organizations.id`)
- `name` (TEXT)
- `slug` (TEXT, UNIQUE)
- `venue` (TEXT)
- `city` (TEXT)
- `start_date` / `end_date` (TIMESTAMPTZ)
- `capacity` (INTEGER)
- `status` (`DRAFT`, `PUBLISHED`, `LIVE`, `CONCLUDED`)

### `participants`
Attendee ledger for registrations and digital passes.
- `id` (TEXT, PK)
- `event_id` (FK -> `events.id`)
- `tier_id` (FK -> `tiers.id`)
- `name` (TEXT)
- `email` (TEXT)
- `college` (TEXT)
- `pass_code` (TEXT, UNIQUE within event)
- `qr_hash` (TEXT, SHA-256 integrity hash)
- `checked_in` (BOOLEAN, default `false`)
- `check_in_time` (TIMESTAMPTZ, NULLable)
- `check_in_gate` (TEXT, NULLable)

### `check_ins`
Immutable audit log of all turnstile admissions.
- `id` (TEXT, PK)
- `event_id` (FK -> `events.id`)
- `participant_id` (FK -> `participants.id`)
- `gate_id` (TEXT)
- `gate_name` (TEXT)
- `scanned_by` (TEXT)
- `check_in_time` (TIMESTAMPTZ)
- **Constraint**: `UNIQUE (event_id, participant_id)` (Anti-passback guarantee)

### `certificates`
Digitally verified credential registry.
- `id` (TEXT, PK, e.g. `CERT-DYN-2026-88912`)
- `event_id` (FK -> `events.id`)
- `participant_id` (FK -> `participants.id`)
- `verification_hash` (TEXT, SHA-256 checksum)
- `issue_date` (DATE)
- `status` (`PENDING`, `MINTED`, `REVOKED`)

---

## 3. Atomic Turnstile Concurrency & Race-Condition Defense

To guarantee that two simultaneous scans of the same badge can **never** result in two admissions, check-ins execute within an atomic PostgreSQL transaction using row-level locking:

```sql
CREATE OR REPLACE FUNCTION process_check_in(
  p_event_id TEXT,
  p_pass_code TEXT,
  p_gate_name TEXT,
  p_scanned_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_part RECORD;
  v_check_in_id TEXT;
BEGIN
  -- 1. Acquire exclusive Row-Level Lock on participant
  SELECT * INTO v_part
  FROM participants
  WHERE event_id = p_event_id
    AND (pass_code = p_pass_code OR qr_hash = p_pass_code)
  FOR UPDATE;

  -- 2. Verify participant existence
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'PARTICIPANT_NOT_FOUND', 'message', 'Pass code not found.');
  END IF;

  -- 3. Check for previous admission
  IF v_part.checked_in THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_CHECKED_IN',
      'message', 'Participant is already admitted.',
      'checkedInAt', v_part.check_in_time,
      'checkedInGate', v_part.check_in_gate
    );
  END IF;

  -- 4. Mark checked_in
  UPDATE participants
  SET checked_in = true,
      check_in_time = NOW(),
      check_in_gate = p_gate_name
  WHERE id = v_part.id;

  -- 5. Record immutable check-in ledger entry
  v_check_in_id := 'chk_' || gen_random_uuid();
  INSERT INTO check_ins (id, event_id, participant_id, gate_name, scanned_by, check_in_time)
  VALUES (v_check_in_id, p_event_id, v_part.id, p_gate_name, p_scanned_by, NOW());

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'checkInId', v_check_in_id,
    'participant', jsonb_build_object('name', v_part.name, 'tier', v_part.tier_id, 'college', v_part.college)
  );
END;
$$;
```

---

## 4. Performance Indexes

```sql
CREATE INDEX idx_participants_event_lookup ON participants(event_id, pass_code);
CREATE INDEX idx_participants_event_email ON participants(event_id, email);
CREATE INDEX idx_participants_checked_in ON participants(event_id, checked_in);
CREATE INDEX idx_check_ins_event_time ON check_ins(event_id, check_in_time DESC);
CREATE INDEX idx_certificates_lookup ON certificates(id, event_id);
```

---

## 5. Supabase Realtime Publication

Realtime change data capture is configured to stream all turnstile scans directly to connected organizer dashboards:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE check_ins;
```
