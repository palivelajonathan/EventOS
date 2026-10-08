# EventOS Authentication & Authorization Architecture

## 1. Overview

EventOS implements a unified, defense-in-depth authentication and Role-Based Access Control (RBAC) model across both browser UI sessions and backend API endpoints.

---

## 2. Authentication Schemes

EventOS supports three authentication modalities:

1. **Supabase Cookie Sessions**: Standard browser sessions created via Supabase Auth (`sb-access-token`, `sb-refresh-token`). Verified server-side via `@supabase/ssr` / `@supabase/supabase-js`.
2. **Bearer JWTs**: Standard `Authorization: Bearer <jwt>` HTTP header passed by external clients and mobile scanners.
3. **Deterministic Test Tokens**: Format `Bearer test-token:<ROLE>:<ORG_ID>:<USER_ID>[:<ASSIGNED_EVENT_ID>]` enabled for CI/CD, integration testing, and local automated auditing.

---

## 3. RBAC Roles & Capabilities Matrix

| Capability | ORGANIZER | ADMIN | VOLUNTEER / GATE_STAFF | PARTICIPANT | ANONYMOUS |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Organization Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create / Edit Events | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export / Import Full Attendee CSV | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Financial & Pass Sales Data | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue / Mint Certificates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Use AI Operations Copilot | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ingress Turnstile Check-In | ✅ | ✅ | ✅ (Scoped to event) | ❌ | ❌ |
| View Personal Digital Pass | ❌ | ❌ | ❌ | ✅ (Self only) | ❌ |
| Verify Public Certificate URL | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Multi-Tenant Server Guard (`authorizeEventAccess`)

Every protected API route invokes the centralized authorization helper:
`authorizeEventAccess(req: NextRequest, eventId: string, allowedRoles: UserRole[])`
in `lib/auth/serverAuth.ts`.

### Enforcement Steps
1. **Authentication Check**: Verifies token presence and validity. Rejects with `HTTP 401 (AUTH_REQUIRED)` if absent.
2. **Event Existence**: Verifies that `eventId` exists in the system. Rejects with `HTTP 404 (EVENT_NOT_FOUND)`.
3. **Tenant Boundary Check**: Verifies that the authenticated user's `organizationId` matches the event's `organizationId`. Rejects cross-tenant attempts with `HTTP 403 (CROSS_TENANT_ACCESS_DENIED)`.
4. **Role Check**: Verifies that the user's role is in the endpoint's `allowedRoles`. Rejects with `HTTP 403 (INSUFFICIENT_ROLE_PERMISSIONS)`.
5. **Staff Scoping**: For `VOLUNTEER` or `GATE_STAFF`, verifies that `assignedEventId` matches the target `eventId`. Rejects cross-event scanning attempts with `HTTP 403 (STAFF_EVENT_MISMATCH)`.

---

## 5. Deliberate Attack Verification Suite

The test suite systematically probes these boundary attacks:

```
[ATTACK] Anonymous -> GET /api/participants
[RESULT] HTTP 401 Unauthorized (AUTH_REQUIRED) - PASSED

[ATTACK] Participant -> GET /api/participants
[RESULT] HTTP 403 Forbidden (INSUFFICIENT_ROLE_PERMISSIONS) - PASSED

[ATTACK] Volunteer -> POST /api/participants/import
[RESULT] HTTP 403 Forbidden (INSUFFICIENT_ROLE_PERMISSIONS) - PASSED

[ATTACK] Org B Organizer -> GET /api/participants?eventId=org_a_event
[RESULT] HTTP 403 Forbidden (CROSS_TENANT_ACCESS_DENIED) - PASSED

[ATTACK] Volunteer (Event A) -> POST /api/check-in at Event B
[RESULT] HTTP 403 Forbidden (STAFF_EVENT_MISMATCH) - PASSED
```
