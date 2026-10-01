/**
 * Comprehensive clinical recommendation options across Consultation, Prescription,
 * Investigations, and Documents (Referral & Medical Certificate).
 */

export const CHIEF_COMPLAINT_RECOMMENDATIONS = [
  "Pain in right knee joint aggravated by walking and climbing stairs",
  "Pain in left knee joint with morning stiffness and crepitus",
  "Bilateral knee pain with joint stiffness and difficulty sitting cross-legged",
  "Severe low back pain radiating to right lower limb (sciatica)",
  "Lower backache with muscle stiffness, aggravated by forward bending",
  "Neck pain with stiffness radiating to left shoulder and arm (cervical radiculopathy)",
  "Acute right ankle pain, swelling, and difficulty bearing weight following twist",
  "Acute left ankle sprain following slip and fall",
  "Right shoulder pain with restricted overhead abduction (frozen shoulder / adhesive capsulitis)",
  "Bilateral heel pain, severe on first taking steps in the morning (plantar fasciitis)",
  "High grade fever with chills, generalized body ache, and headache for 3 days",
  "Persistent dry cough with sore throat and runny nose for 4 days",
  "Burning epigastric pain, acid regurgitation, and bloating after meals (GERD)",
  "Watery loose stools with cramping abdominal pain for 2 days (acute enteritis)",
  "Burning micturition with increased urinary frequency and pelvic discomfort (UTI)",
  "Generalized fatigue, body ache, and muscle weakness",
  "Post-traumatic injury with localized swelling and tenderness",
] as const;

export const ONSET_RECOMMENDATIONS = [
  "Acute onset (today)",
  "Acute onset (2-3 days ago)",
  "Subacute onset (1-2 weeks ago)",
  "Gradual onset (1 month ago)",
  "Insidious onset (over 2-3 months)",
  "Chronic progressive (over 6-12 months)",
  "Post-traumatic (following twist / fall)",
  "Recurrent episodic flare-up",
] as const;

export const DURATION_RECOMMENDATIONS = [
  "1 day",
  "3 days",
  "5 days",
  "1 week",
  "2 weeks",
  "1 month",
  "2 months",
  "3 months",
  "6 months",
  "Intermittent (comes and goes)",
  "Continuous and progressive",
] as const;

export const HPI_RECOMMENDATIONS = [
  "Pain started gradually and has progressively worsened with prolonged standing and walking. Partially relieved by rest and oral analgesics.",
  "Sudden onset sharp shooting pain down the posterior aspect of thigh and calf, associated with tingling sensation and numbness in L5-S1 dermatomal distribution. Exacerbated by coughing and forward bending.",
  "Acute twisting injury while walking on uneven surface, followed by immediate localized swelling, lateral tenderness, and inability to bear full weight.",
  "Severe morning joint stiffness lasting > 30 minutes, difficulty in initiating movements, improves gradually with warm fomentation and light mobility.",
  "Fever associated with chills, generalized malaise, myalgia, sore throat, and dry cough. No shortness of breath or chest pain reported.",
  "Retrosternal burning pain and acid regurgitation, aggravated by spicy/oily food and lying flat after meals. Associated with water brash and nausea.",
  "Acute onset of watery loose stools (5-6 episodes/day) with cramping abdominal pain and mild dehydration. No blood or mucus in stool.",
] as const;

export const PAST_MEDICAL_RECOMMENDATIONS = [
  "No known chronic medical illness",
  "Hypertension (controlled on medication)",
  "Type 2 Diabetes Mellitus (on oral hypoglycemic agents)",
  "Dyslipidemia (elevated cholesterol/triglycerides)",
  "Hypothyroidism (on daily Levothyroxine)",
  "Ischemic Heart Disease / Post-PTCA with stent",
  "Bronchial Asthma / Atopy",
  "Hyperuricemia / Gouty arthritis",
  "Osteopenia / Osteoporosis (T-score < -2.5)",
  "Acid Peptic Disease / Chronic Gastritis",
  "Chronic Kidney Disease (Stage 3)",
] as const;

export const PAST_SURGICAL_RECOMMENDATIONS = [
  "No past surgical history",
  "History of appendectomy (open / lap)",
  "History of cholecystectomy (laparoscopic)",
  "History of total knee replacement (TKR)",
  "History of lumbar spine surgery / laminectomy",
  "History of ORIF (Open Reduction Internal Fixation) for fracture",
  "History of arthroscopic ACL reconstruction / meniscectomy",
  "History of Caesarean section (LSCS)",
  "History of inguinal hernia repair (mesh plasty)",
] as const;

