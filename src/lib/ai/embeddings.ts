import { embed } from "ai";
import { getEmbeddingModel } from "./llm";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/crypto";

export async function generateEmbedding(text: string, tenantId: string): Promise<number[]> {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  if (!tenant.llmApiKey) throw new Error("El tenant no tiene API key configurada");
  const apiKey = decrypt(tenant.llmApiKey);
  const model = getEmbeddingModel(apiKey);
  const { embedding } = await embed({ model, value: text });
  return embedding;
}

export async function searchSimilarChunks(
  query: string,
  tenantId: string,
  limit = 5
): Promise<string[]> {
  const embedding = await generateEmbedding(query, tenantId);
  const vector = `[${embedding.join(",")}]`;

  const chunks = await prisma.$queryRaw<{ content: string }[]>`
    SELECT content
    FROM "DocumentChunk"
    WHERE "tenantId" = ${tenantId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vector}::vector
    LIMIT ${limit}
  `;

  return chunks.map((c) => c.content);
}
