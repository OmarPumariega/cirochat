import nodemailer from "nodemailer";

type LeadEmailParams = {
  toEmail: string;
  tenantName: string;
  sessionId: string;
  conversationId: string;
  messages: { role: string; content: string }[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendLeadNotification(params: LeadEmailParams) {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) return;

  const transcript = params.messages
    .map((m) => `${m.role === "user" ? "👤 Usuario" : "🤖 Asistente"}: ${m.content}`)
    .join("\n\n");

  const transport = buildTransport();

  await transport.sendMail({
    from: `"Cirochat — ${params.tenantName}" <${process.env.EMAIL_FROM ?? process.env.EMAIL_USER}>`,
    to: params.toEmail,
    subject: `🔥 Nuevo lead captado — ${params.tenantName}`,
    text: `Se ha detectado un lead caliente en tu chatbot.

Conversación ID: ${params.conversationId}
Sesión: ${params.sessionId}

--- TRANSCRIPCIÓN ---
${transcript}

---
Puedes ver la conversación completa en tu panel de administración.`,
    html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #16a34a; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h2 style="margin: 0; font-size: 18px;">🔥 Nuevo lead captado</h2>
    <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">${escapeHtml(params.tenantName)}</p>
  </div>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
      Un usuario ha mostrado intención de compra o reserva en tu chatbot. Aquí tienes la transcripción:
    </p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; space-y: 8px;">
      ${params.messages
        .map(
          (m) => `
        <div style="margin-bottom: 12px; display: flex; ${m.role === "user" ? "justify-content: flex-end;" : ""}">
          <div style="max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5;
            ${m.role === "user"
              ? "background: #111827; color: white; border-bottom-right-radius: 4px;"
              : "background: #f3f4f6; color: #1f2937; border-bottom-left-radius: 4px;"}">
            ${escapeHtml(m.content).replace(/\n/g, "<br>")}
          </div>
        </div>`
        )
        .join("")}
    </div>

    <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">
      Sesión: ${params.sessionId} · ID: ${params.conversationId}
    </p>
  </div>
</div>`,
  });
}
