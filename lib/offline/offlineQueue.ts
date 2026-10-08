/**
 * EventOS Offline Resilient Scan Queue
 * Operates during flaky venue WiFi / bad cell connectivity
 * Stores scans locally and reconciles atomically when connectivity is restored
 */

export interface OfflineScanEntry {
  scanId: string;
  participantToken: string;
  deviceId: string;
  timestamp: string;
  gate: string;
  staff: string;
  status: "QUEUED" | "SYNCED" | "CONFLICT";
}

const STORAGE_PREFIX = "eventos_offline_scans_";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "dev_server";
  let deviceId = localStorage.getItem("eventos_device_id");
  if (!deviceId) {
    deviceId = `dev_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    localStorage.setItem("eventos_device_id", deviceId);
  }
  return deviceId;
}

export function enqueueOfflineScan(
  eventId: string,
  participantToken: string,
  gate: string = "Gate 01 • Main Arena",
  staff: string = "GATE_STAFF"
): OfflineScanEntry {
  const deviceId = getOrCreateDeviceId();
  const scanEntry: OfflineScanEntry = {
    scanId: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    participantToken,
    deviceId,
    timestamp: new Date().toISOString(),
    gate,
    staff,
    status: "QUEUED",
  };

  if (typeof window !== "undefined") {
    const key = `${STORAGE_PREFIX}${eventId}`;
    const existing: OfflineScanEntry[] = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(scanEntry);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  return scanEntry;
}

export function getPendingOfflineScans(eventId: string): OfflineScanEntry[] {
  if (typeof window === "undefined") return [];
  const key = `${STORAGE_PREFIX}${eventId}`;
  const existing: OfflineScanEntry[] = JSON.parse(localStorage.getItem(key) || "[]");
  return existing.filter((s) => s.status === "QUEUED");
}

export function clearSyncedOfflineScans(eventId: string, scanIds: string[]): void {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_PREFIX}${eventId}`;
  const existing: OfflineScanEntry[] = JSON.parse(localStorage.getItem(key) || "[]");
  const filtered = existing.filter((s) => !scanIds.includes(s.scanId));
  localStorage.setItem(key, JSON.stringify(filtered));
}

export async function reconcileOfflineQueue(
  eventId: string,
  authHeaders: Record<string, string>
): Promise<{ success: boolean; syncedCount: number; conflictCount: number; message: string }> {
  const pending = getPendingOfflineScans(eventId);
  if (pending.length === 0) {
    return { success: true, syncedCount: 0, conflictCount: 0, message: "Queue is empty." };
  }

  try {
    const res = await fetch("/api/check-in/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        eventId,
        scans: pending,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const syncedIds = pending.map((p) => p.scanId);
      clearSyncedOfflineScans(eventId, syncedIds);
      return {
        success: true,
        syncedCount: data.syncedCount || 0,
        conflictCount: data.conflictCount || 0,
        message: data.message || `Successfully synced ${data.syncedCount} scans.`,
      };
    } else {
      return {
        success: false,
        syncedCount: 0,
        conflictCount: 0,
        message: data.message || "Failed to reconcile with server.",
      };
    }
  } catch (err: any) {
    return {
      success: false,
      syncedCount: 0,
      conflictCount: 0,
      message: "Offline sync failed: " + err.message,
    };
  }
}
