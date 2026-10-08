# EVENTOS — PROJECT AUDIT & ARCHITECTURE SPECIFICATION

**Date:** October 2026  
**Product:** EventOS — The Operating System for Modern Events  
**Design System:** Obsidian Kinetic (Derived from Stitch Production Archive)  
**Status:** Architecture Validated & Active Implementation

---

## 1. Executive Summary & Design System Source of Truth

EventOS is built to serve high-velocity modern events (colleges, hackathons, tech conferences, summits, and large-scale corporate festivals).

The design package located in `stitch_eventos_platform_design_system/stitch_eventos_platform_design_system/` represents the **absolute visual and ergonomic source of truth**. 
No generic dashboards or off-the-shelf templates are permitted. Every screen, animation, telemetry badge, and layout geometry follows the **Obsidian Kinetic** design language:
- **Palette**: Dark Obsidian control room tones (`#111319` surface, `#0c0e13` container lowest, `#191c21` cards, `#1d2025` elevated, `#282a30` high, `#33353b` highest).
- **Accents**: Neon Indigo primary (`#8083ff`, `#c0c1ff`), Electric Cyan telemetry (`#4cd7f6`), emerald live pulse (`#10B981`), amber standby (`#F59E0B`), and crimson alert (`#EF4444`).
- **Typography**: Dual-type hierarchy pairing `Geist` (clean high-contrast headlines & narrative body) with `JetBrains Mono` (real-time telemetry, tabular data, hex hashes, latency metrics, and gate codes).
- **Physicality & Tactility**: 12-column grid, chiseled inset highlights (`box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.08)`), micro-borders (`rgba(255,255,255,0.07)`), optical scanner reticles, and 3D holographic card depth.

---

## 2. Inventory of Stitch Screens & Route Mappings

| Screen Identifier | Stitch Source Folder | Next.js Route | Role & Key Interfaces |
|---|---|---|---|
| **Hero / Overview** | `eventos_cinematic_overview_hero` | `/` | Cinematic landing, orbital kernel visualization, 6-stage lifecycle pipeline, interactive live telemetry cockpit preview, institution trust ticker. |
| **Live Command Center** | `command_center_live_event_telemetry` | `/dashboard/[eventId]` | Real-time event telemetry console, 4 stat cards with SVG sparklines/donuts, live attendance flow velocity spline, gate throughput zone bars, live gate stream feed, AI intelligence dispatch widget. |
| **High-Velocity Gate Control** | `gate_control_high_velocity_qr_scanner` | `/dashboard/[eventId]/gate` | High-velocity check-in station, camera HUD with corner reticles & laser sweep animation, instant QR/NFC/Manual ID modes, real-time validation feedback, recent scan audit trail. |
| **Mobile Volunteer Scanner** | `mobile_volunteer_qr_scanner_high_velocity_gate_check_in` | `/volunteer/scan` | Mobile-first ultra-responsive QR scanner for gate volunteers, haptic/audio validation, single-tap camera switch, quick manual fallback search. |
| **Holographic Digital Passes** | `digital_passes_holographic_attendee_credential` | `/dashboard/[eventId]/passes` & `/pass/[passId]` | Interactive 3D holographic participant credentials, dynamic mouse-tracking tilt, iridescent security overlay, EMV chip, guilloche pattern, dynamic QR, batch issuance and pass ledger. |
| **AI Co-Pilot Synthesizer** | `ai_intelligence_eventos_co_pilot_synthesizer` | `/dashboard/[eventId]/ai` | Dual counter-rotating neural core spherical visualizer, operational intelligence queries, autonomous congestion mitigation recommendations, real-time context streaming. |
| **Attendee Schedule & Timeline** | `attendee_schedule_session_detail_dynamite_2026` | `/event/[slug]/schedule` | Multi-track conference timetable, day switcher, live session indicators, capacity indicators, speaker bios, and reservation drawer. |
| **Verifiable Credentials Gateway** | `certificates_verifiable_credentials_public_verification_gateway` | `/verify/[certificateId]` | Public cryptographic credential verification, SHA-256 integrity validation, digital signature verification, PDF rendering & download, verifiable QR. |
| **6-Stage Event Studio** | `event_studio_6_stage_event_creation_deployment_architecture` | `/org/[orgId]/events/new` | Full wizard: (1) Core Engine (2) Visual Identity (3) Access & Tiers (4) Schedule Matrix (5) Workforce & Volunteers (6) Deployment & Launch. |

---

## 3. Architecture & Data Model

### Multi-Tenant Model:
- **Organizations** (colleges, tech communities, professional conference organizers).
- **Events** (scoped to Organization, slugged, configured with timezones, capacities, and venues).
- **Tiers & Passes** (VIP, General, Speaker, Hackathon Participant, Volunteer, Sponsor).
- **Participants** (associated with email, phone, college/company, roll/emp ID, custom fields).
- **Check-in Ledger** (immutable logs with timestamp, gate identifier, volunteer ID, latency, device telemetry).
- **Sessions & Venues** (stage/hall allocations, speaker data, capacity tracking).
- **Certificates & Badges** (cryptographic hash, template mapping, verification slug).

### Supabase Integration Architecture:
- Realtime PostgreSQL channels for instantaneous live feed (`events`, `check_ins`, `gate_telemetry`).
- Row Level Security (RLS) ensuring strict isolation across organizations.
- Edge functions / server actions for idempotent sub-second check-in processing.
- Mock fallback store ensuring seamless execution and interactive preview when database credentials are in setup/demo mode (Dynamite 2026 pre-loaded data).

---

## 4. Implementation Phasing

1. **Foundations**: CSS Design tokens, typography, UI primitives, and shell layouts (`AppSidebar`, `AppHeader`, `AppShell`, `PublicNavbar`).
2. **Landing Hero**: 1:1 conversion of `eventos_cinematic_overview_hero` with interactive orbital visualization and live cockpit.
3. **Command Center**: Full live dashboard telemetry with reactive stat cards, SVG spline charts, gate throughput monitors, and real-time feeds.
4. **Gate Control & High Velocity Scanners**: Optical QR scanner HUD with reticles, audio feedback chimes, manual lookup, and offline tolerance.
5. **Digital Holographic Passes**: 3D perspective tilt credential card with guilloche patterns and live QR rendering.
6. **AI Co-Pilot**: Operational assistant with animated neural core visualizer and event dispatch recommendations.
7. **Event Studio & Management**: 6-stage wizard for new event creation, participant directory with CSV import/export, and session scheduler.
8. **Certificates & Verification Gateway**: Verifiable credential generation, cryptographic SHA-256 hashing, and public verification page.
