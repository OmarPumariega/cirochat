import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // No devolver la API key encriptada al cliente
  const { llmApiKey: _, ...safe } = tenant;
  return NextResponse.json({ ...safe, hasApiKey: !!tenant.llmApiKey });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;
  const body = await req.json();

  const allowed = [
    "chatbotName",
    "welcomeMessage",
    "tone",
    "primaryColor",
    "accentColor",
    "logoUrl",
    "notificationEmail",
    "leadFormUrl",
    "llmProvider",
    "llmModel",
    "maxMessagesPerConv",
    "blockDurationHours",
  ];

  const intFields = new Set(["maxMessagesPerConv", "blockDurationHours"]);
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in body)) continue;
    data[key] = intFields.has(key) ? parseInt(body[key], 10) || 0 : body[key];
  }

  // La API key se trata aparte — se encripta antes de guardar
  if (body.llmApiKey && typeof body.llmApiKey === "string" && body.llmApiKey.trim()) {
    data.llmApiKey = encrypt(body.llmApiKey.trim());
  }

  const updated = await prisma.tenant.update({ where: { id: tenantId }, data });
  const { llmApiKey: _, ...safe } = updated;
  return NextResponse.json({ ...safe, hasApiKey: !!updated.llmApiKey });
}
