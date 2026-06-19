"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Upload, X } from "lucide-react";

type TenantData = {
  chatbotName: string;
  welcomeMessage: string;
  tone: string;
  systemInstructions: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
};

export default function CustomizePage() {
  const [form, setForm] = useState<TenantData>({
    chatbotName: "",
    welcomeMessage: "",
    tone: "profesional",
    systemInstructions: "",
    primaryColor: "#000000",
    accentColor: "#ffffff",
    logoUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/tenant")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          chatbotName: data.chatbotName ?? "",
          welcomeMessage: data.welcomeMessage ?? "",
          tone: data.tone ?? "profesional",
          systemInstructions: data.systemInstructions ?? "",
          primaryColor: data.primaryColor ?? "#000000",
          accentColor: data.accentColor ?? "#ffffff",
          logoUrl: data.logoUrl ?? null,
        });
        setLoading(false);
      });
  }, []);

  function set(key: keyof TenantData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setSaved(false);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setForm((prev) => ({ ...prev, logoUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    let finalLogoUrl = form.logoUrl;

    // Subir imagen si hay una nueva seleccionada
    if (logoFile) {
      const fd = new FormData();
      fd.append("logo", logoFile);
      const uploadRes = await fetch("/api/admin/upload-logo", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        setError(data.error ?? "Error al subir la imagen");
        setSaving(false);
        return;
      }
      const { logoUrl } = await uploadRes.json();
      finalLogoUrl = logoUrl;
    }

    const res = await fetch("/api/admin/tenant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, logoUrl: finalLogoUrl }),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Error al guardar");
    } else {
      const data = await res.json();
      setForm((prev) => ({ ...prev, logoUrl: data.logoUrl }));
      setLogoFile(null);
      setSaved(true);
    }
  }

  const displayLogo = logoPreview ?? form.logoUrl;

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
        {/* Comportamiento */}
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

          <Field label="Instrucciones y protocolo">
            <textarea
              value={form.systemInstructions}
              onChange={(e) => set("systemInstructions", e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 resize-none font-mono"
              placeholder={"Ejemplos:\n— Solo responde sobre fontanería y servicios de la empresa.\n— Tu objetivo es conseguir que el usuario reserve una cita.\n— Nunca menciones precios exactos, deriva al formulario.\n— Si preguntan por la competencia, no respondas."}
            />
            <p className="text-xs text-gray-400 mt-1">
              Reglas, objetivos y comportamientos específicos del chatbot. Se aplican en cada conversación.
            </p>
          </Field>
        </div>

        {/* Apariencia */}
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

            <Field label="Color de texto">
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

          {/* Logo upload */}
          <Field label="Logo / Avatar del chatbot">
            <div className="flex items-center gap-4">
              {/* Avatar preview */}
              <div className="relative flex-shrink-0">
                {displayLogo ? (
                  <>
                    <img
                      src={displayLogo}
                      alt="logo"
                      className="h-16 w-16 rounded-full object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  {displayLogo ? "Cambiar imagen" : "Subir imagen"}
                </label>
                <p className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP o SVG · Máx. 2 MB</p>
              </div>
            </div>
          </Field>

          {/* Preview del header del chat */}
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-2">Vista previa del chat</p>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: form.primaryColor }}
            >
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: form.accentColor }}>
                    {(form.chatbotName || "A").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-semibold" style={{ color: form.accentColor }}>
                {form.chatbotName || "Asistente"}
              </span>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/20"
                style={{ color: form.accentColor }}
              >
                En línea
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
