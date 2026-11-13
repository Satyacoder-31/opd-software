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
  faBandage,
  faSun,
  faMoon,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import {
  getPrescriptionViewData,
  type PrescriptionViewData,
} from "@/actions/prescriptions";
import { downloadBase64Pdf, cn } from "@/lib/utils";
import { getGenericCompositionForDrug } from "@/lib/drug-catalog";
import { parseDoseSchedule } from "@/lib/pdf/prescription";
import {
  PRESCRIPTION_I18N,
  translateAge,
  translateGender,
  translatePastHistory,
  translateDoctorSpecialty,
  translateChiefComplaint,
  translateDiagnosis,
  translateDosage,
  translateRoute,
  translateDuration,
  translateInstructions,
  translateAdviceText,
  translateFollowUp,
  translatePlasterName,
  translatePlasterSite,
  translatePlasterDuration,
  translatePlasterInstruction,
} from "@/lib/pdf/translations";
import { Button } from "@/components/ui/Button";
import { PrescriptionPaperView } from "@/components/consultation/PrescriptionPaperView";
import { generatePrintablePrescriptionHtml } from "@/lib/pdf/print-html";
import {
  isDesktopApp,
  openDesktopPdf,
  printDesktopHtml,
} from "@/lib/electron-bridge";

export type PrescriptionViewModalProps = {
  consultationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialLang?: "en" | "hi";
  autoPrint?: boolean;
};

