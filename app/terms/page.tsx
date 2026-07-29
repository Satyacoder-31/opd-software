import Link from "next/link";
import { TERMS_VERSION } from "@/lib/clinic-onboarding";

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          By creating a clinic account on this EMR platform, you confirm that
          you are authorized to operate the clinic and manage patient records on
          its behalf.
        </p>
        <p>
          You are responsible for the accuracy of clinical documentation,
          billing, and staff access you grant. You must use the service only for
          lawful outpatient / clinic operations.
        </p>
        <p>
          The platform provides software tools for records, scheduling, and
          related workflows. It does not replace professional medical judgment.
        </p>
        <p>
          We may update these terms; continued use after notice constitutes
          acceptance of the updated version.
        </p>
      </div>
      <p className="mt-8 text-sm">
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
    </main>
  );
}
