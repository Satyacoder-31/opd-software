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

export const JOINTS_AND_PARTS_EXAM_RECOMMENDATIONS = [
  // Full screening / normal
  "Full Joint & Spine Screening: Bilateral shoulders, elbows, wrists, hips, knees, and ankles have full active and passive range of motion without pain. No joint effusion, warmth, deformity, or tenderness. Spine curvature normal with free movements. Gait steady and symmetrical. Distal neurovascular status intact in all 4 extremities.",

  // Knee
  "Right knee: Medial joint line tenderness (+), joint crepitus on passive flexion, range of motion 0-110°, Lachman & McMurray tests negative, no joint effusion.",
  "Left knee: Medial compartment tenderness, mild suprapatellar fullness, patellar grind test positive, terminal flexion painful.",
  "Bilateral knees: Bilateral varus deformity, medial joint line tenderness (+/+), coarse patellofemoral crepitus, flexion restricted to 100° bilaterally, no acute effusion.",
  "Right knee (ACL / Meniscal tear): Anterior drawer (+) and Lachman (+) with soft endpoint, medial joint line tenderness (+), McMurray positive with palpable click, moderate joint effusion.",
  "Knee (Patellofemoral syndrome): Retropatellar tenderness on lateral facet, Clarke's sign (patellar grind) positive, J-sign positive on terminal extension, crepitus on squatting.",

  // Shoulder
  "Right shoulder: Painful arc present (60-120°), Neer's impingement positive, Hawkins-Kennedy positive, rotator cuff power 4/5, supraspinatus empty-can test tender.",
  "Left shoulder (Adhesive capsulitis / Frozen shoulder): Active and passive abduction restricted to 80°, external rotation restricted to 20°, capsular end-feel, diffuse shoulder girdle tenderness.",
  "Shoulder (Instability / Labrum): Anterior apprehension test positive, relocation test relieves apprehension, Sulcus sign negative, generalized ligamentous laxity score 2/9.",
  "Shoulder (Bicipital tendinitis): Tenderness localized over anterior bicipital groove, Speed's test positive, Yergason's test positive, rotator cuff power 5/5.",

  // Spine - Lumbar & Sacroiliac
  "Lumbar spine: Tenderness over L4-L5 and L5-S1 spinous processes, severe paravertebral muscle spasm (+), forward flexion restricted by 50%, right SLR positive at 45°, cross SLR negative, L5 hypoesthesia.",
  "Lumbar spondylosis: Paravertebral muscle tenderness across L3-S1, extension painful and restricted, bilateral SLR 70° with hamstring tightness, intact motor power (5/5).",
  "Sacroiliac (SI) joint: Tenderness over right SI joint, FABER (Patrick's) test positive on right, Gaenslen's test positive, pelvic compression test reproduces localized buttock pain.",

  // Spine - Cervical & Thoracic
  "Cervical spine: Tenderness over bilateral trapezius and cervical paraspinal muscles, restricted rotation and lateral bending, Spurling's test positive on right, symmetrical upper extremity DTRs.",
  "Thoracic spine: Mid-thoracic (T6-T9) paraspinal tenderness, rib spring test negative, postural thoracic hyperkyphosis, symmetrical chest expansion (3.5 cm).",

  // Hip Joint & Pelvis
  "Right hip: Groin pain on passive internal rotation, internal rotation restricted to 10°, flexion restricted to 95°, Thomas test reveals 15° fixed flexion deformity, Trendelenburg test negative.",
  "Greater trochanter / Bursitis: Marked point tenderness over lateral greater trochanter, pain on resisted hip abduction, internal/external rotation of hip painless.",
  "Hip (Avascular necrosis / AVN): Deep groin pain aggravated by axial loading and weight bearing, log-roll test positive, internal rotation painfully restricted, antalgic Trendelenburg gait.",

  // Elbow Joint
  "Right elbow (Tennis elbow / Lateral epicondylitis): Tenderness localized to lateral epicondyle, Cozen's test strongly positive, Mill's test positive, wrist flexion-extension full.",
  "Left elbow (Golfer's elbow / Medial epicondylitis): Tenderness over medial epicondyle and common flexor origin, reverse Cozen's test positive, resisted wrist flexion reproduces pain.",
  "Elbow (Olecranon bursitis / Cubital tunnel): Swelling and fluctuance over olecranon bursa without redness; full elbow ROM; Tinel's sign negative over ulnar nerve at cubital groove.",

  // Wrist & Hand
  "Bilateral hands (Carpal tunnel syndrome): Phalen's test positive at 30 seconds bilaterally, Tinel's sign positive over volar median nerve, thenar bulk preserved, numbness in thumb/index/middle fingers.",
  "Right wrist (De Quervain's tenosynovitis): Marked tenderness over 1st extensor compartment at radial styloid, Finkelstein's test strongly positive, Eichhoff's test positive.",
  "Hands (Osteoarthritis): Heberden's nodes at bilateral DIP joints, Bouchard's nodes at PIP joints, squaring of 1st CMC joint with grind test positive.",
  "Hands (Rheumatoid arthritis): Symmetrical synovitis of MCP and PIP joints, early ulnar drift, morning stiffness pattern, normal grip strength.",
  "Fingers (Trigger finger): Palpable tender nodule over A1 pulley of right ring finger, audible click and mechanical catching on active extension.",

  // Ankle & Foot
  "Right ankle: Lateral malleolar edema, tenderness over anterior talofibular ligament (ATFL), anterior drawer test negative, neurovascular bundle intact.",
  "Bilateral feet (Plantar fasciitis): Marked point tenderness over medial calcaneal tuberosity at plantar fascia insertion, Windlass test positive, tight Achilles-gastrocnemius complex.",
  "Achilles tendinitis: Tenderness and nodular thickening 3-4 cm proximal to calcaneal insertion, pain on passive dorsiflexion, Thompson calf-squeeze test negative (intact tendon).",
  "Foot (Flat foot / Pes planus): Bilateral loss of medial longitudinal arch on weight bearing, hindfoot valgus, too-many-toes sign positive, arch reconstitutes on tip-toe standing (flexible).",
  "Foot (Hallux valgus / Bunion): Medial prominence of 1st MTP joint with mild erythema, hallux valgus angle ~25°, tender bunion on footwear pressure.",

  // TMJ
  "Temporomandibular joint (TMJ): Bilateral preauricular tenderness, clicking noise on terminal mouth opening, jaw deviation to right, inter-incisal distance 38 mm.",

  // Gait & Biomechanical Alignment
  "Gait & Posture: Antalgic gait with reduced stance phase on right lower limb, uses walking stick for support. Spine shows forward head posture with mild hyperlordosis.",
  "Alignment: Genu varum (bow legs) with 4 cm intercondylar distance, patellae track symmetrically, normal distal pulses (dorsalis pedis & posterior tibial 2+).",
] as const;

