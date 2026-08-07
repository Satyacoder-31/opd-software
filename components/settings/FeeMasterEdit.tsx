"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { createFeeItem, setFeeItemActive } from "@/actions/fees";
import {
  FeeItemLabel,
  type FeeRow,
} from "@/components/settings/FeeMasterView";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { usePendingAction } from "@/hooks/usePendingAction";
import { useServerActionForm } from "@/hooks/useServerActionForm";

type FeeMasterEditProps = {
  initialItems: FeeRow[];
};

export function FeeMasterEdit({ initialItems }: FeeMasterEditProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<string>();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const {
    handleSubmit,
    error,
    fieldError,
    pending,
    values,
    setValue,
    setValues,
  } = useServerActionForm(createFeeItem, {
    onSuccess: (data) => {
      setValues({});
      if (data) {
        setItems((prev) => [
          {
            id: data.id,
            name: data.name,
            amount: data.amount,
            isActive: true,
            hsnSac: data.hsnSac,
          },
          ...prev,
        ]);
      }
      router.refresh();
    },
  });

  function handleToggle(id: string, isActive: boolean, name: string) {
    const action = isActive ? "reactivate" : "deactivate";
    if (
      !window.confirm(
        `Are you sure you want to ${action} “${name}”?${
          isActive ? "" : " It will no longer appear in billing."
        }`
      )
    ) {
      return;
    }

    setToggleError(null);
    void run(async () => {
      const result = await setFeeItemActive(id, isActive);
      if (!result.success) {
        setToggleError(result.error);
        return;
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive } : item))
      );
      router.refresh();
    }, id);
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <FeeItemLabel item={item} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={isPending(item.id)}
              onClick={() => handleToggle(item.id, !item.isActive, item.name)}
            >
              {item.isActive ? "Deactivate" : "Reactivate"}
            </Button>
          </li>
        ))}
      </ul>

      {toggleError ? <Banner variant="error">{toggleError}</Banner> : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 border-t border-border pt-4 sm:grid-cols-4"
      >
        <Input
          label="Fee name"
          name="name"
          autoComplete="off"
          value={values.name ?? ""}
          onChange={(e) => setValue("name", e.target.value)}
          error={fieldError("name")}
          required
        />
        <Input
          label="HSN / SAC"
          name="hsnSac"
          autoComplete="off"
          value={values.hsnSac ?? ""}
          onChange={(e) => setValue("hsnSac", e.target.value)}
          error={fieldError("hsnSac")}
        />
        <Input
          label="Amount (₹)"
          name="amount"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={values.amount ?? ""}
          onChange={(e) => setValue("amount", e.target.value)}
          error={fieldError("amount")}
          required
        />
        <div className="flex items-end">
          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            <Icon icon={faPlus} data-icon="inline-start" />
            Add fee
          </Button>
        </div>
      </form>
      {error ? <Banner variant="error">{error}</Banner> : null}
    </div>
  );
}