export const ALLERGIES_RECOMMENDATIONS = [
  "No known drug allergies (NKDA)",
  "Allergic to Penicillin and beta-lactams",
  "Allergic to Sulfa / Sulfonamide drugs",
  "Allergic to NSAIDs (develops bronchospasm or gastric bleeding)",
  "Allergic to Paracetamol",
  "Allergic to Ciprofloxacin / Fluoroquinolones",
  "Allergic to IV Contrast media / Iodine",
  "Allergic to dust, pollen, and animal dander (allergic rhinitis)",
] as const;

export const CURRENT_MEDICATIONS_RECOMMENDATIONS = [
  "None",
  "Tab Telmisartan 40 mg OD morning",
  "Tab Amlodipine 5 mg OD morning",
  "Tab Metformin 500 mg BD after meals",
  "Tab Glimepiride 1 mg OD before breakfast",
  "Tab Atorvastatin 20 mg HS at bedtime",
  "Tab Thyronorm 50 mcg OD empty stomach",
  "Tab Pantoprazole 40 mg OD 30 mins before breakfast",
  "Tab Ecosprin 75 mg OD after lunch",
  "Tab Calcium 500 mg + Vitamin D3 OD after dinner",
] as const;

export const FAMILY_HISTORY_RECOMMENDATIONS = [
  "No significant family history of chronic illness",
  "Father had Hypertension and Coronary Artery Disease",
  "Mother has Type 2 Diabetes Mellitus",
  "Strong family history of degenerative Osteoarthritis",
  "Family history of Rheumatoid Arthritis / Autoimmune disease",
  "Family history of Bronchial Asthma / Atopic allergies",
] as const;

export const SOCIAL_HISTORY_RECOMMENDATIONS = [
  "Non-smoker, non-alcoholic",
  "Occasional social alcohol consumption; non-smoker",
  "Chronic tobacco chewer / smoker (1 pack/day)",
  "Ex-smoker (quit > 5 years ago)",
  "Sedentary lifestyle with prolonged desk sitting (> 8 hrs/day)",
  "Active lifestyle with daily 45 mins morning walk / yoga",
  "Manual laborer with heavy weight-bearing activities",
] as const;

export const GENERAL_EXAM_RECOMMENDATIONS = [
  "Conscious, oriented to time, place, and person. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, or pedal edema. Vitals stable.",
  "Comfortable at rest. Mild antalgic gait noted on walking. Systemic vitals within normal limits.",
  "Severe antalgic gait, walking with support/stick. Guarding affected lower limb.",
  "Bilateral pedal edema present (+). No pallor or icterus. BP within normal limits.",
  "Febrile to touch (101°F). Mild dehydration present with dry tongue.",
] as const;

export const CVS_EXAM_RECOMMENDATIONS = [
  "S1, S2 heard normally. Regular rhythm. No murmurs, rub, or gallop.",
  "Normal heart sounds, no carotid bruit, peripheral pulses well felt.",
  "Sinus tachycardia present (pulse > 100 bpm); normal heart sounds, no murmur.",
] as const;

export const RESP_EXAM_RECOMMENDATIONS = [
  "Bilateral air entry equal. Vesicular breath sounds heard. No wheezing, rhonchi, or crepitations.",
  "Bilateral clear breath sounds. Chest expansion symmetrical, no chest indrawing.",
  "Mild bilateral end-expiratory rhonchi / wheezing heard on forced expiration.",
  "Fine basal crepitations present in bilateral lung bases.",
] as const;

export const ABDOMEN_EXAM_RECOMMENDATIONS = [
  "Soft, non-tender, non-distended. Normal bowel sounds. No hepatosplenomegaly or palpable mass.",
  "Mild epigastric tenderness present on deep palpation. No guarding, rigidity, or rebound.",
  "Right iliac fossa non-tender, Rovsing's negative, Murphy's sign negative. Soft and relaxed.",
  "Active bowel sounds present, abdomen soft and flat.",
] as const;

export const NEURO_EXAM_RECOMMENDATIONS = [
  "Higher mental functions intact. Cranial nerves I-XII normal. Motor power 5/5 all 4 limbs. DTR 2+ symmetrical. Plantars bilateral flexor. Sensations intact.",
  "Straight Leg Raising (SLR) positive on right side at 45 degrees. Cross SLR negative. L5 dermatomal hypoesthesia.",
  "SLR negative bilaterally (80 degrees). Normal motor power (5/5) and intact pinprick sensations in bilateral lower limbs.",
  "Cervical Spurling test positive. Biceps and triceps reflexes symmetrical. Normal hand grip strength.",
  "No focal neurological deficits detected.",
] as const;

