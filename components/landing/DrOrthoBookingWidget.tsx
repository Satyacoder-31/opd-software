"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  faCalendarDays,
  faClock,
  faUser,
  faPhone,
  faCheckCircle,
  faStethoscope,
  faShieldHalved,
  faSpinner,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";

const specialties = [
  { id: "joint-replacement", label: "Joint Replacement (Knee & Hip)", icon: "🦵" },
  { id: "arthroscopy", label: "Arthroscopy & Sports Medicine", icon: "🏃" },
  { id: "spine", label: "Spine & Sciatica Care", icon: "🦴" },
  { id: "fracture", label: "Fracture & Acute Trauma", icon: "🩹" },
  { id: "arthritis", label: "Arthritis & Joint Preservation", icon: "✨" },
  { id: "shoulder", label: "Shoulder & Elbow Pain", icon: "💪" },
];

const availableTimeSlots = [
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

import { bookHomepageAppointment } from "@/actions/booking";

export function DrOrthoBookingWidget() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [specialty, setSpecialty] = useState(specialties[0].label);
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState(availableTimeSlots[1]);
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [symptoms, setSymptoms] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedData, setConfirmedData] = useState<{
    tokenNumber: number;
    mrn: string;
    scheduledTime: string;
    doctorName: string;
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim() || phone.trim().length < 10) {
      setErrorMsg("Please enter a valid patient full name and 10-digit mobile number.");
      return;
    }
    setErrorMsg("");

    startTransition(async () => {
      const result = await bookHomepageAppointment({
        patientName,
        phone,
        age,
        gender,
        specialty,
        date: selectedDate,
        timeSlot: selectedSlot,
        symptoms,
      });

      if (!result.success) {
        setErrorMsg(result.error);
        return;
      }

      setConfirmedData(result.data);
      setBookingConfirmed(true);
      setStep(4);
    });
  };

  return (
    <div id="book" className="scroll-mt-24 rounded-3xl border border-slate-700/60 bg-gradient-to-b from-[#0F2E4A]/90 to-[#0A192F]/95 p-6 sm:p-10 text-white shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300">
            <Icon icon={faShieldHalved} className="size-3" />
            Verified Orthopedic OPD Scheduling
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Book an Orthopedic Consultation
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Same-day priority slots available for acute joint pain and trauma evaluations.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className={`flex size-7 items-center justify-center rounded-full ${step >= 1 ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-500"}`}>
            1
          </span>
          <span className="hidden sm:inline">Specialty</span>
          <span className="text-slate-600">→</span>
          <span className={`flex size-7 items-center justify-center rounded-full ${step >= 2 ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-500"}`}>
            2
          </span>
          <span className="hidden sm:inline">Date &amp; Time</span>
          <span className="text-slate-600">→</span>
          <span className={`flex size-7 items-center justify-center rounded-full ${step >= 3 ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-500"}`}>
            3
          </span>
          <span className="hidden sm:inline">Details</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {step === 1 && (
          <div>
            <h4 className="text-base font-semibold text-slate-200">
              Select Orthopedic Specialty or Primary Concern:
            </h4>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {specialties.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSpecialty(item.label)}
                  className={`flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                    specialty === item.label
                      ? "border-sky-400 bg-sky-500/20 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-400"
                      : "border-slate-700/80 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-white">{item.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Specialist assessment</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition-all"
              >
                <span>Select Date &amp; Slot</span>
                <Icon icon={faArrowRight} className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Date selection */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="booking-date" className="block text-sm font-semibold text-slate-200">
                    <Icon icon={faCalendarDays} className="mr-2 text-sky-400" />
                    Select Consultation Date:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        selectedDate === todayStr
                          ? "bg-sky-500 text-white font-semibold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(tomorrowStr)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        selectedDate === tomorrowStr
                          ? "bg-sky-500 text-white font-semibold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
                <input
                  id="booking-date"
                  type="date"
                  value={selectedDate}
                  min={todayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Select {selectedDate === todayStr ? "Today for urgent same-day assessment" : selectedDate === tomorrowStr ? "Tomorrow for planned consult" : "your preferred date"}.
                </p>
              </div>

              {/* Slot selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-200">
                  <Icon icon={faClock} className="mr-2 text-sky-400" />
                  Available OPD Time Slots:
                </label>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        selectedSlot === slot
                          ? "border-sky-400 bg-sky-500 text-white shadow-md shadow-sky-500/20"
                          : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-700/60 pt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Specialty
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition-all"
              >
                <span>Continue to Patient Details</span>
                <Icon icon={faArrowRight} className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleConfirmBooking}>
            <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-4 mb-6 text-xs text-sky-200 flex items-center justify-between">
              <div>
                <strong className="text-white">Selected:</strong> {specialty} on{" "}
                <strong className="text-white">{selectedDate}</strong> at{" "}
                <strong className="text-white">{selectedSlot}</strong>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="underline hover:text-white"
              >
                Change
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="patient-name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Patient Full Name *
                </label>
                <div className="relative mt-1.5">
                  <Icon icon={faUser} className="absolute left-3.5 top-3.5 size-3.5 text-slate-400" />
                  <input
                    id="patient-name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="patient-phone" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Mobile Number (for Token SMS) *
                </label>
                <div className="relative mt-1.5">
                  <Icon icon={faPhone} className="absolute left-3.5 top-3.5 size-3.5 text-slate-400" />
                  <input
                    id="patient-phone"
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="patient-age" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Patient Age
                </label>
                <input
                  id="patient-age"
                  type="number"
                  placeholder="Years"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div>
                <label htmlFor="patient-gender" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Gender
                </label>
                <select
                  id="patient-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="patient-symptoms" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Chief Complaint / Primary Symptoms (Optional)
                </label>
                <textarea
                  id="patient-symptoms"
                  rows={2}
                  placeholder="e.g. Right knee pain while walking, clicking sensation, past sports injury, difficulty standing..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-700/60 pt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Date/Slot
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-sky-500 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Icon icon={faSpinner} className="size-4 animate-spin" />
                    <span>Confirming Appointment...</span>
                  </>
                ) : (
                  <>
                    <Icon icon={faCheckCircle} className="size-4" />
                    <span>Confirm &amp; Generate Token</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 4 && bookingConfirmed && confirmedData && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <Icon icon={faCheckCircle} className="size-8" />
            </div>
            <h4 className="mt-4 text-2xl font-bold text-white">
              Appointment Confirmed in Live OPD Queue!
            </h4>
            <p className="mt-1.5 text-sm text-slate-300">
              Your appointment is registered with {confirmedData.clinicName}.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-700 bg-slate-800/90 p-5 text-left shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                    Confirmed OPD Token
                  </span>
                  <span className="font-mono text-xs text-sky-400 font-bold">
                    UHID: {confirmedData.mrn}
                  </span>
                </div>
                <span className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-3.5 py-1.5 text-lg font-black text-white shadow-md shadow-sky-500/30">
                  Token #{confirmedData.tokenNumber}
                </span>
              </div>
              <div className="mt-3.5 space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient Name:</span>
                  <strong className="text-white font-medium">{patientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Specialty:</span>
                  <strong className="text-white font-medium">{specialty}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Doctor:</span>
                  <strong className="text-sky-300 font-medium">Dr. {confirmedData.doctorName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Appointment Slot:</span>
                  <strong className="text-emerald-400 font-semibold">{confirmedData.scheduledTime}</strong>
                </div>
                <div className="border-t border-slate-700/80 pt-2 text-[11px] text-slate-400">
                  <span className="block text-slate-400">Clinic Address:</span>
                  <span className="text-slate-200">{confirmedData.clinicAddress}</span>
                  <span className="block mt-0.5 text-slate-400">Tel: {confirmedData.clinicPhone}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-5 py-2.5 text-xs sm:text-sm font-medium text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Present Token #{confirmedData.tokenNumber} at clinic reception for priority check-in
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setBookingConfirmed(false);
                  setConfirmedData(null);
                }}
                className="text-xs font-medium text-slate-400 hover:text-white underline"
              >
                Book another appointment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
