import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/ai/embeddings";
import * as pdfParse from "pdf-parse";
const pdf = (pdfParse as any).default ?? pdfParse;

export const runtime = "nodejs";

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
    i += chunkSize - overlap;
  }
  return chunks.filter((c) => c.trim().length > 0);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;

  const documents = await prisma.document.findMany({
    where: { tenantId },
    include: { _count: { select: { chunks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdf(buffer);
  const text = parsed.text?.trim();

  if (!text || text.length < 10) {
    return NextResponse.json({ error: "No se pudo extraer texto del PDF" }, { status: 422 });
  }

  const document = await prisma.document.create({
    data: { tenantId, filename: file.name, content: text },
  });

  const chunks = chunkText(text);

  for (const chunk of chunks) {
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(chunk, tenantId);
    } catch {
      // Sin embedding — chunk guardado igualmente, no será buscado por similitud
    }

    const vector = embedding ? `[${embedding.join(",")}]` : null;

    if (vector) {
      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, "documentId", "tenantId", content, embedding, "createdAt")
        VALUES (gen_random_uuid()::text, ${document.id}, ${tenantId}, ${chunk}, ${vector}::vector, NOW())
      `;
    } else {
      await prisma.documentChunk.create({
        data: { documentId: document.id, tenantId, content: chunk },
      });
    }
  }

  return NextResponse.json({ ok: true, documentId: document.id, chunks: chunks.length });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;
  const { id } = await req.json();

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.tenantId !== tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.documentChunk.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
