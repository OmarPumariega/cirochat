import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import ChatWidget from "@/components/chat/ChatWidget";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return {};
  return {
    title: tenant.chatbotName ?? "Chat",
    icons: tenant.logoUrl ? { icon: tenant.logoUrl, apple: tenant.logoUrl } : undefined,
  };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  return (
    <ChatWidget
      tenant={{
        slug: tenant.slug,
        chatbotName: tenant.chatbotName,
        welcomeMessage: tenant.welcomeMessage,
        primaryColor: tenant.primaryColor,
        accentColor: tenant.accentColor,
        logoUrl: tenant.logoUrl,
      }}
    />
  );
}
