"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppointmentType } from "@prisma/client";
import { createAppointment } from "@/actions/appointments";
import { createPatient, searchPatients } from "@/actions/patients";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  faCalendarPlus,
  faXmark,
  faMagnifyingGlass,
  faUserPlus,
  faCheck,
  faClock,
  faUserDoctor,
} from "@fortawesome/free-solid-svg-icons";

type DoctorOption = { id: string; name: string };

type ScheduleAppointmentModalProps = {
  doctors: DoctorOption[];
  defaultDate?: string;
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
};

const commonSlots = [
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:15 AM",
  "12:00 PM",
  "04:30 PM",
  "05:15 PM",
  "06:00 PM",
  "06:45 PM",
  "07:30 PM",
];

export function ScheduleAppointmentModal({
  doctors,
  defaultDate,
  triggerButton,
  onSuccess,
}: ScheduleAppointmentModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Patient selection mode: "search" | "new"
  const [patientMode, setPatientMode] = useState<"search" | "new">("search");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string; phone: string; mrn: string }>
  >([]);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
    phone: string;
    mrn: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // New patient state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newGender, setNewGender] = useState("male");

  // Booking fields
  const todayStr = new Date().toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState(defaultDate || todayStr);
  const [selectedSlot, setSelectedSlot] = useState(commonSlots[1]);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [reason, setReason] = useState("");

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchPatients(query, 0, 8);
      setSearchResults(results);
    } catch {
      // ignore search error
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpen = () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (defaultDate) setBookingDate(defaultDate);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      let resolvedPatientId = selectedPatient?.id;

      // If creating new patient
      if (patientMode === "new") {
        if (!newName.trim() || !newPhone.trim() || newPhone.trim().length < 10) {
          setErrorMsg("Please enter patient name and valid 10-digit mobile number.");
          return;
        }

        const formData = new FormData();
        formData.append("name", newName.trim());
        formData.append("phone", newPhone.trim());
        if (newAge) formData.append("age", newAge.trim());
        formData.append("gender", newGender);

        const newPatientRes = await createPatient(formData);
        if (!newPatientRes.success) {
          setErrorMsg(newPatientRes.error || "Failed to register new patient.");
          return;
        }
        resolvedPatientId = newPatientRes.data.id;
      }

      if (!resolvedPatientId) {
        setErrorMsg("Please select or register a patient.");
        return;
      }

      // Compute scheduledAt ISO
      let hours = 10;
      let minutes = 0;
      const parts = selectedSlot.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (parts) {
        hours = parseInt(parts[1], 10);
        minutes = parseInt(parts[2], 10);
        const meridiem = parts[3]?.toUpperCase();
        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;
      }

      const scheduledAtObj = new Date(`${bookingDate}T12:00:00`);
      scheduledAtObj.setHours(hours, minutes, 0, 0);

      const apptRes = await createAppointment({
        patientId: resolvedPatientId,
        type: AppointmentType.scheduled,
        scheduledAt: scheduledAtObj,
        doctorId: doctorId || null,
        reasonForVisit: reason.trim() || "Staff Scheduled Appointment",
      });

      if (!apptRes.success) {
        setErrorMsg(apptRes.error || "Failed to schedule appointment.");
        return;
      }

      setSuccessMsg(`Appointment booked! Token #${apptRes.data.tokenNumber}`);
      onSuccess?.();
      setTimeout(() => {
        handleClose();
        router.refresh();
      }, 900);
    });
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={handleOpen}>{triggerButton}</div>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpen}
          className="shadow-sm"
        >
          <Icon icon={faCalendarPlus} data-icon="inline-start" />
          <span>Schedule Visit</span>
        </Button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  Schedule New Appointment
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Book a consultation slot for an existing or new patient.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-ink transition-colors"
                aria-label="Close dialog"
              >
                <Icon icon={faXmark} className="size-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-800">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <Icon icon={faCheck} className="size-3.5 text-emerald-600" />
                  {successMsg}
                </div>
              )}

              {/* Patient Selection Tabs */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                  Patient Information:
                </label>
                <div className="flex rounded-xl bg-muted/60 p-1 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPatientMode("search");
                      setErrorMsg("");
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      patientMode === "search"
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-ink"
                    }`}
                  >
                    <Icon icon={faMagnifyingGlass} className="mr-1.5 size-3" />
                    Existing Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientMode("new");
                      setErrorMsg("");
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      patientMode === "new"
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-ink"
                    }`}
                  >
                    <Icon icon={faUserPlus} className="mr-1.5 size-3" />
                    Quick Register New
                  </button>
                </div>

                {patientMode === "search" ? (
                  <div className="space-y-2">
                    {selectedPatient ? (
                      <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-3">
                        <div>
                          <div className="font-bold text-sm text-sky-950">
                            {selectedPatient.name}
                          </div>
                          <div className="text-xs text-sky-700 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{selectedPatient.mrn}</span>
                            <span>·</span>
                            <span>{selectedPatient.phone}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(null)}
                          className="text-xs font-semibold text-sky-700 hover:text-sky-950 underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search patient by name, mobile, or MRN..."
                          value={searchQuery}
                          onChange={(e) => void handleSearch(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-3 text-xs text-muted-foreground animate-pulse">
                            Searching...
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-lg divide-y divide-border">
                            {searchResults.map((pt) => (
                              <button
                                key={pt.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatient(pt);
                                  setSearchResults([]);
                                  setSearchQuery("");
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-muted/80 transition-colors flex items-center justify-between"
                              >
                                <div>
                                  <strong className="text-ink text-sm block">
                                    {pt.name}
                                  </strong>
                                  <span className="text-muted-foreground">
                                    Tel: {pt.phone}
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                  {pt.mrn}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Mobile (10 Digits) *
                        </label>
                        <input
                          type="tel"
                          placeholder="9876543210"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          placeholder="35"
                          value={newAge}
                          onChange={(e) => setNewAge(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Gender
                        </label>
                        <select
                          value={newGender}
                          onChange={(e) => setNewGender(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Doctor Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Consultation Date:
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Attending Doctor:
                  </label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  <Icon icon={faClock} className="mr-1 text-primary" />
                  Time Slot:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {commonSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg py-1.5 text-[11px] font-semibold transition-all border ${
                        selectedSlot === slot
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-muted"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Reason for Visit / Clinical Concern:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Knee Pain Assessment, Follow-up, Post-op Review"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-ink placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isPending}
                >
                  Confirm &amp; Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
