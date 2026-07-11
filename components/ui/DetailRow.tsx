type DetailRowProps = {
  label: string;
  value: React.ReactNode;
};

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-3">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-ink sm:col-span-2">{value ?? "—"}</dd>
    </div>
  );
}
