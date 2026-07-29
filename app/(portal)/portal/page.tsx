import Link from "next/link";
import { getPortalPatientData } from "@/actions/portal";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";
import { PortalAppointmentActions } from "@/components/portal/PortalAppointmentActions";
import { PortalPrescriptionDownload } from "@/components/portal/PortalPrescriptionDownload";
import { QueueStatusBadge } from "@/components/portal/QueueStatusBadge";
import { Card } from "@/components/ui/Card";
import { ClinicLogo } from "@/components/ui/ClinicLogo";
import type { Medicine } from "@/lib/types";

type SearchParams = Promise<{ next?: string }>;

export default async function PatientPortalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const data = await getPortalPatientData();

  if (!data) {
    return (
      <div className="mx-auto grid max-w-lg gap-6 pt-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your phone number. We&apos;ll send a one-time code — no password.
          </p>
        </div>
        <Card title="OTP login" className="border border-border bg-card">
          <PortalLoginForm redirectTo={params.next} />
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Looking for a clinic?{" "}
          <Link href="/clinics" className="font-medium text-primary hover:underline">
            Browse the directory
          </Link>
        </p>
      </div>
    );
  }

  const { account, appointments } = data;
  const upcoming = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      a.status !== "done" &&
      a.status !== "no_show" &&
      (a.scheduledAt ?? a.queueDate).getTime() >= Date.now() - 12 * 60 * 60 * 1000,
  );
  const past = appointments.filter((a) => !upcoming.includes(a));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Hello{account.name ? `, ${account.name}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {account.phone}
            {account.clinicLinks.length
              ? ` · ${account.clinicLinks.length} clinic${account.clinicLinks.length === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <Link
          href="/clinics"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-surface-deep px-4 text-sm font-semibold text-white hover:bg-primary"
        >
          Book appointment
        </Link>
      </div>

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-3">
        <h2 id="upcoming-heading" className="font-display text-xl font-semibold">
          Upcoming
        </h2>
        {!upcoming.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-white/60 p-8 text-center text-muted-foreground">
            No upcoming visits.{" "}
            <Link href="/clinics" className="font-medium text-primary hover:underline">
              Find a clinic
            </Link>
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {upcoming.map((appointment) => (
              <li
                key={appointment.id}
                className="rounded-2xl border border-border/80 bg-white/90 p-5"
              >
                <div className="flex items-start gap-3">
                  <ClinicLogo
                    src={appointment.clinic.logoUrl}
                    alt=""
                    size="sm"
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {appointment.clinic.name}
                      {appointment.scheduledAt
                        ? ` · ${appointment.scheduledAt.toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`
                        : ` · ${appointment.queueDate.toLocaleDateString("en-IN")}`}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold">
                      {appointment.doctor?.name || "Clinic visit"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Token #{appointment.tokenNumber}
                      {appointment.reasonForVisit ? ` · ${appointment.reasonForVisit}` : ""}
                    </p>
                    <QueueStatusBadge appointmentId={appointment.id} />
                    <PortalAppointmentActions
                      appointmentId={appointment.id}
                      clinicSlug={appointment.clinic.slug}
                      doctorId={appointment.doctor?.id ?? null}
                      canModify={
                        appointment.status === "waiting" &&
                        appointment.bookingSource === "portal"
                      }
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-heading" className="flex flex-col gap-3">
        <h2 id="history-heading" className="font-display text-xl font-semibold">
          Visit history
        </h2>
        {!past.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-white/60 p-8 text-center text-muted-foreground">
            Past visits and prescriptions will show up here.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {past.map((appointment) => {
              const rx = appointment.consultation?.prescription;
              const medicines =
                rx && Array.isArray(rx.medicines) ? (rx.medicines as Medicine[]) : [];
              const bill = appointment.consultation?.invoice;
              return (
                <li
                  key={appointment.id}
                  className="rounded-2xl border border-border/80 bg-white/90 p-5"
                >
                  <div className="flex items-start gap-3">
                    <ClinicLogo
                      src={appointment.clinic.logoUrl}
                      alt=""
                      size="sm"
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {appointment.clinic.name} ·{" "}
                        {appointment.queueDate.toLocaleDateString("en-IN")} ·{" "}
                        {appointment.status.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-semibold">
                        {appointment.consultation?.diagnosis ||
                          appointment.doctor?.name ||
                          "Clinic visit"}
                      </h3>
                      {medicines.length ? (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold">Prescription</h4>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            {medicines.map((medicine, index) => (
                              <li key={`${medicine.name}-${index}`}>
                                {medicine.name} · {medicine.dosage} · {medicine.frequency}
                              </li>
                            ))}
                          </ul>
                          {appointment.consultation?.id ? (
                            <PortalPrescriptionDownload
                              consultationId={appointment.consultation.id}
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {bill ? (
                        <div className="mt-4 border-t border-border pt-3 text-sm">
                          <strong>Bill {bill.invoiceNumber || ""}</strong>
                          <p className="text-muted-foreground">
                            ₹{Number(bill.amount).toFixed(2)} · paid ₹
                            {Number(bill.amountPaid).toFixed(2)} · {bill.status}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
