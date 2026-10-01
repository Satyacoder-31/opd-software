"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PaymentMode } from "@prisma/client";
import {
  faHeartPulse,
  faTemperatureHalf,
  faWeightScale,
  faDroplet,
  faRulerVertical,
  faStethoscope,
  faPills,
  faPrint,
  faDownload,
  faTriangleExclamation,
  faPenToSquare,
  faCheck,
  faXmark,
  faFileInvoice,
  faReceipt,
  faMoneyBillWave,
  faPlus,
  faTrash,
  faRotateRight,
  faUserDoctor,
  faShieldHalved,
  faNotesMedical,
} from "@fortawesome/free-solid-svg-icons";
import {
  createOrUpdateInvoice,
  markInvoicePaid,
  generateReceiptPdf,
  voidInvoice,
  updateBillingVitals,
} from "@/actions/invoices";
import { listFeeItems } from "@/actions/fees";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { downloadBase64Pdf, cn, formatPhone } from "@/lib/utils";
import { validateBillingInput } from "@/lib/validation";
import type { LineItem, Medicine, Vitals } from "@/lib/types";
import { usePendingAction } from "@/hooks/usePendingAction";

type FeeOption = {
  id: string;
  name: string;
  amount: number;
};

export type BillingFormProps = {
  consultationId: string;
  patient?: {
    id: string;
    name: string;
    mrn: string;
    phone: string;
    age?: number | null;
    gender?: string | null;
    dateOfBirth?: Date | null;
    allergies?: string | null;
    chronicConditions?: string | null;
    address?: string | null;
    abhaNumber?: string | null;
  } | null;
  doctor?: {
    name: string;
    specialty?: string | null;
    registrationNo?: string | null;
    qualifications?: string | null;
  } | null;
  appointment?: {
    tokenNumber: number;
    queueDate: Date;
    type?: string | null;
    reasonForVisit?: string | null;
  } | null;
  prescription?: {
    medicines: unknown;
    advice?: string | null;
    followUp?: string | null;
  } | null;
  clinic?: {
    name: string;
    phone: string;
    address: string;
    gstin?: string | null;
    logoUrl?: string | null;
    email?: string | null;
  } | null;
  clinical?: {
    chiefComplaint?: string | null;
    diagnosis?: string | null;
    notes?: string | null;
  } | null;
  vitals?: Vitals | null;
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

function calculateBmi(weightKg?: string, heightCm?: string): { bmi: string; category: string; color: string } | null {
  if (!weightKg || !heightCm) return null;
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm) / 100;
  if (!w || !h || h <= 0) return null;
  const val = w / (h * h);
  const bmiStr = val.toFixed(1);

  if (val < 18.5) return { bmi: bmiStr, category: "Underweight", color: "text-amber-600 bg-amber-50 border-amber-200" };
  if (val < 25.0) return { bmi: bmiStr, category: "Normal", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (val < 30.0) return { bmi: bmiStr, category: "Overweight", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { bmi: bmiStr, category: "Obese", color: "text-rose-700 bg-rose-50 border-rose-200" };
}

function getBpStatus(bp?: string): { status: string; color: string } {
  if (!bp || !bp.includes("/")) return { status: "Recorded", color: "text-slate-700 bg-slate-100 border-slate-200" };
  const [systolicStr, diastolicStr] = bp.split("/");
  const sys = parseInt(systolicStr, 10);
  const dia = parseInt(diastolicStr, 10);
  if (isNaN(sys) || isNaN(dia)) return { status: "Recorded", color: "text-slate-700 bg-slate-100 border-slate-200" };

  if (sys < 120 && dia < 80) {
    return { status: "Normal BP", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }
  if (sys <= 129 && dia < 80) {
    return { status: "Elevated", color: "text-amber-700 bg-amber-50 border-amber-200" };
  }
  if (sys <= 139 || dia <= 89) {
    return { status: "Stage 1 HTN", color: "text-amber-700 bg-amber-50 border-amber-200" };
  }
  return { status: "Stage 2 HTN", color: "text-rose-700 bg-rose-50 border-rose-200" };
}

export function BillingForm({
  consultationId,
  patient,
  doctor,
  appointment,
  prescription,
  clinic,
  clinical,
  vitals: initialVitals,
  initial,
}: BillingFormProps) {
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
    initial.lineItems ?? [{ description: "OPD Consultation & Clinical Assessment", amount: 500 }]
  );
  const [taxRate, setTaxRate] = useState(
    initial.taxRate != null && initial.taxRate > 0 ? String(initial.taxRate) : "0"
  );
  const [feeItems, setFeeItems] = useState<FeeOption[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initial.paymentMode ?? PaymentMode.cash
  );
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Vitals State & Live Editor
  const [vitals, setVitals] = useState<Vitals>(initialVitals ?? {});
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bp: initialVitals?.bp ?? "",
    pulse: initialVitals?.pulse ?? "",
    temp: initialVitals?.temp ?? "",
    weight: initialVitals?.weight ?? "",
    spo2: initialVitals?.spo2 ?? "",
    height: initialVitals?.height ?? "",
    bmi: initialVitals?.bmi ?? "",
  });
  const [vitalsSaveStatus, setVitalsSaveStatus] = useState<string | null>(null);

  // Prescription medicines
  const medicines = useMemo<Medicine[]>(() => {
    if (!prescription?.medicines) return [];
    if (Array.isArray(prescription.medicines)) return prescription.medicines;
    return [];
  }, [prescription?.medicines]);

  const { isPending, run } = usePendingAction<
    "save" | "pay" | "receipt" | "void" | "vitals"
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

  // Calculate live BMI from vitals
  const liveBmi = useMemo(() => {
    return calculateBmi(vitals.weight, vitals.height);
  }, [vitals.weight, vitals.height]);

  const bpStatus = useMemo(() => {
    return getBpStatus(vitals.bp);
  }, [vitals.bp]);

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

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) {
      setLineItems([{ description: "", amount: 0 }]);
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
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

  function addQuickPreset(name: string, amount: number) {
    if (mode === "flat") {
      setFlatAmount(String(amount));
      return;
    }
    setLineItems((prev) => [...prev, { description: name, amount }]);
  }

  function handleSaveVitals() {
    setVitalsSaveStatus(null);
    void run(async () => {
      // Calculate BMI automatically if height & weight exist
      let calculatedBmiStr = vitalsForm.bmi;
      if (vitalsForm.weight && vitalsForm.height) {
        const res = calculateBmi(vitalsForm.weight, vitalsForm.height);
        if (res) calculatedBmiStr = res.bmi;
      }

      const payload = {
        bp: vitalsForm.bp,
        pulse: vitalsForm.pulse,
        temp: vitalsForm.temp,
        weight: vitalsForm.weight,
        spo2: vitalsForm.spo2,
        height: vitalsForm.height,
        bmi: calculatedBmiStr,
      };

      const result = await updateBillingVitals(consultationId, payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setVitals(payload);
      setIsEditingVitals(false);
      setVitalsSaveStatus("Vitals updated successfully and attached to this invoice!");
      setTimeout(() => setVitalsSaveStatus(null), 4000);
    }, "vitals");
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
      setSuccessMsg("Draft invoice saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3500);
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
      setSuccessMsg("Payment collected and receipt finalized!");
      setTimeout(() => setSuccessMsg(null), 4000);
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

  function handlePrintBrowser() {
    window.print();
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

  const receiptNo = initial.invoiceNumber ?? consultationId.slice(0, 8).toUpperCase();
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* 1. CLINICAL HEADER & PATIENT BANNER */}
      <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              {patient?.name?.charAt(0) || "P"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold text-ink">
                  {patient?.name || "Patient Record"}
                </h2>
                <span className="rounded-md bg-sky-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-sky-800">
                  {patient?.mrn || "UHID: —"}
                </span>
                {patient?.gender && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 capitalize">
                    {patient.gender}
                  </span>
                )}
                {patient?.age != null && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {patient.age} yrs
                  </span>
                )}
                {patient?.abhaNumber && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                    ABHA: {patient.abhaNumber}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {patient?.phone && (
                  <span>Tel: <strong className="text-ink">{formatPhone(patient.phone)}</strong></span>
                )}
                {doctor?.name && (
                  <span className="flex items-center gap-1">
                    <Icon icon={faUserDoctor} className="text-sky-600 size-3" />
                    Doctor: <strong className="text-ink">Dr. {doctor.name}</strong>
                    {doctor.specialty && ` (${doctor.specialty})`}
                  </span>
                )}
                {appointment?.tokenNumber != null && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                    Token #{appointment.tokenNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <StatusBadge status={status} />
            <span className="rounded-md bg-white border border-border px-2.5 py-1 text-xs font-mono font-medium text-slate-700 shadow-2xs">
              INV-{receiptNo}
            </span>
          </div>
        </div>

        {/* Safety Alert / Allergies */}
        {patient?.allergies && (
          <div className="mt-3.5 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-medium text-rose-800">
            <Icon icon={faTriangleExclamation} className="text-rose-600 size-4 shrink-0" />
            <span>Known Allergies: <strong>{patient.allergies}</strong></span>
          </div>
        )}

        {/* Diagnosis Pill */}
        {(clinical?.chiefComplaint || clinical?.diagnosis) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-sky-100/80 pt-3 text-xs">
            {clinical.chiefComplaint && (
              <span className="text-slate-600">
                Complaint: <strong className="text-ink">{clinical.chiefComplaint}</strong>
              </span>
            )}
            {clinical.diagnosis && (
              <span className="rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                Diagnosis: {clinical.diagnosis}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. CLINICAL VITALS COMMAND STRIP (Temperature, Weight, BP, Pulse, SpO2, BMI) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3.5 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Icon icon={faNotesMedical} className="text-primary size-4" />
              <h3 className="font-display text-base font-bold text-ink">
                Patient Clinical Vitals & Measurements
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recorded during examination and automatically embedded into the patient&apos;s tax invoice receipt
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsEditingVitals(!isEditingVitals)}
            className="self-start sm:self-auto"
          >
            <Icon icon={isEditingVitals ? faXmark : faPenToSquare} data-icon="inline-start" />
            {isEditingVitals ? "Close editor" : "Update vitals"}
          </Button>
        </div>

        {vitalsSaveStatus && (
          <div className="mb-4">
            <Banner variant="success">{vitalsSaveStatus}</Banner>
          </div>
        )}

        {/* Vitals Tiles View */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* BP */}
          <div className="flex flex-col rounded-xl border border-sky-100 bg-sky-50/40 p-3.5 transition-all hover:border-sky-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Blood Pressure</span>
              <Icon icon={faDroplet} className="size-3.5 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink">
                {vitals.bp || "—"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">mmHg</span>
            </div>
            <div className="mt-1.5">
              <span className={cn("inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold border", bpStatus.color)}>
                {bpStatus.status}
              </span>
            </div>
          </div>

          {/* Pulse */}
          <div className="flex flex-col rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 transition-all hover:border-rose-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Pulse Rate</span>
              <Icon icon={faHeartPulse} className="size-3.5 text-rose-500 animate-pulse" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink">
                {vitals.pulse || "—"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">bpm</span>
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              {vitals.pulse ? "Resting heart rate" : "Not measured"}
            </div>
          </div>

          {/* Temperature */}
          <div className="flex flex-col rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 transition-all hover:border-amber-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Temperature</span>
              <Icon icon={faTemperatureHalf} className="size-3.5 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink">
                {vitals.temp || "—"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">°F</span>
            </div>
            <div className="mt-1.5">
              {parseFloat(vitals.temp || "0") > 99.5 ? (
                <span className="inline-block rounded-md bg-rose-100 border border-rose-300 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                  Fever Alert
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {vitals.temp ? "Normal core" : "Not measured"}
                </span>
              )}
            </div>
          </div>

          {/* Weight */}
          <div className="flex flex-col rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 transition-all hover:border-indigo-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Weight</span>
              <Icon icon={faWeightScale} className="size-3.5 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink">
                {vitals.weight || "—"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">kg</span>
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              {vitals.weight ? "Patient mass" : "Not recorded"}
            </div>
          </div>

          {/* Oxygen SpO2 */}
          <div className="flex flex-col rounded-xl border border-teal-100 bg-teal-50/40 p-3.5 transition-all hover:border-teal-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Oxygen SpO₂</span>
              <Icon icon={faStethoscope} className="size-3.5 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink">
                {vitals.spo2 || "—"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">%</span>
            </div>
            <div className="mt-1.5">
              {parseFloat(vitals.spo2 || "100") < 94 && vitals.spo2 ? (
                <span className="inline-block rounded-md bg-rose-100 border border-rose-300 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                  Low Saturation
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {vitals.spo2 ? "Oxygenated" : "Not measured"}
                </span>
              )}
            </div>
          </div>

          {/* Height & BMI */}
          <div className="flex flex-col rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 transition-all hover:border-emerald-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Height / BMI</span>
              <Icon icon={faRulerVertical} className="size-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink">
                {vitals.height ? `${vitals.height}` : "—"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">cm</span>
            </div>
            <div className="mt-1.5">
              {liveBmi ? (
                <span className={cn("inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold border", liveBmi.color)}>
                  BMI: {liveBmi.bmi} ({liveBmi.category})
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {vitals.bmi ? `BMI: ${vitals.bmi}` : "Enter height"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inline Quick Vitals Editor */}
        {isEditingVitals && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-sky-50/60 p-4 animate-in fade-in-50 duration-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Record / Correct Vitals at Billing Counter
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Input
                label="BP (mmHg)"
                placeholder="120/80"
                value={vitalsForm.bp}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
              />
              <Input
                label="Pulse (bpm)"
                placeholder="72"
                value={vitalsForm.pulse}
                onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
              />
              <Input
                label="Temp (°F)"
                placeholder="98.6"
                value={vitalsForm.temp}
                onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
              />
              <Input
                label="Weight (kg)"
                placeholder="70"
                value={vitalsForm.weight}
                onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
              />
              <Input
                label="SpO₂ (%)"
                placeholder="98"
                value={vitalsForm.spo2}
                onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
              />
              <Input
                label="Height (cm)"
                placeholder="170"
                value={vitalsForm.height}
                onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingVitals(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveVitals}
                loading={isPending("vitals")}
              >
                <Icon icon={faCheck} data-icon="inline-start" />
                Save Vitals
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. PRESCRIBED MEDICINES SUMMARY DRAWER */}
      {medicines.length > 0 && (
        <details className="group rounded-xl border border-border bg-card p-4 shadow-xs open:bg-slate-50/50">
          <summary className="flex cursor-pointer items-center justify-between font-display text-sm font-semibold text-ink">
            <div className="flex items-center gap-2">
              <Icon icon={faPills} className="text-primary size-4" />
              <span>Consultation Prescriptions ({medicines.length} medicines)</span>
            </div>
            <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-3 divide-y divide-border border-t border-border pt-2 text-xs">
            {medicines.map((med, idx) => (
              <div key={idx} className="flex flex-col py-2 sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <strong className="text-ink font-semibold">{med.name}</strong>
                  <span className="text-muted-foreground ml-2 font-mono">{med.dosage}</span>
                  {med.route && <span className="ml-1 text-slate-500">({med.route})</span>}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Frequency: <strong className="text-ink">{med.frequency}</strong></span>
                  <span>Duration: <strong className="text-ink">{med.duration}</strong></span>
                  {med.quantity && <span>Qty: <strong className="text-ink">{med.quantity}</strong></span>}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Alerts & Notifications */}
      {isVoid && voidReasonDisplay && (
        <Banner variant="error">
          Invoice voided: {voidReasonDisplay}. Save a corrected draft below to
          continue billing.
        </Banner>
      )}

      {isPaid && (
        <Banner variant="success">
          Payment completed and receipt issued. You can print the official receipt or download the PDF below.
        </Banner>
      )}

      {successMsg && <Banner variant="success">{successMsg}</Banner>}

      {/* 4. BILLING ITEMS & FEE PRESETS */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              Invoice Items & Fee Details
            </h3>
            <p className="text-xs text-muted-foreground">
              Select standard fees or add custom line items for this visit
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-surface-muted p-1 border border-border">
            <button
              type="button"
              onClick={() => setMode("flat")}
              disabled={!isEditable}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                mode === "flat"
                  ? "bg-white text-primary shadow-xs"
                  : "text-muted-foreground hover:text-ink"
              )}
            >
              Flat Fee
            </button>
            <button
              type="button"
              onClick={() => setMode("itemized")}
              disabled={!isEditable}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                mode === "itemized"
                  ? "bg-white text-primary shadow-xs"
                  : "text-muted-foreground hover:text-ink"
              )}
            >
              Itemized Charges
            </button>
          </div>
        </div>

        {/* Quick Fee Presets */}
        {isEditable && (
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Quick OPD Presets
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuickPreset("OPD Consultation Fee", 500)}
              >
                + Consultation (₹500)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuickPreset("Follow-Up Consultation", 300)}
              >
                + Follow-up (₹300)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuickPreset("Wound Dressing & Bandaging", 250)}
              >
                + Dressing (₹250)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuickPreset("Plaster / POP Cast Application", 1200)}
              >
                + Plaster / Cast (₹1200)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuickPreset("Intra-articular Joint Injection", 1500)}
              >
                + Joint Injection (₹1500)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuickPreset("Digital X-Ray Review & Report", 400)}
              >
                + X-Ray Review (₹400)
              </Button>
            </div>
          </div>
        )}

        {/* Master Catalog Dropdown */}
        {isEditable && feeItems.length > 0 && (
          <div className="max-w-md">
            <Select
              label="Add from clinic fee catalog"
              name="feePreset"
              value=""
              onChange={(e) => {
                if (e.target.value) applyFeePreset(e.target.value);
              }}
              options={[
                { value: "", label: "Pick a service from fee catalog…" },
                ...feeItems.map((f) => ({
                  value: f.id,
                  label: `${f.name} — ₹${f.amount.toFixed(2)}`,
                })),
              ]}
            />
          </div>
        )}

        {/* Line Items Editor */}
        {mode === "flat" ? (
          <div className="max-w-md">
            <Input
              label="Taxable consultation amount (₹)"
              name="amount"
              type="number"
              min={0}
              step={0.01}
              value={flatAmount}
              onChange={(e) => setFlatAmount(e.target.value)}
              disabled={!isEditable}
              placeholder="500"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2.5">Item Description</th>
                    <th className="px-3.5 py-2.5 w-32">Amount (₹)</th>
                    {isEditable && <th className="px-3.5 py-2.5 w-12 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          aria-label={`Description for line item ${index + 1}`}
                          className="w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink focus:border-primary focus:outline-hidden disabled:bg-slate-50"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, "description", e.target.value)}
                          disabled={!isEditable}
                          placeholder="Service or medication name"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          aria-label={`Amount for line item ${index + 1}`}
                          className="w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs font-bold text-ink text-right focus:border-primary focus:outline-hidden disabled:bg-slate-50"
                          value={item.amount}
                          onChange={(e) => updateLineItem(index, "amount", e.target.value)}
                          disabled={!isEditable}
                          min={0}
                          step={1}
                        />
                      </td>
                      {isEditable && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Remove item"
                          >
                            <Icon icon={faTrash} className="size-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEditable && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addLineItem}
              >
                <Icon icon={faPlus} data-icon="inline-start" />
                Add line item
              </Button>
            )}
          </div>
        )}

        {/* GST / Tax & Grand Total */}
        <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-border">
          <div className="space-y-3">
            <div className="max-w-xs">
              <Select
                label="GST Tax Rate (%)"
                name="taxRate"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={!isEditable}
                options={[
                  { value: "0", label: "0% — Healthcare Exempt" },
                  { value: "5", label: "5% — Standard Medical GST" },
                  { value: "12", label: "12% — Consumables GST" },
                  { value: "18", label: "18% — Diagnostic Services GST" },
                ]}
              />
            </div>

            <div className="max-w-xs">
              <Select
                label="Settlement Mode"
                name="paymentMode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                disabled={!isEditable}
                options={[
                  { value: "cash", label: "💵 Cash" },
                  { value: "upi", label: "📱 UPI / QR Code" },
                  { value: "card", label: "💳 Debit / Credit Card" },
                  { value: "online", label: "🌐 Online Payment" },
                  { value: "other", label: "🏛️ Insurance / Other" },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-4">
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal / Taxable:</span>
                <span className="font-semibold text-ink">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST / Taxes ({rate}%):</span>
                <span className="font-semibold text-ink">₹{taxAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm font-bold text-ink">Total Payable:</span>
                <span className="font-display text-2xl font-bold text-primary">
                  ₹{total.toFixed(2)}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground block text-right mt-0.5">
                Indian Rupees (INR)
              </span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {/* 5. ACTIONS: Save, Mark Paid, Download PDF, Browser Print */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
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
                <Icon icon={faMoneyBillWave} data-icon="inline-start" />
                Collect & Mark Paid (₹{total.toFixed(2)})
              </Button>
            </>
          )}

          {isPaid && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDownloadReceipt}
                loading={isPending("receipt")}
              >
                <Icon icon={faDownload} data-icon="inline-start" />
                Download Tax Invoice (PDF)
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handlePrintBrowser}
              >
                <Icon icon={faPrint} data-icon="inline-start" />
                Print Receipt
              </Button>
            </>
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

      {/* PRINT-ONLY STYLESHEET AND PRINT CONTAINER (renders on window.print) */}
      <div className="hidden print:block print:p-6 print:text-black">
        <div className="border-b-2 border-primary pb-4">
          <h1 className="text-xl font-bold">{clinic?.name || "Dr. Ortho Clinic"}</h1>
          <p className="text-xs text-gray-600">{clinic?.address} · Tel: {clinic?.phone}</p>
          {clinic?.gstin && <p className="text-xs text-gray-600">GSTIN: {clinic.gstin}</p>}
        </div>

        <div className="my-3 flex justify-between text-xs">
          <div>
            <p><strong>Patient:</strong> {patient?.name}</p>
            <p><strong>MRN:</strong> {patient?.mrn}</p>
            <p><strong>Age/Gender:</strong> {patient?.age} yrs / {patient?.gender}</p>
          </div>
          <div className="text-right">
            <p><strong>Invoice #:</strong> {receiptNo}</p>
            <p><strong>Date:</strong> {dateStr}</p>
            <p><strong>Doctor:</strong> Dr. {doctor?.name || "Consultant"}</p>
          </div>
        </div>

        {/* Vitals in Print */}
        <div className="my-3 rounded border border-gray-300 bg-gray-50 p-2 text-xs">
          <p className="font-bold text-gray-700 uppercase mb-1">Clinical Vitals & Measurements</p>
          <div className="grid grid-cols-6 gap-2 text-center text-xs">
            <div><span className="block text-gray-500">BP</span><strong>{vitals.bp || "—"}</strong></div>
            <div><span className="block text-gray-500">Pulse</span><strong>{vitals.pulse ? `${vitals.pulse} bpm` : "—"}</strong></div>
            <div><span className="block text-gray-500">Temp</span><strong>{vitals.temp ? `${vitals.temp} °F` : "—"}</strong></div>
            <div><span className="block text-gray-500">Weight</span><strong>{vitals.weight ? `${vitals.weight} kg` : "—"}</strong></div>
            <div><span className="block text-gray-500">SpO₂</span><strong>{vitals.spo2 ? `${vitals.spo2} %` : "—"}</strong></div>
            <div><span className="block text-gray-500">BMI</span><strong>{liveBmi?.bmi || vitals.bmi || "—"}</strong></div>
          </div>
        </div>

        {/* Diagnosis in Print */}
        {(clinical?.chiefComplaint || clinical?.diagnosis) && (
          <div className="my-2 text-xs">
            {clinical.chiefComplaint && <p><strong>Complaint:</strong> {clinical.chiefComplaint}</p>}
            {clinical.diagnosis && <p><strong>Diagnosis:</strong> {clinical.diagnosis}</p>}
          </div>
        )}

        <table className="my-3 w-full border border-gray-300 text-xs">
          <thead className="bg-gray-100 font-bold border-b">
            <tr>
              <th className="p-1.5 text-left">Description</th>
              <th className="p-1.5 text-right w-24">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-1.5">{item.description}</td>
                <td className="p-1.5 text-right">₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-3 flex justify-end text-xs">
          <div className="w-48 text-right space-y-1">
            <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
            <p>GST ({rate}%): ₹{taxAmount.toFixed(2)}</p>
            <p className="font-bold text-sm border-t pt-1">Total Paid: ₹{total.toFixed(2)}</p>
            <p className="text-gray-600">Settled via {paymentMode.toUpperCase()}</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t flex justify-between text-xs text-gray-500">
          <p>Thank you for visiting. Get well soon.</p>
          <div className="text-center w-36">
            <div className="border-b border-gray-400 mb-1 h-8"></div>
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
