"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStaffActive } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { DoctorStaffCard } from "@/components/settings/DoctorStaffCard";
import { usePendingAction } from "@/hooks/usePendingAction";
import type { User } from "@prisma/client";

type StaffListProps = {
  staff: User[];
  currentUserId: string;
};

export function StaffList({ staff, currentUserId }: StaffListProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<string>();

  function handleToggle(userId: string, isActive: boolean) {
    setError(null);
    void run(async () => {
      const result = await setStaffActive(userId, isActive);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    }, userId);
  }

  return (
    <div className="space-y-4">
      {error && <Banner variant="error">{error}</Banner>}
      {staff.map((user) => (
        <div key={user.id} className="space-y-2">
          {user.role === "doctor" ? (
            <ul>
              <DoctorStaffCard doctor={user} />
            </ul>
          ) : (
            <div className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {user.name}{" "}
                  <span className="text-muted-foreground">({user.email})</span>
                  {!user.isActive && (
                    <span className="ml-2 text-danger">Inactive</span>
                  )}
                </span>
                <span className="capitalize text-muted-foreground">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          <StaffActiveToggle
            user={user}
            currentUserId={currentUserId}
            pending={isPending(user.id)}
            onToggle={handleToggle}
          />
        </div>
      ))}
    </div>
  );
}

function StaffActiveToggle({
  user,
  currentUserId,
  pending,
  onToggle,
}: {
  user: User;
  currentUserId: string;
  pending: boolean;
  onToggle: (userId: string, isActive: boolean) => void;
}) {
  if (user.id === currentUserId) {
    return (
      <p className="text-xs text-muted-foreground">This is your account.</p>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() => onToggle(user.id, !user.isActive)}
    >
      {user.isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
