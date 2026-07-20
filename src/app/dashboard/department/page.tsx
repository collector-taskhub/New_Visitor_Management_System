import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatsCards from "@/components/StatsCards";
import VisitorTable from "@/components/VisitorTable";

export default async function DepartmentDashboard() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role !== "DEPARTMENT_OFFICER") redirect("/login");

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">{user.departmentName} — Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user.name}</p>
        </div>
        <StatsCards />
        <VisitorTable role="DEPARTMENT_OFFICER" />
      </main>
      <Footer />
    </>
  );
}