export const OTHER_EXAM_RECOMMENDATIONS = JOINTS_AND_PARTS_EXAM_RECOMMENDATIONS;

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

/* ---------------- ADVICE SECTION DETAILED RECOMMENDATIONS ---------------- */

export const ADVICE_GENERAL_PRECAUTIONS = [
  "Avoid squatting, sitting cross-legged (palathi), and repeated stair climbing. Use western commode.",
  "Ergonomic sitting: high-backed chair with lumbar support cushion. Avoid slumping; take a 5-min walk break every 45 mins.",
  "Strictly avoid lifting heavy weights (> 5 kg) and bending forward from waist; bend knees when picking objects from floor.",
  "Wear comfortable, well-cushioned shock-absorbing footwear (MCP footwear / cushioned running shoes); avoid walking barefoot on hard floors.",
  "Use orthopedic support: Lumbar sacral (LS) belt during travel/activity; hinged knee brace / patellar knee cap during weight bearing.",
  "Sleep on a firm orthopedic mattress with a pillow under knees (for back pain) or ergonomic cervical pillow under neck.",
  "Apply ice pack for 15-20 mins 3 times a day for acute flare-up / swelling; hot moist fomentation for chronic morning stiffness.",
] as const;

export const ADVICE_PHYSIOTHERAPY_RECOMMENDATIONS = [
  "Knee Isometric Protocol: Static quadriceps contractions (hold 10s x 15 reps twice daily), straight leg raises (SLR), hamstring curls, vastus medialis obliquus (VMO) strengthening.",
  "Lumbar Spine Core Stability: Pelvic tilts, cat-and-camel stretches, gentle knee-to-chest, isometric abdominal drawing-in, bridging exercises. Avoid spinal crunches during acute phase.",
  "Cervical Spine Isometric Rehab: Isometric neck strengthening (anterior, posterior, lateral resistance), chin tucks, scapular retractions, upper trapezius gentle stretching.",
  "Shoulder Rehabilitation: Codman's pendulum exercises, wall-climbing finger walks, active-assisted overhead elevation with wand/stick, theraband rotator cuff strengthening.",
  "Foot & Ankle Rehabilitation: Plantar fascia stretching (toe-pull stretch), Achilles tendon wall stretch, frozen water bottle roll under foot for 10 mins twice daily, ankle mobility circles.",
  "Post-Op Early Mobilization: Bedside ankle pumps, active assisted knee flexion-extension, assisted walker ambulation as per surgeon weight-bearing protocol.",
] as const;

