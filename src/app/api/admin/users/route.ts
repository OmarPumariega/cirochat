import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function isSuperAdmin(session: any) {
  return session?.user?.role === "superadmin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const tenantId = (session.user as any).tenantId as string;
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const tenantId = (session.user as any).tenantId as string;
  const { email, password } = await req.json();

  if (!email || !password)
    return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, role: "admin", tenantId },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
