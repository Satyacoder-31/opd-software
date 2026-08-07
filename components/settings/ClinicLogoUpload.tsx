"use client";

import { useId, useRef, useState } from "react";
import {
  faArrowUpFromBracket,
  faImage,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { clearClinicLogo, uploadClinicLogo } from "@/actions/onboarding";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const HINT = "PNG, JPEG, WebP, or SVG · max 2 MB";

type ClinicLogoUploadProps = {
  value: string;
  onChange: (logoUrl: string) => void;
  onMessage?: (message: { type: "success" | "error"; text: string } | null) => void;
  /** Persist current logo URL with parent form submits (clinic profile). */
  includeHiddenField?: boolean;
  disabled?: boolean;
  className?: string;
};

export function ClinicLogoUpload({
  value,
  onChange,
  onMessage,
  includeHiddenField = false,
  disabled = false,
  className,
}: ClinicLogoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const busy = uploading || clearing || disabled;

  async function uploadFile(file: File | null) {
    if (!file || busy) return;
    onMessage?.(null);
    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      const upload = await uploadClinicLogo({
        fileName: file.name,
        mimeType: file.type || "image/png",
        base64,
      });
      if (!upload.success) {
        onMessage?.({ type: "error", text: upload.error });
        return;
      }
      onChange(upload.data.logoUrl);
      onMessage?.({ type: "success", text: "Logo uploaded." });
    } catch {
      onMessage?.({
        type: "error",
        text: "Could not read that image file.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    if (busy) return;
    onMessage?.(null);
    setClearing(true);
    try {
      const result = await clearClinicLogo();
      if (!result.success) {
        onMessage?.({ type: "error", text: result.error });
        return;
      }
      onChange("");
      onMessage?.({ type: "success", text: "Logo removed." });
    } finally {
      setClearing(false);
    }
  }

  function openPicker() {
    if (busy) return;
    inputRef.current?.click();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          Clinic logo
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        </label>
        {value ? (
          <span className="text-xs text-muted-foreground">Shown on prescriptions & listing</span>
        ) : null}
      </div>

      {includeHiddenField ? (
        <input type="hidden" name="logoUrl" value={value} />
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          void uploadFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/60 p-3 sm:p-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL */}
            <img
              src={value}
              alt="Clinic logo preview"
              className="size-full object-contain p-1.5"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-sm font-medium text-ink">Logo ready</p>
            <p className="text-xs text-muted-foreground">{HINT}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploading}
                disabled={busy}
                onClick={openPicker}
              >
                <Icon icon={faArrowUpFromBracket} data-icon="inline-start" />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={clearing}
                disabled={busy}
                onClick={() => void removeLogo()}
              >
                <Icon icon={faTrash} data-icon="inline-start" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={openPicker}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!busy) setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!busy) setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            const file = e.dataTransfer.files?.[0] ?? null;
            void uploadFile(file);
          }}
          className={cn(
            "group flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-[border-color,background-color,box-shadow] duration-150",
            "border-border bg-surface/40 hover:border-primary/50 hover:bg-primary/4",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            "disabled:pointer-events-none disabled:opacity-60",
            dragging && "border-primary bg-primary/6 shadow-[inset_0_0_0_1px_var(--color-primary)]",
            uploading && "border-primary/40",
          )}
        >
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-150",
              "group-hover:scale-105",
              uploading && "animate-pulse",
            )}
          >
            <Icon
              icon={uploading ? faArrowUpFromBracket : faImage}
              className="size-5"
              aria-hidden
            />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">
              {uploading ? "Uploading logo…" : "Drop an image here, or browse"}
            </span>
            <span className="text-xs text-muted-foreground">{HINT}</span>
          </span>
        </button>
      )}
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
