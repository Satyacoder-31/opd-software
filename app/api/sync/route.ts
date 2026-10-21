import { NextResponse } from "next/server";
import { getSyncStatus, runFullSync, checkCloudConnectivity } from "@/lib/sync/sync-worker";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId") || undefined;

    const isOnline = await checkCloudConnectivity();
    const status = await getSyncStatus(clinicId);

    return NextResponse.json({
      success: true,
      isOnline,
      pendingCount: status.pendingCount,
      lastSyncedAt: status.lastSyncedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch sync status",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const clinicId = body.clinicId || undefined;

    const result = await runFullSync(clinicId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Sync execution failed",
      },
      { status: 500 }
    );
  }
}
