"use client";

import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTriangleExclamation,
  faNotesMedical,
  faBandage,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { PrescriptionViewData } from "@/actions/prescriptions";
import { cn } from "@/lib/utils";
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

export type PrescriptionPaperViewProps = {
  data: PrescriptionViewData;
  lang: "en" | "hi";
  className?: string;
};

export function PrescriptionPaperView({
  data,
  lang,
  className,
}: PrescriptionPaperViewProps) {
  const i18n = PRESCRIPTION_I18N[lang];
  const hasAllergies = Boolean(data.patient.allergies?.trim());

  return (
    <div
      id="printable-prescription"
      className={cn(
        "max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md text-slate-800 space-y-6",
        className
      )}
    >
      {/* LETTERHEAD HEADER */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-teal-600 pb-5">
        <div className="flex items-start gap-3">
          {data.clinic.logoUrl && (
            <img
              src={data.clinic.logoUrl}
              alt={data.clinic.name}
              className="h-20 w-auto max-w-[140px] rounded-lg object-contain border border-slate-100 shadow-2xs"
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
          </div>
        </div>

        {/* Consulting Doctor Box */}
        <div className="sm:text-right min-w-[200px]">
          <h3 className="font-display text-base font-bold text-slate-900">
            {lang === "hi" ? "डॉ. " : "Dr. "}
            {data.doctor.name.replace(/^Dr\.?\s+/i, "")}
          </h3>
          {data.doctor.specialty && (
            <p className="text-xs font-semibold text-teal-700">
              {translateDoctorSpecialty(data.doctor.specialty, lang)}
            </p>
          )}
          {data.doctor.qualifications && (
            <p className="text-[11px] text-slate-500">
              {data.doctor.qualifications}
            </p>
          )}
          {data.doctor.registrationNo && (
            <p className="text-[11px] font-mono text-slate-500">
              {lang === "hi" ? "पंजीकरण संख्या: " : "Reg. No: "}
              {data.doctor.registrationNo}
            </p>
          )}
        </div>
      </div>

      {/* PATIENT INFO BANNER */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">
              {lang === "hi" ? "मरीज़ का नाम" : "Patient Name"}
            </span>
            <strong className="text-slate-900 font-semibold">
              {data.patient.name}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">
              {lang === "hi" ? "विशिष्ट पहचान (UHID)" : "UHID / MRN"}
            </span>
            <span className="font-mono font-bold text-teal-800">
              {data.patient.mrn}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">
              {lang === "hi" ? "उम्र / लिंग" : "Age / Gender"}
            </span>
            <span>
              {translateAge(data.patient.age, lang)} /{" "}
              {translateGender(data.patient.gender, lang)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">
              {lang === "hi" ? "दिनांक व टोकन" : "Date & Token"}
            </span>
            <span>
              {data.date}{" "}
              {data.tokenNumber && (
                <strong className="text-teal-700">
                  ({lang === "hi" ? `टोकन #${data.tokenNumber}` : `Token #${data.tokenNumber}`})
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
              {lang === "hi" ? "दवा एलर्जी: " : "Known Allergies: "}
              {data.patient.allergies}
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Icon icon={faCheck} className="size-3 text-emerald-600" />
              {lang === "hi" ? "कोई ज्ञात दवा एलर्जी नहीं (NKDA)" : "Allergies: No Known Drug Allergies"}
            </span>
          )}
          {data.patient.chronicConditions?.trim() ? (
            <span className="text-slate-600">
              {lang === "hi" ? "पूर्व चिकित्सा इतिहास: " : "Past History: "}
              <strong className="text-slate-800">
                {translatePastHistory(data.patient.chronicConditions, lang)}
              </strong>
            </span>
          ) : null}
        </div>
      </div>

      {/* VITALS RIBBON */}
      {data.vitals && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            {lang === "hi" ? "शारीरिक माप:" : "Vitals:"}
          </span>
          {data.vitals.bp && (
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
              {lang === "hi" ? "रक्तचाप: " : "BP: "}
              {data.vitals.bp} mmHg
            </span>
          )}
          {data.vitals.pulse && (
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
              {lang === "hi" ? "नाड़ी: " : "Pulse: "}
              {data.vitals.pulse} bpm
            </span>
          )}
          {data.vitals.weight && (
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
              {lang === "hi" ? "वजन: " : "Weight: "}
              {data.vitals.weight} kg
            </span>
          )}
          {data.vitals.temp && (
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
              {lang === "hi" ? "तापमान: " : "Temp: "}
              {data.vitals.temp} °F
            </span>
          )}
          {data.vitals.spo2 && (
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
              {lang === "hi" ? "ऑक्सीजन: " : "SpO2: "}
              {data.vitals.spo2} %
            </span>
          )}
        </div>
      )}

      {/* CLINICAL DIAGNOSIS & COMPLAINTS */}
      <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3.5 space-y-1.5 text-xs">
        {data.chiefComplaint && (
          <div>
            <span className="font-bold uppercase tracking-wider text-teal-900 text-[11px]">
              {lang === "hi" ? "मुख्य समस्या व लक्षण: " : "Chief Complaints: "}
            </span>
            <span className="text-slate-800">
              {translateChiefComplaint(data.chiefComplaint, lang)}
            </span>
          </div>
        )}
        <div>
          <span className="font-bold uppercase tracking-wider text-teal-900 text-[11px]">
            {lang === "hi" ? "चिकित्सीय निदान: " : "Clinical Diagnosis: "}
          </span>
          <strong className="text-slate-900 font-bold text-sm">
            {translateDiagnosis(data.diagnosis, lang) ||
              (lang === "hi" ? "परीक्षण मूल्यांकन दर्ज" : "Clinical assessment recorded")}
          </strong>
        </div>
      </div>

      {/* OUTPATIENT PRESCRIPTION & MEDICINES TABLE */}
      <div>
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-bold text-2xl text-teal-800">℞</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {i18n.scheduleTitle} ({data.medicines.length})
            </span>
          </div>
          <span className="text-[11px] font-normal text-slate-500">
            {i18n.scheduleSubtitle}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">{i18n.medicines}</th>
                <th className="py-2.5 px-3 text-center w-24">{i18n.morning}</th>
                <th className="py-2.5 px-3 text-center w-24">{i18n.afternoon}</th>
                <th className="py-2.5 px-3 text-center w-24">{i18n.evening}</th>
                <th className="py-2.5 px-3 text-center w-24">{i18n.night}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.medicines.map((med, idx) => {
                const genericSalt =
                  med.genericName?.trim() || getGenericCompositionForDrug(med.name);
                const sched = parseDoseSchedule(med.frequency);
                const subDetails = [
                  translateDosage(med.dosage, lang),
                  translateRoute(med.route, lang),
                  translateDuration(med.duration, lang),
                  translateInstructions(med.instructions, lang),
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {med.name}
                      </div>
                      {genericSalt && genericSalt.toLowerCase() !== med.name.toLowerCase() ? (
                        <div className="text-[11px] font-medium text-teal-700 mt-0.5">
                          {genericSalt}
                        </div>
                      ) : null}
                      {subDetails ? (
                        <div className="text-xs text-slate-600 mt-1">
                          {subDetails}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "font-bold font-mono text-sm",
                          sched.morning !== "—" ? "text-sky-600" : "text-slate-400"
                        )}
                      >
                        {sched.morning}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "font-bold font-mono text-sm",
                          sched.afternoon !== "—" ? "text-sky-600" : "text-slate-400"
                        )}
                      >
                        {sched.afternoon}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "font-bold font-mono text-sm",
                          sched.evening !== "—" ? "text-sky-600" : "text-slate-400"
                        )}
                      >
                        {sched.evening}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "font-bold font-mono text-sm",
                          sched.night !== "—" ? "text-sky-600" : "text-slate-400"
                        )}
                      >
                        {sched.night}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BANDAGES, PLASTERS & SUPPORTS */}
      {((data.plasterOrBandages && data.plasterOrBandages.length > 0) ||
        data.plasterAdvice) && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
            <Icon icon={faBandage} className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{i18n.plastersAndBandagesTitle}</span>
          </div>

          {data.plasterOrBandages && data.plasterOrBandages.length > 0 && (
            <div className="grid gap-2">
              {data.plasterOrBandages.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs text-xs"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {translatePlasterName(item.name, lang)}
                    </span>
                    {item.site && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {lang === "hi" ? "अंग: " : "Site: "}
                        {translatePlasterSite(item.site, lang)}
                      </span>
                    )}
                    {item.duration && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/60">
                        {lang === "hi" ? "अवधि: " : "Duration: "}
                        {translatePlasterDuration(item.duration, lang)}
                      </span>
                    )}
                  </div>
                  {item.instructions && (
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                      {translatePlasterInstruction(item.instructions, lang)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.plasterAdvice && (
            <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-900/50 text-xs">
              <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                <span>{i18n.plasterCareAdviceTitle}:</span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line pl-1">
                {translateAdviceText(data.plasterAdvice, lang)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADVICE & INSTRUCTIONS */}
      {data.advice && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Icon icon={faNotesMedical} className="size-3.5 text-teal-700" />
            <span>{i18n.adviceTitle}</span>
          </div>
          <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line pl-1">
            {translateAdviceText(data.advice, lang)}
          </div>
        </div>
      )}

      {/* FOLLOW-UP REVIEW */}
      {data.followUp && (
        <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <Icon icon={faCalendarCheck} className="size-3.5 text-sky-700" />
            <span className="font-semibold text-slate-700">{i18n.followUpTitle}:</span>
            <strong className="text-sky-900 font-bold">
              {translateFollowUp(data.followUp, lang)}
            </strong>
          </div>
          <span className="text-slate-500 text-[11px]">
            {i18n.followUpBring}
          </span>
        </div>
      )}

      {/* FOOTER & DOCTOR SIGNATURE */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-6 text-xs text-slate-500">
        <div className="max-w-md">
          <p>{i18n.disclaimer}</p>
        </div>
        <div className="text-center sm:text-right w-52 space-y-1">
          <div className="h-10 border-b border-dashed border-slate-400"></div>
          <div className="text-xs font-bold text-slate-900">
            {lang === "hi" ? "डॉ. " : "Dr. "}
            {data.doctor.name.replace(/^Dr\.?\s+/i, "")}
          </div>
          {data.doctor.registrationNo && (
            <div className="text-[11px] font-mono text-slate-500">
              {lang === "hi" ? "पंजीकरण संख्या: " : "Reg. No: "}
              {data.doctor.registrationNo}
            </div>
          )}
          <div className="text-[10px] text-teal-800 font-semibold uppercase">
            {i18n.doctorSignature}
          </div>
        </div>
      </div>
    </div>
  );
}
