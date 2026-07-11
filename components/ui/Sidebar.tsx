import { logout } from "@/actions/auth";
import type { SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { NavLink } from "@/components/ui/NavLink";

const navItems = [
  { href: "/queue", label: "Queue", roles: ["admin", "doctor", "receptionist"] },
  { href: "/patients", label: "Patients", roles: ["admin", "doctor", "receptionist"] },
  { href: "/reports", label: "Reports", roles: ["admin", "receptionist"] },
  { href: "/settings", label: "Settings", roles: ["admin"] },
];

type SidebarProps = {
  session: SessionUser;
  clinicName: string;
};

export function Sidebar({ session, clinicName }: SidebarProps) {
  const filtered = navItems.filter((item) =>
    item.roles.includes(session.role)
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="border-b border-border bg-gradient-to-b from-surface-tint to-white px-5 py-6">
        <p className="font-display text-xl font-semibold text-primary">
          Medyx
        </p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{clinicName}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {filtered.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-medium text-ink">{session.name}</p>
        <p className="truncate text-xs text-muted-foreground capitalize">{session.role}</p>
        <form action={logout} className="mt-3">
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
