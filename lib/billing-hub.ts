export type BillingHubStatusFilter =
  | "all"
  | "draft"
  | "paid"
  | "partial"
  | "void"
  | "unbilled";

export type BillingHubRowKind = "invoice" | "unbilled";

export function matchesBillingHubSearch(
  row: {
    patientName: string;
    patientMrn: string;
    invoiceNumber: string | null;
  },
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.patientName.toLowerCase().includes(q) ||
    row.patientMrn.toLowerCase().includes(q) ||
    (row.invoiceNumber?.toLowerCase().includes(q) ?? false)
  );
}

export function matchesBillingHubStatus(
  kind: BillingHubRowKind,
  invoiceStatus: string | null,
  filter: BillingHubStatusFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "unbilled") return kind === "unbilled";
  if (kind === "unbilled") return false;
  return invoiceStatus === filter;
}
