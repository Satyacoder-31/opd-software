import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type SupportedEntityType =
  | "Patient"
  | "Appointment"
  | "Consultation"
  | "Prescription"
  | "Invoice"
  | "InvoicePayment"
  | "StockMovement"
  | "DrugCatalogItem";

export type OutboxAction = "create" | "update" | "delete";

interface QueueSyncItemParams {
  clinicId: string;
  entityType: SupportedEntityType;
  recordId: string;
  action: OutboxAction;
  payload: Record<string, unknown> | Prisma.InputJsonValue;
}

/**
 * Enqueues a change to the local SyncQueue.
 * Accepts an optional transaction client so queuing can be atomic with the database write.
 */
export async function queueSyncItem(
  params: QueueSyncItemParams,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;

  try {
    return await client.syncQueue.create({
      data: {
        clinicId: params.clinicId,
        entityType: params.entityType,
        recordId: params.recordId,
        action: params.action,
        payload: params.payload as Prisma.InputJsonValue,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("[SyncOutbox] Failed to enqueue sync item:", error);
    // Don't fail the entire local user interaction if sync-queue fails
    return null;
  }
}
