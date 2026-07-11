import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSessionUser();
  if (session) redirect("/queue");
  return <LandingPage />;
}
