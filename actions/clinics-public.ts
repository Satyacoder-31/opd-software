"use server";

import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { bookableClinicianWhere } from "@/lib/bookable-clinicians";
import { haversineKm } from "@/lib/clinic-directory-location";
import { applyOccupancy, generateDaySlots } from "@/lib/slots";
import { parseLocalDateInput } from "@/lib/date-utils";

const PUBLIC_CLINIC_WHERE = {
  isPublicListed: true,
  bookingEnabled: true,
};

export type PublicClinicCard = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  address: string;
  specialties: string[];
  description: string | null;
  logoUrl: string | null;
  doctorCount: number;
  distanceKm?: number | null;
};

export async function listPublicClinics(filters?: {
  q?: string;
  city?: string;
  state?: string;
  specialty?: string;
  doctor?: string;
  lat?: number;
  lng?: number;
}): Promise<PublicClinicCard[]> {
  const q = filters?.q?.trim();
  const city = filters?.city?.trim();
  const state = filters?.state?.trim();
  const specialty = filters?.specialty?.trim();
  const doctor = filters?.doctor?.trim();
  const lat = filters?.lat;
  const lng = filters?.lng;
  const hasOrigin =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng);

  const clinics = await prisma.clinic.findMany({
    where: {
      ...PUBLIC_CLINIC_WHERE,
      slug: { not: null },
      ...(city
        ? { city: { contains: city, mode: "insensitive" as const } }
        : {}),
      ...(state
        ? { state: { equals: state, mode: "insensitive" as const } }
        : {}),
      ...(specialty
        ? { specialties: { has: specialty } }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { city: { contains: q, mode: "insensitive" as const } },
              { address: { contains: q, mode: "insensitive" as const } },
              { specialties: { has: q } },
            ],
          }
        : {}),
      ...(doctor
        ? {
            users: {
              some: {
                ...bookableClinicianWhere(),
                name: { contains: doctor, mode: "insensitive" as const },
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      address: true,
      specialties: true,
      description: true,
      logoUrl: true,
      latitude: true,
      longitude: true,
      users: {
        where: bookableClinicianWhere(),
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  const mapped = clinics
    .filter((c): c is typeof c & { slug: string } => Boolean(c.slug))
    .map((c) => {
      const distanceKm =
        hasOrigin && c.latitude != null && c.longitude != null
          ? haversineKm(lat!, lng!, c.latitude, c.longitude)
          : null;
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        city: c.city,
        address: c.address,
        specialties: c.specialties,
        description: c.description,
        logoUrl: c.logoUrl,
        doctorCount: c.users.length,
        distanceKm,
      };
    });

  if (hasOrigin) {
    mapped.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) {
        return a.name.localeCompare(b.name);
      }
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return mapped;
}

export async function getPublicClinicBySlug(slug: string) {
  const clinic = await prisma.clinic.findFirst({
    where: {
      slug,
      isPublicListed: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      phone: true,
      address: true,
      city: true,
      description: true,
      specialties: true,
      bookingEnabled: true,
      cancelCutoffHours: true,
      timezone: true,
      logoUrl: true,
      clinicHours: true,
      website: true,
      mapsUrl: true,
      landmark: true,
      languages: true,
      facilities: true,
      users: {
        where: bookableClinicianWhere(),
        select: {
          id: true,
          name: true,
          specialty: true,
          qualifications: true,
          consultationFee: true,
          availabilities: {
            where: { isActive: true },
            select: {
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              slotDuration: true,
              maxPerSlot: true,
            },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  return clinic;
}

export async function listPublicCities(): Promise<string[]> {
  const rows = await prisma.clinic.findMany({
    where: { ...PUBLIC_CLINIC_WHERE, city: { not: null } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city!).filter(Boolean);
}

export async function getDoctorAvailableSlots(args: {
  clinicSlug: string;
  doctorId: string;
  date: string;
}) {
  const clinic = await getPublicClinicBySlug(args.clinicSlug);
  if (!clinic || !clinic.bookingEnabled) {
    return { success: false as const, error: "Clinic is not available for booking." };
  }

  const doctor = clinic.users.find((u) => u.id === args.doctorId);
  if (!doctor) {
    return { success: false as const, error: "Doctor not found at this clinic." };
  }

  const date = parseLocalDateInput(args.date);
  if (!date) {
    return { success: false as const, error: "Invalid date." };
  }

  const leave = await prisma.doctorLeave.findUnique({
    where: {
      doctorId_date: { doctorId: doctor.id, date },
    },
    select: { id: true },
  });

  const windows = doctor.availabilities;
  if (!windows.length) {
    return {
      success: true as const,
      data: { slots: [] as { startIso: string; endIso: string; label: string; remaining: number }[] },
    };
  }

  const maxPerSlot = Math.max(...windows.map((w) => w.maxPerSlot), 1);
  const timeZone = clinic.timezone || "Asia/Kolkata";
  const candidates = generateDaySlots({
    date,
    windows,
    onLeave: Boolean(leave),
    timeZone,
  });

  const dayStart = date;
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await prisma.appointment.findMany({
    where: {
      clinicId: clinic.id,
      doctorId: doctor.id,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { notIn: [AppointmentStatus.cancelled, AppointmentStatus.no_show] },
    },
    select: { scheduledAt: true },
  });

  const slots = applyOccupancy(
    candidates,
    bookings
      .filter((b): b is { scheduledAt: Date } => Boolean(b.scheduledAt))
      .map((b) => ({ scheduledAt: b.scheduledAt! })),
    maxPerSlot,
  ).map((s) => ({
    startIso: s.start.toISOString(),
    endIso: s.end.toISOString(),
    label: s.label,
    remaining: s.remaining,
  }));

  return { success: true as const, data: { slots } };
}
