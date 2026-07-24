import Image from "next/image";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LandingNav } from "./LandingNav";

const features = [
  {
    title: "Live token queue",
    description:
      "Every reception desk sees the same queue. Status changes sync instantly — no refresh, no shouting across the room.",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    alt: "Clinic staff coordinating patient flow at a reception desk",
  },
  {
    title: "Complete patient records",
    description:
      "MRN auto-generation, demographics, visit history, and consultation notes — all in one place, isolated per clinic.",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
    alt: "Doctor reviewing patient information on a tablet",
  },
  {
    title: "Prescriptions & receipts",
    description:
      "Build prescriptions with your common medicines, download PDFs instantly, and generate itemized or flat-fee bills.",
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80",
    alt: "Medical prescription and healthcare documentation",
  },
];

const integrations = [
  "Realtime queue sync",
  "Role-based access",
  "Prescription PDFs",
  "Billing receipts",
  "Visit history",
  "Multi-staff clinics",
  "Secure cloud storage",
  "Mobile-friendly UI",
];

const stories = [
  {
    quote: (
      <>
        We went from paper tokens and Excel sheets to a live queue in one
        weekend.{" "}
        <strong className="font-semibold text-primary">
          Our morning rush is actually manageable now.
        </strong>
      </>
    ),
    name: "Dr. Sanjay Gupta",
    role: "Multi-specialty OPD, Delhi",
  },
  {
    quote: (
      <>
        I used to lose consultation notes between visits. Medyx keeps
        drafts safe and{" "}
        <strong className="font-semibold text-primary">
          my prescriptions look professional.
        </strong>
      </>
    ),
    name: "Dr. Lakshmi Rao",
    role: "Dermatology clinic, Visakhapatnam",
  },
  {
    quote: (
      <>
        As admin, I control who sees what. Doctors get consultations,
        reception gets billing —{" "}
        <strong className="font-semibold text-primary">
          everyone stays in their lane.
        </strong>
      </>
    ),
    name: "Mohammed Farooq",
    role: "Clinic manager, Lucknow",
  },
];

const faqs = [
  {
    question: "Is Medyx free to start?",
    answer:
      "Yes. Register your clinic and start using the core OPD features — patient records, queue management, consultations, prescriptions, and billing — at no cost during our early access period.",
  },
  {
    question: "How does the token queue work?",
    answer:
      "Reception issues a daily token for each walk-in. The queue board updates in real time across all logged-in devices, so every desk sees who's waiting, in consultation, or done.",
  },
  {
    question: "Can multiple staff use it at the same time?",
    answer:
      "Absolutely. Medyx is built for busy OPDs. Admins invite doctors and receptionists with role-based permissions — doctors handle consultations, reception handles queue and billing.",
  },
  {
    question: "Is patient data secure?",
    answer:
      "Each clinic's data is isolated with database-level row security. Only your clinic's staff can access your patients, consultations, and billing records.",
  },
  {
    question: "Do I need special hardware?",
    answer:
      "No. Medyx runs in any modern browser on a laptop, tablet, or phone. If you can open a web page, you can run your clinic.",
  },
];

const ctaStyles = {
  primary:
    "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary shadow-lg shadow-primary/20",
  secondary:
    "border border-border bg-white/90 text-ink shadow-sm backdrop-blur-sm hover:bg-white focus-visible:ring-primary",
  /* For rich, dark bands */
  accent:
    "bg-accent text-ink hover:bg-accent/90 focus-visible:ring-white shadow-lg shadow-black/25",
  "outline-light":
    "border border-white/40 text-white backdrop-blur-sm hover:bg-white/10 focus-visible:ring-white",
} as const;

function CtaButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof ctaStyles;
}) {
  const base =
    "inline-flex h-12 items-center justify-center rounded-xl px-8 text-base font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  return (
    <Link href={href} className={`${base} ${ctaStyles[variant]}`}>
      {children}
    </Link>
  );
}

