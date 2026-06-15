import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  MessageSquare,
  Users,
  FileText,
  TrendingUp,
  Calendar,
} from "lucide-react";

async function getMetrics(tenantId: string) {
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

  const dailyRaw = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT DATE("createdAt") as day, COUNT(*) as count
    FROM "Conversation"
    WHERE "tenantId" = ${tenantId}
      AND "createdAt" >= ${weekStart}
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;

  const dailyConversations = dailyRaw.map((r) => ({
    day: String(r.day),
    count: Number(r.count),
  }));

  const conversionRate =
    totalConversations > 0
      ? Math.round((totalLeads / totalConversations) * 100)
      : 0;

  return { totalConversations, todayConversations, totalLeads, documents, conversionRate, dailyConversations };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session!.user as any).tenantId as string;
  const metrics = await getMetrics(tenantId);

  const stats = [
    {
      label: "Conversaciones hoy",
      value: metrics.todayConversations,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Conversaciones totales",
      value: metrics.totalConversations,
      icon: MessageSquare,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
    {
      label: "Leads captados",
      value: metrics.totalLeads,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Tasa de conversión",
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Documentos subidos",
      value: metrics.documents,
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const maxCount = Math.max(...metrics.dailyConversations.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3"
          >
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico sencillo de barras — últimos 7 días */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Conversaciones — últimos 7 días
        </h2>
        {metrics.dailyConversations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {metrics.dailyConversations.map((d) => {
              const height = Math.round((d.count / maxCount) * 100);
              const label = new Date(d.day).toLocaleDateString("es", {
                weekday: "short",
                day: "numeric",
              });
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{d.count}</span>
                  <div
                    className="w-full bg-gray-900 rounded-t-sm transition-all"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-gray-400 truncate w-full text-center">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