export const ADVICE_ACTIVITY_RESTRICTIONS = [
  "Restrict high-impact activities (running, jumping, heavy sports, heavy gym deadlifts/squats) until reassessment.",
  "Avoid prolonged static sitting or standing (> 1 hour without posture break). Alternate sitting and standing.",
  "Avoid sudden twisting, jerking, or hyperextension movements of the spine or neck.",
  "Avoid two-wheeler / bumpy road travel during acute spinal spasm / flare-up.",
  "No forward bending from waist; lift objects by keeping back straight and bending hips and knees.",
] as const;

export const ADVICE_DIET_LIFESTYLE_RECOMMENDATIONS = [
  "Weight optimization target: Aim for 5-7% weight reduction; every 1 kg weight loss reduces knee joint compressive stress by ~4 kg.",
  "Bone health nutrition: Calcium-rich foods (milk, curd, paneer, almonds, ragi, sesame seeds) and 20 mins daily morning sunlight exposure for Vitamin D3.",
  "Anti-inflammatory & tissue repair: High protein intake (pulses, sprouts, eggs, fish, nuts) and fresh green leafy vegetables.",
  "Optimal disc & joint hydration: Drink 2.5 to 3 liters of warm water daily to preserve intervertebral disc and cartilage hydration.",
  "Smoking cessation counseling: Tobacco and smoking significantly retard bone healing, increase disc degeneration, and impair surgical outcomes.",
] as const;

export const ADVICE_WARNING_SIGNS_RECOMMENDATIONS = [
  "Red Flag Spine Alert: Report immediately to emergency if sudden progressive leg weakness, foot drop, loss of bladder/bowel control, or saddle numbness develops (Cauda Equina alert).",
  "Red Flag Joint Alert: Report urgently if severe joint pain develops with high fever (>101°F), chills, and hot, tense joint swelling (Septic Arthritis suspicion).",
  "Red Flag Vascular Alert: Seek emergency care if sudden calf swelling, severe calf tenderness, localized warmth, or chest pain / breathlessness develops (DVT / PE alert).",
  "Red Flag Neurological Alert: Report if severe intractable radicular pain is unresponsive to prescribed analgesics or if motor grip weakness rapidly progresses.",
] as const;

/* ---------------- PLAN OF TREATMENT - SURGERY RECOMMENDATIONS ---------------- */

