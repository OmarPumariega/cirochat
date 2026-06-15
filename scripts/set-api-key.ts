import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { encrypt } from "../src/lib/crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const [, , slug, apiKey] = process.argv;

if (!slug || !apiKey) {
  console.error("Uso: npx tsx scripts/set-api-key.ts <slug> <api-key>");
  process.exit(1);
}

async function main() {
  const encrypted = encrypt(apiKey);
  await prisma.tenant.update({
    where: { slug },
    data: { llmApiKey: encrypted },
  });
  console.log(`✓ API key guardada para tenant "${slug}"`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
