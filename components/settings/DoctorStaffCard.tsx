"use client";

import { useState } from "react";
import { updateDoctorCredentials } from "@/actions/prescriptions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DetailRow } from "@/components/ui/DetailRow";
import type { User } from "@prisma/client";
import { usePendingAction } from "@/hooks/usePendingAction";

type DoctorStaffCardProps = {
  doctor: User;
};

export function DoctorStaffCard({ doctor }: DoctorStaffCardProps) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { pending, run } = usePendingAction();

  function handleSubmit(formData: FormData) {
    setMessage(null);
    void run(async () => {
      const result = await updateDoctorCredentials(doctor.id, formData);
      if (result.success) {
        setMessage({ type: "success", text: "Credentials saved" });
        setEditing(false);
        return;
      }
      setMessage({ type: "error", text: result.error });
    });
  }

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between text-sm">
        <span>
          {doctor.name}{" "}
          <span className="text-muted-foreground">({doctor.email})</span>
          {!doctor.isActive && (
            <span className="ml-2 text-danger">Inactive</span>
          )}
        </span>
        <span className="capitalize text-muted-foreground">{doctor.role}</span>
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
          className="mt-3 grid gap-3 border-t border-border pt-3 md:grid-cols-2"
        >
          <Input
            label="Qualifications"
            name="qualifications"
            defaultValue={doctor.qualifications ?? ""}
            placeholder="MBBS, MD"
          />
          <Input
            label="Registration no."
            name="registrationNo"
            defaultValue={doctor.registrationNo ?? ""}
            placeholder="XXXXX"
          />
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setMessage(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="secondary" loading={pending}>
              Save credentials
            </Button>
            {message && (
              <span
                className={
                  message.type === "success"
                    ? "text-sm text-success"
                    : "text-sm text-danger"
                }
                role="status"
              >
                {message.text}
              </span>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-3 border-t border-border pt-3">
          <dl>
            <DetailRow
              label="Qualifications"
              value={doctor.qualifications || "—"}
            />
            <DetailRow
              label="Registration no."
              value={doctor.registrationNo || "—"}
            />
          </dl>
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setEditing(true)}
            >
              Edit credentials
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
