"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPortalOtp, verifyPortalOtp } from "@/actions/portal";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { OneTapPatientLogin } from "@/components/portal/OneTapPatientLogin";

export function PortalLoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePrefillPhone = (newPhone: string) => {
    setPhone(newPhone);
    setSent(false);
    setCode("");
    setMessage(null);
  };

  async function requestCode() {
    setPending(true);
    const result = await requestPortalOtp(phone);
    setPending(false);
    if (!result.success) return setMessage(result.error);
    setSent(true);
    setMessage(
      result.data.developmentCode
        ? `Development OTP: ${result.data.developmentCode}`
        : "OTP sent to your phone.",
    );
  }

  async function verify() {
    setPending(true);
    const result = await verifyPortalOtp(phone, code);
    setPending(false);
    if (!result.success) return setMessage(result.error);
    router.push(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/portal");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1-Tap Demo Patient Sign In */}
      <OneTapPatientLogin onPrefillPhone={handlePrefillPhone} />

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Or verify with phone OTP
        </div>
      </div>

      <div className="flex flex-col gap-4">
      <Input
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={sent}
      />
      {sent ? (
        <Input
          label="6-digit OTP"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      ) : null}
      {message ? (
        <Banner
          variant={
            message.startsWith("The ") || message.startsWith("No ") || message.startsWith("Enter ")
              ? "error"
              : message.startsWith("Development")
                ? "info"
                : "info"
          }
        >
          {message}
        </Banner>
      ) : null}
      <Button type="button" onClick={sent ? verify : requestCode} loading={pending}>
        {sent ? "Verify and continue" : "Send OTP"}
      </Button>
      {sent ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSent(false);
            setCode("");
            setMessage(null);
          }}
        >
          Use another number
        </Button>
      ) : null}
      </div>
    </div>
  );
}
