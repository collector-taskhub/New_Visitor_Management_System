import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

// PUBLIC: used by the visitor registration form dropdown, and by the staff
// registration page dropdown. Only returns active departments.
// Pass ?all=true (requires PA/Collector/Admin login) to also see inactive ones,
// used by the Master Data management screen.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wantAll = searchParams.get("all") === "true";

  if (wantAll) {
    const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
    if (!user) return response;

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        users: { select: { id: true, name: true } },
        _count: { select: { visitors: true, users: true } },
      },
    });
    return NextResponse.json({ departments });
  }

  const departments = await prisma.department.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { users: { where: { role: "DEPARTMENT_OFFICER", active: true }, select: { id: true, name: true } } },
  });
  return NextResponse.json({ departments });
}

// PUBLIC: creating a new department is allowed without login, because it needs
// to work from the public "New Staff Registration" page when an officer's
// department isn't listed yet. Also used from the authenticated Master Data screen.
export async function POST(req: Request) {
  try {
    const { name, nameMarathi } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Department name (English) is required" }, { status: 400 });
    }
    if (!nameMarathi || typeof nameMarathi !== "string" || nameMarathi.trim().length < 2) {
      return NextResponse.json({ error: "Department name (Marathi) is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedMarathi = nameMarathi.trim();

    const existing = await prisma.department.findFirst({
      where: { name: { equals: trimmedName, mode: "insensitive" } },
    });
    if (existing) {
      // Idempotent: if it already exists, just hand it back rather than erroring,
      // so re-submitting the same department name from two staff at once is harmless.
      return NextResponse.json({ department: existing });
    }

    let baseCode = trimmedName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 8);
    if (!baseCode) baseCode = "DEPT";

    let finalCode = baseCode;
    let suffix = 1;
    while (await prisma.department.findUnique({ where: { code: finalCode } })) {
      finalCode = `${baseCode}${suffix++}`;
    }

    const department = await prisma.department.create({
      data: { name: trimmedName, nameMarathi: trimmedMarathi, code: finalCode },
    });

    return NextResponse.json({ department });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create department" }, { status: 400 });
  }
}
