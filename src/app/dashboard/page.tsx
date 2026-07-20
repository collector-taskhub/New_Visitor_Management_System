import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardIndex() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session) redirect("/login");

  if (role === "DEPARTMENT_OFFICER") redirect("/dashboard/department");
  redirect("/dashboard/pa"); // PA, COLLECTOR, ADMIN all share the full dashboard
}
