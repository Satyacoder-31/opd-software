"use client";

import { useEffect, useState } from "react";
import {
  faDownload,
  faPaperclip,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  deleteConsultationAttachment,
  getAttachmentDownloadUrl,
  listConsultationAttachments,
  uploadConsultationAttachment,
} from "@/actions/attachments";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
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

  const list =
    items.length === 0 ? null : (
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
                <Icon icon={faDownload} data-icon="inline-start" />
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
                  <Icon icon={faTrash} data-icon="inline-start" />
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );

  // Visit summary: hide the whole attachments block when there is nothing to show.
  if (readOnly) {
    if (items.length === 0) {
      return error ? (
        <div className="px-4 py-4">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null;
    }

    return (
      <Card title="Attachments" flush className="border-t border-border">
        <div className="space-y-4 px-4 py-4">
          {error && <Banner variant="error">{error}</Banner>}
          {list}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {error && <Banner variant="error">{error}</Banner>}

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

      {items.length === 0 ? (
        <EmptyState
          icon={faPaperclip}
          title="No attachments yet"
          description="Upload a PDF or image to keep with this visit."
          compact
        />
      ) : (
        list
      )}
    </div>
  );
}
