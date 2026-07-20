import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardTabs from "@/components/DashboardTabs";

export default async function PADashboard() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || !["PA", "COLLECTOR", "ADMIN"].includes(user.role)) redirect("/login");

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">
            {user.role === "COLLECTOR" ? "Collector Dashboard" : "PA Dashboard"}
          </h1>
          <p className="text-sm text-gray-500">Welcome, {user.name}</p>
        </div>
        <DashboardTabs role={user.role} />
      </main>
      <Footer />
    </>
  );
}
