export interface Participant {
  id: string;
  passId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  tier: "VIP" | "ALL-ACCESS" | "HACKER" | "DELEGATE" | "STUDENT";
  tierPrice: number;
  rollNumber?: string;
  qrPayload: string;
  sha256Hash: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkInGate?: string;
  avatarUrl?: string;
  externalRegistrationId?: string;
  rawPhone?: string;
  emailStatus?: "PENDING" | "QUEUED" | "SENT" | "FAILED";
  whatsappStatus?: "PENDING" | "QUEUED" | "SENT" | "FAILED";
  emailSentAt?: string;
  whatsappSentAt?: string;
  passUrl?: string;
}

export interface GateThroughput {
  id: string;
  name: string;
  category: "PRIMARY ENTRANCE" | "SECONDARY ACCESS" | "RESTRICTED PASS";
  loadPercent: number;
  currentCount: number;
  capacityLimit: number;
  velocityPerMin: number;
  status: "OPTIMAL" | "STANDBY" | "NEAR_CAPACITY";
}

export interface CheckInLog {
  id: string;
  timestamp: string;
  gate: string;
  passId: string;
  participantName: string;
  college: string;
  status: "VALIDATED" | "DENIED" | "FLAGGED";
  latencyMs: number;
}

export interface Session {
  id: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  title: string;
  track: "KEYNOTE" | "AI & AGENTS" | "WEB3" | "FOUNDERS" | "DESIGN";
  stage: string;
  speaker: {
    name: string;
    title: string;
    avatar: string;
    org: string;
  };
  capacity: number;
  enrolled: number;
  isLiveNow?: boolean;
}

export interface EventData {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  organization: string;
  venue: string;
  city: string;
  date: string;
  status: "LIVE" | "UPCOMING" | "CONCLUDED";
  metrics: {
    registered: number;
    capacity: number;
    checkedIn: number;
    attendanceRatio: number;
    targetRatio: number;
    certificatesMinted: number;
    peakScansPerSec: number;
    avgLatencyMs: number;
  };
  collegeBreakdown: Array<{ college: string; count: number; percentage: number }>;
  gates: GateThroughput[];
  recentCheckins: CheckInLog[];
  sessions: Session[];
}

export const DYNAMITE_2026: EventData = {
  id: "evt_dynamite2026",
  slug: "dynamite-2026",
  name: "DYNAMITE 2026",
  tagline: "Hyderabad's Multi-College Student Experience",
  organization: "Dynamite Events Collective",
  venue: "Begumpet Exhibition Concourse",
  city: "Hyderabad",
  date: "October 8, 2026",
  status: "LIVE",
  metrics: {
    registered: 1247,
    capacity: 1500,
    checkedIn: 1086,
    attendanceRatio: 0.871,
    targetRatio: 0.85,
    certificatesMinted: 842,
    peakScansPerSec: 4.8,
    avgLatencyMs: 12,
  },
  collegeBreakdown: [
    { college: "CBIT Hyderabad", count: 298, percentage: 24 },
    { college: "VNR VJIET", count: 224, percentage: 18 },
    { college: "Osmania Univ", count: 187, percentage: 15 },
    { college: "BITS Pilani Hyd", count: 174, percentage: 14 },
    { college: "Vasavi College", count: 150, percentage: 12 },
    { college: "Others (14 Colls)", count: 214, percentage: 17 },
  ],
  gates: [
    {
      id: "gate-01",
      name: "Gate 01 • Main Arena",
      category: "PRIMARY ENTRANCE",
      loadPercent: 94,
      currentCount: 420,
      capacityLimit: 450,
      velocityPerMin: 22,
      status: "NEAR_CAPACITY",
    },
    {
      id: "gate-02",
      name: "Gate 02 • North Turnstiles",
      category: "SECONDARY ACCESS",
      loadPercent: 78,
      currentCount: 390,
      capacityLimit: 500,
      velocityPerMin: 14,
      status: "OPTIMAL",
    },
    {
      id: "hall-02",
      name: "Hall 02 • Hackathon Annex",
      category: "RESTRICTED PASS",
      loadPercent: 91,
      currentCount: 276,
      capacityLimit: 300,
      velocityPerMin: 8,
      status: "NEAR_CAPACITY",
    },
  ],
  recentCheckins: [
    {
      id: "chk_01",
      timestamp: "10:42:15 AM",
      gate: "Gate 01",
      passId: "DYN-88912",
      participantName: "Aryan Varma",
      college: "CBIT Hyderabad",
      status: "VALIDATED",
      latencyMs: 180,
    },
    {
      id: "chk_02",
      timestamp: "10:42:12 AM",
      gate: "Gate 02",
      passId: "DYN-88913",
      participantName: "Priya Sundaram",
      college: "Vasavi Engg",
      status: "VALIDATED",
      latencyMs: 220,
    },
    {
      id: "chk_03",
      timestamp: "10:42:08 AM",
      gate: "Gate 01",
      passId: "DYN-88914",
      participantName: "Karthik Reddy",
      college: "VNR VJIET",
      status: "VALIDATED",
      latencyMs: 150,
    },
    {
      id: "chk_04",
      timestamp: "10:41:59 AM",
      gate: "Gate 02",
      passId: "DYN-88915",
      participantName: "Sana Sheikh",
      college: "Osmania Univ",
      status: "VALIDATED",
      latencyMs: 190,
    },
    {
      id: "chk_05",
      timestamp: "10:41:43 AM",
      gate: "Hall 02",
      passId: "DYN-88916",
      participantName: "Rahul Nambiar",
      college: "BITS Pilani Hyd",
      status: "VALIDATED",
      latencyMs: 140,
    },
    {
      id: "chk_06",
      timestamp: "10:41:30 AM",
      gate: "Gate 01",
      passId: "DYN-88917",
      participantName: "Divya Teja",
      college: "IIT Hyderabad",
      status: "VALIDATED",
      latencyMs: 165,
    },
  ],
  sessions: [
    {
      id: "sess_01",
      timeSlot: "10:00 AM – 11:15 AM",
      startTime: "10:00 AM",
      endTime: "11:15 AM",
      title: "Keynote: Architectural Shifts in Autonomous Agent Networks",
      track: "KEYNOTE",
      stage: "Main Arena (Hall 01)",
      speaker: {
        name: "Dr. Vikram Sethi",
        title: "Principal Research Lead",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        org: "NeuralScale AI Labs",
      },
      capacity: 800,
      enrolled: 780,
      isLiveNow: true,
    },
    {
      id: "sess_02",
      timeSlot: "11:30 AM – 01:00 PM",
      startTime: "11:30 AM",
      endTime: "01:00 PM",
      title: "Hackathon Sprint: Zero-Knowledge Verification on Micro-Chains",
      track: "AI & AGENTS",
      stage: "Lab Stage B (Hall 02)",
      speaker: {
        name: "Ananya Rao",
        title: "Cryptographic Engineer",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
        org: "Aether Protocol",
      },
      capacity: 350,
      enrolled: 342,
    },
    {
      id: "sess_03",
      timeSlot: "02:00 PM – 03:30 PM",
      startTime: "02:00 PM",
      endTime: "03:30 PM",
      title: "Founder Playbook: Scaling From College Fest to Multi-Tenant SaaS",
      track: "FOUNDERS",
      stage: "Auditorium Delta",
      speaker: {
        name: "Rohan Singhal",
        title: "Co-Founder & CEO",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        org: "EventOS Systems",
      },
      capacity: 400,
      enrolled: 395,
    },
  ],
};

