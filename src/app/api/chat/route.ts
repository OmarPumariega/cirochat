import { streamText } from "ai";
import { prisma } from "@/lib/db/prisma";
import { getLLMModel } from "@/lib/ai/llm";
import { searchSimilarChunks } from "@/lib/ai/embeddings";
import { isLeadMessage } from "@/lib/ai/leads";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { slug, sessionId, message } = await req.json();

  if (!slug || !sessionId || !message) {
    return Response.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    return Response.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  if (!tenant.llmApiKey) {
    return Response.json(
      { error: "Este chatbot no tiene una API key configurada." },
      { status: 503 }
    );
  }

  // Obtener o crear conversación
  let conversation = await prisma.conversation.findFirst({
    where: { tenantId: tenant.id, sessionId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { tenantId: tenant.id, sessionId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });
  }

  // Guardar mensaje del usuario
  await prisma.message.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });

  // Detectar lead
  const detectedLead = isLeadMessage(message);
  if (detectedLead && !conversation.isLead) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isLead: true },
    });
  }

  // Buscar contexto RAG
  let ragContext = "";
  try {
    const chunks = await searchSimilarChunks(message, tenant.id);
    if (chunks.length > 0) {
      ragContext = `\n\nInformación relevante de la base de conocimiento:\n${chunks.join("\n---\n")}`;
    }
  } catch {
    // Sin documentos o embeddings aún — continúa sin RAG
  }

  // Construir historial de mensajes para el LLM
  const history = conversation.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const toneInstructions: Record<string, string> = {
    profesional: "Mantén un tono profesional, claro y conciso.",
    amigable: "Mantén un tono amigable, cercano y empático.",
    formal: "Mantén un tono formal y cortés en todo momento.",
  };

  const systemPrompt = `Eres ${tenant.chatbotName}, el asistente virtual de este negocio.
${toneInstructions[tenant.tone] ?? toneInstructions.profesional}
Responde siempre en el mismo idioma en que te hablen.
Si no sabes la respuesta, dilo honestamente y sugiere contactar con el equipo.${ragContext}`;

  const model = getLLMModel({
    provider: tenant.llmProvider,
    model: tenant.llmModel,
    apiKey: tenant.llmApiKey,
  });

  const result = streamText({
    model,
    system: systemPrompt,
    messages: [...history, { role: "user", content: message }],
    onFinish: async ({ text }) => {
      await prisma.message.create({
        data: { conversationId: conversation!.id, role: "assistant", content: text },
      });
    },
  });

  return result.toTextStreamResponse();
}
