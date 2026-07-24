import { Role } from "@prisma/client";
import {
  getCompletedQueue,
  getQueue,
  listClinicDoctors,
} from "@/actions/appointments";
import { requireSessionUser } from "@/lib/auth";
import { can, isClinicManager } from "@/lib/rbac";
import { QueueBoard } from "@/components/queue/QueueBoard";

export default async function QueuePage() {
  const session = await requireSessionUser();
  const [queue, completed, doctors] = await Promise.all([
    getQueue(),
    getCompletedQueue(),
    listClinicDoctors(),
  ]);

  return (
    <QueueBoard
      clinicId={session.clinicId}
      initialQueue={queue}
      initialCompleted={completed}
      canStartConsultation={can(session, "consultations.start")}
      canPickDoctor={isClinicManager(session.role)}
      canOpenConsultation={can(session, "consultations.read")}
      canAccessBilling={can(session, "billing.read")}
      doctors={doctors}
      defaultDoctorId={
        session.role === Role.doctor ? session.userId : doctors[0]?.id
      }
    />
  );
}
