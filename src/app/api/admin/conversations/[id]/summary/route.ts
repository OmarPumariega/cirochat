import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getLLMModel } from "@/lib/ai/llm";
import { generateText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation || conversation.tenantId !== tenantId) {
    return Response.json({ error: "No encontrada" }, { status: 404 });
  }

  if (conversation.messages.length < 2) {
    return Response.json({ error: "La conversación es demasiado corta para resumir." }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  if (!tenant.llmApiKey) {
    return Response.json({ error: "Sin API key configurada." }, { status: 503 });
  }

  const model = getLLMModel({
    provider: tenant.llmProvider,
    model: tenant.llmModel,
    apiKey: tenant.llmApiKey,
  });

  const transcript = conversation.messages
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
    .join("\n");

  const { text } = await generateText({
    model,
    prompt: `Analiza esta conversación de soporte/ventas y devuelve un JSON con exactamente esta estructura:
{
  "resumen": "Breve descripción de qué trató la conversación (2-3 frases)",
  "temas": ["tema1", "tema2"],
  "sentimiento": "positivo | neutro | negativo",
  "intencion": "soporte | ventas | informacion | queja | otro",
  "es_lead": true | false,
  "razon_lead": "Por qué es o no es un lead (1 frase)",
  "conclusion": "Qué acción se recomienda tomar (1 frase)"
}

Conversación:
${transcript}

Responde SOLO con el JSON, sin markdown ni texto adicional.`,
  });

  let parsed: object;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return Response.json({ error: "No se pudo parsear el resumen." }, { status: 500 });
  }

  const summary = JSON.stringify(parsed);
  await prisma.conversation.update({ where: { id }, data: { summary } });

  return Response.json({ summary: parsed });
}