export const TREATMENT_PLAN_TYPE_RECOMMENDATIONS = [
  "Conservative Management (Medications + Physiotherapy + Lifestyle Modifications)",
  "Interventional / Injections (PRP / Viscosupplementation / Steroid / Nerve Block)",
  "Elective Surgical Management",
  "Urgent / Emergency Surgical Intervention",
] as const;

export const TREATMENT_PLAN_PROCEDURE_RECOMMENDATIONS = [
  "Total Knee Arthroplasty (TKA - Unilateral)",
  "Total Knee Arthroplasty (TKA - Bilateral Staged / Simultaneous)",
  "Robotic-Assisted Total Knee Arthroplasty (TKA)",
  "Unicondylar Knee Arthroplasty (UKA / Partial Knee)",
  "Arthroscopic Anterior Cruciate Ligament (ACL) Reconstruction (Hamstring Autograft)",
  "Arthroscopic Partial Meniscectomy / Meniscal Preservation Repair",
  "Arthroscopic Rotator Cuff Repair (Suture Anchor Fixation)",
  "Arthroscopic Subacromial Decompression & Acromioplasty",
  "Arthroscopic Bankart Repair / Latarjet Procedure for Shoulder Instability",
  "Total Hip Arthroplasty (THA - Uncemented Ceramic-on-Poly)",
  "Hemiarthroplasty of Hip (Bipolar Prosthesis)",
  "Micro-Endoscopic Discectomy (MED - Lumbar L4-L5 / L5-S1)",
  "Lumbar Laminectomy & TLIF with Pedicle Screw Fixation",
  "Anterior Cervical Discectomy and Fusion (ACDF)",
  "Open Reduction & Internal Fixation (ORIF - Anatomical Locking Plate)",
  "Closed Reduction & Interlocking Intramedullary Nailing (IMN)",
  "Closed Reduction & Percutaneous K-Wire Fixation",
  "Tension Band Wiring (TBW - Patella / Olecranon)",
  "Carpal Tunnel Release (Open / Endoscopic Mini-Incision)",
  "De Quervain's 1st Extensor Compartment Release",
  "Trigger Finger A1 Pulley Percutaneous / Open Release",
  "Core Decompression with PRP for Early AVN Femoral Head",
  "Intra-Articular Viscosupplementation (Hyaluronic Acid) / PRP Infiltration",
  "Hardware / Implant Removal (Plates / Screws / Intramedullary Nail)",
] as const;

export const TREATMENT_PLAN_LATERALITY_RECOMMENDATIONS = [
  "Right",
  "Left",
  "Bilateral",
  "Axial / Spine",
  "Not Applicable",
] as const;

export const TREATMENT_PLAN_ANESTHESIA_RECOMMENDATIONS = [
  "Spinal Anesthesia (SA - Bupivacaine 0.5% Heavy)",
  "General Anesthesia (GA with Endotracheal Intubation)",
  "Combined Spinal-Epidural (CSE) with Post-Op Epidural Analgesia",
  "Regional Nerve Block (Adductor Canal Block / Femoral / Sciatic Block)",
  "Brachial Plexus Block (Supraclavicular / Interscalene)",
  "Local Anesthesia with Monitored Anesthesia Care (MAC) / Conscious Sedation",
  "Not Applicable (Conservative Medical Management)",
] as const;

export const TREATMENT_PLAN_PREOP_RECOMMENDATIONS = [
  "Full Pre-Anesthetic Checkup (PAC), CBC, Blood Sugar (Fasting & PP), HbA1c, RFT (Urea, Creatinine), LFT, Coagulation (PT/INR, APTT), Viral Markers (HIV, HBsAg, HCV), Chest X-Ray PA, ECG, 2D Echo, 2 units PRBC cross-matching.",
  "Day-Care Pre-Op Workup: CBC, Blood Sugar, PT/INR, Viral Serology (HIV/HBsAg/HCV), ECG, Chest X-ray, Physician fitness clearance.",
  "Diabetic & Cardiac Optimization: Cardiology Echo clearance for high-risk surgery, strict glycemic control (HbA1c < 7.5%), stop antiplatelets (Aspirin/Clopidogrel) 5 days prior.",
  "Workup Pending: PAC evaluation advised; fresh weight-bearing digital radiographs and pre-operative blood profile required before finalizing date.",
] as const;

