import "dotenv/config";
import { prisma } from "../db";

type OpenSourceNameRow = {
  partnershipName: string;
};

function toShortName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const parts = trimmed.split(" ");
  if (parts.length < 2) return null;

  const first = parts[0];
  const last = parts[parts.length - 1];

  // Target only clear full last names (letters only, no punctuation)
  if (!/^[A-Za-z]+$/.test(last)) return null;

  const short = `${first} ${last.charAt(0).toUpperCase()}.`;
  if (short === trimmed) return null;
  return short;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await prisma.openSourceEntry.findMany({
    select: { partnershipName: true },
    distinct: ["partnershipName"],
    orderBy: { partnershipName: "asc" },
  });

  const candidates = rows
    .map((row: OpenSourceNameRow) => {
      const nextName = toShortName(row.partnershipName);
      return nextName ? { before: row.partnershipName, after: nextName } : null;
    })
    .filter((v): v is { before: string; after: string } => v !== null);

  console.log(`Found ${candidates.length} OpenSourceEntry partnership name(s) to shorten.`);
  if (candidates.length > 0) {
    console.table(candidates);
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to persist changes.");
    return;
  }

  for (const row of candidates) {
    await prisma.openSourceEntry.updateMany({
      where: { partnershipName: row.before },
      data: { partnershipName: row.after },
    });
  }

  console.log(`Updated ${candidates.length} OpenSourceEntry partnership name value(s).`);
}

main()
  .catch((error) => {
    console.error("Failed to shorten OpenSourceEntry partnershipName values:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