export function LandingPage() {
  return (
    <div id="main-content" className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* Hero — deep ocean-blue band, white type, amber CTA */}
      <section className="relative overflow-hidden tint-hero">
        <div className="landing-grain pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <span className="size-2 rounded-full bg-accent" />
              Modern OPD &amp; EMR Platform
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
              The Complete OPD &amp; EMR Platform for Modern Clinics.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
              The all-in-one queue, patient records, consultation, and billing
              platform for small OPD practices.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaButton href="/signup" variant="accent">
                Start today — it&apos;s free
              </CtaButton>
              <CtaButton href="/login" variant="outline-light">
                Sign in to your clinic
              </CtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations / capabilities */}
      <section className="tint-band py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Everything your OPD desk needs
            </h2>
            <p className="mt-4 text-lg text-white/80">
              One platform instead of registers, spreadsheets, and sticky notes.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {integrations.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature sections with images — warm ochre band, white cards */}
      <section id="features" className="tint-band-warm py-20 sm:py-28">
        <div className="mx-auto max-w-6xl space-y-24 px-4 sm:px-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`flex flex-col items-center gap-12 rounded-3xl bg-white p-6 shadow-lg shadow-black/10 sm:p-10 lg:gap-16 ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-ink/10" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-4 text-lg text-muted-foreground">{feature.description}</p>
                {i === 0 && (
                  <div className="mt-8">
                    <CtaButton href="/signup">Try the live queue</CtaButton>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Big CTA with image */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1631217868264-e5b90bb5e933?w=1600&q=80"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-ink/75" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            If your clinic sees patients, Medyx fits
          </h2>
          <p className="mt-4 text-lg text-white/80">
            From solo practitioners to multi-doctor OPDs — patient records,
            queue, prescriptions, and billing in one secure place.
          </p>
          <div className="mt-10">
            <CtaButton href="/signup" variant="accent">
              Get started free
            </CtaButton>
          </div>
        </div>
      </section>

      {/* Success stories — rich blue band, white cards */}
      <section id="stories" className="tint-band py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Clinics that made the switch
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Real practices. Real mornings without the paper chase.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {stories.map((story) => (
              <blockquote
                key={story.name}
                className="flex flex-col rounded-2xl bg-white p-8 shadow-lg shadow-black/15"
              >
                <p className="flex-1 text-lg text-ink">{story.quote}</p>
                <footer className="mt-6 border-t border-border pt-6">
                  <p className="font-medium text-ink">{story.name}</p>
                  <p className="text-sm text-muted-foreground">{story.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — full-bleed rich band */}
      <section className="relative overflow-hidden tint-hero py-20 sm:py-28">
        <div className="landing-grain pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
            Starting is the hard part. We make it easy.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Register your clinic, invite your team, and issue your first token
            today. No credit card required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CtaButton href="/signup" variant="accent">
              Register your clinic
            </CtaButton>
            <CtaButton href="/login" variant="outline-light">
              I already have an account
            </CtaButton>
          </div>
        </div>
      </section>

      {/* FAQ — rich blue band, white accordion */}
      <section id="faq" className="tint-band py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Questions &amp; answers
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Quick answers about getting started, the queue, and your data.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-3xl">
            <Accordion className="rounded-2xl bg-white px-6 shadow-lg shadow-black/15">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${i}`}
                  className="border-border px-0 last:border-b-0"
                >
                  <AccordionTrigger className="py-5 font-display text-base font-semibold text-ink hover:no-underline sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-deep py-12 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div>
              <BrandLogo size="md" inverted />
              <p className="mt-2 text-sm text-white/70">
                OPD management for real clinics.
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
              <Link href="/signup" className="hover:text-white">
                Register
              </Link>
              <Link href="/login" className="hover:text-white">
                Sign in
              </Link>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
            </nav>
          </div>
          <p className="mt-8 text-center text-xs text-white/50">
            &copy; {new Date().getFullYear()} Medyx. Built for small
            Indian OPD practices.
          </p>
        </div>
      </footer>
    </div>
  );
}
