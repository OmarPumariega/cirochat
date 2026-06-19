import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
