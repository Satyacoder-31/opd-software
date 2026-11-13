"use client";

import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserDoctor,
  faNotesMedical,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import type { ReceiptViewData } from "@/actions/invoices";
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
import { cn } from "@/lib/utils";

export type ReceiptPaperViewProps = {
  data: ReceiptViewData;
  lang: PdfLanguage;
  className?: string;
};

export function ReceiptPaperView({
  data,
  lang,
  className,
}: ReceiptPaperViewProps) {
  const i18n = RECEIPT_I18N[lang];
  const lineItems = data.lineItems || [];

  return (
    <div
      id="printable-receipt"
      className={cn(
        "max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md text-slate-800 space-y-6",
        className
      )}
    >
      {/* HEADER: Clinic Letterhead & Invoice Badge */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3">
          {data.clinic.logoUrl && (
            <img
              src={data.clinic.logoUrl}
              alt={data.clinic.name}
              className="size-14 rounded-lg object-contain border border-slate-100"
            />
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 leading-tight">
              {data.clinic.name}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {data.clinic.address}
            </p>
            <p className="text-xs text-slate-600">
              <span className="font-semibold">Phone:</span> {data.clinic.phone}
              {data.clinic.email && (
                <span> | Email: {data.clinic.email}</span>
              )}
            </p>
            {data.clinic.gstin && (
              <p className="text-xs font-semibold text-sky-800">
                GSTIN: {data.clinic.gstin}
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
                {data.invoiceNumber}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">{i18n.date} </span>
              <strong className="text-slate-900">{data.date}</strong>
            </div>
            {data.tokenNumber && (
              <div>
                <span className="text-slate-500">{i18n.token} </span>
                <strong className="text-sky-700 font-bold">
                  #{data.tokenNumber}
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
          <div className="text-xs space-y-0.5 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">{i18n.patientName}:</span>
              <strong className="text-slate-900">{data.patient.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{i18n.mrn}:</span>
              <span className="font-mono text-teal-800 font-bold">
                {data.patient.mrn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{i18n.ageGender}:</span>
              <span>
                {translateAge(data.patient.age, lang)} /{" "}
                {translateGender(data.patient.gender, lang)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{i18n.contact}:</span>
              <span>{data.patient.phone}</span>
            </div>
            {data.patient.address && (
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">{i18n.address}:</span>
                <span className="text-right text-[11px] text-slate-600 max-w-[180px] truncate">
                  {data.patient.address}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Information */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200/70">
            <Icon icon={faUserDoctor} className="size-3 text-teal-600" />
            <span>{i18n.doctorInfoTitle}</span>
          </div>
          <div className="text-xs space-y-0.5 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">{i18n.doctorName}:</span>
              <strong className="text-slate-900">{data.doctor.name}</strong>
            </div>
            {data.doctor.specialty && (
              <div className="flex justify-between">
                <span className="text-slate-500">{i18n.specialty}:</span>
                <span className="text-teal-700 font-medium">
                  {translateDoctorSpecialty(data.doctor.specialty, lang)}
                </span>
              </div>
            )}
            {data.doctor.registrationNo && (
              <div className="flex justify-between">
                <span className="text-slate-500">{i18n.regNo}:</span>
                <span className="font-mono text-slate-600">
                  {data.doctor.registrationNo}
                </span>
              </div>
            )}
            {data.doctor.qualifications && (
              <div className="flex justify-between">
                <span className="text-slate-500">Qualifications:</span>
                <span className="text-[11px] text-slate-600">
                  {data.doctor.qualifications}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CLINICAL SUMMARY (if available) */}
      {(data.chiefComplaint || data.diagnosis) && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-600 text-[10px]">
            <Icon icon={faNotesMedical} className="size-3 text-sky-600" />
            <span>{i18n.clinicalTitle}</span>
          </div>
          {data.chiefComplaint && (
            <div className="text-slate-700">
              <span className="text-slate-500">{i18n.chiefComplaint}: </span>
              {translateChiefComplaint(data.chiefComplaint, lang)}
            </div>
          )}
          {data.diagnosis && (
            <div className="text-slate-700">
              <span className="text-slate-500">{i18n.diagnosis}: </span>
              <strong className="text-slate-900">
                {translateDiagnosis(data.diagnosis, lang)}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* LINE ITEMS TABLE */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          {i18n.tableDesc} ({lineItems.length})
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">{i18n.tableDesc}</th>
                <th className="py-2.5 px-3 text-center w-28">{i18n.tableSac}</th>
                <th className="py-2.5 px-3 text-right w-36">{i18n.tableAmount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {idx + 1}. {translateLineItemDescription(item.description, lang)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                    {item.hsnSac || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{Number(item.amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY TOTALS & PAYMENT DETAILS */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
        {/* Left: Payment status */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 space-y-1 text-xs">
          <div className="text-slate-600">
            {i18n.paymentMode}:{" "}
            <strong className="text-emerald-800 font-semibold uppercase">
              {translatePaymentMode(data.paymentMode, lang)}
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
              ₹{data.taxableAmount.toFixed(2)}
            </span>
          </div>

          {data.taxRate > 0 && data.taxAmount > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">
                {i18n.taxRate} ({data.taxRate}%)
              </span>
              <span className="font-mono">
                ₹{data.taxAmount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-t-2 border-slate-900 text-slate-900 font-bold text-sm">
            <span>{i18n.totalPaid}</span>
            <span className="font-mono text-base text-sky-800">
              ₹{data.amount.toFixed(2)}
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
            {data.clinic.name}
          </div>
        </div>
      </div>
    </div>
  );
}