export const TREATMENT_PLAN_IMPLANTS_RECOMMENDATIONS = [
  "Cruciate-Retaining (CR) / Posterior-Stabilized (PS) High-Flexion Knee Arthroplasty System with Titanium tibial tray & cobalt-chromium femoral component.",
  "Uncemented Titanium Trabecular Metal Acetabular Cup, Highly Crosslinked Polyethylene Liner, 32/36mm Ceramic Femoral Head & Titanium Femoral Stem.",
  "Titanium anatomical distal femur / proximal tibia / distal radius locking compression plate and screws.",
  "Interlocking Titanium Intramedullary Nail with dynamic & static locking bolts.",
  "Bio-composite / PEEK suture anchors (2.8mm / 4.5mm) for rotator cuff / labral repair.",
  "Transforaminal Lumbar Interbody Fusion (TLIF) PEEK Cage, Titanium Pedicle Screws, and Demineralized Bone Matrix (DBM) Graft.",
  "Bio-absorbable interference screw (8x25mm) and Titanium adjustable loop cortical button for ACL reconstruction.",
] as const;

export const TREATMENT_PLAN_TIMING_RECOMMENDATIONS = [
  "Elective - Planned within 1-2 weeks after PAC clearance",
  "Elective - Specific scheduled date following pre-op workup",
  "Urgent - Within 24-48 hours (after acute medical stabilization)",
  "Emergency - Immediate surgical intervention required",
  "Trial of Conservative Management (Review after 3-4 weeks for surgical reassessment)",
] as const;

export const TREATMENT_PLAN_REHAB_RECOMMENDATIONS = [
  "Day 0/1: Assisted walker mobilization, bedside quadriceps isometrics, active ankle pumps. Full weight-bearing as tolerated. Suture removal on post-op day 14.",
  "Strict non-weight bearing on operated limb with axillary crutches for 6 weeks. Knee ROM limited to 0-90° in hinged knee brace.",
  "Shoulder arm sling immobilization for 3 weeks; pendulum exercises from Day 3; active-assisted elevation after 4 weeks; no active lifting for 6 weeks.",
  "Lumbar stabilization brace while mobilizing; avoid forward bending and lifting heavy weights (>3 kg) for 8 weeks; gradual core stability exercises.",
  "DVT Prophylaxis: Enoxaparin 40mg SC daily / Rivaroxaban 10mg daily + graduated compression TED stockings for 14-21 days.",
] as const;

export const TREATMENT_PLAN_COUNSELING_RECOMMENDATIONS = [
  "Detailed counseling provided regarding diagnosis, surgical indication, proposed procedure, expected functional outcomes, implant longevity, and potential risks (infection, DVT, stiffness, implant loosening, neurovascular injury). Non-surgical alternatives explained. Patient and attendants understood in native language and gave informed consent.",
  "Patient and family elected for a 3-4 week trial of structured conservative management (medications, physical therapy, activity modification). Advised to report earlier if red flag neurological signs or progressive weakness develops.",
  "High-risk surgical consent explained in view of patient age and co-morbidities. Physician and Cardiology fitness obtained.",
] as const;

export const TREATMENT_PLAN_CONSERVATIVE_RECOMMENDATIONS = [
  "Comprehensive non-surgical pathway: oral analgesics & anti-inflammatory course, daily supervised physical therapy (isometric strengthening), ergonomic modifications, firm footwear, periodic review.",
  "Interventional conservative: Intra-articular PRP / Hyaluronic acid injection administered under aseptic technique; active rest for 48 hours followed by home exercise protocol.",
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
