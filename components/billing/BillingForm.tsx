"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentMode } from "@prisma/client";
import {
  createOrUpdateInvoice,
  markInvoicePaid,
  generateReceiptPdf,
  voidInvoice,
} from "@/actions/invoices";
import { listFeeItems } from "@/actions/fees";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/ui/Badge";
import { downloadBase64Pdf } from "@/lib/utils";
import { validateBillingInput } from "@/lib/validation";
import type { LineItem } from "@/lib/types";
import { usePendingAction } from "@/hooks/usePendingAction";

type FeeOption = {
  id: string;
  name: string;
  amount: number;
};

type BillingFormProps = {
  consultationId: string;
  initial: {
    amount: number;
    lineItems: LineItem[] | null;
    status: string;
    paymentMode: PaymentMode | null;
    voidReason?: string | null;
    taxRate?: number | null;
    taxableAmount?: number | null;
    taxAmount?: number | null;
    invoiceNumber?: string | null;
  };
};

export function BillingForm({ consultationId, initial }: BillingFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initial.status);
  const [voidReasonDisplay, setVoidReasonDisplay] = useState(
    initial.voidReason ?? null
  );
  const [mode, setMode] = useState<"flat" | "itemized">(
    initial.lineItems && initial.lineItems.length > 0 ? "itemized" : "flat"
  );
  const taxableInitial =
    initial.taxableAmount != null && initial.taxableAmount > 0
      ? initial.taxableAmount
      : initial.amount;
  const [flatAmount, setFlatAmount] = useState(
    taxableInitial > 0 ? String(taxableInitial) : ""
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initial.lineItems ?? [{ description: "Consultation fee", amount: 500 }]
  );
  const [taxRate, setTaxRate] = useState(
    initial.taxRate != null && initial.taxRate > 0 ? String(initial.taxRate) : ""
  );
  const [feeItems, setFeeItems] = useState<FeeOption[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initial.paymentMode ?? PaymentMode.cash
  );
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<
    "save" | "pay" | "receipt" | "void"
  >();

  useEffect(() => {
    void listFeeItems(true).then((items) => {
      setFeeItems(
        items.map((item) => ({
          id: item.id,
          name: item.name,
          amount: Number(item.amount),
        }))
      );
    });
  }, []);

  const isPaid = status === "paid";
  const isVoid = status === "void";
  const isEditable = !isPaid;

  const subtotal =
    mode === "flat"
      ? parseFloat(flatAmount) || 0
      : lineItems.reduce((sum, item) => sum + item.amount, 0);
  const rate = parseFloat(taxRate) || 0;
  const taxAmount = Math.round(subtotal * rate) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  function updateLineItem(
    index: number,
    field: keyof LineItem,
    value: string
  ) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "amount" ? parseFloat(value) || 0 : value,
            }
          : item
      )
    );
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", amount: 0 }]);
  }

  function applyFeePreset(feeId: string) {
    const fee = feeItems.find((f) => f.id === feeId);
    if (!fee) return;
    if (mode === "flat") {
      setFlatAmount(String(fee.amount));
      return;
    }
    setLineItems((prev) => [
      ...prev,
      { description: fee.name, amount: fee.amount },
    ]);
  }

  function validateBeforeSave() {
    const validation = validateBillingInput({
      mode,
      total: subtotal,
      lineItems,
    });
    if (!validation.ok) {
      setError(validation.error);
      return false;
    }
    setError(null);
    return true;
  }

  function invoicePayload() {
    return {
      lineItems: mode === "itemized" ? lineItems : null,
      amount: subtotal,
      taxRate: rate > 0 ? rate : null,
    };
  }

  function handleSave() {
    if (!validateBeforeSave()) return;

    void run(async () => {
      const result = await createOrUpdateInvoice(consultationId, invoicePayload());
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStatus("draft");
      setVoidReasonDisplay(null);
      setShowVoidForm(false);
      router.refresh();
    }, "save");
  }

  function handleMarkPaid() {
    if (!validateBeforeSave()) return;

    void run(async () => {
      const saveResult = await createOrUpdateInvoice(
        consultationId,
        invoicePayload()
      );
      if (!saveResult.success) {
        setError(saveResult.error);
        return;
      }
      const payResult = await markInvoicePaid(consultationId, paymentMode);
      if (!payResult.success) {
        setError(payResult.error);
        return;
      }
      setStatus("paid");
      setVoidReasonDisplay(null);
      setShowVoidForm(false);
      router.refresh();
    }, "pay");
  }

  function handleDownloadReceipt() {
    setError(null);
    void run(async () => {
      const result = await generateReceiptPdf(consultationId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.success && result.data) {
        downloadBase64Pdf(result.data.pdfBase64, result.data.filename);
      }
    }, "receipt");
  }

  function handleVoid() {
    setError(null);
    void run(async () => {
      const result = await voidInvoice(consultationId, voidReason);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStatus("void");
      setVoidReasonDisplay(voidReason.trim());
      setShowVoidForm(false);
      setVoidReason("");
      router.refresh();
    }, "void");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Status:</span>
        <StatusBadge status={status} />
        {initial.invoiceNumber && (
          <span className="text-sm text-muted-foreground">
            {initial.invoiceNumber}
          </span>
        )}
      </div>

      {isVoid && voidReasonDisplay && (
        <Banner variant="error">
          Invoice voided: {voidReasonDisplay}. Save a corrected draft below to
          continue billing.
        </Banner>
      )}

      {isPaid && (
        <Banner variant="info">
          This invoice is paid. Void it to issue a corrected bill — amounts
          cannot be edited while paid.
        </Banner>
      )}

      {isEditable && feeItems.length > 0 && (
        <Select
          label="Add from fee master"
          name="feePreset"
          value=""
          onChange={(e) => {
            if (e.target.value) applyFeePreset(e.target.value);
          }}
          options={[
            { value: "", label: "Select a fee…" },
            ...feeItems.map((f) => ({
              value: f.id,
              label: `${f.name} — ₹${f.amount.toFixed(2)}`,
            })),
          ]}
        />
      )}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="billingMode"
            checked={mode === "flat"}
            onChange={() => setMode("flat")}
            disabled={!isEditable}
          />
          Flat fee
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="billingMode"
            checked={mode === "itemized"}
            onChange={() => setMode("itemized")}
            disabled={!isEditable}
          />
          Itemized
        </label>
      </div>

      {mode === "flat" ? (
        <Input
          label="Taxable amount (₹)"
          name="amount"
          type="number"
          min={0}
          step={0.01}
          value={flatAmount}
          onChange={(e) => setFlatAmount(e.target.value)}
          disabled={!isEditable}
        />
      ) : (
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-2">
              <Input
                label="Description"
                name={`desc-${index}`}
                value={item.description}
                onChange={(e) =>
                  updateLineItem(index, "description", e.target.value)
                }
                disabled={!isEditable}
              />
              <Input
                label="Amount (₹)"
                name={`amt-${index}`}
                type="number"
                min={0}
                value={item.amount}
                onChange={(e) =>
                  updateLineItem(index, "amount", e.target.value)
                }
                disabled={!isEditable}
              />
            </div>
          ))}
          {isEditable && (
            <Button type="button" variant="secondary" size="sm" onClick={addLineItem}>
              Add line item
            </Button>
          )}
        </div>
      )}

      <Input
        label="GST rate (%)"
        name="taxRate"
        type="number"
        min={0}
        max={100}
        step={0.01}
        value={taxRate}
        onChange={(e) => setTaxRate(e.target.value)}
        disabled={!isEditable}
        placeholder="0"
      />

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
        {rate > 0 && <p>GST ({rate}%): ₹{taxAmount.toFixed(2)}</p>}
      </div>

      <p className="font-display text-xl font-semibold text-primary">
        Total: ₹{total.toFixed(2)}
      </p>

      <Select
        label="Payment mode"
        name="paymentMode"
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
        disabled={!isEditable}
        options={[
          { value: "cash", label: "Cash" },
          { value: "upi", label: "UPI" },
          { value: "card", label: "Card" },
          { value: "other", label: "Other" },
        ]}
      />

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {isEditable && (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSave}
              loading={isPending("save")}
            >
              {isVoid ? "Save corrected draft" : "Save draft"}
            </Button>
            <Button
              type="button"
              onClick={handleMarkPaid}
              loading={isPending("pay")}
            >
              Mark paid
            </Button>
          </>
        )}
        {isPaid && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadReceipt}
            loading={isPending("receipt")}
          >
            Download receipt
          </Button>
        )}
        {(isPaid || status === "draft") && !isVoid && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setShowVoidForm((open) => !open);
              setError(null);
            }}
          >
            Void invoice
          </Button>
        )}
      </div>

      {showVoidForm && (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <Textarea
            label="Reason for voiding"
            name="voidReason"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="e.g. Wrong amount entered, duplicate charge"
            rows={3}
            required
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="danger"
              onClick={handleVoid}
              loading={isPending("void")}
            >
              Confirm void
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowVoidForm(false);
                setVoidReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
