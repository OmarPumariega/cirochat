import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } });
  console.log("Tenants:", JSON.stringify(tenants, null, 2));

  const users = await prisma.user.findMany({ select: { email: true, tenantId: true } });
  console.log("Users:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
