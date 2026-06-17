"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

type TenantConfig = {
  slug: string;
  chatbotName: string;
  welcomeMessage: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
};

export default function ChatWidget({ tenant }: { tenant: TenantConfig }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: tenant.welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef<string>(
    typeof window !== "undefined"
      ? (sessionStorage.getItem("ciro_session") ?? (() => {
          const id = crypto.randomUUID();
          sessionStorage.setItem("ciro_session", id);
          return id;
        })())
      : crypto.randomUUID()
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tenant.slug, sessionId: sessionId.current, message: text }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const until = data.blockedUntil
          ? new Date(data.blockedUntil).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
          : null;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: until
              ? `Has alcanzado el límite de mensajes. Esta conversación estará disponible de nuevo a las ${until}.`
              : "Has alcanzado el límite de mensajes. Por favor, intenta más tarde.",
          },
        ]);
        setLoading(false);
        return;
      }

      if (!res.ok || !res.body) throw new Error("Error en la respuesta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantText };
          return updated;
        });
      }

      if (!assistantText) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Lo siento, no pude obtener respuesta. El servicio puede no estar disponible.",
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, hubo un error. Inténtalo de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shadow-sm"
        style={{ backgroundColor: tenant.primaryColor }}
      >
        {tenant.logoUrl && (
          <img src={tenant.logoUrl} alt="logo" className="h-8 w-8 rounded-full object-cover" />
        )}
        <span className="font-semibold text-lg" style={{ color: tenant.accentColor }}>
          {tenant.chatbotName}
        </span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/20"
          style={{ color: tenant.accentColor }}
        >
          En línea
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "rounded-br-sm text-white"
                  : "rounded-bl-sm bg-white text-gray-800 shadow-sm border border-gray-100"
              }`}
              style={msg.role === "user" ? { backgroundColor: tenant.primaryColor } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-2xl rounded-bl-sm">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-full border border-gray-200 text-sm outline-none focus:border-gray-400 disabled:opacity-50 bg-gray-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-full disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: tenant.primaryColor }}
        >
          <Send className="h-4 w-4" style={{ color: tenant.accentColor }} />
        </button>
      </form>
    </div>
  );
}
