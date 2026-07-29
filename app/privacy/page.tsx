import Link from "next/link";
import { TERMS_VERSION } from "@/lib/clinic-onboarding";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-foreground">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          Home
        </Link>
        {" · "}
        Version {TERMS_VERSION}
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
        Privacy Policy
      </h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          We process clinic operational and patient health data to provide EMR,
          scheduling, billing, and patient-portal features you enable.
        </p>
        <p>
          Under India&apos;s Digital Personal Data Protection (DPDP) framework,
          clinics act as data fiduciaries for patient records they create. You
          must obtain any consents required for your practice and limit staff
          access appropriately.
        </p>
        <p>
          We store data with industry-standard safeguards and do not sell
          patient data. Subprocessors (for example hosting and auth) process
          data only to run the service.
        </p>
        <p>
          Contact your clinic administrator for patient access or correction
          requests related to records held in your clinic account.
        </p>
      </div>
      <p className="mt-8 text-sm">
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
      </p>
    </main>
  );
}
