"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faXmark,
  faDownload,
  faPrint,
  faEye,
  faFilePdf,
  faFileInvoiceDollar,
  faBuilding,
  faUser,
  faUserDoctor,
  faCheck,
  faLanguage,
  faSpinner,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  getReceiptViewData,
  getPatientReceiptsList,
  type ReceiptViewData,
  type PatientReceiptSummary,
} from "@/actions/invoices";
import {
  RECEIPT_I18N,
  type PdfLanguage,
  translateAge,
  translateGender,
  translatePaymentMode,
  translateDoctorSpecialty,
  translateChiefComplaint,
  translateDiagnosis,
  translateLineItemDescription,
} from "@/lib/pdf/translations";
import { downloadBase64Pdf, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type ReceiptViewModalProps = {
  consultationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialLang?: PdfLanguage;
};

export function ReceiptViewModal({
  consultationId,
  isOpen,
  onClose,
  initialLang = "en",
}: ReceiptViewModalProps) {
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(
    consultationId
  );
  const [lang, setLang] = useState<PdfLanguage>(initialLang);
  const [viewMode, setViewMode] = useState<"paper" | "pdf">("paper");
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptViewData | null>(null);
  const [patientReceipts, setPatientReceipts] = useState<PatientReceiptSummary[]>([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Sync initial language when modal opens
  useEffect(() => {
    if (isOpen) {
      setLang(initialLang);
    }
  }, [isOpen, initialLang]);

  // Keep activeConsultationId synced when prop changes
  useEffect(() => {
    setActiveConsultationId(consultationId);
  }, [consultationId]);

  // Clean up previous blob URL
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Fetch receipt view data whenever activeConsultationId or lang changes
  useEffect(() => {
    if (!isOpen || !activeConsultationId) return;

    let isSubscribed = true;
    if (!receiptData) {
      setLoading(true);
    } else {
      setIsGeneratingPdf(true);
    }
    setError(null);

    void getReceiptViewData(activeConsultationId, lang).then((res) => {
      if (!isSubscribed) return;
      setLoading(false);
      setIsGeneratingPdf(false);

      if (!res.success) {
        setError(res.error);
        return;
      }

      setReceiptData(res.data);

      // Create PDF blob URL for embedding
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
          console.error("Failed to create blob for receipt PDF:", e);
        }
      }

      // Fetch all receipts for this patient so the doctor/cashier can view all past receipts
      if (res.data.patient?.id) {
        void getPatientReceiptsList(res.data.patient.id).then((pRes) => {
          if (!isSubscribed) return;
          if (pRes.success) {
            setPatientReceipts(pRes.data);
          }
        });
      }
    }).catch((err) => {
      if (!isSubscribed) return;
      setLoading(false);
      setIsGeneratingPdf(false);
      setError(err instanceof Error ? err.message : "Failed to load receipt.");
    });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, activeConsultationId, lang]);

  if (!isOpen) return null;

  const i18n = RECEIPT_I18N[lang];

  function handleDownload() {
    if (!receiptData?.pdfBase64) return;
    downloadBase64Pdf(receiptData.pdfBase64, receiptData.filename);
  }

  function handlePrint() {
    // If PDF blob URL is available, print via a hidden iframe
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl overflow-hidden">
        {/* MODAL TOP BAR */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shadow-2xs">
              <Icon icon={faReceipt} className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="receipt-modal-title"
                  className="font-display text-base font-bold text-slate-900"
                >
                  {i18n.documentTitle}
                </h2>
                {receiptData && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-700 border border-emerald-200">
                    <Icon icon={faCheck} className="size-2.5" />
                    {receiptData.invoiceNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Official GST Tax Invoice & Settled Payment Receipt
              </p>
            </div>
          </div>

          {/* CONTROLS & ACTIONS */}
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
                <Icon icon={faFileInvoiceDollar} className="size-3" />
                <span>{lang === "hi" ? "कागज़ रसीद" : "Paper Receipt"}</span>
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
                <span>{lang === "hi" ? "पीडीएफ रसीद" : "PDF Document"}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-all",
                  lang === "en"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-all",
                  lang === "hi"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                हिंदी
              </button>
            </div>

            {/* Quick Print & Download */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !receiptData}
              title="Print Receipt"
            >
              <Icon icon={faPrint} data-icon="inline-start" />
              <span>{i18n.printReceipt}</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !receiptData}
              title="Download Receipt PDF"
            >
              <Icon icon={faDownload} data-icon="inline-start" />
              <span>{i18n.downloadReceipt}</span>
            </Button>

            {/* Close Button */}
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

        {/* PATIENT'S ALL RECEIPTS SELECTOR (If patient has multiple receipts) */}
        {patientReceipts.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-sky-100 bg-sky-50/80 px-5 py-2 sm:px-6">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
              <Icon icon={faCalendarCheck} className="size-3 text-sky-700" />
              All Receipts for this Patient ({patientReceipts.length}):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {patientReceipts.map((rec) => {
                const isSelected = rec.consultationId === activeConsultationId;
                return (
                  <button
                    key={rec.invoiceId}
                    type="button"
                    onClick={() => setActiveConsultationId(rec.consultationId)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-all",
                      isSelected
                        ? "bg-sky-700 text-white shadow-2xs"
                        : "bg-white text-sky-800 border border-sky-200 hover:bg-sky-100"
                    )}
                  >
                    <span>{rec.invoiceNumber}</span>
                    <span className="text-[10px] opacity-80">
                      ({rec.date} · ₹{rec.amount.toFixed(0)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Icon icon={faSpinner} className="size-8 animate-spin text-sky-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Loading official tax receipt...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Fetching clinic verification and generating PDF preview
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
              <p className="font-semibold text-sm">Unable to display receipt</p>
              <p className="text-xs mt-1">{error}</p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (activeConsultationId) {
                      setLoading(true);
                      void getReceiptViewData(activeConsultationId, lang);
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : !receiptData ? null : viewMode === "pdf" ? (
            /* EMBEDDED PDF VIEWER CONTAINER */
            <div className="h-[75vh] w-full flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
              {/* TOP PDF BAR */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-xs text-white">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-teal-300">
                    {lang === "hi" ? "अधिकृत कर चालान एवं रसीद (PDF)" : "Official Tax Invoice & Receipt (PDF)"}
                  </span>
                  <span className="text-[11px] text-slate-400">· A4 Print Standard</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Icon icon={faDownload} className="size-3" />
                    <span>{i18n.downloadReceipt}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Icon icon={faPrint} className="size-3" />
                    <span>{i18n.printReceipt}</span>
                  </button>
                </div>
              </div>

              {/* VIEWER AREA */}
              <div className="flex-1 w-full h-full relative bg-slate-950 min-h-[500px]">
                {isGeneratingPdf || !pdfBlobUrl ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 p-6 min-h-[400px]">
                    <Icon icon={faSpinner} className="size-9 animate-spin text-teal-400 mb-3" />
                    <p className="text-sm font-semibold text-white">
                      {lang === "hi"
                        ? "पीडीएफ रसीद तैयार की जा रही है..."
                        : "Preparing high-resolution Receipt PDF..."}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === "hi"
                        ? "भुगतान विवरण एवं जीएसटी चालान लोड हो रहा है"
                        : "Formatting billing breakdown and authorized invoice"}
                    </p>
                  </div>
                ) : (
                  <object
                    data={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                    type="application/pdf"
                    className="w-full h-full border-0"
                  >
                    <iframe
                      src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                      className="w-full h-full border-0"
                      title="Tax Invoice PDF Preview"
                    >
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-200">
                        <p className="font-semibold text-base mb-3">
                          {lang === "hi"
                            ? "पीडीएफ रसीद दस्तावेज़ तैयार है"
                            : "PDF Receipt is ready"}
                        </p>
                        <div className="flex gap-3">
                          <Button onClick={handleDownload} variant="primary">
                            <Icon icon={faDownload} className="mr-1.5" />
                            {i18n.downloadReceipt}
                          </Button>
                          <Button onClick={handlePrint} variant="secondary">
                            <Icon icon={faPrint} className="mr-1.5" />
                            {i18n.printReceipt}
                          </Button>
                        </div>
                      </div>
                    </iframe>
                  </object>
                )}
              </div>
            </div>
          ) : (
            /* PAPER RECEIPT CARD VIEW */
            <div className="max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md text-slate-800 space-y-6">
              {/* HEADER: Clinic Letterhead & Invoice Badge */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-start gap-3">
                  {receiptData.clinic.logoUrl && (
                    <img
                      src={receiptData.clinic.logoUrl}
                      alt={receiptData.clinic.name}
                      className="size-14 rounded-lg object-contain border border-slate-100"
                    />
                  )}
                  <div>
                    <h1 className="font-display text-xl font-bold text-slate-900 leading-tight">
                      {receiptData.clinic.name}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {receiptData.clinic.address}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">Phone:</span>{" "}
                      {receiptData.clinic.phone}
                      {receiptData.clinic.email && (
                        <span> | Email: {receiptData.clinic.email}</span>
                      )}
                    </p>
                    {receiptData.clinic.gstin && (
                      <p className="text-xs font-semibold text-sky-800">
                        GSTIN: {receiptData.clinic.gstin}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Badge */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:text-right min-w-[200px]">
                  <span className="inline-block rounded-md bg-sky-700 px-2 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    {i18n.documentTitle}
                  </span>
                  <div className="mt-2 text-xs space-y-0.5">
                    <div>
                      <span className="text-slate-500">{i18n.invoiceNo} </span>
                      <strong className="text-slate-900 font-mono">
                        {receiptData.invoiceNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{i18n.date} </span>
                      <strong className="text-slate-900">{receiptData.date}</strong>
                    </div>
                    {receiptData.tokenNumber && (
                      <div>
                        <span className="text-slate-500">{i18n.token} </span>
                        <strong className="text-sky-700 font-bold">
                          #{receiptData.tokenNumber}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PATIENT & DOCTOR TWO-COLUMN BOX */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Patient Information */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200/70">
                    <Icon icon={faUser} className="size-3 text-sky-600" />
                    <span>{i18n.patientInfoTitle}</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{i18n.patientName}</span>
                      <strong className="text-slate-900 font-medium">
                        {receiptData.patient.name}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{i18n.mrn}</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {receiptData.patient.mrn}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{i18n.ageGender}</span>
                      <span>
                        {translateAge(receiptData.patient.age, lang)} /{" "}
                        {translateGender(receiptData.patient.gender, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{i18n.contact}</span>
                      <span>{receiptData.patient.phone || "—"}</span>
                    </div>
                    {receiptData.patient.address && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{i18n.address}</span>
                        <span className="text-right truncate max-w-[180px]">
                          {receiptData.patient.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Consulting Doctor */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200/70">
                    <Icon icon={faUserDoctor} className="size-3 text-sky-600" />
                    <span>{i18n.doctorInfoTitle}</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{i18n.doctorName}</span>
                      <strong className="text-slate-900 font-medium">
                        {lang === "hi" ? "डॉ. " : "Dr. "}
                        {receiptData.doctor.name.replace(/^Dr\.?\s+/i, "")}
                      </strong>
                    </div>
                    {receiptData.doctor.specialty && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{i18n.specialty}</span>
                        <span>{translateDoctorSpecialty(receiptData.doctor.specialty, lang)}</span>
                      </div>
                    )}
                    {receiptData.doctor.registrationNo && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{i18n.regNo}</span>
                        <span className="font-mono text-slate-700">
                          {receiptData.doctor.registrationNo}
                        </span>
                      </div>
                    )}
                    {receiptData.queueDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{i18n.visitDate}</span>
                        <span>{receiptData.queueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CLINICAL SUMMARY & VITALS (If present) */}
              {(receiptData.chiefComplaint ||
                receiptData.diagnosis ||
                receiptData.vitals) && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 text-xs space-y-2">
                  {receiptData.vitals && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-600">{i18n.vitalsTitle}:</span>
                      {receiptData.vitals.bp && (
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">
                          {i18n.bp}: {receiptData.vitals.bp} mmHg
                        </span>
                      )}
                      {receiptData.vitals.pulse && (
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">
                          {i18n.pulse}: {receiptData.vitals.pulse} bpm
                        </span>
                      )}
                      {receiptData.vitals.weight && (
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">
                          {i18n.weight}: {receiptData.vitals.weight} kg
                        </span>
                      )}
                      {receiptData.vitals.temp && (
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">
                          {i18n.temp}: {receiptData.vitals.temp} °F
                        </span>
                      )}
                      {receiptData.vitals.spo2 && (
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200 text-slate-700">
                          {i18n.spo2}: {receiptData.vitals.spo2} %
                        </span>
                      )}
                    </div>
                  )}

                  {(receiptData.chiefComplaint || receiptData.diagnosis) && (
                    <div className="flex flex-col sm:flex-row gap-4 pt-1 border-t border-slate-200/60">
                      {receiptData.chiefComplaint && (
                        <div className="flex-1">
                          <span className="font-semibold text-slate-600">
                            {i18n.chiefComplaint}{" "}
                          </span>
                          <span className="text-slate-800">
                            {translateChiefComplaint(receiptData.chiefComplaint, lang)}
                          </span>
                        </div>
                      )}
                      {receiptData.diagnosis && (
                        <div className="flex-1">
                          <span className="font-semibold text-slate-600">
                            {i18n.diagnosis}{" "}
                          </span>
                          <span className="text-slate-800">
                            {translateDiagnosis(receiptData.diagnosis, lang)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ITEMIZED SERVICES TABLE */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">{i18n.tableIndex}</th>
                      <th className="py-2.5 px-3">{i18n.tableDesc}</th>
                      <th className="py-2.5 px-3 w-28 text-center">{i18n.tableSac}</th>
                      <th className="py-2.5 px-3 w-28 text-right">{i18n.tableAmount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receiptData.lineItems && receiptData.lineItems.length > 0 ? (
                      receiptData.lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {translateLineItemDescription(item.description, lang)}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                            999312
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-900">
                            ₹{Number(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          1
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {lang === "hi"
                            ? "ओपीडी डॉक्टर परामर्श एवं चिकित्सीय मूल्यांकन"
                            : "OPD Doctor Consultation & Clinical Assessment"}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                          999312
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-900">
                          ₹{receiptData.amount.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTALS & SETTLEMENT BREAKDOWN */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
                {/* Left: Payment Status Stamp & Mode */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-1.5 min-w-[240px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <Icon icon={faCheck} className="size-3.5 text-emerald-600" />
                    <span>{i18n.statusPaid}</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="text-slate-500">{i18n.paymentMode} </span>
                    <strong className="uppercase font-semibold">
                      {translatePaymentMode(receiptData.paymentMode, lang)}
                    </strong>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    {i18n.verifiedReceipt}
                  </div>
                </div>

                {/* Right: Calculations */}
                <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{i18n.subtotal}</span>
                    <span className="font-mono">
                      ₹{receiptData.taxableAmount.toFixed(2)}
                    </span>
                  </div>

                  {receiptData.taxRate > 0 && receiptData.taxAmount > 0 && (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">
                          {i18n.taxRate} ({receiptData.taxRate}%)
                        </span>
                        <span className="font-mono">
                          ₹{receiptData.taxAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center py-2 border-t-2 border-slate-900 text-slate-900 font-bold text-sm">
                    <span>{i18n.totalPaid}</span>
                    <span className="font-mono text-base text-sky-800">
                      ₹{receiptData.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* DISCLAIMER & SIGNATURE */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-6 text-xs text-slate-500">
                <div className="max-w-md whitespace-pre-line text-[11px] leading-relaxed">
                  {i18n.terms}
                </div>
                <div className="text-center sm:text-right w-44 space-y-1">
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <div className="text-[11px] font-semibold text-slate-700">
                    {i18n.authorizedSignatory}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {receiptData.clinic.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
          <div className="text-xs text-slate-500">
            {receiptData ? (
              <span>
                {lang === "hi" ? (
                  <>
                    कुल भुगतान की गई राशि:{" "}
                    <strong className="text-slate-900 font-mono">
                      ₹{receiptData.amount.toFixed(2)}
                    </strong>{" "}
                    ({translatePaymentMode(receiptData.paymentMode, lang)} द्वारा)
                  </>
                ) : (
                  <>
                    Total Amount Paid:{" "}
                    <strong className="text-slate-900 font-mono">
                      ₹{receiptData.amount.toFixed(2)}
                    </strong>{" "}
                    via{" "}
                    <span className="uppercase font-semibold text-slate-700">
                      {receiptData.paymentMode}
                    </span>
                  </>
                )}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              {i18n.close}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !receiptData}
            >
              <Icon icon={faPrint} data-icon="inline-start" />
              <span>{i18n.printReceipt}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !receiptData}
            >
              <Icon icon={faDownload} data-icon="inline-start" />
              <span>{i18n.downloadReceipt}</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
