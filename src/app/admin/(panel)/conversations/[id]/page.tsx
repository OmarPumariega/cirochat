import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, MessageSquare, Clock, ShieldOff } from "lucide-react";
import ConversationSummary from "@/components/admin/ConversationSummary";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const tenantId = (session!.user as any).tenantId as string;
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation || conversation.tenantId !== tenantId) notFound();

  const userMessages = conversation.messages.filter((m) => m.role === "user").length;
  const assistantMessages = conversation.messages.filter((m) => m.role === "assistant").length;
  const isBlocked = conversation.blockedUntil && conversation.blockedUntil > new Date();

  const durationMs =
    conversation.messages.length > 1
      ? new Date(conversation.messages[conversation.messages.length - 1].createdAt).getTime() -
        new Date(conversation.messages[0].createdAt).getTime()
      : 0;
  const durationMin = Math.round(durationMs / 60000);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/conversations"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900">Conversación</h1>
          {conversation.isLead && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <Users className="h-3 w-3" />
              Lead
            </span>
          )}
          {isBlocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
              <ShieldOff className="h-3 w-3" />
              Bloqueada
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Iniciada el{" "}
        {new Date(conversation.createdAt).toLocaleDateString("es", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {" · "}
        Sesión: {conversation.sessionId.slice(0, 8)}…
      </p>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Mensajes</p>
            <p className="text-sm font-semibold text-gray-800">
              {userMessages}u · {assistantMessages}a
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Duración</p>
            <p className="text-sm font-semibold text-gray-800">
              {durationMin > 0 ? `${durationMin} min` : "< 1 min"}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Estado</p>
            <p className="text-sm font-semibold text-gray-800">
              {isBlocked ? "Bloqueada" : conversation.isLead ? "Lead" : "Normal"}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen IA */}
      <ConversationSummary
        conversationId={conversation.id}
        initialSummary={conversation.summary}
      />

      {/* Mensajes */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gray-900 text-white rounded-br-sm"
                  : "bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
