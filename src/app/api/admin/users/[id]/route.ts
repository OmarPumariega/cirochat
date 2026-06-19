import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "superadmin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const currentUserId = (session.user as any).sub ?? (session.user as any).id;

  if (id === currentUserId)
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });

  const tenantId = (session.user as any).tenantId as string;
  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
