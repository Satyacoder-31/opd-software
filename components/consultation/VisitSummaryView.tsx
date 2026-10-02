import Link from "next/link";
import { ConsultationAttachments } from "@/components/consultation/ConsultationAttachments";
import { ConsultationDocumentActions } from "@/components/consultation/ConsultationDocumentActions";
import { ConsultationProfile } from "@/components/consultation/ConsultationProfile";
import { PatientContextRail } from "@/components/consultation/PatientContextRail";
import { PrescriptionProfile } from "@/components/consultation/PrescriptionProfile";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { hasMedicalCertificateContent } from "@/lib/consultation-clinical";
import { hasPatientSafetyAlerts } from "@/lib/consultation-utils";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";

type VisitSummaryViewProps = {
  consultationId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  episodeNo: string;
  patientPhone?: string | null;
  patientAge?: string | null;
  patientGender?: string | null;
  doctorName: string;
  clinical: ConsultationClinicalData;
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
  patientAllergies?: string | null;
  patientChronicConditions?: string | null;
  amendmentReason?: string | null;
  amendedAt?: Date | null;
  canAmend?: boolean;
  labOrders?: Array<{
    id: string;
    status: string;
    createdAt: Date;
    notes?: string | null;
    items: Array<{
      id: string;
      status: string;
      resultValue?: string | null;
      resultUnit?: string | null;
      resultNotes?: string | null;
      resultedAt?: Date | null;
      labTest: {
        name: string;
        code?: string | null;
        sampleType?: string | null;
      };
    }>;
  }>;
};

export function VisitSummaryView({
  consultationId,
  patientId,
  patientName,
  uhid,
  episodeNo,
  patientPhone,
  patientAge,
  patientGender,
  doctorName,
  clinical,
  medicines,
  advice,
  followUp,
  patientAllergies,
  patientChronicConditions,
  amendmentReason,
  amendedAt,
  canAmend = true,
  labOrders = [],
}: VisitSummaryViewProps) {
  const hasPrescription = medicines.some((medicine) => medicine.name?.trim());
  const hasMedicalCertificate = hasMedicalCertificateContent(
    clinical.medicalCertificate
  );

  return (
    <PageShell>
      <div className="border-b border-border bg-card">
        <PageHeader
          className="pb-3 md:pb-3"
          title="Visit summary"
          backHref="/queue"
          backLabel="Back to queue"
          actions={
            <div className="flex flex-wrap gap-3">
              <ConsultationDocumentActions
                consultationId={consultationId}
                hasPrescription={hasPrescription}
                hasMedicalCertificate={hasMedicalCertificate}
                showBillingLink={false}
              />
              <Link href={`/billing/${consultationId}`}>
                <Button type="button" variant="secondary">
                  Go to billing
                </Button>
              </Link>
              {canAmend ? (
                <Link href={`/consultations/${consultationId}/amend`}>
                  <Button type="button" variant="secondary">
                    Amend consultation
                  </Button>
                </Link>
              ) : null}
            </div>
          }
        >
          {amendmentReason && amendedAt ? (
            <Banner variant="info">
              Last amended{" "}
              {new Date(amendedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              : {amendmentReason}
            </Banner>
          ) : null}
        </PageHeader>

        <PatientContextRail
          className="px-6 pb-4 md:px-8"
          patientName={patientName}
          uhid={uhid}
          episodeNo={episodeNo}
          patientPhone={patientPhone}
          patientAge={patientAge}
          patientGender={patientGender}
          doctorName={doctorName}
          patientHref={`/patients/${patientId}`}
        />
      </div>

      {hasPatientSafetyAlerts({
        allergies: patientAllergies,
        chronicConditions: patientChronicConditions,
      }) ? (
        <div className="border-b border-border px-6 py-3 md:px-8">
          <PatientSafetyBanner
            allergies={patientAllergies}
            chronicConditions={patientChronicConditions}
          />
        </div>
      ) : null}

      <div className="min-w-0 divide-y divide-border border-b border-border bg-card">
        <ConsultationProfile {...clinical} />
        <Card title="Prescription" flush>
          <PrescriptionProfile
            medicines={medicines}
            advice={advice}
            followUp={followUp}
          />
        </Card>
        {labOrders && labOrders.length > 0 && (
          <Card title={`Advised Investigations & Lab Results (${labOrders.length})`} flush>
            <div className="divide-y divide-border px-4 py-3 sm:px-6">
              {labOrders.map((order) => (
                <div key={order.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-ink">
                      Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold capitalize text-primary">
                      {order.status}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded border border-border/70 bg-muted/20 p-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-medium text-ink">{item.labTest.name}</span>
                          <span className="text-[10px] capitalize text-muted-foreground">
                            {item.status}
                          </span>
                        </div>
                        {item.resultValue ? (
                          <div className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.resultValue} {item.resultUnit ?? ""}
                            {item.resultNotes && (
                              <span className="block font-normal text-[11px] text-muted-foreground italic">
                                Note: {item.resultNotes}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <p className="mt-1.5 text-xs text-muted-foreground italic">
                      Notes: {order.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
        <ConsultationAttachments consultationId={consultationId} readOnly />
      </div>
    </PageShell>
  );
}
