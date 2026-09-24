"use client";

import Link from "next/link";
import {
  faCalendarCheck,
  faArrowRight,
  faCheckCircle,
  faShieldHalved,
  faStethoscope,
  faUserDoctor,
  faClock,
  faAward,
  faHandHoldingHeart,
  faHospital,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { LandingNav } from "./LandingNav";
import { ConditionExplorer } from "./ConditionExplorer";
import { DrOrthoBookingWidget } from "./DrOrthoBookingWidget";

const orthopedicTreatments = [
  {
    title: "Joint Replacement",
    description: "Minimally invasive total and partial knee and hip arthroplasty with computer-assisted precision and fast-track rehabilitation.",
    icon: "🦵",
    highlight: "Knee & Hip Arthroplasty",
  },
  {
    title: "Sports Medicine & Arthroscopy",
    description: "Keyhole arthroscopic surgery for ACL, PCL, meniscus tears, and shoulder rotator cuff repairs to restore athletic performance.",
    icon: "🏃",
    highlight: "Keyhole Ligament Repair",
  },
  {
    title: "Spine & Sciatica Care",
    description: "Targeted evaluation of disc herniations, spinal stenosis, and sciatica, prioritizing conservative decompression and physical therapy.",
    icon: "🦴",
    highlight: "Conservative & Micro-decompression",
  },
  {
    title: "Fracture & Acute Trauma",
    description: "Prompt stabilization of simple and complex fractures with anatomical casting, splinting, or rigid internal fixation (ORIF).",
    icon: "🩹",
    highlight: "Emergency & Cast Protocols",
  },
  {
    title: "Arthritis & Joint Preservation",
    description: "Early-stage osteoarthritis management including viscosupplementation, intra-articular injections, and joint unloading therapy.",
    icon: "✨",
    highlight: "Cartilage Protection",
  },
  {
    title: "Shoulder & Upper Extremity",
    description: "Specialized treatment for rotator cuff impingement, frozen shoulder, recurrent shoulder dislocation, and tennis elbow.",
    icon: "💪",
    highlight: "Shoulder Arthroscopy",
  },
  {
    title: "Foot & Ankle Care",
    description: "Care for chronic ankle sprains, Achilles tendinitis, plantar fasciitis, and foot biomechanical deformities.",
    icon: "🦶",
    highlight: "Ankle Stabilization",
  },
  {
    title: "Pediatric Orthopedics",
    description: "Compassionate evaluation of growth plate injuries, pediatric limb fractures, flat feet, and developmental alignment concerns.",
    icon: "👶",
    highlight: "Growth & Pediatric Trauma",
  },
];

const clinicalPillars = [
  {
    title: "Clinical Precision",
    description: "Every treatment plan is based on detailed biomechanical examination and high-resolution imaging, avoiding generic prescriptions.",
    icon: faStethoscope,
  },
  {
    title: "Conservative-First Philosophy",
    description: "Surgery is recommended only when indicated. We exhaust non-surgical options — physiotherapy, targeted injections, and lifestyle care — first.",
    icon: faShieldHalved,
  },
  {
    title: "Zero Waiting Anxiety",
    description: "Track your real-time OPD token queue from your smartphone. Arrive exactly when the doctor is ready to consult.",
    icon: faClock,
  },
  {
    title: "Complete Digital Continuity",
    description: "Receive electronic prescriptions, digital X-ray records, and structured post-consultation recovery instructions directly at every visit.",
    icon: faFilePdf,
  },
];

const careSteps = [
  {
    step: "01",
    title: "Consultation & Examination",
    description: "Comprehensive history taking, joint range-of-motion testing, and orthopedic provocative assessments.",
  },
  {
    step: "02",
    title: "Precision Imaging",
    description: "Weight-bearing digital X-rays and MRI reviews to establish exact joint alignment and tissue integrity.",
  },
  {
    step: "03",
    title: "Evidence-Based Plan",
    description: "Transparent discussion of conservative vs surgical pathways tailored to your age, mobility, and goals.",
  },
  {
    step: "04",
    title: "Intervention & Care",
    description: "Physiotherapy protocols, joint injections, or state-of-the-art minimally invasive surgery.",
  },
  {
    step: "05",
    title: "Dedicated Recovery",
    description: "Continuous post-op checkups, digital exercise monitoring, and sustained functional recovery.",
  },
];

const faqs = [
  {
    question: "How do I book an appointment with Dr Orthos?",
    answer: "You can book directly using the online booking widget above or visit the clinic during OPD hours. Online bookings receive an instant digital token number with live queue tracking.",
  },
  {
    question: "How does the live token queue tracking work?",
    answer: "When your appointment is scheduled or you check in at the reception desk, you receive a prioritized token number displayed on clinic OPD boards, keeping your consultation on schedule with minimal wait time.",
  },
  {
    question: "What documents should I bring for my first consultation?",
    answer: "Please bring any previous X-rays, MRI scans, CT reports, blood tests, and a list of your current medications. If you have had previous surgeries or joint injections, bringing discharge summaries is helpful.",
  },
  {
    question: "Does Dr Orthos recommend surgery for all knee pain?",
    answer: "No. In fact, over 80% of knee conditions are successfully managed conservatively through quadriceps strengthening physiotherapy, weight management, anti-inflammatory protocols, and joint injections. Surgery is only considered for severe end-stage osteoarthritis or complete ligament tears.",
  },
  {
    question: "Can I get digital prescriptions and receipts?",
    answer: "Yes. All consultations generate a clean, digitally signed prescription and printed summary with detailed medicine dosage times and clinical exercise advice provided at checkout.",
  },
  {
    question: "Are emergency fracture and trauma services supported?",
    answer: "Yes. Our clinic is equipped with digital X-ray, plaster casting, and splinting facilities for acute musculoskeletal injuries and fractures during OPD hours.",
  },
];

export function LandingPage() {
  return (
    <div id="main-content" className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* =====================================================================
          1. HERO SECTION
          ===================================================================== */}
      <section className="relative overflow-hidden tint-hero pt-12 pb-20 sm:pt-20 sm:pb-28 text-white">
        <div className="landing-grain pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Premier Orthopedic &amp; Joint Health Center</span>
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
                Move Better. <br />
                <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-white bg-clip-text text-transparent">
                  Live Stronger.
                </span>
              </h1>

              <p className="mx-auto lg:mx-0 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed text-balance">
                Advanced orthopedic care combining clinical experience, modern diagnostics, and personalized treatment. From joint preservation and sports arthroscopy to robotic joint replacement, your mobility is our singular focus.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#book"
                  className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 text-base font-bold text-white shadow-xl shadow-sky-600/30 hover:from-sky-400 hover:to-sky-500 transition-all active:scale-[0.98]"
                >
                  <Icon icon={faCalendarCheck} className="size-4" />
                  <span>Book an Appointment</span>
                </a>
                <a
                  href="#treatments"
                  className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-7 text-base font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all backdrop-blur-sm"
                >
                  <span>Explore Treatments</span>
                  <Icon icon={faArrowRight} className="size-3.5" />
                </a>
              </div>

              {/* Trust Indicators Bar */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-sky-400 font-bold text-lg sm:text-xl">Focused</div>
                  <div className="text-xs text-slate-400 font-medium">Orthopedic Care</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-sky-400 font-bold text-lg sm:text-xl">In-House</div>
                  <div className="text-xs text-slate-400 font-medium">Digital X-Ray OPD</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-sky-400 font-bold text-lg sm:text-xl">Real-Time</div>
                  <div className="text-xs text-slate-400 font-medium">Token Queue Sync</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-sky-400 font-bold text-lg sm:text-xl">Digital</div>
                  <div className="text-xs text-slate-400 font-medium">PDF Prescriptions</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card (Clinical Highlights) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-[#0F2E4A]/80 p-7 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                      <Icon icon={faUserDoctor} className="size-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Dr. Orthos Lead Consultant</div>
                      <div className="text-xs text-slate-400">Orthopedic &amp; Joint Specialist</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    OPD Active
                  </span>
                </div>

                {/* Clinical Checklist */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                    <Icon icon={faCheckCircle} className="size-4 text-sky-400 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <strong className="text-slate-200">Joint Preservation:</strong> Custom physical therapy &amp; viscosupplementation before surgical recommendation.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                    <Icon icon={faCheckCircle} className="size-4 text-sky-400 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <strong className="text-slate-200">Minimally Invasive Arthroscopy:</strong> Rapid recovery with tiny keyhole incisions for knee &amp; shoulder.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                    <Icon icon={faCheckCircle} className="size-4 text-sky-400 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <strong className="text-slate-200">Fracture &amp; Trauma Ready:</strong> Immediate digital imaging, waterproof fiberglass casts, and splints.
                    </div>
                  </div>
                </div>

                {/* Queue Tracker Snapshot */}
                <div className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sky-300 font-semibold flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-sky-400 animate-ping" />
                      Live OPD Queue Board
                    </span>
                    <span className="text-emerald-400 text-[11px] font-semibold tracking-wide uppercase">
                      Live Queue
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                    <span>Now Serving Token: <strong className="text-white text-sm">#12</strong></span>
                    <span>Average Wait: <strong className="text-white">~15 mins</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. TREATMENTS GRID SECTION
          ===================================================================== */}
      <section id="treatments" className="scroll-mt-24 py-20 sm:py-28 bg-white text-slate-900 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800">
              <Icon icon={faStethoscope} className="size-3 text-sky-600" />
              Specialized Orthopedic Care
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Comprehensive Treatments for Every Joint
            </h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              From non-invasive cartilage preservation to complex joint reconstruction, we provide clinical solutions tailored to your condition.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {orthopedicTreatments.map((treatment) => (
              <div
                key={treatment.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-xl hover:shadow-sky-100"
              >
                <div>
                  <div className="text-3xl mb-4">{treatment.icon}</div>
                  <span className="inline-block rounded-md bg-sky-100/70 px-2 py-0.5 text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                    {treatment.highlight}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {treatment.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {treatment.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-sky-600">
                  <span>Learn more</span>
                  <Icon icon={faArrowRight} className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. INTERACTIVE CONDITION EXPLORER
          ===================================================================== */}
      <ConditionExplorer />

      {/* =====================================================================
          4. WHY DR ORTHOS (CLINICAL PILLARS)
          ===================================================================== */}
      <section id="why" className="tint-band py-20 sm:py-28 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300">
              <Icon icon={faAward} className="size-3" />
              Clinical Governance
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Why Patients Choose Dr Orthos
            </h2>
            <p className="mt-3 text-base text-slate-300 sm:text-lg">
              We combine clinical expertise with an empathetic, patient-centered approach and modern digital healthcare convenience.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {clinicalPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-6 backdrop-blur-sm"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 mb-5">
                  <Icon icon={pillar.icon} className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. CARE PATHWAY JOURNEY
          ===================================================================== */}
      <section id="journey" className="scroll-mt-24 py-20 sm:py-28 bg-white text-slate-900 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800">
              <Icon icon={faHandHoldingHeart} className="size-3 text-sky-600" />
              Structured Care
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The Dr Orthos Patient Journey
            </h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              A transparent, 5-stage clinical pathway designed for clear expectations and sustained musculoskeletal recovery.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {careSteps.map((step) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-left"
              >
                <span className="font-display text-3xl font-black text-sky-600/40 block mb-2">
                  {step.step}
                </span>
                <h3 className="font-bold text-base text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. CLINICAL DOCTORS / SPECIALISTS
          ===================================================================== */}
      <section id="doctors" className="scroll-mt-24 py-20 sm:py-28 bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800">
              <Icon icon={faUserDoctor} className="size-3 text-sky-600" />
              Medical Faculty
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Orthopedic Specialists &amp; Surgeons
            </h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              Consult with experienced orthopedic consultants dedicated to joint preservation, sports medicine, and reconstructive surgery.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Doctor Card 1 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-[#0F2E4A] text-sky-300 text-2xl font-bold">
                    DO
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Dr. Orthos Lead Consultant
                    </h3>
                    <p className="text-xs font-semibold text-sky-700">
                      Chief Orthopedic Consultant &amp; Surgeon
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      MBBS, MS (Orthopedics), DNB
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  <p>
                    <strong className="text-slate-800">Special Focus:</strong> Complex joint replacement (Knee &amp; Hip), knee arthroscopy, ACL reconstruction, and joint preservation.
                  </p>
                  <p>
                    <strong className="text-slate-800">OPD Timings:</strong> Monday to Saturday: 9:00 AM – 1:00 PM &amp; 4:00 PM – 8:00 PM.
                  </p>
                  <p>
                    <strong className="text-slate-800">Registration:</strong> Verified State Medical Council (MCI-48291-MH).
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="#book"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-500 transition-all"
                >
                  <Icon icon={faCalendarCheck} className="size-3.5" />
                  <span>Book Consultation</span>
                </a>
              </div>
            </div>

            {/* Doctor Card 2 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-800 text-sky-300 text-2xl font-bold">
                    SM
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Sports Medicine &amp; Spine Consultant
                    </h3>
                    <p className="text-xs font-semibold text-sky-700">
                      Fellow in Sports Arthroscopy &amp; Spine Care
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      MBBS, D.Ortho, Fellowship in Arthroscopy
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  <p>
                    <strong className="text-slate-800">Special Focus:</strong> Shoulder impingement, rotator cuff repairs, sciatica non-surgical decompression, and athletic rehabilitation.
                  </p>
                  <p>
                    <strong className="text-slate-800">OPD Timings:</strong> Monday to Friday: 10:00 AM – 2:00 PM &amp; 5:00 PM – 7:30 PM.
                  </p>
                  <p>
                    <strong className="text-slate-800">Registration:</strong> Registered Specialist.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="#book"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-500 transition-all"
                >
                  <Icon icon={faCalendarCheck} className="size-3.5" />
                  <span>Book Consultation</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. INTERACTIVE BOOKING ENGINE (FLAGSHIP SECTION)
          ===================================================================== */}
      <section id="book" className="scroll-mt-24 py-20 sm:py-28 bg-[#071322]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <DrOrthoBookingWidget />
        </div>
      </section>

      {/* =====================================================================
          8. PATIENT RESOURCES & ACCORDION FAQ
          ===================================================================== */}
      <section id="faq" className="scroll-mt-24 py-20 sm:py-28 bg-surface text-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800">
              Patient Information
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Clear answers regarding appointment booking, queue tracking, imaging, and post-treatment recovery.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/50">
            <Accordion className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${i}`}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-5 transition-colors data-[state=open]:bg-sky-50/40 data-[state=open]:border-sky-200"
                >
                  <AccordionTrigger className="py-4 text-left font-display text-base font-semibold text-slate-900 hover:no-underline sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. FINAL CLINICAL CTA
          ===================================================================== */}
      <section className="tint-hero py-20 sm:py-24 text-white relative overflow-hidden text-center">
        <div className="landing-grain pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl text-balance">
            Your Next Step Toward Pain-Free Movement Starts Here.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            Schedule an in-person orthopedic evaluation today. Walk-ins and pre-booked digital tokens are accepted daily.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#book"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-sky-600/30 hover:from-sky-400 hover:to-sky-500 transition-all active:scale-[0.98]"
            >
              <Icon icon={faCalendarCheck} className="size-4" />
              <span>Book Consultation Now</span>
            </a>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-7 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <Icon icon={faUserDoctor} className="size-4 text-sky-400" />
              <span>Staff Workspace Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          10. PREMIUM CLINICAL FOOTER
          ===================================================================== */}
      <footer className="bg-[#071322] border-t border-slate-800 text-slate-300 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <BrandLogo size="lg" inverted />
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                Dr Orthos is an advanced orthopedic specialty practice delivering precision joint replacement, arthroscopic surgery, spine decompression, and dedicated rehabilitation.
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>📍 Suite 401, Dr Orthos Pavilion, Marine Lines, Mumbai 400020</p>
                <p>📞 Emergency Trauma Desk: +91 98765 43210</p>
                <p>✉️ contact@drorthos.in</p>
              </div>
            </div>

            {/* Col 2: Treatments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Treatments
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#treatments" className="hover:text-white">Knee Replacement</a></li>
                <li><a href="#treatments" className="hover:text-white">Hip Replacement</a></li>
                <li><a href="#treatments" className="hover:text-white">ACL Reconstruction</a></li>
                <li><a href="#treatments" className="hover:text-white">Rotator Cuff Repair</a></li>
                <li><a href="#treatments" className="hover:text-white">Spine Decompression</a></li>
                <li><a href="#treatments" className="hover:text-white">Fracture Casting &amp; Fixation</a></li>
              </ul>
            </div>

            {/* Col 3: Patients */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Patient Services
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#book" className="hover:text-white">Book Appointment</a></li>
                <li><a href="#faq" className="hover:text-white">Frequently Asked Questions</a></li>
                <li><Link href="/clinics" className="hover:text-white">Clinic Directory</Link></li>
              </ul>
            </div>

            {/* Col 4: Clinical Team */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Clinical Access
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link href="/login" className="hover:text-white">Doctor &amp; Admin Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-white">Clinic Registration</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Care</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Dr Orthos Healthcare. All rights reserved. Registered orthopedic healthcare practice.
            </p>
            <p className="text-center sm:text-right">
              Medical advice disclaimer: Online content is informational. Always consult a qualified orthopedic surgeon for medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
