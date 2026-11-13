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
import { ReceiptPaperView } from "@/components/billing/ReceiptPaperView";
import { generatePrintableReceiptHtml } from "@/lib/pdf/print-html";
import {
  isDesktopApp,
  openDesktopPdf,
  printDesktopHtml,
} from "@/lib/electron-bridge";

export type ReceiptViewModalProps = {
  consultationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialLang?: PdfLanguage;
  autoPrint?: boolean;
};

export function ReceiptViewModal({
  consultationId,
  isOpen,
  onClose,
  initialLang = "en",
  autoPrint = false,
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
  const [hasTriggeredAutoPrint, setHasTriggeredAutoPrint] = useState(false);

  // Sync initial language when modal opens
  useEffect(() => {
    if (isOpen) {
      setLang(initialLang);
      setHasTriggeredAutoPrint(false);
    }
  }, [isOpen, initialLang]);

  // Handle autoPrint trigger when ready
  useEffect(() => {
    if (isOpen && autoPrint && !hasTriggeredAutoPrint && !loading && receiptData && pdfBlobUrl) {
      setHasTriggeredAutoPrint(true);
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, hasTriggeredAutoPrint, loading, receiptData, pdfBlobUrl]);

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

  async function handleOpenSystemPdf() {
    if (!receiptData?.pdfBase64) return;

    if (isDesktopApp()) {
      const res = await openDesktopPdf(
        receiptData.pdfBase64,
        receiptData.filename
      );
      if (res.success) return;
    }

    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
      return;
    }

    handleDownload();
  }

  async function handlePrint() {
    if (!receiptData) return;

    const printableHtml = generatePrintableReceiptHtml(receiptData, lang);

    if (isDesktopApp()) {
      try {
        const res = await printDesktopHtml(printableHtml);
        if (res.success) return;
      } catch (e) {
        console.warn("Desktop receipt print failed, falling back to iframe:", e);
      }
    }

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
          console.error("Receipt iframe print execution error:", e);
        } finally {
          setTimeout(() => {
            iframe.remove();
          }, 4000);
        }
      }, 350);
      return;
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printableHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* MODAL TOP BAR */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shadow-2xs">
              <Icon icon={faReceipt} className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="receipt-modal-title"
                  className="font-display text-base font-bold text-slate-900 dark:text-white"
                >
                  {i18n.documentTitle}
                </h2>
                {receiptData && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Icon icon={faCheck} className="size-2.5" />
                    {receiptData.invoiceNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official GST Tax Invoice & Settled Payment Receipt
              </p>
            </div>
          </div>

          {/* CONTROLS & ACTIONS */}
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
                <Icon icon={faFileInvoiceDollar} className="size-3" />
                <span>{lang === "hi" ? "कागज़ रसीद" : "Paper Receipt"}</span>
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
                <span>{lang === "hi" ? "पीडीएफ रसीद" : "PDF Document"}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer",
                  lang === "en"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer",
                  lang === "hi"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                हिंदी
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
            /* PDF DIGITAL A4 DOCUMENT HUB */
            <div className="w-full flex flex-col rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xl overflow-hidden">
              {/* TOP PDF BAR */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-xs text-white">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-teal-300">
                    {lang === "hi" ? "अधिकृत कर चालान एवं रसीद (PDF)" : "Official Tax Invoice & Receipt (PDF)"}
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
                    <span>{i18n.downloadReceipt}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Icon icon={faPrint} className="size-3" />
                    <span>{i18n.printReceipt}</span>
                  </button>
                </div>
              </div>

              {/* DOCUMENT VIEW AREA - CLEAN CRISP DESK WITH SHADOWED A4 SHEET */}
              <div className="flex-1 w-full bg-slate-200/90 dark:bg-slate-950/80 p-3 sm:p-6 overflow-y-auto max-h-[72vh] flex flex-col items-center">
                {isGeneratingPdf && !receiptData ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 dark:text-slate-300 p-8 min-h-[400px]">
                    <Icon icon={faSpinner} className="size-9 animate-spin text-teal-600 dark:text-teal-400 mb-3" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {lang === "hi"
                        ? "पीडीएफ रसीद तैयार की जा रही है..."
                        : "Preparing high-resolution Receipt PDF..."}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {lang === "hi"
                        ? "भुगतान विवरण एवं जीएसटी चालान लोड हो रहा है"
                        : "Formatting billing breakdown and authorized invoice"}
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-3xl space-y-3">
                    <div className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-2xs flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-medium flex items-center gap-1.5">
                        <Icon icon={faCheck} className="size-3 text-emerald-600" />
                        {lang === "hi" ? "A4 लेआउट सत्यापन पूर्ण" : "A4 Print Standard Receipt Ready"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {receiptData.filename}
                      </span>
                    </div>

                    <ReceiptPaperView data={receiptData} lang={lang} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* PAPER RECEIPT CARD VIEW */
            <ReceiptPaperView data={receiptData} lang={lang} />
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
              disabled={loading || !receiptData}
              className="h-8 gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Icon icon={faPrint} className="size-3 text-white" />
              <span>{i18n.printReceipt}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !receiptData}
              className="h-8 gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Icon icon={faDownload} className="size-3 text-white" />
              <span>{i18n.downloadReceipt}</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
