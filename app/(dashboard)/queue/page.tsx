import { Role } from "@prisma/client";
import {
  getCompletedQueue,
  getQueue,
  listClinicDoctors,
} from "@/actions/appointments";
import { requireSessionUser } from "@/lib/auth";
import { QueueBoard } from "@/components/queue/QueueBoard";

export default async function QueuePage() {
  const session = await requireSessionUser();
  const [queue, completed, doctors] = await Promise.all([
    getQueue(),
    getCompletedQueue(),
    listClinicDoctors(),
  ]);
  const canStartConsultation =
    session.role === Role.admin || session.role === Role.doctor;
  const canPickDoctor = session.role === Role.admin;

  return (
    <QueueBoard
      clinicId={session.clinicId}
      initialQueue={queue}
      initialCompleted={completed}
      canStartConsultation={canStartConsultation}
      canPickDoctor={canPickDoctor}
      doctors={doctors}
      defaultDoctorId={
        session.role === Role.doctor ? session.userId : doctors[0]?.id
      }
    />
  );
}
