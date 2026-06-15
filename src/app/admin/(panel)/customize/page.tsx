"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

type TenantData = {
  chatbotName: string;
  welcomeMessage: string;
  tone: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
};

export default function CustomizePage() {
  const [form, setForm] = useState<TenantData>({
    chatbotName: "",
    welcomeMessage: "",
    tone: "profesional",
    primaryColor: "#000000",
    accentColor: "#ffffff",
    logoUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/tenant")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          chatbotName: data.chatbotName ?? "",
          welcomeMessage: data.welcomeMessage ?? "",
          tone: data.tone ?? "profesional",
          primaryColor: data.primaryColor ?? "#000000",
          accentColor: data.accentColor ?? "#ffffff",
          logoUrl: data.logoUrl ?? "",
        });
        setLoading(false);
      });
  }, []);

  function set(key: keyof TenantData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/tenant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Error al guardar");
    } else {
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900">Personalización</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Comportamiento</h2>

          <Field label="Nombre del chatbot">
            <input
              type="text"
              value={form.chatbotName}
              onChange={(e) => set("chatbotName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
              placeholder="Asistente"
            />
          </Field>

          <Field label="Mensaje de bienvenida">
            <textarea
              value={form.welcomeMessage}
              onChange={(e) => set("welcomeMessage", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 resize-none"
              placeholder="¡Hola! ¿En qué puedo ayudarte?"
            />
          </Field>

          <Field label="Tono">
            <select
              value={form.tone}
              onChange={(e) => set("tone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
            >
              <option value="profesional">Profesional</option>
              <option value="amigable">Amigable</option>
              <option value="formal">Formal</option>
            </select>
          </Field>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Apariencia</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Color principal">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-9 w-14 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-500 font-mono">{form.primaryColor}</span>
              </div>
            </Field>

            <Field label="Color de acento (texto)">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="h-9 w-14 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-500 font-mono">{form.accentColor}</span>
              </div>
            </Field>
          </div>

          <Field label="URL del logo (opcional)">
            <input
              type="url"
              value={form.logoUrl ?? ""}
              onChange={(e) => set("logoUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
              placeholder="https://…"
            />
          </Field>

          {/* Preview */}
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-2">Vista previa del header</p>
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ backgroundColor: form.primaryColor }}
            >
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <span className="text-sm font-semibold" style={{ color: form.accentColor }}>
                {form.chatbotName || "Asistente"}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            Cambios guardados correctamente
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
