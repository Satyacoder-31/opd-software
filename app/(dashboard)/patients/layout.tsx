export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-nav [&_.font-display]:font-nav [&_.font-sans]:font-nav">
      {children}
    </div>
  );
}
