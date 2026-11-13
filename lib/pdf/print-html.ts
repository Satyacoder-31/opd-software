import type { PrescriptionViewData } from "@/actions/prescriptions";
import type { ReceiptViewData } from "@/actions/invoices";
import { getGenericCompositionForDrug } from "@/lib/drug-catalog";
import { parseDoseSchedule } from "@/lib/pdf/prescription";
import {
  PRESCRIPTION_I18N,
  RECEIPT_I18N,
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

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generatePrintableReceiptHtml(
  data: ReceiptViewData,
  lang: "en" | "hi" = "en"
): string {
  const i18n = RECEIPT_I18N[lang] || RECEIPT_I18N.en;
  const lineItems = data.lineItems || [];

  const itemsRows = lineItems
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #0f172a;">
          ${idx + 1}. <strong>${escapeHtml(item.description)}</strong>
        </td>
        <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-family: monospace; color: #64748b;">
          ${escapeHtml(item.hsnSac || "—")}
        </td>
        <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-family: monospace; font-weight: 700; color: #0f172a;">
          ₹${Number(item.amount || 0).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>Receipt - ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
  <div style="max-width: 100%; margin: 0 auto; background: #ffffff;">
    <!-- HEADER -->
    <div style="border-bottom: 2.5px solid #0284c7; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 20px; font-weight: 800; color: #0f172a;">${escapeHtml(data.clinic.name)}</h1>
        <p style="font-size: 11px; color: #475569; margin-top: 2px;">${escapeHtml(data.clinic.address)}</p>
        <p style="font-size: 11px; color: #475569;"><strong>Phone:</strong> ${escapeHtml(data.clinic.phone)} ${data.clinic.gstin ? ` | <strong>GSTIN:</strong> ${escapeHtml(data.clinic.gstin)}` : ""}</p>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
          ${escapeHtml(i18n.documentTitle)}
        </span>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: monospace;">
          ${escapeHtml(data.invoiceNumber)}
        </div>
        <div style="font-size: 11px; color: #64748b;">${escapeHtml(data.date)}</div>
      </div>
    </div>

    <!-- PATIENT & DOCTOR DETAILS -->
    <div style="margin-top: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
      <table style="width: 100%; font-size: 11px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase;">${escapeHtml(i18n.patientName)}</span><br />
            <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(data.patient.name)}</strong><br />
            <span style="color: #475569;">MRN: <strong>${escapeHtml(data.patient.mrn)}</strong></span>
            ${data.patient.age ? ` | ${escapeHtml(data.patient.age)}` : ""}
            ${data.patient.gender ? ` / ${escapeHtml(data.patient.gender)}` : ""}
          </td>
          <td style="width: 50%; vertical-align: top; text-align: right;">
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase;">${escapeHtml(i18n.doctorName)}</span><br />
            <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(data.doctor.name)}</strong><br />
            <span style="color: #0284c7; font-weight: 600;">${escapeHtml(data.doctor.specialty || "")}</span>
            ${data.doctor.registrationNo ? `<br /><span style="font-size: 10px; color: #64748b;">Reg: ${escapeHtml(data.doctor.registrationNo)}</span>` : ""}
          </td>
        </tr>
      </table>
    </div>

    <!-- LINE ITEMS TABLE -->
    <div style="margin-top: 16px;">
      <table style="width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background: #f1f5f9; color: #334155; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-bottom: 1.5px solid #cbd5e1;">
            <th style="padding: 8px 10px; text-align: left;">${escapeHtml(i18n.tableDesc)}</th>
            <th style="padding: 8px 10px; text-align: center; width: 100px;">${escapeHtml(i18n.tableSac)}</th>
            <th style="padding: 8px 10px; text-align: right; width: 130px;">${escapeHtml(i18n.tableAmount)}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- TOTALS -->
    <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
      <table style="width: 260px; font-size: 12px;">
        <tr>
          <td style="padding: 4px 8px; color: #64748b;">Taxable Value:</td>
          <td style="padding: 4px 8px; text-align: right; font-family: monospace;">₹${Number(data.taxableAmount || data.amount).toFixed(2)}</td>
        </tr>
        ${
          data.taxAmount > 0
            ? `
          <tr>
            <td style="padding: 4px 8px; color: #64748b;">GST (${data.taxRate}%):</td>
            <td style="padding: 4px 8px; text-align: right; font-family: monospace;">₹${Number(data.taxAmount).toFixed(2)}</td>
          </tr>
        `
            : ""
        }
        <tr style="border-top: 2px solid #0f172a; font-weight: 800; font-size: 14px;">
          <td style="padding: 6px 8px; color: #0f172a;">Grand Total:</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: #0284c7;">₹${Number(data.amount).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #64748b; font-size: 11px;">Payment Mode:</td>
          <td style="padding: 4px 8px; text-align: right; font-weight: 600; text-transform: uppercase; font-size: 11px; color: #059669;">${escapeHtml(data.paymentMode)}</td>
        </tr>
      </table>
    </div>

    <!-- FOOTER -->
    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b;">
      <div>
        <p>This is a computer-generated official receipt.</p>
        <p>Thank you for choosing ${escapeHtml(data.clinic.name)}.</p>
      </div>
      <div style="text-align: right;">
        <div style="height: 35px; border-bottom: 1px dashed #94a3b8; width: 160px; margin-bottom: 4px;"></div>
        <div style="font-weight: 700; color: #0f172a;">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generatePrintablePrescriptionHtml(
  data: PrescriptionViewData,
  lang: "en" | "hi" = "en"
): string {
  const i18n = PRESCRIPTION_I18N[lang] || PRESCRIPTION_I18N.en;
  const hasAllergies = Boolean(data.patient.allergies?.trim());

  const doctorDisplayName =
    lang === "hi"
      ? `डॉ. ${data.doctor.name.replace(/^Dr\.?\s+/i, "")}`
      : `Dr. ${data.doctor.name.replace(/^Dr\.?\s+/i, "")}`;

  const medicinesRows = data.medicines
    .map((med, idx) => {
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
        .join(" &middot; ");

      return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a;">
              ${idx + 1}. ${escapeHtml(med.name)}
            </div>
            ${
              genericSalt && genericSalt.toLowerCase() !== med.name.toLowerCase()
                ? `<div style="font-size: 11px; color: #0f766e; font-weight: 500; margin-top: 2px;">${escapeHtml(genericSalt)}</div>`
                : ""
            }
            ${
              subDetails
                ? `<div style="font-size: 11px; color: #475569; margin-top: 3px;">${escapeHtml(subDetails)}</div>`
                : ""
            }
          </td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; font-weight: 700; color: ${sched.morning !== "—" ? "#0284c7" : "#94a3b8"};">
            ${escapeHtml(sched.morning)}
          </td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; font-weight: 700; color: ${sched.afternoon !== "—" ? "#0284c7" : "#94a3b8"};">
            ${escapeHtml(sched.afternoon)}
          </td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; font-weight: 700; color: ${sched.evening !== "—" ? "#0284c7" : "#94a3b8"};">
            ${escapeHtml(sched.evening)}
          </td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; font-weight: 700; color: ${sched.night !== "—" ? "#0284c7" : "#94a3b8"};">
            ${escapeHtml(sched.night)}
          </td>
        </tr>
      `;
    })
    .join("");

  const plastersSection =
    (data.plasterOrBandages && data.plasterOrBandages.length > 0) ||
    data.plasterAdvice
      ? `
      <div style="margin-top: 16px; border: 1.5px solid #c7d2fe; border-radius: 8px; background-color: #f5f7ff; padding: 12px;">
        <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: #3730a3; letter-spacing: 0.5px; margin-bottom: 8px;">
          🩹 ${escapeHtml(i18n.plastersAndBandagesTitle)}
        </div>
        ${
          data.plasterOrBandages && data.plasterOrBandages.length > 0
            ? `<div style="display: flex; flex-direction: column; gap: 6px;">
                ${data.plasterOrBandages
                  .map(
                    (item) => `
                    <div style="background: #ffffff; border: 1px solid #e0e7ff; border-radius: 6px; padding: 6px 10px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; font-size: 12px;">
                      <div>
                        <strong style="color: #0f172a;">${escapeHtml(translatePlasterName(item.name, lang))}</strong>
                        ${
                          item.site
                            ? `<span style="margin-left: 8px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #334155;">📍 ${escapeHtml(translatePlasterSite(item.site, lang))}</span>`
                            : ""
                        }
                        ${
                          item.duration
                            ? `<span style="margin-left: 8px; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">⏱️ ${escapeHtml(translatePlasterDuration(item.duration, lang))}</span>`
                            : ""
                        }
                      </div>
                      ${
                        item.instructions
                          ? `<span style="background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">📋 ${escapeHtml(translatePlasterInstruction(item.instructions, lang))}</span>`
                          : ""
                      }
                    </div>
                  `
                  )
                  .join("")}
              </div>`
            : ""
        }
        ${
          data.plasterAdvice
            ? `
            <div style="margin-top: 8px; background: #ffffff; border: 1px solid #e0e7ff; border-radius: 6px; padding: 8px 10px; font-size: 11px; color: #1e293b; line-height: 1.5; white-space: pre-line;">
              <strong style="color: #3730a3;">${escapeHtml(i18n.plasterCareAdviceTitle)}:</strong><br />
              ${escapeHtml(translateAdviceText(data.plasterAdvice, lang))}
            </div>
          `
            : ""
        }
      </div>
    `
      : "";

  const adviceSection = data.advice
    ? `
    <div style="margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 10px 14px; font-size: 11px;">
      <div style="font-weight: 700; text-transform: uppercase; color: #0f766e; letter-spacing: 0.5px; margin-bottom: 4px;">
        💡 ${escapeHtml(i18n.adviceTitle)}
      </div>
      <div style="color: #1e293b; line-height: 1.5; white-space: pre-line;">
        ${escapeHtml(translateAdviceText(data.advice, lang))}
      </div>
    </div>
  `
    : "";

  const followUpSection = data.followUp
    ? `
    <div style="margin-top: 12px; border: 1.5px solid #bae6fd; border-radius: 8px; background: #f0f9ff; padding: 8px 14px; font-size: 11px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <strong style="color: #0369a1;">📅 ${escapeHtml(i18n.followUpTitle)}:</strong>
        <span style="font-weight: 700; color: #0c4a6e; margin-left: 6px;">${escapeHtml(translateFollowUp(data.followUp, lang))}</span>
      </div>
      <span style="color: #64748b; font-size: 10px;">${escapeHtml(i18n.followUpBring)}</span>
    </div>
  `
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(data.patient.name)} - Prescription (${escapeHtml(data.patient.mrn)})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .prescription-container {
      max-width: 100%;
      margin: 0 auto;
      background: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
  </style>
</head>
<body>
  <div class="prescription-container">
    <!-- CLINIC HEADER -->
    <div style="border-bottom: 2.5px solid #0d9488; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="display: flex; gap: 12px; align-items: center;">
        ${
          data.clinic.logoUrl
            ? `<img src="${data.clinic.logoUrl}" alt="${escapeHtml(data.clinic.name)}" style="height: 64px; max-width: 120px; object-fit: contain;" />`
            : ""
        }
        <div>
          <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.1;">
            ${escapeHtml(data.clinic.name)}
          </h1>
          <p style="font-size: 11px; color: #475569; margin-top: 2px;">
            ${escapeHtml(data.clinic.address)}
          </p>
          <p style="font-size: 11px; color: #475569;">
            <strong>Phone:</strong> ${escapeHtml(data.clinic.phone)}
            ${data.clinic.email ? ` | <strong>Email:</strong> ${escapeHtml(data.clinic.email)}` : ""}
          </p>
        </div>
      </div>

      <div style="text-align: right; min-width: 180px;">
        <h2 style="font-size: 15px; font-weight: 700; color: #0f172a;">
          ${escapeHtml(doctorDisplayName)}
        </h2>
        ${
          data.doctor.specialty
            ? `<div style="font-size: 11px; font-weight: 600; color: #0f766e;">${escapeHtml(translateDoctorSpecialty(data.doctor.specialty, lang))}</div>`
            : ""
        }
        ${
          data.doctor.qualifications
            ? `<div style="font-size: 10px; color: #64748b;">${escapeHtml(data.doctor.qualifications)}</div>`
            : ""
        }
        ${
          data.doctor.registrationNo
            ? `<div style="font-size: 10px; font-family: monospace; color: #64748b;">${lang === "hi" ? "पंजीकरण संख्या:" : "Reg. No:"} ${escapeHtml(data.doctor.registrationNo)}</div>`
            : ""
        }
      </div>
    </div>

    <!-- PATIENT INFO RIBBON -->
    <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
      <table style="width: 100%; font-size: 11px;">
        <tr>
          <td style="width: 32%;">
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase;">${lang === "hi" ? "मरीज़ का नाम" : "Patient Name"}</span><br />
            <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(data.patient.name)}</strong>
          </td>
          <td style="width: 24%;">
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase;">UHID / MRN</span><br />
            <strong style="font-family: monospace; color: #0f766e; font-size: 12px;">${escapeHtml(data.patient.mrn)}</strong>
          </td>
          <td style="width: 22%;">
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase;">${lang === "hi" ? "उम्र / लिंग" : "Age / Gender"}</span><br />
            <strong>${escapeHtml(translateAge(data.patient.age, lang))} / ${escapeHtml(translateGender(data.patient.gender, lang))}</strong>
          </td>
          <td style="width: 22%; text-align: right;">
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase;">${lang === "hi" ? "दिनांक व टोकन" : "Date & Token"}</span><br />
            <strong>${escapeHtml(data.date)} ${data.tokenNumber ? `<span style="color: #0f766e;">(#${data.tokenNumber})</span>` : ""}</strong>
          </td>
        </tr>
      </table>

      <!-- Allergies & Chronic Conditions -->
      <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        ${
          hasAllergies
            ? `<span style="background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                ⚠️ ${lang === "hi" ? "दवा एलर्जी:" : "Known Allergies:"} ${escapeHtml(data.patient.allergies)}
              </span>`
            : `<span style="color: #059669; font-weight: 600;">
                ✓ ${lang === "hi" ? "कोई ज्ञात दवा एलर्जी नहीं (NKDA)" : "Allergies: No Known Drug Allergies"}
              </span>`
        }
        ${
          data.patient.chronicConditions?.trim()
            ? `<span style="color: #475569;">
                ${lang === "hi" ? "पूर्व चिकित्सा इतिहास:" : "Past History:"} <strong>${escapeHtml(translatePastHistory(data.patient.chronicConditions, lang))}</strong>
              </span>`
            : ""
        }
      </div>
    </div>

    <!-- VITALS RIBBON -->
    ${
      data.vitals &&
      (data.vitals.bp ||
        data.vitals.pulse ||
        data.vitals.weight ||
        data.vitals.temp ||
        data.vitals.spo2)
        ? `
        <div style="margin-top: 8px; font-size: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
          <strong style="text-transform: uppercase; color: #64748b;">${lang === "hi" ? "शारीरिक माप:" : "Vitals:"}</strong>
          ${data.vitals.bp ? `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px;">BP: <strong>${escapeHtml(data.vitals.bp)} mmHg</strong></span>` : ""}
          ${data.vitals.pulse ? `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px;">Pulse: <strong>${escapeHtml(data.vitals.pulse)} bpm</strong></span>` : ""}
          ${data.vitals.weight ? `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px;">Weight: <strong>${escapeHtml(data.vitals.weight)} kg</strong></span>` : ""}
          ${data.vitals.temp ? `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px;">Temp: <strong>${escapeHtml(data.vitals.temp)} °F</strong></span>` : ""}
          ${data.vitals.spo2 ? `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px;">SpO2: <strong>${escapeHtml(data.vitals.spo2)} %</strong></span>` : ""}
        </div>
      `
        : ""
    }

    <!-- CLINICAL DIAGNOSIS & COMPLAINTS -->
    <div style="margin-top: 10px; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 8px 12px; font-size: 11px;">
      ${
        data.chiefComplaint
          ? `<div style="margin-bottom: 4px;">
              <strong style="text-transform: uppercase; color: #134e4a; font-size: 10px;">${lang === "hi" ? "मुख्य लक्षण व समस्या:" : "Chief Complaints:"}</strong>
              <span style="color: #0f172a; margin-left: 4px;">${escapeHtml(translateChiefComplaint(data.chiefComplaint, lang))}</span>
            </div>`
          : ""
      }
      <div>
        <strong style="text-transform: uppercase; color: #134e4a; font-size: 10px;">${lang === "hi" ? "चिकित्सीय निदान:" : "Clinical Diagnosis:"}</strong>
        <span style="color: #0f172a; font-weight: 700; font-size: 12px; margin-left: 4px;">
          ${escapeHtml(translateDiagnosis(data.diagnosis, lang)) || (lang === "hi" ? "परीक्षण मूल्यांकन दर्ज" : "Clinical assessment recorded")}
        </span>
      </div>
    </div>

    <!-- RX MEDICINES TABLE -->
    <div style="margin-top: 14px;">
      <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1.5px solid #cbd5e1;">
        <div>
          <span style="font-family: Georgia, serif; font-style: italic; font-size: 22px; font-weight: bold; color: #0d9488; margin-right: 6px;">℞</span>
          <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            ${escapeHtml(i18n.scheduleTitle)} (${data.medicines.length})
          </strong>
        </div>
        <span style="font-size: 10px; color: #64748b;">${escapeHtml(i18n.scheduleSubtitle)}</span>
      </div>

      <table style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; font-size: 11px;">
        <thead>
          <tr style="background: #f1f5f9; color: #334155; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-bottom: 1.5px solid #cbd5e1;">
            <th style="padding: 6px 10px; text-align: left;">${escapeHtml(i18n.medicines)}</th>
            <th style="padding: 6px 8px; text-align: center; width: 65px;">${escapeHtml(i18n.morning)}</th>
            <th style="padding: 6px 8px; text-align: center; width: 65px;">${escapeHtml(i18n.afternoon)}</th>
            <th style="padding: 6px 8px; text-align: center; width: 65px;">${escapeHtml(i18n.evening)}</th>
            <th style="padding: 6px 8px; text-align: center; width: 65px;">${escapeHtml(i18n.night)}</th>
          </tr>
        </thead>
        <tbody>
          ${medicinesRows}
        </tbody>
      </table>
    </div>

    <!-- BANDAGES & PLASTERS -->
    ${plastersSection}

    <!-- ADVICE & RECOMMENDATIONS -->
    ${adviceSection}

    <!-- FOLLOW-UP -->
    ${followUpSection}

    <!-- DOCTOR SIGNATURE BLOCK -->
    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b;">
      <div style="max-width: 55%;">
        <p>${escapeHtml(i18n.disclaimer)}</p>
      </div>
      <div style="text-align: right; min-width: 180px;">
        <div style="height: 35px; border-bottom: 1px dashed #94a3b8; margin-bottom: 4px;"></div>
        <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${escapeHtml(doctorDisplayName)}</div>
        ${data.doctor.registrationNo ? `<div style="font-family: monospace;">${lang === "hi" ? "पंजीकरण संख्या:" : "Reg. No:"} ${escapeHtml(data.doctor.registrationNo)}</div>` : ""}
        <div style="font-size: 9px; font-weight: 600; text-transform: uppercase; color: #0d9488; margin-top: 2px;">${escapeHtml(i18n.doctorSignature)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
