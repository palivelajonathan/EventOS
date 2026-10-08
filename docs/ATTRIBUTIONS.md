# Open-Source Architectural Attributions & References

EventOS incorporates battle-tested operational patterns inspired by the global open-source event engineering ecosystem:

### 1. Pretix (pretix.eu)
- **Architecture Reference**: Atomic check-in state transitions (`valid`, `already_redeemed`, `blocked`, `invalid`).
- **Offline Protocol**: Cryptographic timestamping, local queue nonce verification, and transactional reconciliation.
- **License Compliance**: Independent clean-room implementation of operational schemas in PostgreSQL / TypeScript.

### 2. Eventyay / FOSSASIA
- **Architecture Reference**: Real-time admission telemetry, multi-gate ingress balancing, and audio-frequency feedback signals (high chime for valid entry, low warning buzz for duplicate/unauthorized ingress).
- **License Compliance**: Clean-room Next.js / TypeScript integration.

### 3. OpenPass
- **Architecture Reference**: Zero-PII QR code payload design. Avoidance of cleartext attendee personal identifiable information inside optical barcodes.
- **Payload Format**: `EVENTOS:<event_id>:<pass_id>:<sha256_hash>` with backend verification.

### 4. Admitto
- **Architecture Reference**: Column-mapping preview heuristics and resilient attendee batch ingestion with fuzzy header resolution across diverse registrar exports.

*EventOS maintains full architectural independence and complies with all software licensing requirements.*
