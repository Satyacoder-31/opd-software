"use client";

import { useEffect, useState, useTransition } from "react";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faPrescription,
  faXmark,
  faDownload,
  faPrint,
  faFilePdf,
  faFileLines,
  faUser,
  faUserDoctor,
  faCheck,
  faCalendarCheck,
  faSpinner,
  faTriangleExclamation,
  faNotesMedical,
  faSun,
  faMoon,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import {
  getPrescriptionViewData,
  type PrescriptionViewData,
} from "@/actions/prescriptions";
import { downloadBase64Pdf, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type PrescriptionViewModalProps = {
  consultationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialLang?: "en" | "hi";
};

export function PrescriptionViewModal({
  consultationId,
  isOpen,
  onClose,
  initialLang = "en",
}: PrescriptionViewModalProps) {
  const [lang, setLang] = useState<"en" | "hi">(initialLang);
  const [viewMode, setViewMode] = useState<"paper" | "pdf">("paper");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionViewData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPendingLang, startTransition] = useTransition();

  // Clean up previous blob URL
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Fetch prescription data
  useEffect(() => {
    if (!isOpen || !consultationId) return;

    let isSubscribed = true;
    setLoading(true);
    setError(null);

    void getPrescriptionViewData(consultationId, lang).then((res) => {
      if (!isSubscribed) return;
      setLoading(false);

      if (!res.success) {
        setError(res.error);
        return;
      }

      setPrescriptionData(res.data);

      if (res.data.pdfBase64) {
        try {
          const bytes = Uint8Array.from(atob(res.data.pdfBase64), (c) =>
            c.charCodeAt(0)
          );
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        } catch (e) {
          console.error("Failed to create blob for prescription PDF:", e);
        }
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, consultationId, lang]);

  if (!isOpen) return null;

  function handleDownload() {
    if (!prescriptionData?.pdfBase64) return;
    downloadBase64Pdf(prescriptionData.pdfBase64, prescriptionData.filename);
  }

  function handlePrint() {
    if (pdfBlobUrl) {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = pdfBlobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      };
      return;
    }
    window.print();
  }

  const hasAllergies = Boolean(prescriptionData?.patient.allergies?.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rx-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl overflow-hidden">
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 shadow-2xs">
              <Icon icon={faPrescription} className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="rx-modal-title" className="font-display text-base font-bold text-slate-900">
                  {lang === "hi" ? "चिकित्सीय पर्चा एवं उपचार विवरण" : "Prescription & Treatment Plan"}
                </h2>
                {prescriptionData && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-700 border border-emerald-200">
                    <Icon icon={faCheck} className="size-2.5" />
                    Doctor Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Official OPD medical prescription, dosing schedule, and precautions
              </p>
            </div>
          </div>

          {/* ACTIONS & CONTROLS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("paper")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all",
                  viewMode === "paper"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Icon icon={faFileLines} className="size-3" />
                <span>Paper Rx</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all",
                  viewMode === "pdf"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Icon icon={faFilePdf} className="size-3" />
                <span>PDF Document</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => startTransition(() => setLang("en"))}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-all",
                  lang === "en"
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => setLang("hi"))}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-all",
                  lang === "hi"
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                हिंदी
              </button>
            </div>

            {/* Print & Download */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !prescriptionData}
              title="Print Prescription"
            >
              <Icon icon={faPrint} data-icon="inline-start" />
              <span>Print Rx</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !prescriptionData}
              title="Download Prescription PDF"
            >
              <Icon icon={faDownload} data-icon="inline-start" />
              <span>Download PDF</span>
            </Button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close dialog"
            >
              <Icon icon={faXmark} className="size-4" />
            </button>
          </div>
        </header>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Icon icon={faSpinner} className="size-8 animate-spin text-teal-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Generating prescription preview...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Formatting medical instructions, dosing schedule, and doctor verification
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
              <p className="font-semibold text-sm">Unable to display prescription</p>
              <p className="text-xs mt-1">{error}</p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (consultationId) {
                      setLoading(true);
                      void getPrescriptionViewData(consultationId, lang);
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : !prescriptionData ? null : viewMode === "pdf" && pdfBlobUrl ? (
            /* EMBEDDED PDF VIEWER */
            <div className="h-[70vh] w-full rounded-xl border border-slate-300 bg-slate-800 shadow-inner overflow-hidden">
              <iframe
                src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title="Prescription PDF Preview"
              />
            </div>
          ) : (
            /* PAPER RX VIEW */
            <div className="max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md text-slate-800 space-y-6">
              {/* LETTERHEAD HEADER */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-teal-600 pb-5">
                <div className="flex items-start gap-3">
                  {prescriptionData.clinic.logoUrl && (
                    <img
                      src={prescriptionData.clinic.logoUrl}
                      alt={prescriptionData.clinic.name}
                      className="size-14 rounded-lg object-contain border border-slate-100"
                    />
                  )}
                  <div>
                    <h1 className="font-display text-xl font-bold text-slate-900 leading-tight">
                      {prescriptionData.clinic.name}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {prescriptionData.clinic.address}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">Phone:</span> {prescriptionData.clinic.phone}
                      {prescriptionData.clinic.email && (
                        <span> | Email: {prescriptionData.clinic.email}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Consulting Doctor Box */}
                <div className="sm:text-right min-w-[200px]">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Dr. {prescriptionData.doctor.name}
                  </h3>
                  {prescriptionData.doctor.specialty && (
                    <p className="text-xs font-semibold text-teal-700">
                      {prescriptionData.doctor.specialty}
                    </p>
                  )}
                  {prescriptionData.doctor.qualifications && (
                    <p className="text-[11px] text-slate-500">
                      {prescriptionData.doctor.qualifications}
                    </p>
                  )}
                  {prescriptionData.doctor.registrationNo && (
                    <p className="text-[11px] font-mono text-slate-500">
                      Reg. No: {prescriptionData.doctor.registrationNo}
                    </p>
                  )}
                </div>
              </div>

              {/* PATIENT INFO BANNER */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Patient Name</span>
                    <strong className="text-slate-900 font-semibold">
                      {prescriptionData.patient.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">UHID / MRN</span>
                    <span className="font-mono font-bold text-teal-800">
                      {prescriptionData.patient.mrn}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Age / Gender</span>
                    <span>
                      {prescriptionData.patient.age || "—"} /{" "}
                      {prescriptionData.patient.gender
                        ? prescriptionData.patient.gender.charAt(0).toUpperCase() +
                          prescriptionData.patient.gender.slice(1)
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date & Token</span>
                    <span>
                      {prescriptionData.date}{" "}
                      {prescriptionData.tokenNumber && (
                        <strong className="text-teal-700">
                          (Token #{prescriptionData.tokenNumber})
                        </strong>
                      )}
                    </span>
                  </div>
                </div>

                {/* Allergies / Chronic condition */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-xs">
                  {hasAllergies ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 font-bold text-rose-800">
                      <Icon icon={faTriangleExclamation} className="size-3 text-rose-600" />
                      Known Allergies: {prescriptionData.patient.allergies}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Icon icon={faCheck} className="size-3 text-emerald-600" />
                      Allergies: No Known Drug Allergies
                    </span>
                  )}
                  <span className="text-slate-600">
                    Past History:{" "}
                    <strong className="text-slate-800">
                      {prescriptionData.patient.chronicConditions?.trim() || "No DM, No HTN, No surgery"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* VITALS RIBBON */}
              {prescriptionData.vitals && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Vitals:
                  </span>
                  {prescriptionData.vitals.bp && (
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
                      BP: {prescriptionData.vitals.bp} mmHg
                    </span>
                  )}
                  {prescriptionData.vitals.pulse && (
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
                      Pulse: {prescriptionData.vitals.pulse} bpm
                    </span>
                  )}
                  {prescriptionData.vitals.weight && (
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
                      Weight: {prescriptionData.vitals.weight} kg
                    </span>
                  )}
                  {prescriptionData.vitals.temp && (
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
                      Temp: {prescriptionData.vitals.temp} °F
                    </span>
                  )}
                  {prescriptionData.vitals.spo2 && (
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
                      SpO2: {prescriptionData.vitals.spo2} %
                    </span>
                  )}
                </div>
              )}

              {/* CLINICAL DIAGNOSIS & COMPLAINTS */}
              <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3.5 space-y-1.5 text-xs">
                {prescriptionData.chiefComplaint && (
                  <div>
                    <span className="font-bold uppercase tracking-wider text-teal-900 text-[11px]">
                      Chief Complaints:{" "}
                    </span>
                    <span className="text-slate-800">{prescriptionData.chiefComplaint}</span>
                  </div>
                )}
                <div>
                  <span className="font-bold uppercase tracking-wider text-teal-900 text-[11px]">
                    Clinical Diagnosis:{" "}
                  </span>
                  <strong className="text-slate-900 font-bold text-sm">
                    {prescriptionData.diagnosis || "Clinical assessment recorded"}
                  </strong>
                </div>
              </div>

              {/* MEDICATIONS Rx TABLE */}
              <div>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                  <span className="font-serif italic font-bold text-2xl text-teal-800">℞</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Prescribed Medications ({prescriptionData.medicines.length})
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Medicine & Strength</th>
                        <th className="py-2.5 px-3 w-32">Dosage & Timing</th>
                        <th className="py-2.5 px-3 w-40 text-center">Schedule (M-A-E-N)</th>
                        <th className="py-2.5 px-3 w-28">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prescriptionData.medicines.map((med, idx) => {
                        const freq = (med.frequency || "").toLowerCase();
                        const isMorning = freq.includes("1-0-") || freq.includes("1-1-") || freq.includes("morning") || freq.includes("once daily");
                        const isAfternoon = freq.includes("-1-") || freq.includes("afternoon") || freq.includes("thrice");
                        const isEvening = freq.includes("evening");
                        const isNight = freq.includes("-0-1") || freq.includes("-1-1") || freq.includes("night") || freq.includes("bedtime");
                        const isSos = freq.includes("sos") || freq.includes("as needed");

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 text-sm">
                                {med.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {med.dosage || "1 tab"} · {med.route || "Oral"}
                                {med.instructions ? ` · ${med.instructions}` : ""}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {med.frequency || "As advised"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isSos ? (
                                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  SOS (When Needed)
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold">
                                  <span
                                    className={cn(
                                      "size-5 rounded flex items-center justify-center text-[10px]",
                                      isMorning ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-300"
                                    )}
                                    title="Morning"
                                  >
                                    {isMorning ? "1" : "0"}
                                  </span>
                                  <span>-</span>
                                  <span
                                    className={cn(
                                      "size-5 rounded flex items-center justify-center text-[10px]",
                                      isAfternoon ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-300"
                                    )}
                                    title="Afternoon"
                                  >
                                    {isAfternoon ? "1" : "0"}
                                  </span>
                                  <span>-</span>
                                  <span
                                    className={cn(
                                      "size-5 rounded flex items-center justify-center text-[10px]",
                                      isEvening ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-300"
                                    )}
                                    title="Evening"
                                  >
                                    {isEvening ? "1" : "0"}
                                  </span>
                                  <span>-</span>
                                  <span
                                    className={cn(
                                      "size-5 rounded flex items-center justify-center text-[10px]",
                                      isNight ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-300"
                                    )}
                                    title="Night"
                                  >
                                    {isNight ? "1" : "0"}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {med.duration || "5 days"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ADVICE & INSTRUCTIONS */}
              {prescriptionData.advice && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Icon icon={faNotesMedical} className="size-3.5 text-teal-700" />
                    <span>Doctor&apos;s Advice & Precautions</span>
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line pl-1">
                    {prescriptionData.advice}
                  </div>
                </div>
              )}

              {/* FOLLOW-UP REVIEW */}
              {prescriptionData.followUp && (
                <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Icon icon={faCalendarCheck} className="size-3.5 text-sky-700" />
                    <span className="font-semibold text-slate-700">Follow-Up Review:</span>
                    <strong className="text-sky-900 font-bold">{prescriptionData.followUp}</strong>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    Bring this prescription on next visit
                  </span>
                </div>
              )}

              {/* FOOTER & DOCTOR SIGNATURE */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-6 text-xs text-slate-500">
                <div>
                  <p>Computer generated medical prescription.</p>
                  <p>Take medicines strictly as prescribed by the doctor.</p>
                </div>
                <div className="text-center sm:text-right w-52 space-y-1">
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <div className="text-xs font-bold text-slate-900">
                    Dr. {prescriptionData.doctor.name}
                  </div>
                  {prescriptionData.doctor.registrationNo && (
                    <div className="text-[11px] font-mono text-slate-500">
                      Reg. No: {prescriptionData.doctor.registrationNo}
                    </div>
                  )}
                  <div className="text-[10px] text-teal-800 font-semibold uppercase">
                    Authorized Doctor Signature
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
          <div className="text-xs text-slate-500">
            {prescriptionData ? (
              <span>
                Prescribed by <strong className="text-slate-900">Dr. {prescriptionData.doctor.name}</strong> on{" "}
                <span className="font-semibold">{prescriptionData.date}</span>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !prescriptionData}
            >
              <Icon icon={faPrint} data-icon="inline-start" />
              <span>Print Prescription</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !prescriptionData}
            >
              <Icon icon={faDownload} data-icon="inline-start" />
              <span>Download PDF</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