export function PrescriptionViewModal({
  consultationId,
  isOpen,
  onClose,
  initialLang = "en",
  autoPrint = false,
}: PrescriptionViewModalProps) {
  const [lang, setLang] = useState<"en" | "hi">(initialLang);
  const [viewMode, setViewMode] = useState<"paper" | "pdf">("paper");
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionViewData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [hasTriggeredAutoPrint, setHasTriggeredAutoPrint] = useState(false);

  // Sync initial language whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setLang(initialLang);
      setHasTriggeredAutoPrint(false);
    }
  }, [isOpen, initialLang]);

  // Handle autoPrint trigger when ready (prints cleanly without waiting for blob)
  useEffect(() => {
    if (isOpen && autoPrint && !hasTriggeredAutoPrint && !loading && prescriptionData) {
      setHasTriggeredAutoPrint(true);
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, hasTriggeredAutoPrint, loading, prescriptionData]);

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
    if (!prescriptionData) {
      setLoading(true);
    } else {
      setIsGeneratingPdf(true);
    }
    setError(null);

    void getPrescriptionViewData(consultationId, lang)
      .then((res) => {
        if (!isSubscribed) return;
        setLoading(false);
        setIsGeneratingPdf(false);

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
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setLoading(false);
        setIsGeneratingPdf(false);
        setError(err instanceof Error ? err.message : "Failed to load prescription.");
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

  async function handleOpenSystemPdf() {
    if (!prescriptionData?.pdfBase64) return;

    // In Electron desktop app: open directly in Windows default PDF viewer (Adobe / Edge)
    if (isDesktopApp()) {
      const res = await openDesktopPdf(
        prescriptionData.pdfBase64,
        prescriptionData.filename
      );
      if (res.success) return;
    }

    // In browser: open in new tab
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
      return;
    }

    handleDownload();
  }

  async function handlePrint() {
    if (!prescriptionData) return;

    const printableHtml = generatePrintablePrescriptionHtml(prescriptionData, lang);

    // If running in Electron desktop app, print directly via hidden window
    if (isDesktopApp()) {
      try {
        const res = await printDesktopHtml(printableHtml);
        if (res.success) return;
      } catch (e) {
        console.warn("Desktop native print failed, falling back to iframe:", e);
      }
    }

    // Web browsers & Electron fallback: Hidden iframe printing with pure A4 HTML
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printableHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Iframe print execution error:", e);
        } finally {
          setTimeout(() => {
            iframe.remove();
          }, 4000);
        }
      }, 350);
      return;
    }

    // Absolute fallback: new window print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printableHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  const hasAllergies = Boolean(prescriptionData?.patient.allergies?.trim());
  const i18n = PRESCRIPTION_I18N[lang];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rx-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 shadow-2xs">
              <Icon icon={faPrescription} className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="rx-modal-title" className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {lang === "hi" ? "चिकित्सीय पर्चा एवं उपचार विवरण" : "Prescription & Treatment Plan"}
                </h2>
                {prescriptionData && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Icon icon={faCheck} className="size-2.5" />
                    {lang === "hi" ? "चिकित्सक द्वारा सत्यापित" : "Doctor Verified"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === "hi"
                  ? "अधिकृत ओपीडी चिकित्सीय पर्चा, खुराक समय सारणी एवं सावधानियां"
                  : "Official OPD medical prescription, dosing schedule, and precautions"}
              </p>
            </div>
          </div>

          {/* ACTIONS & CONTROLS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("paper")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer",
                  viewMode === "paper"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon icon={faFileLines} className="size-3" />
                <span>{lang === "hi" ? "कागज़ प्रारूप" : "Paper Rx"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer",
                  viewMode === "pdf"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon icon={faFilePdf} className="size-3" />
                <span>{lang === "hi" ? "पीडीएफ प्रारूप" : "PDF Document"}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all cursor-pointer",
                  lang === "en"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
                title="View prescription in English"
              >
                <span>EN</span>
                <span className="text-[10px] font-normal opacity-85">(English)</span>
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all cursor-pointer",
                  lang === "hi"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
                title="चिकित्सीय पर्चा हिंदी में देखें"
              >
                <span>हिंदी</span>
                <span className="text-[10px] font-normal opacity-85">(Hindi)</span>
              </button>
            </div>

            {/* Print & Download - Highly visible, vibrant and always prominent */}
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !prescriptionData}
              title="Print Prescription (Ctrl+P)"
              className="h-8 gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Icon icon={faPrint} className="size-3 text-white" />
              <span>{i18n.printPrescription}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !prescriptionData}
              title="Download Prescription PDF"
              className="h-8 gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Icon icon={faDownload} className="size-3 text-white" />
              <span>{i18n.downloadPrescription}</span>
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
          ) : !prescriptionData ? null : viewMode === "pdf" ? (
            /* PDF DIGITAL A4 DOCUMENT HUB */
            <div className="w-full flex flex-col rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xl overflow-hidden">
              {/* TOP PDF BAR */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-xs text-white">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-teal-300">
                    {lang === "hi" ? "अधिकृत डिजिटल पर्चा (PDF)" : "Official Digital Rx (PDF)"}
                  </span>
                  <span className="text-[11px] text-slate-300 hidden sm:inline">
                    · A4 High-Resolution Print Standard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenSystemPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    title="Open in Adobe Acrobat Reader or Windows Edge PDF Viewer"
                  >
                    <Icon icon={faFilePdf} className="size-3 text-white" />
                    <span>{lang === "hi" ? "रीडर में खोलें" : "Open in PDF App"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Icon icon={faDownload} className="size-3" />
                    <span>{i18n.downloadPrescription}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Icon icon={faPrint} className="size-3" />
                    <span>{i18n.printPrescription}</span>
                  </button>
                </div>
              </div>

              {/* DOCUMENT VIEW AREA - CLEAN CRISP DESK WITH SHADOWED A4 SHEET */}
              <div className="flex-1 w-full bg-slate-200/90 dark:bg-slate-950/80 p-3 sm:p-6 overflow-y-auto max-h-[72vh] flex flex-col items-center">
                {isGeneratingPdf && !prescriptionData ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 dark:text-slate-300 p-8 min-h-[400px]">
                    <Icon icon={faSpinner} className="size-9 animate-spin text-teal-600 dark:text-teal-400 mb-3" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {lang === "hi"
                        ? "पीडीएफ पर्चा तैयार किया जा रहा है..."
                        : "Preparing high-resolution PDF..."}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {lang === "hi"
                        ? "वेक्टर फॉन्ट एवं क्लिनिक लेआउट लोड हो रहा है"
                        : "Formatting vector fonts and letterhead"}
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-3xl space-y-3">
                    <div className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-2xs flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-medium flex items-center gap-1.5">
                        <Icon icon={faCheck} className="size-3 text-emerald-600" />
                        {lang === "hi" ? "A4 लेआउट सत्यापन पूर्ण" : "A4 Print Standard Document Ready"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {prescriptionData.filename}
                      </span>
                    </div>

                    <PrescriptionPaperView data={prescriptionData} lang={lang} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* PAPER RX VIEW */
            <PrescriptionPaperView data={prescriptionData} lang={lang} />
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
          <div className="text-xs text-slate-500">
            {prescriptionData ? (
              <span>
                {lang === "hi" ? (
                  <>
                    <strong className="text-slate-900">
                      डॉ. {prescriptionData.doctor.name.replace(/^Dr\.?\s+/i, "")}
                    </strong>{" "}
                    द्वारा <span className="font-semibold">{prescriptionData.date}</span> को जारी अधिकृत पर्चा
                  </>
                ) : (
                  <>
                    Prescribed by <strong className="text-slate-900">Dr. {prescriptionData.doctor.name}</strong> on{" "}
                    <span className="font-semibold">{prescriptionData.date}</span>
                  </>
                )}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-medium text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {i18n.close}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !prescriptionData}
              className="h-8 gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Icon icon={faPrint} className="size-3 text-white" />
              <span>{i18n.printPrescription}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !prescriptionData}
              className="h-8 gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Icon icon={faDownload} className="size-3 text-white" />
              <span>{i18n.downloadPrescription}</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