export const OTHER_EXAM_RECOMMENDATIONS = [
  "Right knee: Medial joint line tenderness (+), joint crepitus on passive flexion, range of motion 0-110°, Lachman & McMurray tests negative, no joint effusion.",
  "Left knee: Medial compartment tenderness, mild suprapatellar fullness, patellar grind test positive, terminal flexion painful.",
  "Lumbar spine: Tenderness over L4-L5 and L5-S1 spinous processes, severe paravertebral muscle spasm (+), forward flexion restricted by 50%.",
  "Cervical spine: Tenderness over bilateral trapezius and cervical paraspinal muscles, restricted rotation and lateral bending.",
  "Right shoulder: Painful arc present (60-120°), Neer's impingement positive, Hawkins-Kennedy positive, rotator cuff power 4/5.",
  "Right ankle: Lateral malleolar edema, tenderness over anterior talofibular ligament (ATFL), anterior drawer test negative, neurovascular bundle intact.",
] as const;

export const DIAGNOSIS_NOTES_RECOMMENDATIONS = [
  "Bilateral Knee Osteoarthritis (Grade II-III Kellgren-Lawrence)",
  "Acute Lumbar Spondylosis with L4-L5 Disc Protrusion and Sciatica",
  "Cervical Spondylosis with Paravertebral Muscle Spasm",
  "Acute Ankle Sprain (Lateral Ligament Complex Strain Grade I/II)",
  "Right Shoulder Subacromial Impingement / Frozen Shoulder",
  "Bilateral Plantar Fasciitis with Calcaneal Spur",
  "Acute Viral Upper Respiratory Tract Infection (Common Cold & Flu)",
  "Acid Peptic Disease / Gastroesophageal Reflux Disease (GERD)",
  "Acute Infectious Gastroenteritis with Mild Dehydration",
  "Uncomplicated Urinary Tract Infection (Acute Cystitis)",
  "Essential Hypertension (Grade 1)",
  "Type 2 Diabetes Mellitus with Peripheral Neuropathy",
] as const;

export const ADDITIONAL_NOTES_RECOMMENDATIONS = [
  "Patient reassured regarding benign degenerative changes. Prognosis and importance of non-pharmacological lifestyle modifications explained.",
  "Discussed surgical vs conservative options. Patient elected for trial of conservative medical management and physiotherapy for 3-4 weeks.",
  "Advised to avoid high-impact activities, sitting cross-legged, and squatting. Follow up with fresh X-ray if symptoms do not improve in 2 weeks.",
  "Counseled regarding ergonomics, proper posture while sitting, and regular isometric core/quadriceps strengthening exercises.",
  "Red flag signs explained: to report immediately if progressive leg weakness, bowel/bladder incontinence, or severe intractable pain develops.",
] as const;

/* ---------------- PRESCRIPTION FIELD RECOMMENDATIONS ---------------- */

export const DOSAGE_RECOMMENDATIONS = [
  "1 tablet",
  "1/2 tablet",
  "2 tablets",
  "1 capsule",
  "5 ml (1 teaspoon)",
  "10 ml (2 teaspoons)",
  "15 ml (1 tablespoon)",
  "1 sachet in 200 ml water",
  "1 sachet in 1 liter water",
  "Gentle local application",
  "1 puff",
  "2 puffs",
  "1 spray each nostril",
  "2 drops in affected eye/ear",
  "1 injection IM",
  "1 injection IV",
] as const;

export const DURATION_PRESETS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "21 days",
  "1 month",
  "2 months",
  "3 months",
  "SOS (As needed)",
] as const;

