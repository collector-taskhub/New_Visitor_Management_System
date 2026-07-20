import { prisma } from "./prisma";

/**
 * Generates a unique visitor token like: JLN/20260720/0001
 * Uses an atomic upsert on TokenCounter so concurrent registrations
 * never collide, even under load, without needing a queue/lock service.
 */
export async function generateTokenNo(): Promise<string> {
  const now = new Date();
  const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const counter = await prisma.tokenCounter.upsert({
    where: { dateKey },
    update: { count: { increment: 1 } },
    create: { dateKey, count: 1 },
  });

  const serial = String(counter.count).padStart(4, "0");
  return `JLN/${dateKey}/${serial}`;
}
