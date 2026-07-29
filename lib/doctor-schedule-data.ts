import { bookableClinicianWhere } from "@/lib/bookable-clinicians";
import { toDateInputValue } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

type ScheduleLoadMode = "view" | "edit";

type DoctorRow = {
  id: string;
  name: string;
  specialty: string | null;
  consultationFee: string | null;
};

export async function loadDoctorScheduleData(
  session: SessionUser,
  mode: ScheduleLoadMode = "view",
) {
  const doctorWhere =
    session.role === "doctor"
      ? {
          ...bookableClinicianWhere(session.clinicId),
          id: session.userId,
        }
      : bookableClinicianWhere(session.clinicId);

  const doctorFilterId =
    session.role === "doctor" ? session.userId : undefined;

  const scheduleWhere = {
    clinicId: session.clinicId,
    ...(doctorFilterId ? { doctorId: doctorFilterId } : {}),
  };

  const doctorsPromise: Promise<DoctorRow[]> =
    mode === "view"
      ? prisma.user
          .findMany({
            where: doctorWhere,
            select: {
              id: true,
              name: true,
              specialty: true,
              consultationFee: true,
            },
            orderBy: { name: "asc" },
          })
          .then((rows) =>
            rows.map((d) => ({
              id: d.id,
              name: d.name,
              specialty: d.specialty,
              consultationFee:
                d.consultationFee != null ? d.consultationFee.toString() : null,
            })),
          )
      : prisma.user
          .findMany({
            where: doctorWhere,
            select: {
              id: true,
              name: true,
            },
            orderBy: { name: "asc" },
          })
          .then((rows) =>
            rows.map((d) => ({
              id: d.id,
              name: d.name,
              specialty: null,
              consultationFee: null,
            })),
          );

  const [availabilities, leaves, doctors] = await Promise.all([
    prisma.doctorAvailability.findMany({
      where: scheduleWhere,
      select: {
        id: true,
        doctorId: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        slotDuration: true,
        maxPerSlot: true,
      },
      orderBy: [{ doctorId: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.doctorLeave.findMany({
      where: {
        ...scheduleWhere,
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      select: {
        id: true,
        doctorId: true,
        date: true,
        reason: true,
      },
      orderBy: { date: "asc" },
      take: 100,
    }),
    doctorsPromise,
  ]);

  return {
    doctors,
    availabilities,
    leaves: leaves.map((row) => ({
      id: row.id,
      doctorId: row.doctorId,
      date: toDateInputValue(row.date),
      reason: row.reason,
    })),
    defaultDoctorId:
      session.role === "doctor" ? session.userId : doctors[0]?.id,
  };
}
