"use client";

import { useState } from "react";
import {
  faBone,
  faTriangleExclamation,
  faCircleCheck,
  faNotesMedical,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";

const conditions = [
  {
    id: "knee-osteoarthritis",
    title: "Knee Osteoarthritis",
    subtitle: "Degenerative Joint Cartilage Wear",
    badge: "Most Common",
    symptoms: [
      "Persistent aching joint pain worse with walking or stair climbing",
      "Morning stiffness lasting 15–30 minutes",
      "Noticeable crackling or grating sensation (crepitus)",
      "Mild swelling and joint line tenderness",
    ],
    diagnostics: "Standing weight-bearing bilateral knee X-rays (AP & Lateral) to measure joint space reduction.",
    treatmentConservative: "Physiotherapy (isometric quadriceps strengthening), weight optimization, viscosupplementation or PRP injections.",
    treatmentSurgical: "Unicondylar (Partial) or Total Knee Arthroplasty (TKA) with robotic precision when daily function is severely restricted.",
  },
  {
    id: "acl-tear",
    title: "ACL & Meniscal Sports Tears",
    subtitle: "Knee Instability & Ligament Rupture",
    badge: "Sports Medicine",
    symptoms: [
      "Audible 'pop' sensation during sudden pivot or deceleration",
      "Rapid joint swelling (hemarthrosis) within 2–6 hours",
      "Instability and knee 'giving way' during direction changes",
      "Pain and mechanical locking if meniscus is trapped",
    ],
    diagnostics: "High-resolution 3T MRI of Knee and clinical Lachman / Pivot-shift tests.",
    treatmentConservative: "Supervised brace immobilization, acute swelling reduction, and functional neuromuscular rehabilitation.",
    treatmentSurgical: "Arthroscopic minimally invasive ACL reconstruction with hamstring/patellar graft and meniscal preservation repair.",
  },
  {
    id: "rotator-cuff",
    title: "Rotator Cuff Tears & Impingement",
    subtitle: "Shoulder Overhead Weakness & Pain",
    badge: "Upper Extremity",
    symptoms: [
      "Dull ache deep in shoulder, aggravated by reaching overhead or behind back",
      "Disturbed sleep when lying on the affected shoulder",
      "Arm weakness when lifting or rotating the shoulder",
      "Restricted active range of motion with preserved passive range",
    ],
    diagnostics: "Shoulder MRI and Neer's / Hawkins-Kennedy impingement clinical testing.",
    treatmentConservative: "Targeted rotator cuff strengthening, subacromial corticosteroid or PRP infiltration.",
    treatmentSurgical: "Keyhole arthroscopic subacromial decompression and suture-anchor rotator cuff tendon repair.",
  },
  {
    id: "spine-sciatica",
    title: "Lumbar Disc Herniation & Sciatica",
    subtitle: "Lower Back Pain Radiating to Leg",
    badge: "Spine Care",
    symptoms: [
      "Sharp, electric shock-like shooting pain down buttock, thigh, and calf",
      "Numbness, tingling, or 'pins and needles' in foot and toes",
      "Pain aggravated by prolonged sitting, coughing, or bending forward",
      "Weakness in ankle dorsiflexion or big toe extension in severe cases",
    ],
    diagnostics: "Lumbar spine MRI and neurological straight leg raise (SLR) evaluation.",
    treatmentConservative: "Brief active rest, neuro-protective medications (Pregabalin/Methylcobalamin), core stabilization physiotherapy, and selective nerve root block.",
    treatmentSurgical: "Micro-endoscopic discectomy (MED) for persistent neurological deficit or intractable pain unresponsive to 6 weeks of conservative care.",
  },
  {
    id: "fracture-trauma",
    title: "Fractures & Acute Trauma",
    subtitle: "Bone Fractures, Casts & Fixation",
    badge: "Urgent OPD Care",
    symptoms: [
      "Severe localized pain immediately following fall, impact, or accident",
      "Obvious deformity, unnatural bone mobility, or inability to bear weight",
      "Rapid bruising, hematoma formation, and localized swelling",
      "Point tenderness over bone surfaces",
    ],
    diagnostics: "Emergency digital radiography (2 views minimum) and 3D CT reconstruction for complex intra-articular injuries.",
    treatmentConservative: "Closed anatomical reduction, waterproof fiberglass cast immobilization, and serial radiological union monitoring.",
    treatmentSurgical: "Open reduction and internal fixation (ORIF) with titanium anatomical locking plates and intramedullary nails.",
  },
];

export function ConditionExplorer() {
  const [activeId, setActiveId] = useState(conditions[0].id);
  const activeCondition = conditions.find((c) => c.id === activeId) || conditions[0];

  return (
    <div id="conditions" className="scroll-mt-24 py-16 sm:py-24 bg-surface text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800">
            <Icon icon={faBone} className="size-3 text-sky-600" />
            Patient Health Guide
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Understand Your Musculoskeletal Health
          </h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Accurate diagnosis is the cornerstone of effective orthopedic treatment. Explore common conditions, clinical indicators, and non-surgical versus surgical treatment pathways.
          </p>
        </div>

        {/* Condition Selector Tabs */}
        <div className="mt-12 flex flex-wrap justify-center gap-2 sm:gap-3">
          {conditions.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#0F2E4A] text-white shadow-md shadow-slate-900/15 ring-2 ring-sky-500"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        {/* Selected Condition Detail Card */}
        <div className="mx-auto mt-10 max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-800">
                {activeCondition.badge}
              </span>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                {activeCondition.title}
              </h3>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                {activeCondition.subtitle}
              </p>
            </div>

            <a
              href="#book"
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-sky-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-500 transition-all"
            >
              <span>Consult for this Condition</span>
              <Icon icon={faArrowRight} className="size-3.5" />
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Symptoms & Diagnostics */}
            <div className="space-y-6">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
                  <Icon icon={faTriangleExclamation} className="size-4 text-amber-500" />
                  Common Clinical Symptoms
                </h4>
                <ul className="mt-3 space-y-2.5">
                  {activeCondition.symptoms.map((symptom, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-1 size-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Icon icon={faNotesMedical} className="size-3.5 text-sky-600" />
                  Diagnostic Protocol
                </h5>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {activeCondition.diagnostics}
                </p>
              </div>
            </div>

            {/* Right: Treatment Pathways */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Step 1: Conservative &amp; Non-Surgical Care (First Line)
                  </h4>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-emerald-900 leading-relaxed">
                  {activeCondition.treatmentConservative}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-sky-600 text-white text-xs font-bold">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-sky-950">
                    Step 2: Precision Surgical Intervention (When Indicated)
                  </h4>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-sky-900 leading-relaxed">
                  {activeCondition.treatmentSurgical}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                <Icon icon={faCircleCheck} className="size-3.5 text-slate-400" />
                Individual treatment pathways are customized following clinical examination and imaging review.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
