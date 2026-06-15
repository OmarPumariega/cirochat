import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session!.user as any).tenantId as string;

  const leads = await prisma.conversation.findMany({
    where: { tenantId, isLead: true },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 2 },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
        <span className="text-sm text-gray-400">{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay leads captados aún</p>
          <p className="text-xs text-gray-300 mt-1">
            Aparecerán aquí cuando alguien muestre intención de compra en el chat
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => {
            const firstUserMsg = lead.messages.find((m) => m.role === "user");
            return (
              <Link
                key={lead.id}
                href={`/admin/conversations/${lead.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-4 hover:border-gray-200 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <Users className="h-3 w-3" />
                      Lead
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    {firstUserMsg?.content ?? "Sin mensaje"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lead._count.messages} mensajes en total
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 ml-4 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
