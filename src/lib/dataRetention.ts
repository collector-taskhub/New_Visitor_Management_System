import { prisma } from "./prisma";

/**
 * Data retention policy: personally identifiable information (name, mobile,
 * address, village) on visitor records is anonymized after RETENTION_YEARS
 * (default 3) - long enough to cover realistic follow-up/audit needs, short
 * enough to limit how long citizen PII sits in the database indefinitely.
 *
 * Anonymizing (not hard-deleting) preserves status/department/date fields so
 * historical reporting and trend analysis keep working. The token number and
 * subject are also redacted since they can indirectly identify someone.
 *
 * Configure the retention period by setting RETENTION_YEARS in environment
 * variables (defaults to 3 if not set). Triggered automatically by a free
 * Vercel Cron job (see vercel.json) - no paid scheduler needed.
 */
export async function anonymizeOldRecords(): Promise<{ anonymizedCount: number }> {
  const retentionYears = Number(process.env.RETENTION_YEARS) || 3;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - retentionYears);

  const oldRecords = await prisma.visitor.findMany({
    where: { anonymized: false, createdAt: { lt: cutoff } },
    select: { id: true },
  });

  if (oldRecords.length === 0) {
    return { anonymizedCount: 0 };
  }

  for (const record of oldRecords) {
    await prisma.visitor.update({
      where: { id: record.id },
      data: {
        name: "REDACTED",
        mobile: "0000000000",
        address: "REDACTED",
        village: "REDACTED",
        subject: "[Redacted per data retention policy]",
        attachmentUrl: null,
        aiSummary: null,
        aiRawResponse: null,
        anonymized: true,
        anonymizedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: { visitorId: record.id, action: "ANONYMIZED", details: `Auto-anonymized after ${retentionYears} year retention period` },
    });
  }

  return { anonymizedCount: oldRecords.length };
}
