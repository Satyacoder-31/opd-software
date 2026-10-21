import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SyncResult {
  status: "success" | "partial" | "error" | "offline";
  pushed: number;
  pulled: number;
  failed: number;
  message?: string;
  lastSyncedAt?: Date | null;
}

/**
 * Checks if Supabase Cloud is reachable.
 */
export async function checkCloudConnectivity(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("Clinic").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Pushes pending local changes from the Outbox SyncQueue up to Supabase Cloud.
 */
export async function pushLocalToCloud(clinicId?: string): Promise<{ pushed: number; failed: number }> {
  let pushed = 0;
  let failed = 0;

  try {
    const supabase = createAdminClient();

    const pendingItems = await prisma.syncQueue.findMany({
      where: {
        ...(clinicId ? { clinicId } : {}),
        status: { in: ["pending", "failed"] },
        attempts: { lt: 5 },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    for (const item of pendingItems) {
      try {
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { status: "in_progress", attempts: { increment: 1 } },
        });

        const table = item.entityType;
        const payload = item.payload as Record<string, any>;

        if (item.action === "delete") {
          const { error } = await supabase.from(table).delete().eq("id", item.recordId);
          if (error) throw error;
        } else {
          // Upsert record into Cloud Supabase
          const { error } = await supabase.from(table).upsert(payload, { onConflict: "id" });
          if (error) throw error;
        }

        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: "synced",
            syncedAt: new Date(),
            lastError: null,
          },
        });
        pushed++;
      } catch (err: any) {
        failed++;
        console.error(`[SyncWorker] Failed to push ${item.entityType}:${item.recordId}:`, err);
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: "failed",
            lastError: err?.message || String(err),
          },
        });
      }
    }
  } catch (err) {
    console.error("[SyncWorker] Error in pushLocalToCloud:", err);
  }

  return { pushed, failed };
}

/**
 * Pulls recent online changes (e.g. appointments booked via patient portal) from Cloud Supabase.
 */
export async function pullCloudToLocal(clinicId?: string): Promise<{ pulled: number }> {
  let pulled = 0;

  try {
    const supabase = createAdminClient();

    // Check last pull timestamp
    const meta = await prisma.syncMetadata.findUnique({
      where: { key: `last_pull_${clinicId || "global"}` },
    });

    const lastPullDate = meta ? new Date(meta.value) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Pull Appointments created/updated in cloud since last pull
    let query = supabase
      .from("Appointment")
      .select("*")
      .gt("updatedAt", lastPullDate.toISOString());

    if (clinicId) {
      query = query.eq("clinicId", clinicId);
    }

    const { data: cloudAppointments, error } = await query;

    if (!error && cloudAppointments && cloudAppointments.length > 0) {
      for (const apt of cloudAppointments) {
        try {
          await prisma.appointment.upsert({
            where: { id: apt.id },
            create: apt,
            update: apt,
          });
          pulled++;
        } catch (upsertErr) {
          console.warn("[SyncWorker] Pull appointment upsert skipped:", upsertErr);
        }
      }
    }

    // Update metadata
    await prisma.syncMetadata.upsert({
      where: { key: `last_pull_${clinicId || "global"}` },
      create: { key: `last_pull_${clinicId || "global"}`, value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });
  } catch (err) {
    console.error("[SyncWorker] Error in pullCloudToLocal:", err);
  }

  return { pulled };
}

/**
 * Orchestrates a complete push + pull cycle.
 */
export async function runFullSync(clinicId?: string): Promise<SyncResult> {
  const isOnline = await checkCloudConnectivity();
  if (!isOnline) {
    const pendingCount = await prisma.syncQueue.count({
      where: {
        ...(clinicId ? { clinicId } : {}),
        status: { in: ["pending", "failed"] },
      },
    });

    return {
      status: "offline",
      pushed: 0,
      pulled: 0,
      failed: 0,
      message: `Offline mode active. ${pendingCount} local changes safely queued.`,
    };
  }

  const { pushed, failed } = await pushLocalToCloud(clinicId);
  const { pulled } = await pullCloudToLocal(clinicId);

  const lastSyncRecord = await prisma.syncQueue.findFirst({
    where: { status: "synced" },
    orderBy: { syncedAt: "desc" },
    select: { syncedAt: true },
  });

  return {
    status: failed > 0 ? "partial" : "success",
    pushed,
    pulled,
    failed,
    lastSyncedAt: lastSyncRecord?.syncedAt ?? new Date(),
    message: `Sync complete: ${pushed} uploaded, ${pulled} downloaded.`,
  };
}

/**
 * Gets the current status of the sync queue.
 */
export async function getSyncStatus(clinicId?: string) {
  const pendingCount = await prisma.syncQueue.count({
    where: {
      ...(clinicId ? { clinicId } : {}),
      status: { in: ["pending", "in_progress", "failed"] },
    },
  });

  const lastSynced = await prisma.syncQueue.findFirst({
    where: {
      ...(clinicId ? { clinicId } : {}),
      status: "synced",
    },
    orderBy: { syncedAt: "desc" },
    select: { syncedAt: true },
  });

  return {
    pendingCount,
    lastSyncedAt: lastSynced?.syncedAt ?? null,
  };
}
