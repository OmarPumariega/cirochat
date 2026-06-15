import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Business",
      slug: "demo",
      primaryColor: "#6366f1",
      accentColor: "#ffffff",
      welcomeMessage: "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte?",
      chatbotName: "Asistente",
      tone: "profesional",
      llmProvider: "openai",
      llmModel: "gpt-4o-mini",
      notificationEmail: "admin@demo.com",
    },
  });

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      password: hashedPassword,
      tenantId: tenant.id,
    },
  });

  console.log("✓ Seed completado — tenant: demo, login: admin@demo.com / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
