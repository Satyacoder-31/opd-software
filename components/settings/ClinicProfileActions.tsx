import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function ClinicProfileActions() {
  return (
    <Link href="/settings/edit">
      <Button variant="secondary">Edit profile</Button>
    </Link>
  );
}
