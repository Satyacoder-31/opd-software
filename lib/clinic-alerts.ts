export type ClinicAlertTone = "info" | "warning" | "danger";

export type ClinicAlert = {
  id: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  tone: ClinicAlertTone;
};
