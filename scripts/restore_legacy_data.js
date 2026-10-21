const fs = require('fs');
const path = require('path');
const { PrismaClient, Gender, Role, AppointmentStatus, InvoiceStatus, PaymentMethod } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function mapGender(g) {
  if (!g) return null;
  const lower = g.toLowerCase();
  if (lower === 'male') return Gender.male;
  if (lower === 'female') return Gender.female;
  return Gender.other;
}

function mapAppointmentStatus(s) {
  if (!s) return AppointmentStatus.booked;
  const lower = s.toLowerCase();
  if (lower === 'completed') return AppointmentStatus.completed;
  if (lower === 'in-queue' || lower === 'in_queue' || lower === 'checked_in') return AppointmentStatus.checked_in;
  if (lower === 'confirmed') return AppointmentStatus.confirmed;
  if (lower === 'cancelled') return AppointmentStatus.cancelled;
  if (lower === 'no_show') return AppointmentStatus.no_show;
  return AppointmentStatus.booked;
}

async function main() {
  const backupPath = path.join(__dirname, '../prisma/backup_legacy_data.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found at:', backupPath);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log('Loaded backup from:', backupPath);

  // 1. Get or verify Clinic
  const clinic = await prisma.clinic.findFirst({
    where: { slug: 'dr-orthos' },
  }) || await prisma.clinic.findFirst();

  if (!clinic) {
    console.error('No clinic found in database!');
    process.exit(1);
  }
  console.log(`Target clinic: ${clinic.name} (${clinic.id})`);

  // 2. Ensure Doctors / Staff from profiles exist
  const legacyProfiles = backup.profiles || [];
  const doctorMap = new Map(); // profile_id -> user.id

  // Existing users in clinic
  const existingUsers = await prisma.user.findMany({ where: { clinicId: clinic.id } });
  for (const u of existingUsers) {
    doctorMap.set(u.email, u.id);
  }

  for (const prof of legacyProfiles) {
    let existing = existingUsers.find(u => u.email === prof.email);
    if (!existing) {
      let role = Role.doctor;
      if (prof.role === 'admin') role = Role.admin;
      else if (prof.role === 'receptionist') role = Role.receptionist;

      existing = await prisma.user.create({
        data: {
          id: prof.id,
          clinicId: clinic.id,
          name: prof.name,
          email: prof.email,
          role: role,
          supabaseAuthId: prof.id,
          specialty: prof.specialization || null,
          phone: prof.phone || null,
          consultationFee: 800.0,
        },
      });
      console.log(`Created user: ${existing.name} (${existing.email})`);
    }
    doctorMap.set(prof.id, existing.id);
  }

  // Fallback doctor (the clinic owner or any doctor)
  const defaultDoctor = existingUsers.find(u => u.role === Role.doctor || u.role === Role.owner) || existingUsers[0];

  // 3. Restore all 14 Patients
  const legacyPatients = backup.patients || [];
  console.log(`\nRestoring ${legacyPatients.length} legacy patients...`);

  let restoredPatients = 0;
  let skippedPatients = 0;

  for (const p of legacyPatients) {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unnamed Patient';
    const address = [p.street, p.city, p.state, p.pincode].filter(Boolean).join(', ') || null;
    const allergies = Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || null);
    const dob = p.date_of_birth ? new Date(p.date_of_birth) : null;
    const age = calculateAge(p.date_of_birth);
    const gender = mapGender(p.gender);

    const existingPatient = await prisma.patient.findFirst({
      where: {
        clinicId: clinic.id,
        OR: [
          { id: p.id },
          { phone: p.phone },
          { mrn: p.patient_id },
        ],
      },
    });

    if (existingPatient) {
      console.log(`- Patient exists: ${existingPatient.name} [${existingPatient.mrn}] (${existingPatient.phone})`);
      skippedPatients++;
    } else {
      await prisma.patient.create({
        data: {
          id: p.id,
          clinicId: clinic.id,
          name: fullName,
          phone: p.phone,
          mrn: p.patient_id,
          age: age,
          dateOfBirth: dob,
          gender: gender,
          address: address,
          allergies: allergies,
          chronicConditions: p.medical_history || null,
          createdAt: new Date(p.created_at || Date.now()),
          updatedAt: new Date(p.updated_at || Date.now()),
        },
      });
      console.log(`+ Restored patient: ${fullName} [${p.patient_id}] (${p.phone})`);
      restoredPatients++;
    }
  }

  console.log(`Patients restoration summary: ${restoredPatients} restored, ${skippedPatients} already existed.`);

  // 4. Restore Appointments
  const legacyAppointments = backup.appointments || [];
  console.log(`\nRestoring ${legacyAppointments.length} legacy appointments...`);

  let restoredAppointments = 0;
  let tokenCounter = 50;

  for (const appt of legacyAppointments) {
    const existing = await prisma.appointment.findUnique({ where: { id: appt.id } });
    if (existing) continue;

    // Check if patient exists
    const pat = await prisma.patient.findUnique({ where: { id: appt.patient_id } });
    if (!pat) {
      console.warn(`Skipping appointment ${appt.appointment_id}: patient ${appt.patient_id} not found.`);
      continue;
    }

    const docId = doctorMap.get(appt.doctor_id) || defaultDoctor.id;
    const scheduledDate = new Date(appt.scheduled_date || Date.now());
    const queueDate = new Date(Date.UTC(scheduledDate.getUTCFullYear(), scheduledDate.getUTCMonth(), scheduledDate.getUTCDate()));

    tokenCounter++;
    await prisma.appointment.create({
      data: {
        id: appt.id,
        clinicId: clinic.id,
        patientId: appt.patient_id,
        doctorId: docId,
        queueDate: queueDate,
        tokenNumber: tokenCounter,
        status: mapAppointmentStatus(appt.status),
        scheduledAt: scheduledDate,
        reasonForVisit: appt.reason || null,
        createdAt: new Date(appt.created_at || Date.now()),
        updatedAt: new Date(appt.updated_at || Date.now()),
      },
    });
    restoredAppointments++;
  }
  console.log(`Appointments restoration summary: ${restoredAppointments} restored.`);

  // 5. Restore Consultations
  const legacyConsultations = backup.consultations || [];
  console.log(`\nRestoring ${legacyConsultations.length} legacy consultations...`);
  let restoredConsultations = 0;

  for (const c of legacyConsultations) {
    const existing = await prisma.consultation.findUnique({ where: { id: c.id } });
    if (existing) continue;

    // Must have a valid appointment
    const appt = await prisma.appointment.findUnique({ where: { id: c.appointment_id } });
    if (!appt) continue;

    const docId = doctorMap.get(c.doctor_id) || defaultDoctor.id;

    await prisma.consultation.create({
      data: {
        id: c.id,
        clinicId: clinic.id,
        appointmentId: c.appointment_id,
        patientId: c.patient_id,
        doctorId: docId,
        chiefComplaint: c.symptoms || null,
        diagnosis: c.diagnosis || null,
        notes: c.clinical_notes || null,
        examination: c.physical_examination ? { notes: c.physical_examination } : null,
        treatmentPlan: c.treatment_plan ? { plan: c.treatment_plan } : null,
        createdById: docId,
        createdAt: new Date(c.created_at || Date.now()),
        updatedAt: new Date(c.updated_at || Date.now()),
      },
    });
    restoredConsultations++;
  }
  console.log(`Consultations restoration summary: ${restoredConsultations} restored.`);

  // Verify final count of patients in DB
  const finalPatients = await prisma.patient.findMany({
    where: { clinicId: clinic.id },
    orderBy: { mrn: 'asc' },
  });

  console.log(`\n========================================`);
  console.log(`🎉 Total Patients Now in Database: ${finalPatients.length}`);
  console.log(`========================================`);
  for (const p of finalPatients) {
    console.log(`  [${p.mrn}] ${p.name.padEnd(25)} Phone: ${p.phone} | Age: ${p.age || 'N/A'}`);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error during restoration:', err);
  process.exit(1);
});
