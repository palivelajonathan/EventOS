# EventOS Security Architecture & Threat Model

EventOS is engineered with a multi-layered security model designed for high-density physical event turnstiles and multi-tenant cloud operations.

---

## 1. Threat Model & Mitigations

| Threat | Vector | EventOS Mitigation |
| :--- | :--- | :--- |
| **Pass-Back / Double Entry** | Attendee screenshots QR and sends to a friend outside the gate. | Atomic database row lock (`FOR UPDATE`) on participant row + unique constraint in `check_ins`. Simultaneous scans reject the duplicate with `HTTP 409 (ALREADY CHECKED IN)`. |
| **Cross-Tenant Data Breach** | Organizer from Organization B tries querying Organization A's participants. | Multi-tenant middleware `authorizeEventAccess` verifies organization ownership before executing queries. Rejects with `HTTP 403 (CROSS_TENANT_ACCESS_DENIED)`. |
| **Staff Privilege Escalation** | Field volunteer attempts to export financial summaries or CSV rosters. | Role-Based Access Control (RBAC) verifies `allowedRoles`. Rejects with `HTTP 403 (INSUFFICIENT_ROLE_PERMISSIONS)`. |
| **Cross-Event Ingress Breach** | Staff assigned to Event X tries scanning attendees at Event Y. | Staff event scoping verifies `assignedEventId == eventId`. Rejects with `HTTP 403 (STAFF_EVENT_MISMATCH)`. |
| **Fake Certificate Generation** | Malicious attendee fabricates a certificate ID. | Public verification endpoint (`/verify/[certificateId]`) validates the certificate ID and SHA-256 integrity hash against the database registry before rendering or streaming PDF. |
| **AI Data Poisoning / Hallucination** | Prompt injection requesting confidential event financial details or fake info. | AI prompt uses strict system instructions and sandboxed tools with hard refusals for out-of-domain questions. |

---

## 2. Cryptographic Honesty & Verification Standards

In alignment with production engineering standards:
- **Integrity Verification**: EventOS uses standard **SHA-256** checksum hashes for participant pass codes and certificate verification.
- **Vaporware Claims Removed**: No marketing claims of "Zero-Knowledge SNARKs", "Ed25519 ring signatures", or "instant sub-15ms blockchain finality" are made. Verification is backed by honest, battle-tested PostgreSQL relational transactions and SHA-256 integrity hashes.

---

## 3. PII & Turnstile QR Payloads

Digital passes and volunteer scanners utilize a structured, privacy-conscious QR payload:
```
EVTOS:<EVENT_PREFIX>:<PASS_CODE>:<SHA256_HASH>
```
Example:
```
EVTOS:DYN:88912:9e84b238f:SHA256
```
- No attendee full names, phone numbers, or credit card details are serialized inside the QR code.
- Only the event code, pass identifier, and integrity hash are encoded.
- The volunteer scanner submits this token to the backend, which resolves the attendee record inside the secure server boundary.
