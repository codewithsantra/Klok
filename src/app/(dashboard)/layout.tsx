import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Defensive guard — proxy already protects these routes,
  // but if a user record is missing the session is invalid.
  if (!user) {
    redirect("/sign-in");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
