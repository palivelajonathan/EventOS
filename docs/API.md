# EventOS API Catalog & Reference

This specification defines the production REST API endpoints for EventOS. All mutating endpoints enforce JSON payload formatting, authentication, and multi-tenant authorization guards.

---

## Standard Response Format & Error Codes

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Human-readable error description",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": "Optional diagnostic details"
}
```

### Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `400 Bad Request`: Missing or malformed parameters.
- `401 Unauthorized`: Token missing, expired, or invalid (`AUTH_REQUIRED`).
- `403 Forbidden`: Cross-tenant breach, insufficient role, or staff post mismatch (`CROSS_TENANT_ACCESS_DENIED`, `INSUFFICIENT_ROLE_PERMISSIONS`, `STAFF_EVENT_MISMATCH`).
- `404 Not Found`: Event, participant, or certificate record not found.
- `409 Conflict`: Attendee already checked in (`ALREADY CHECKED IN`).
- `503 Service Unavailable`: Production Supabase database connection unavailable.

---

## 1. Check-In & Gate Admission

### `POST /api/check-in`
Atomic turnstile attendee check-in.

- **Access**: `ORGANIZER`, `ADMIN`, `VOLUNTEER`, `GATE_STAFF`
- **Request Headers**:
  `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "eventId": "evt_dynamite2026",
  "passCode": "DYN-88912",
  "gateName": "Gate 01 • Main Arena",
  "scannedBy": "Scanner_1"
}
```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "SUCCESS",
      "participant": {
        "name": "Aryan Varma",
        "college": "CBIT Hyderabad",
        "tier": "VIP"
      },
      "gate": "Gate 01 • Main Arena",
      "checkInTime": "2026-10-05T18:00:00.000Z"
    }
    ```
  - `409 Conflict`:
    ```json
    {
      "status": "ALREADY CHECKED IN",
      "participant": { "name": "Aryan Varma" },
      "checkedInAt": "2026-10-05T17:45:12.000Z",
      "checkedInGate": "Gate 01 • Main Arena"
    }
    ```

---

## 2. Participant Management

### `GET /api/participants`
List and filter event participants.

- **Access**: `ORGANIZER`, `ADMIN`
- **Query Parameters**:
  - `eventId` (required): Event identifier
  - `page` (optional, default: 1)
  - `limit` (optional, default: 20)
  - `search` (optional): Filter by name, email, pass ID
  - `tier` (optional): Filter by ticket tier
  - `checkedIn` (optional, `true`/`false`)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "participants": [ ... ],
      "total": 1247,
      "page": 1,
      "totalPages": 63
    }
    ```

### `POST /api/participants/import`
Batch CSV participant import.

- **Access**: `ORGANIZER`, `ADMIN`
- **Request Body**:
```json
{
  "eventId": "evt_dynamite2026",
  "rows": [
    { "name": "Deepa Rao", "email": "deepa@vbit.ac.in", "college": "VBIT", "tier": "Delegate" }
  ]
}
```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "summary": { "totalProcessed": 1, "inserted": 1, "duplicatesSkipped": 0 },
      "errors": []
    }
    ```

---

## 3. Verifiable Credentials & Certificates

### `GET /api/certificates`
List certificates minted for an event.

- **Access**: `ORGANIZER`, `ADMIN`, `VOLUNTEER`
- **Query Parameters**: `eventId` (required)
- **Responses**:
  - `200 OK`: List of certificate records with hashes, participant names, and status.

### `GET /api/certificates/pdf/[certificateId]`
Dynamic server-side PDF stream generation.

- **Access**: Public (Verifiable credentials)
- **Response**: Binary stream (`Content-Type: application/pdf`), header `%PDF-1.7`, A4 landscape format.

---

## 4. AI Operations Copilot

### `POST /api/ai/copilot`
Query event statistics, gate loads, and attendance via Gemini 1.5 Flash.

- **Access**: `ORGANIZER`, `ADMIN`, `VOLUNTEER`
- **Request Body**:
```json
{
  "message": "Which college has the highest attendance?",
  "eventId": "evt_dynamite2026"
}
```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "reply": "Participant demographic analysis shows highest representation from...",
      "toolUsed": "getParticipantStats",
      "timestamp": "2026-10-05T18:00:00.000Z"
    }
    ```

---

## 5. Webhooks & Integrations

### `POST /api/webhooks/eventos`
Asynchronous ingestion endpoint for external systems (e.g. n8n, Slack).

- **Access**: Public / Webhook signature
- **Responses**:
  - `200 OK`: `{ "status": "received", "timestamp": "..." }`
