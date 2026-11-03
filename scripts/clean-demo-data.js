const path = require('path');
const { PrismaClient } = require(path.resolve(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function cleanDemoData() {
  console.log('--- Cleaning Demo Data ---');
  try {
    // 1. Invoice Payments & Invoices
    const delPayments = await prisma.invoicePayment.deleteMany({});
    console.log(`Deleted invoice payments: ${delPayments.count}`);
    const delInvoices = await prisma.invoice.deleteMany({});
    console.log(`Deleted invoices: ${delInvoices.count}`);

    // 2. Prescriptions
    const delPrescriptions = await prisma.prescription.deleteMany({});
    console.log(`Deleted prescriptions: ${delPrescriptions.count}`);

    // 3. Consultation Attachments & Consultations
    const delAttachments = await prisma.consultationAttachment.deleteMany({});
    console.log(`Deleted consultation attachments: ${delAttachments.count}`);
    const delConsultations = await prisma.consultation.deleteMany({});
    console.log(`Deleted consultations: ${delConsultations.count}`);

    // 4. Appointments
    const delAppointments = await prisma.appointment.deleteMany({});
    console.log(`Deleted appointments: ${delAppointments.count}`);

    // 5. Lab Orders
    const delLabOrderItems = await prisma.labOrderItem.deleteMany({});
    console.log(`Deleted lab order items: ${delLabOrderItems.count}`);
    const delLabOrders = await prisma.labOrder.deleteMany({});
    console.log(`Deleted lab orders: ${delLabOrders.count}`);

    // 6. Patient Relations
    const delNotifications = await prisma.notificationLog.deleteMany({});
    console.log(`Deleted notification logs: ${delNotifications.count}`);
    const delPortalOtps = await prisma.portalOtp.deleteMany({});
    console.log(`Deleted portal otps: ${delPortalOtps.count}`);
    const delClinicPatients = await prisma.clinicPatient.deleteMany({});
    console.log(`Deleted clinic patients: ${delClinicPatients.count}`);

    // 7. Delete all demo Patients
    const delPatients = await prisma.patient.deleteMany({});
    console.log(`Deleted demo patients: ${delPatients.count}`);

    console.log('\n✅ Demo data cleanup completed successfully!');
    console.log('All demo patients, appointments, consultations, and invoices have been removed.');
    console.log('Mobile numbers are now completely free for real patient registrations.');
  } catch (err) {
    console.error('Error cleaning demo data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDemoData();
