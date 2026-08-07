"use server";

import type { ActionResult } from "@/lib/types";
import {
  requestPortalOtp as requestOtp,
  verifyPortalOtp as verifyOtp,
  logoutPortal as logout,
  getPortalSessionAccount as getAccount,
  getPortalPatientData as getPatientData,
  updatePortalProfile as updateProfile,
  bookPortalAppointment as bookAppointment,
  cancelPortalAppointment as cancelAppointment,
  reschedulePortalAppointment as rescheduleAppointment,
  getQueuePosition as queuePosition,
  previewSlotsForBooking as previewSlots,
  downloadPortalPrescription as downloadPrescription,
} from "@/actions/booking";

export async function requestPortalOtp(
  phone: string,
): Promise<ActionResult<{ expiresInMinutes: number; developmentCode?: string }>> {
  return requestOtp(phone);
}

export async function verifyPortalOtp(
  phone: string,
  code: string,
): Promise<ActionResult<{ portalAccountId: string }>> {
  return verifyOtp(phone, code);
}

export async function logoutPortal() {
  return logout();
}

export async function getPortalSessionAccount() {
  return getAccount();
}

export async function getPortalPatientData() {
  return getPatientData();
}

export async function updatePortalProfile(formData: FormData) {
  return updateProfile(formData);
}

export async function bookPortalAppointment(input: {
  clinicSlug: string;
  doctorId: string;
  slotStartIso: string;
  reasonForVisit?: string;
  patientName?: string;
  age?: number | string;
  dateOfBirth?: string;
  gender?: string;
}) {
  return bookAppointment(input);
}

export async function cancelPortalAppointment(appointmentId: string) {
  return cancelAppointment(appointmentId);
}

export async function reschedulePortalAppointment(input: {
  appointmentId: string;
  slotStartIso: string;
}) {
  return rescheduleAppointment(input);
}

export async function getQueuePosition(appointmentId: string) {
  return queuePosition(appointmentId);
}

export async function previewSlotsForBooking(args: {
  clinicSlug: string;
  doctorId: string;
  date: string;
}) {
  return previewSlots(args);
}

export async function downloadPortalPrescription(consultationId: string) {
  return downloadPrescription(consultationId);
}
