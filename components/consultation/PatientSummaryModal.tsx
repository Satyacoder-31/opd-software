"use client";

import { useEffect, useState, useTransition } from "react";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faFileContract,
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
  faStethoscope,
  faFlaskVial,
  faXRay,
  faCapsules,
} from "@fortawesome/free-solid-svg-icons";
import {
  getPatientOutpatientSummary,
  type PatientOutpatientSummaryData,
} from "@/actions/consultations";
import { downloadBase64Pdf, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type PatientSummaryModalProps = {
  consultationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialLang?: "en" | "hi";
};

export function PatientSummaryModal({
  consultationId,
  isOpen,
  onClose,
  initialLang = "en",
}: PatientSummaryModalProps) {
  const [lang, setLang] = useState<"en" | "hi">(initialLang);
  const [viewMode, setViewMode] = useState<"paper" | "pdf">("paper");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<PatientOutpatientSummaryData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPendingLang, startTransition] = useTransition();

  // Clean up blob URL
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Fetch summary data
  useEffect(() => {
    if (!isOpen || !consultationId) return;

    let isSubscribed = true;
    setLoading(true);
    setError(null);

    void getPatientOutpatientSummary(consultationId, lang).then((res) => {
      if (!isSubscribed) return;
      setLoading(false);

      if (!res.success) {
        setError(res.error);
        return;
      }

      setSummaryData(res.data);

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
          console.error("Failed to create blob for outpatient summary PDF:", e);
        }
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, consultationId, lang]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!summaryData?.pdfBase64) return;
    downloadBase64Pdf(summaryData.pdfBase64, summaryData.filename);
  };

  const handlePrint = () => {
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
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {
            window.open(pdfBlobUrl, "_blank");
          }
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 3000);
        }, 300);
      };
    } else {
      window.print();
    }
  };

  const parseDoseSchedule = (freq: string | undefined) => {
    if (!freq) return { m: "-", a: "-", e: "-", n: "-" };
    const parts = freq.split(/[-/]/).map((p) => p.trim());
    if (parts.length === 3) {
      return { m: parts[0] || "-", a: parts[1] || "-", e: "-", n: parts[2] || "-" };
    }
    if (parts.length === 4) {
      return { m: parts[0] || "-", a: parts[1] || "-", e: parts[2] || "-", n: parts[3] || "-" };
    }
    return { m: freq, a: "-", e: "-", n: "-" };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
    >
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/30">
              <Icon icon={faFileContract} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="summary-modal-title" className="text-base font-semibold tracking-wide text-white">
                  Outpatient Summary & Prescription
                </h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  Apollo Standard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete clinical visit summary, findings, investigation & prescription
              </p>
            </div>
          </div>

          {/* Action Buttons & Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("paper")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors",
                  viewMode === "paper"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon icon={faFileLines} className="text-xs" />
                Paper View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors",
                  viewMode === "pdf"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon icon={faFilePdf} className="text-xs" />
                PDF Preview
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => {
                  startTransition(() => setLang("en"));
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-md font-semibold transition-colors",
                  lang === "en"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                )}
                disabled={isPendingLang}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  startTransition(() => setLang("hi"));
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-md font-semibold transition-colors",
                  lang === "hi"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                )}
                disabled={isPendingLang}
              >
                हिन्दी
              </button>
            </div>

            {/* Print Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !summaryData}
              className="bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 h-8 gap-1.5 text-xs font-semibold"
            >
              <Icon icon={faPrint} />
              Print
            </Button>

            {/* Download PDF Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !summaryData}
              className="bg-teal-600 hover:bg-teal-500 text-white h-8 gap-1.5 text-xs font-semibold"
            >
              <Icon icon={faDownload} />
              Download PDF
            </Button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              aria-label="Close"
            >
              <Icon icon={faXmark} className="text-lg" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <Icon icon={faSpinner} spin className="text-3xl text-teal-600 mb-3" />
              <p className="text-sm font-medium">Generating Outpatient Summary & Prescription...</p>
              <p className="text-xs text-slate-400 mt-1">Compiling vitals, history, investigations, and medicines</p>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
              <Icon icon={faTriangleExclamation} className="text-red-500 text-2xl mb-2" />
              <h3 className="font-semibold text-red-900 text-sm">Failed to Load Summary</h3>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (consultationId) {
                    setLoading(true);
                    setError(null);
                    void getPatientOutpatientSummary(consultationId, lang).then((res) => {
                      setLoading(false);
                      if (res.success) setSummaryData(res.data);
                      else setError(res.error);
                    });
                  }
                }}
                className="mt-4 text-xs"
              >
                Retry
              </Button>
            </div>
          ) : viewMode === "pdf" && pdfBlobUrl ? (
            <div className="w-full h-[70vh] bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-slate-300">
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Outpatient Summary PDF Preview"
              />
            </div>
          ) : summaryData ? (
            /* High Fidelity Paper Summary Document */
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200/80 p-8 text-slate-800 text-[13px] leading-relaxed font-sans">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
                <div className="max-w-md">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
                    {summaryData.doctor.name.startsWith("Dr.")
                      ? summaryData.doctor.name
                      : `Dr. ${summaryData.doctor.name}`}
                  </h1>
                  {summaryData.doctor.specialty && (
                    <div className="text-xs font-semibold text-teal-700 tracking-wide uppercase mt-0.5">
                      {summaryData.doctor.specialty}
                    </div>
                  )}
                  {summaryData.doctor.qualifications && (
                    <div className="text-xs text-slate-600 mt-0.5">
                      {summaryData.doctor.qualifications}
                    </div>
                  )}
                  {summaryData.doctor.registrationNo && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Reg. No: {summaryData.doctor.registrationNo}
                    </div>
                  )}
                  {summaryData.doctor.email && (
                    <div className="text-[11px] text-slate-500">
                      Email: {summaryData.doctor.email}
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="text-xs font-extrabold tracking-wider uppercase bg-teal-50 text-teal-800 px-2.5 py-1 rounded border border-teal-200 mb-1">
                    Outpatient Summary and Prescription
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {summaryData.clinic.name}
                  </div>
                  <div className="text-xs text-slate-500 max-w-xs text-right">
                    {summaryData.clinic.address}
                  </div>
                  <div className="text-xs text-slate-500">
                    Phone: {summaryData.clinic.phone}
                  </div>
                </div>
              </div>

              {/* Patient Demographics Container */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 mb-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Patient Name</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {summaryData.patient.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">UHID / MRN</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {summaryData.patient.uhid}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">OP Number</span>
                    <span className="font-semibold text-slate-900">
                      {summaryData.patient.opNumber || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Visit Date</span>
                    <span className="font-semibold text-slate-900">
                      {summaryData.visitDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Age / Gender</span>
                    <span className="font-medium text-slate-800">
                      {[summaryData.patient.age, summaryData.patient.gender].filter(Boolean).join(" / ") || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Date of Birth</span>
                    <span className="font-medium text-slate-800">
                      {summaryData.patient.dob || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Phone</span>
                    <span className="font-medium text-slate-800">
                      {summaryData.patient.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Address</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {summaryData.patient.address || "-"}
                    </span>
                  </div>
                </div>

                {/* Allergies Highlight */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Allergy Status:</span>
                    {summaryData.patient.allergies ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold border border-red-200">
                        <Icon icon={faTriangleExclamation} className="text-xs" />
                        {summaryData.patient.allergies}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                        <Icon icon={faCheck} className="text-xs" />
                        No Known Drug Allergies
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">Apollo Clinical Verification</span>
                </div>
              </div>

              {/* SECTION 1: CHIEF COMPLAINTS */}
              {summaryData.chiefComplaints && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">1.</span> CHIEF COMPLAINTS
                  </div>
                  <div className="pl-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {summaryData.chiefComplaints}
                  </div>
                </div>
              )}

              {/* SECTION 2: HISTORY OF PRESENT ILLNESS */}
              {summaryData.historyOfPresentIllness && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">2.</span> HISTORY OF PRESENT ILLNESS
                  </div>
                  <div className="pl-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {summaryData.historyOfPresentIllness}
                  </div>
                </div>
              )}

              {/* SECTION 3: CURRENT MEDICATION */}
              {summaryData.currentMedications && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">3.</span> CURRENT MEDICATION & MEDICAL HISTORY
                  </div>
                  <div className="pl-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {summaryData.currentMedications}
                  </div>
                </div>
              )}

              {/* SECTION 4: PHYSICAL & JOINT EXAMINATION */}
              {summaryData.physicalExamination && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">4.</span> PHYSICAL & JOINT EXAMINATION
                  </div>
                  <div className="pl-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {summaryData.physicalExamination}
                  </div>
                </div>
              )}

              {/* SECTION 5: CLINICAL DIAGNOSIS */}
              <div className="mb-4">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                  <span className="text-teal-600 font-extrabold">5.</span> CLINICAL DIAGNOSIS
                </div>
                <div className="pl-4 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {summaryData.diagnosis}
                  </span>
                  {summaryData.diagnosisType && (
                    <span className="text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                      ({summaryData.diagnosisType})
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION 6: INVESTIGATION RESULTS */}
              {summaryData.investigationResults && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">6.</span> INVESTIGATION RESULTS (IMAGING / DIAGNOSTICS)
                  </div>
                  <div className="pl-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {summaryData.investigationResults}
                  </div>
                </div>
              )}

              {/* SECTION 7: LABS */}
              {summaryData.labs && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">7.</span> LABS & PATHOLOGY PARAMETERS
                  </div>
                  <div className="pl-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                    {summaryData.labs}
                  </div>
                </div>
              )}

              {/* SECTION 8: OUTPATIENT PRESCRIPTION & MEDICINES */}
              <div className="mb-5">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">8.</span> OUTPATIENT PRESCRIPTION & MEDICINES
                  </div>
                  <span className="text-[11px] font-normal text-slate-500">
                    {summaryData.medicines.length} prescribed items
                  </span>
                </div>

                {summaryData.medicines.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Medicines & Strength</th>
                          <th className="py-2.5 px-3 text-center">Schedule (M - A - E - N)</th>
                          <th className="py-2.5 px-3">Dosage / Route</th>
                          <th className="py-2.5 px-3">Timing</th>
                          <th className="py-2.5 px-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {summaryData.medicines.map((med, idx) => {
                          const sched = parseDoseSchedule(med.frequency);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-slate-400 text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 uppercase tracking-tight">
                                  {med.name}
                                </div>
                                {med.instructions && (
                                  <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                                    {med.instructions}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center justify-center gap-1 text-[11px]">
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-semibold" title="Morning">
                                    {sched.m}
                                  </span>
                                  <span className="text-slate-300">-</span>
                                  <span className="px-1.5 py-0.5 bg-orange-50 text-orange-900 border border-orange-200 rounded font-semibold" title="Afternoon">
                                    {sched.a}
                                  </span>
                                  <span className="text-slate-300">-</span>
                                  <span className="px-1.5 py-0.5 bg-sky-50 text-sky-900 border border-sky-200 rounded font-semibold" title="Evening">
                                    {sched.e}
                                  </span>
                                  <span className="text-slate-300">-</span>
                                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded font-semibold" title="Night">
                                    {sched.n}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {med.dosage}
                                {med.route && (
                                  <span className="text-[11px] text-slate-400 block">
                                    {med.route}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                                  {med.frequency || "As advised"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {med.duration || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 italic text-center">
                    No prescription medicines recorded for this consultation.
                  </div>
                )}
              </div>

              {/* SECTION 9: ADVICE & PRECAUTIONS */}
              {summaryData.advice && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">9.</span> ADVICE & PRECAUTIONS
                  </div>
                  <div className="pl-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {summaryData.advice}
                  </div>
                </div>
              )}

              {/* SECTION 10: FOLLOW UP & REVIEW */}
              {summaryData.followUp && (
                <div className="mb-6">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                    <span className="text-teal-600 font-extrabold">10.</span> FOLLOW-UP REVIEW
                  </div>
                  <div className="pl-4 text-xs font-bold text-teal-800">
                    {summaryData.followUp}
                  </div>
                </div>
              )}

              {/* Footer & Signature Block */}
              <div className="border-t-2 border-slate-300 pt-6 mt-8 flex items-end justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">
                    Generated on {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    This document serves as an authentic electronic outpatient medical record.
                  </div>
                </div>

                <div className="text-right">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1 w-48 ml-auto"></div>
                  <div className="font-bold text-slate-900">
                    {summaryData.doctor.name.startsWith("Dr.")
                      ? summaryData.doctor.name
                      : `Dr. ${summaryData.doctor.name}`}
                  </div>
                  {summaryData.doctor.qualifications && (
                    <div className="text-[11px] text-slate-500">
                      {summaryData.doctor.qualifications}
                    </div>
                  )}
                  {summaryData.doctor.registrationNo && (
                    <div className="text-[11px] text-slate-500">
                      Reg. No: {summaryData.doctor.registrationNo}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
