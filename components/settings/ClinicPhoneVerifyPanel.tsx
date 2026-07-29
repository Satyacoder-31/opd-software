"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  requestClinicPhoneOtp,
  verifyClinicPhoneOtp,
} from "@/actions/onboarding-medium";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/** Compact phone OTP verify block for settings / onboarding reuse. */
export function ClinicPhoneVerifyPanel({
  phone,
  verifiedAt,
}: {
  phone: string;
  verifiedAt: Date | string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (verifiedAt) {
    return <Banner variant="success">Clinic phone verified ({phone}).</Banner>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Verify <span className="font-medium text-ink">{phone}</span> with OTP
        before listing publicly.
      </p>
      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Banner>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          loading={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await requestClinicPhoneOtp();
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setHint(result.data.dryRunHint ?? "OTP sent.");
              setMessage({ type: "success", text: "OTP sent." });
            });
          }}
        >
          Send OTP
        </Button>
        <Input
          label="OTP"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          inputMode="numeric"
          className="max-w-[8rem]"
        />
        <Button
          type="button"
          loading={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("code", code);
            startTransition(async () => {
              const result = await verifyClinicPhoneOtp(fd);
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setMessage({ type: "success", text: "Phone verified." });
              router.refresh();
            });
          }}
        >
          Verify
        </Button>
      </div>
    </div>
  );
}