export const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "p_001",
    passId: "DYN-88912",
    name: "Aryan Varma",
    email: "aryan.varma@cbit.ac.in",
    phone: "+91 98490 12345",
    college: "CBIT Hyderabad",
    tier: "VIP",
    tierPrice: 1299,
    rollNumber: "1601-22-733-042",
    qrPayload: "EVTOS:DYN:88912:ARYAN_VARMA:CBIT:VIP:SHA256:7f83b165",
    sha256Hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    checkedIn: true,
    checkInTime: "10:42:15 AM",
    checkInGate: "Gate 01",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_002",
    passId: "DYN-88913",
    name: "Priya Sundaram",
    email: "priya.s@vasavi.edu.in",
    phone: "+91 97000 54321",
    college: "Vasavi College",
    tier: "ALL-ACCESS",
    tierPrice: 649,
    rollNumber: "1602-23-737-015",
    qrPayload: "EVTOS:DYN:88913:PRIYA_SUNDARAM:VASAVI:ALLACCESS:SHA256:e3b0c442",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    checkedIn: true,
    checkInTime: "10:42:12 AM",
    checkInGate: "Gate 02",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_003",
    passId: "DYN-88914",
    name: "Karthik Reddy",
    email: "karthik.r@vnrvjiet.in",
    phone: "+91 99887 65432",
    college: "VNR VJIET",
    tier: "HACKER",
    tierPrice: 499,
    rollNumber: "22071A0589",
    qrPayload: "EVTOS:DYN:88914:KARTHIK_REDDY:VNR:HACKER:SHA256:ca978112",
    sha256Hash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    checkedIn: true,
    checkInTime: "10:42:08 AM",
    checkInGate: "Gate 01",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_004",
    passId: "DYN-88915",
    name: "Sana Sheikh",
    email: "sana.sheikh@osmania.ac.in",
    phone: "+91 98112 34567",
    college: "Osmania Univ",
    tier: "DELEGATE",
    tierPrice: 649,
    rollNumber: "1005-22-733-102",
    qrPayload: "EVTOS:DYN:88915:SANA_SHEIKH:OU:DELEGATE:SHA256:4b227777",
    sha256Hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    checkedIn: true,
    checkInTime: "10:41:59 AM",
    checkInGate: "Gate 02",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_005",
    passId: "DYN-88916",
    name: "Rahul Nambiar",
    email: "f20220194@hyderabad.bits-pilani.ac.in",
    phone: "+91 97234 56789",
    college: "BITS Pilani Hyd",
    tier: "HACKER",
    tierPrice: 499,
    rollNumber: "2022A7PS0194H",
    qrPayload: "EVTOS:DYN:88916:RAHUL_NAMBIAR:BITS:HACKER:SHA256:ef2d127de",
    sha256Hash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    checkedIn: true,
    checkInTime: "10:41:43 AM",
    checkInGate: "Hall 02",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_006",
    passId: "DYN-88917",
    name: "Divya Teja",
    email: "cs22btech11005@iith.ac.in",
    phone: "+91 99441 23456",
    college: "IIT Hyderabad",
    tier: "ALL-ACCESS",
    tierPrice: 649,
    rollNumber: "CS22BTECH11005",
    qrPayload: "EVTOS:DYN:88917:DIVYA_TEJA:IITH:ALLACCESS:SHA256:5994471a",
    sha256Hash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5",
    checkedIn: false,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
];
