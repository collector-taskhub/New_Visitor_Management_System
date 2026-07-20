import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_DEPARTMENTS, JALNA_TALUKAS, MAHARASHTRA_DISTRICTS, DISTRICT_NAME } from "../src/lib/masterData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding departments...");
  for (const d of DEFAULT_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
  }

  console.log("Seeding talukas...");
  for (const t of JALNA_TALUKAS) {
    await prisma.talukaMaster.upsert({
      where: { name_district: { name: t, district: DISTRICT_NAME } },
      update: {},
      create: { name: t, district: DISTRICT_NAME },
    });
  }

  console.log("Seeding districts...");
  for (const dist of MAHARASHTRA_DISTRICTS) {
    await prisma.districtMaster.upsert({
      where: { name: dist },
      update: {},
      create: { name: dist },
    });
  }

  const gad = await prisma.department.findFirst({ where: { code: "GAD" } });

  console.log("Seeding default staff accounts (CHANGE PASSWORDS IMMEDIATELY AFTER FIRST LOGIN)...");

  const collectorPassword = await bcrypt.hash("Jalna@Collector2026", 10);
  await prisma.user.upsert({
    where: { email: "collector@jalna.gov.in" },
    update: {},
    create: {
      name: "District Collector, Jalna",
      email: "collector@jalna.gov.in",
      mobile: "9999999999",
      passwordHash: collectorPassword,
      role: "COLLECTOR",
      designation: "District Collector & District Magistrate",
      departmentId: gad?.id,
      active: true,
    },
  });

  const paPassword = await bcrypt.hash("Jalna@PA2026", 10);
  await prisma.user.upsert({
    where: { email: "pa@jalna.gov.in" },
    update: {},
    create: {
      name: "PA to Collector, Jalna",
      email: "pa@jalna.gov.in",
      mobile: "9999999998",
      passwordHash: paPassword,
      role: "PA",
      designation: "Personal Assistant to Collector",
      departmentId: gad?.id,
      active: true,
    },
  });

  console.log("\n✅ Seed complete.");
  console.log("   Collector login: collector@jalna.gov.in / Jalna@Collector2026");
  console.log("   PA login:        pa@jalna.gov.in / Jalna@PA2026");
  console.log("   ⚠️  Change both passwords immediately after first login.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
