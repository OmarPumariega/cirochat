import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenantId = (session.user as any).tenantId as string;

  const form = await req.formData();
  const file = form.get("logo") as File | null;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WEBP o SVG." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "La imagen no puede superar 2 MB" }, { status: 400 });

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const dir = path.join(process.cwd(), "public", "uploads", tenantId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, `logo.${ext}`), buffer);

  const logoUrl = `/uploads/${tenantId}/logo.${ext}`;
  await prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl } });

  return NextResponse.json({ logoUrl });
}
