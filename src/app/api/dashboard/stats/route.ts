import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";
import { startOfDay, subDays } from "date-fns";

export async function GET() {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "DEPARTMENT_OFFICER", "ADMIN"]);
  if (!user) return response;

  const deptFilter =
    user.role === "DEPARTMENT_OFFICER" && user.departmentId ? { assignedDepartmentId: user.departmentId } : {};

  const [total, todayCount, statusGroups, deptGroups, last7Days] = await Promise.all([
    prisma.visitor.count({ where: deptFilter }),
    prisma.visitor.count({ where: { ...deptFilter, createdAt: { gte: startOfDay(new Date()) } } }),
    prisma.visitor.groupBy({ by: ["status"], where: deptFilter, _count: true }),
    prisma.visitor.groupBy({
      by: ["assignedDepartmentId"],
      where: deptFilter,
      _count: true,
    }),
    Promise.all(
      Array.from({ length: 7 }).map(async (_, i) => {
        const day = subDays(new Date(), 6 - i);
        const start = startOfDay(day);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        const count = await prisma.visitor.count({
          where: { ...deptFilter, createdAt: { gte: start, lt: end } },
        });
        return { date: start.toISOString().slice(0, 10), count };
      })
    ),
  ]);

  const departments = await prisma.department.findMany();
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  return NextResponse.json({
    total,
    todayCount,
    statusGroups: statusGroups.map((s) => ({ status: s.status, count: s._count })),
    deptGroups: deptGroups.map((d) => ({
      department: d.assignedDepartmentId ? deptMap.get(d.assignedDepartmentId) || "Unassigned" : "Unassigned",
      count: d._count,
    })),
    last7Days,
  });
}
