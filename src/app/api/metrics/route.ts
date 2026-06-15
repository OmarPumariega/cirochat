import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [totalConversations, todayConversations, totalLeads, documents] =
    await Promise.all([
      prisma.conversation.count({ where: { tenantId } }),
      prisma.conversation.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
      prisma.conversation.count({ where: { tenantId, isLead: true } }),
      prisma.document.count({ where: { tenantId } }),
    ]);

  // Conversaciones por día — últimos 7 días
  const dailyRaw = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT DATE("createdAt") as day, COUNT(*) as count
    FROM "Conversation"
    WHERE "tenantId" = ${tenantId}
      AND "createdAt" >= ${weekStart}
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;

  const dailyConversations = dailyRaw.map((r) => ({
    day: r.day,
    count: Number(r.count),
  }));

  const conversionRate =
    totalConversations > 0
      ? Math.round((totalLeads / totalConversations) * 100)
      : 0;

  return NextResponse.json({
    totalConversations,
    todayConversations,
    totalLeads,
    documents,
    conversionRate,
    dailyConversations,
  });
}
