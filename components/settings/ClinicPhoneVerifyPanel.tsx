"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  requestClinicPhoneOtp,
  verifyClinicPhoneOtp,
} from "@/actions/onboarding-medium";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { OtpCodeInput } from "@/components/ui/OtpCodeInput";

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

  function verify(nextCode = code) {
    if (nextCode.length !== 6) return;
    const fd = new FormData();
    fd.set("code", nextCode);
    startTransition(async () => {
      const result = await verifyClinicPhoneOtp(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: "Phone verified." });
      router.refresh();
    });
  }

  if (verifiedAt) {
    return <Banner variant="success">Clinic phone verified ({phone}).</Banner>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/50 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink">Verify clinic phone</p>
        <p className="text-sm text-muted-foreground">
          Phone on file:{" "}
          <span className="font-medium tabular-nums text-ink">{phone}</span>
        </p>
      </div>
      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Banner>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={pending}
          disabled={!phone}
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
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            We’ll text a 6-digit code to this number.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <label htmlFor="settings-clinic-phone-otp" className="text-sm font-medium text-ink">
          Enter OTP
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <OtpCodeInput
            id="settings-clinic-phone-otp"
            value={code}
            onChange={setCode}
            disabled={pending || !phone}
            onComplete={(value) => {
              setCode(value);
              verify(value);
            }}
          />
          <Button
            type="button"
            loading={pending}
            disabled={code.length !== 6}
            onClick={() => verify()}
            className="sm:self-center"
          >
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
