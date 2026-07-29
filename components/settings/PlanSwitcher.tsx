"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plan } from "@prisma/client";
import { setClinicPlan } from "@/actions/auth";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { PLAN_LABELS } from "@/lib/plan-features";

const PLAN_OPTIONS: { value: Plan; blurb: string }[] = [
  { value: Plan.free, blurb: "OPD queue, records, portal, and public booking" },
  { value: Plan.starter, blurb: "Adds messaging and labs" },
  { value: Plan.pro, blurb: "Adds online payments, ABHA, and MIS reports (later)" },
];

export function PlanSwitcher({ currentPlan }: { currentPlan: Plan }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(currentPlan);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("plan", plan);
        startTransition(async () => {
          const result = await setClinicPlan(fd);
          if (!result.success) {
            setMessage({ type: "error", text: result.error });
            return;
          }
          setMessage({ type: "success", text: `Switched to ${PLAN_LABELS[plan]}.` });
          router.refresh();
        });
      }}
    >
      <div>
        <h3 className="text-sm font-semibold text-ink">Change plan</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Billing checkout isn&apos;t live yet — owners can switch plans here for testing.
        </p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Plan</legend>
        {PLAN_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-surface-muted/60"
          >
            <input
              type="radio"
              name="plan"
              value={option.value}
              checked={plan === option.value}
              onChange={() => setPlan(option.value)}
              className="mt-1 size-4"
            />
            <span>
              <span className="font-medium text-ink">{PLAN_LABELS[option.value]}</span>
              <span className="mt-0.5 block text-muted-foreground">{option.blurb}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>{message.text}</Banner>
      ) : null}
      <Button type="submit" loading={pending} disabled={plan === currentPlan}>
        Save plan
      </Button>
    </form>
  );
}
