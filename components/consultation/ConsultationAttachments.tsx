"use client";

import { useEffect, useState } from "react";
import {
  deleteConsultationAttachment,
  getAttachmentDownloadUrl,
  listConsultationAttachments,
  uploadConsultationAttachment,
} from "@/actions/attachments";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { usePendingAction } from "@/hooks/usePendingAction";

type AttachmentRow = Awaited<
  ReturnType<typeof listConsultationAttachments>
>[number];

type ConsultationAttachmentsProps = {
  consultationId: string;
  readOnly?: boolean;
};

export function ConsultationAttachments({
  consultationId,
  readOnly = false,
}: ConsultationAttachmentsProps) {
  const [items, setItems] = useState<AttachmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<"upload" | string>();

  async function refresh() {
    const next = await listConsultationAttachments(consultationId);
    setItems(next);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    void run(async () => {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      const base64 = btoa(binary);
      const result = await uploadConsultationAttachment({
        consultationId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      await refresh();
    }, "upload");
  }

  function handleDownload(id: string) {
    setError(null);
    void run(async () => {
      const result = await getAttachmentDownloadUrl(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    }, `dl-${id}`);
  }

  function handleDelete(id: string) {
    setError(null);
    void run(async () => {
      const result = await deleteConsultationAttachment(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      await refresh();
    }, `del-${id}`);
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {error && <Banner variant="error">{error}</Banner>}

      {!readOnly && (
        <div>
          <label className="mb-2 block text-sm font-medium text-ink">
            Upload report / image
          </label>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            disabled={isPending("upload")}
            onChange={(e) => {
              handleFileChange(e.target.files);
              e.target.value = "";
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            PDF or image up to 5 MB. Requires a Supabase bucket named
            consultation-attachments.
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                {item.fileName}{" "}
                <span className="text-muted-foreground">
                  · {(item.sizeBytes / 1024).toFixed(0)} KB ·{" "}
                  {item.uploadedBy.name}
                </span>
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={isPending(`dl-${item.id}`)}
                  onClick={() => handleDownload(item.id)}
                >
                  Open
                </Button>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={isPending(`del-${item.id}`)}
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
