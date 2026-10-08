export type UserRole = "ORGANIZER" | "ADMIN" | "VOLUNTEER" | "GATE_STAFF" | "PARTICIPANT";
export type Role = UserRole;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  assignedGate?: string;
  avatarUrl?: string;
}

export const DEMO_USERS: Record<UserRole, AuthUser> = {
  ORGANIZER: {
    id: "usr_org_01",
    email: "organizer@eventos.sh",
    name: "Vikramaditya (Lead Organizer)",
    role: "ORGANIZER",
    orgId: "org_dynamite",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  ADMIN: {
    id: "usr_admin_01",
    email: "admin@eventos.sh",
    name: "Platform Systems Architect",
    role: "ADMIN",
    orgId: "org_dynamite",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
  VOLUNTEER: {
    id: "usr_vol_01",
    email: "volunteer@eventos.sh",
    name: "Siddharth K. (Field Volunteer)",
    role: "VOLUNTEER",
    orgId: "org_dynamite",
    assignedGate: "Gate 01 • Main Arena",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  GATE_STAFF: {
    id: "usr_gate_01",
    email: "gate@eventos.sh",
    name: "Ananya Nair (Turnstile Lead)",
    role: "GATE_STAFF",
    orgId: "org_dynamite",
    assignedGate: "Gate 02 • North Turnstiles",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
  },
  PARTICIPANT: {
    id: "usr_part_01",
    email: "aryan.varma@cbit.ac.in",
    name: "Aryan Varma",
    role: "PARTICIPANT",
    orgId: "org_dynamite",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
};
