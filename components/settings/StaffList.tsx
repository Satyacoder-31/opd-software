"use client";

import Link from "next/link";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { ROLE_LABELS } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { StaffMember } from "@/components/settings/types";
import { Icon } from "@/components/ui/Icon";

type StaffListProps = {
  staff: StaffMember[];
};

export function StaffList({ staff }: StaffListProps) {
  if (staff.length === 0) {
    return (
      <p className="px-5 py-5 text-sm text-muted-foreground">
        No staff members yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {staff.map((user) => (
        <li key={user.id}>
          <Link
            href={`/settings/staff/${user.id}`}
            className={cn(
              "flex items-center gap-3 px-5 py-3 transition-colors",
              "hover:bg-surface-muted/60 active:bg-surface-muted"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {user.name}
                {!user.isActive && (
                  <span className="ml-2 text-xs font-normal text-danger">
                    Inactive
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]}
                {user.specialty
                  ? ` · ${user.specialty}`
                  : user.designation
                    ? ` · ${user.designation}`
                    : ""}
              </p>
            </div>
            <Icon
              icon={faChevronRight}
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