export const ADVICE_RECOMMENDATIONS = [
  "• Steam inhalation twice daily.\n• Warm saline water gargles.\n• Drink plenty of warm fluids (2.5-3 liters/day).\n• Adequate bed rest.",
  "• Avoid squatting, sitting cross-legged, and frequent stair climbing.\n• Apply ice pack for 15 mins twice daily during acute flare.\n• Wear comfortable, well-cushioned footwear.\n• Isometric quadriceps exercises once acute pain subsides.",
  "• Sleep on a firm mattress with pillow under knees.\n• Strictly avoid lifting heavy weights and forward bending from the waist.\n• Use a lumbar support cushion while sitting.\n• Core stability exercises after pain subsides.",
  "• Avoid spicy, fried, sour foods, tea, coffee, and late-night snacking.\n• Take smaller, more frequent meals; do not skip breakfast.\n• Do not lie down within 2 hours of eating dinner.\n• Elevate head end of bed by 6 inches.",
  "• R.I.C.E. protocol:\n  - Rest: Minimize weight bearing\n  - Ice: Cold pack for 15 mins 3 times a day\n  - Compression: Crepe bandage wrap\n  - Elevation: Keep limb elevated above heart level.",
  "• Low salt diet (< 5g/day).\n• Avoid pickles, papads, and processed snacks.\n• 30 minutes of brisk walking daily.\n• Monitor blood pressure weekly.",
  "• Strict diabetic diet: avoid sweets, table sugar, potatoes, and white bread.\n• 30-45 minutes of daily physical exercise.\n• Check fasting and post-prandial blood sugar every 2 weeks.",
] as const;

export const FOLLOW_UP_RECOMMENDATIONS = [
  "Review after 3 days if fever or symptoms persist.",
  "Review after 5 days for clinical progress assessment.",
  "Review after 7 days.",
  "Review after 2 weeks.",
  "Review after 1 month with Blood Pressure / Blood Sugar log.",
  "Review with X-ray / MRI imaging reports.",
  "Review with Lab reports (CBC, ESR, CRP, Uric Acid).",
  "SOS / report immediately if pain intensifies or red flag signs develop.",
] as const;

/* ---------------- INVESTIGATIONS RECOMMENDATIONS ---------------- */

export const LAB_RESULTS_RECOMMENDATIONS = [
  "CBC: Hb 13.5 g/dL, TLC 7,800 /mcL, Platelets 2.5 lakhs /mcL — Within normal limits.",
  "Inflammatory markers: ESR 36 mm/hr (mildly elevated), CRP 14 mg/L (positive). Suggestive of active inflammation.",
  "Metabolic panel: Fasting Blood Sugar 118 mg/dL, Post-Prandial 164 mg/dL, HbA1c 6.6%.",
  "Serum Uric Acid: 7.9 mg/dL (elevated hyperuricemia).",
  "Rheumatology workup: RA Factor negative, Anti-CCP negative, ANA negative by IFA.",
  "Kidney Function Tests: S. Creatinine 0.9 mg/dL, Blood Urea 28 mg/dL, S. Uric Acid 5.2 mg/dL — Normal.",
  "Liver Function Tests: S. Bilirubin 0.8 mg/dL, SGOT 26 U/L, SGPT 30 U/L, Alkaline Phosphatase 88 U/L — Normal.",
  "Lipid Profile: Total Cholesterol 228 mg/dL, Triglycerides 192 mg/dL, HDL 41 mg/dL, LDL 148 mg/dL.",
  "Thyroid Profile: TSH 2.8 uIU/mL, Free T4 1.15 ng/dL — Euthyroid state.",
  "Urine Routine & Microscopy: Albumin Nil, Sugar Nil, Pus cells 1-2 /HPF, RBCs Nil, Casts Nil — Normal.",
] as const;

export const IMAGING_RESULTS_RECOMMENDATIONS = [
  "X-ray Bilateral Knees (AP & Lateral Weight-bearing): Medial compartment joint space narrowing with subchondral sclerosis and marginal osteophyte formation. Features consistent with Grade II-III Osteoarthritis (Kellgren-Lawrence).",
  "X-ray Lumbar Spine (AP & Lateral): Degenerative changes with L4-L5 disc space narrowing and anterior osteophyte formation. No spondylolisthesis or bony erosion.",
  "X-ray Cervical Spine (AP & Lateral): Straightening of cervical spine with loss of normal lordosis secondary to muscle spasm. C5-C6 disc space reduction.",
  "X-ray Chest (PA View): Normal cardiac silhouette, clear bilateral lung parenchyma, normal costophrenic angles. No active pulmonary infiltration.",
  "X-ray Right Ankle (AP & Lateral): No fracture or dislocation seen. Normal mortise joint alignment. Soft tissue swelling noted over lateral malleolar region.",
  "MRI Lumbo-Sacral Spine: L4-L5 posterior disc extrusion causing thecal sac indentation and right L5 nerve root impingement. Facet joint arthropathy noted.",
  "MRI Right Knee: Complex tear of posterior horn of medial meniscus. Intact ACL, PCL, and collateral ligaments. Mild joint effusion.",
  "Ultrasound Abdomen & Pelvis: Normal liver, gallbladder, pancreas, spleen, and kidneys. No cholelithiasis, nephrolithiasis, or hydronephrosis.",
] as const;

