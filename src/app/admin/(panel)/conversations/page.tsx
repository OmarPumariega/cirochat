import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const tenantId = (session!.user as any).tenantId as string;
  const { lead } = await searchParams;
  const onlyLeads = lead === "1";

  const conversations = await prisma.conversation.findMany({
    where: { tenantId, ...(onlyLeads ? { isLead: true } : {}) },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Conversaciones</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/conversations"
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              !onlyLeads
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Todas
          </Link>
          <Link
            href="/admin/conversations?lead=1"
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              onlyLeads
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Solo leads
          </Link>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay conversaciones aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const firstMsg = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/admin/conversations/${c.id}`}
                className="block bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {c.isLead && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <Users className="h-3 w-3" />
                        Lead
                      </span>
                    )}
                    <p className="text-sm text-gray-700 truncate">
                      {firstMsg?.content ?? "Sin mensajes"}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c._count.messages} mensajes
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