export const OTHER_INVESTIGATION_RECOMMENDATIONS = [
  "Electrocardiogram (ECG): Normal sinus rhythm, rate 74 bpm, normal axis, no ST-T segment elevation/depression.",
  "Dual-energy X-ray Absorptiometry (DEXA): Lumbar spine T-score -2.8 (Osteoporosis), Femoral neck T-score -1.9 (Osteopenia).",
  "Electromyography / Nerve Conduction Velocity (EMG/NCV): Symmetrical sensory-motor peripheral polyneuropathy of bilateral lower extremities.",
] as const;

/* ---------------- DOCUMENTS (REFERRAL & MEDICAL CERTIFICATE) ---------------- */

export const REFERRAL_SPECIALTY_RECOMMENDATIONS = [
  "Orthopedics & Joint Replacement",
  "Spine Surgery",
  "Neurology",
  "Rheumatology",
  "Cardiology",
  "Physical Medicine & Rehabilitation (Physiotherapy)",
  "General Surgery",
  "Gastroenterology",
  "Pulmonology / Chest Medicine",
  "Endocrinology & Diabetology",
  "Nephrology",
  "Dermatology",
  "ENT (Otorhinolaryngology)",
  "Psychiatry & Behavioral Sciences",
] as const;

export const REFERRAL_FACILITY_RECOMMENDATIONS = [
  "Tertiary Care Medical Center",
  "Government Medical College & Hospital",
  "District Civil Hospital",
  "Super Specialty Hospital",
  "Advanced Diagnostic & MRI Imaging Center",
  "Specialized Physiotherapy & Sports Rehab Center",
  "Comprehensive Orthopedic Trauma Center",
] as const;

export const REFERRAL_REASON_RECOMMENDATIONS = [
  "Evaluation for surgical intervention / joint replacement (TKR/THR)",
  "Advanced MRI neuro-imaging and spine surgical consultation for persistent radiculopathy",
  "Management of chronic refractory radicular pain and consideration of epidural steroid injection",
  "Pre-operative cardiac risk evaluation and fitness clearance",
  "Comprehensive rheumatological workup for suspected inflammatory arthritis / spondyloarthropathy",
  "Structured physical therapy, gait retraining, and core stabilization protocol",
  "Upper gastrointestinal endoscopy evaluation for chronic refractory dyspepsia/GERD",
  "Specialist consultation for brittle diabetes and glycemic optimization",
] as const;

export const REFERRAL_NOTES_RECOMMENDATIONS = [
  "Patient was evaluated in our OPD with progressive symptoms. Conservative trial provided partial relief. Kindly evaluate for advanced intervention / surgery and advise.",
  "History and relevant baseline investigations attached. Requesting your expert opinion and further management plan.",
  "Patient has multiple comorbidities (HTN, T2DM). Kindly review and provide clinical clearance / optimization.",
] as const;

export const MED_CERT_DIAGNOSIS_RECOMMENDATIONS = [
  "Acute flare of bilateral knee osteoarthritis",
  "Acute lumbar disc herniation with severe radiculopathy / sciatica",
  "Cervical spondylosis with paravertebral muscle spasm",
  "Acute ankle ligament sprain (lateral ligament injury)",
  "Acute viral upper respiratory tract infection with fever",
  "Acute infectious gastroenteritis with dehydration",
  "Post-operative orthopedic convalescence and rehabilitation",
] as const;

export const MED_CERT_FITNESS_RECOMMENDATIONS = [
  "Unfit for work/duty — Advised strict medical rest",
  "Fit to resume duty with ergonomic modifications (Avoid lifting heavy weights & bending)",
  "Fit to resume light desk duties only; avoid field duties",
  "Fit to resume full normal official duties",
  "Advised medical leave for 5 days; review on expiry",
  "Advised medical leave for 7 days; review on expiry",
  "Advised medical leave for 14 days; review on expiry",
] as const;

export const MED_CERT_REMARKS_RECOMMENDATIONS = [
  "Advised strict rest at home and avoid weight bearing on the affected limb.",
  "Recommended ergonomic chair support; avoid prolonged sitting or forward bending.",
  "Avoid strenuous physical activities, climbing ladders/stairs, and sports for 4 weeks.",
  "Patient has sufficiently recovered and is medically fit to resume official duties.",
  "Light desk duties recommended; strictly avoid field duties and two-wheeler travel for 2 weeks.",
] as const;
