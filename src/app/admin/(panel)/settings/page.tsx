"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";

type SettingsForm = {
  llmProvider: string;
  llmModel: string;
  llmApiKey: string;
  notificationEmail: string;
  leadFormUrl: string;
  maxMessagesPerConv: string;
  blockDurationHours: string;
  wordpressUrl: string;
  woocommerceUrl: string;
  woocommerceKey: string;
  woocommerceSecret: string;
};

const CUSTOM = "__custom__";

const MODEL_DOCS: Record<string, string> = {
  anthropic: "https://docs.anthropic.com/en/docs/about-claude/models",
  openai: "https://platform.openai.com/docs/models",
  google: "https://ai.google.dev/gemini-api/docs/models",
};

const MODELS: Record<string, { label: string; value: string }[]> = {
  anthropic: [
    { label: "Claude Sonnet 4.6 (recomendado)", value: "claude-sonnet-4-6" },
    { label: "Claude Haiku 4.5", value: "claude-haiku-4-5-20251001" },
    { label: "Claude Opus 4.8", value: "claude-opus-4-8" },
    { label: "Personalizado...", value: CUSTOM },
  ],
  openai: [
    { label: "GPT-4o mini (recomendado)", value: "gpt-4o-mini" },
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "Personalizado...", value: CUSTOM },
  ],
  google: [
    { label: "Gemini 2.0 Flash (recomendado)", value: "gemini-2.0-flash" },
    { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
    { label: "Personalizado...", value: CUSTOM },
  ],
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    llmProvider: "anthropic",
    llmModel: "claude-sonnet-4-6",
    llmApiKey: "",
    notificationEmail: "",
    leadFormUrl: "",
    maxMessagesPerConv: "50",
    blockDurationHours: "1",
    wordpressUrl: "",
    woocommerceUrl: "",
    woocommerceKey: "",
    woocommerceSecret: "",
  });
  const [customModel, setCustomModel] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showWcSecret, setShowWcSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/tenant")
      .then((r) => r.json())
      .then((data) => {
        const provider = data.llmProvider ?? "anthropic";
        const savedModel = data.llmModel ?? "claude-sonnet-4-6";
        const knownModels = MODELS[provider] ?? [];
        const isKnown = knownModels.some((m) => m.value === savedModel);
        setForm({
          llmProvider: provider,
          llmModel: isKnown ? savedModel : CUSTOM,
          llmApiKey: "",
          notificationEmail: data.notificationEmail ?? "",
          leadFormUrl: data.leadFormUrl ?? "",
          maxMessagesPerConv: String(data.maxMessagesPerConv ?? 50),
          blockDurationHours: String(data.blockDurationHours ?? 1),
          wordpressUrl: data.wordpressUrl ?? "",
          woocommerceUrl: data.woocommerceUrl ?? "",
          woocommerceKey: data.woocommerceKey ?? "",
          woocommerceSecret: data.woocommerceSecret ?? "",
        });
        if (!isKnown) setCustomModel(savedModel);
        setHasApiKey(!!data.hasApiKey);
        setLoading(false);
      });
  }, []);

  function set(key: keyof SettingsForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "llmProvider") {
        next.llmModel = MODELS[value]?.[0]?.value ?? "";
        setCustomModel("");
      }
      return next;
    });
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const resolvedModel =
      form.llmProvider === "openrouter"
        ? form.llmModel
        : form.llmModel === CUSTOM
        ? customModel.trim()
        : form.llmModel;

    if (!resolvedModel) {
      setError("Escribe el nombre del modelo personalizado");
      setSaving(false);
      return;
    }

    const payload: Record<string, string> = {
      llmProvider: form.llmProvider,
      llmModel: resolvedModel,
      notificationEmail: form.notificationEmail,
      leadFormUrl: form.leadFormUrl,
      maxMessagesPerConv: form.maxMessagesPerConv,
      blockDurationHours: form.blockDurationHours,
      wordpressUrl: form.wordpressUrl,
      woocommerceUrl: form.woocommerceUrl,
      woocommerceKey: form.woocommerceKey,
      woocommerceSecret: form.woocommerceSecret,
    };
    if (form.llmApiKey.trim()) payload.llmApiKey = form.llmApiKey;

    const res = await fetch("/api/admin/tenant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Error al guardar");
    } else {
      setSaved(true);
      setHasApiKey(true);
      setForm((prev) => ({ ...prev, llmApiKey: "" }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const models = MODELS[form.llmProvider] ?? [];

  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* LLM */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Modelo de IA</h2>

          <Field label="Proveedor">
            <select
              value={form.llmProvider}
              onChange={(e) => set("llmProvider", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="google">Google (Gemini)</option>
              <option value="openrouter">OpenRouter (cientos de modelos)</option>
            </select>
          </Field>

          <Field label="Modelo">
            {form.llmProvider === "openrouter" ? (
              <>
                <input
                  type="text"
                  value={form.llmModel}
                  onChange={(e) => set("llmModel", e.target.value)}
                  placeholder="ej: openai/gpt-4o, anthropic/claude-3.5-sonnet, meta-llama/llama-3.1-70b-instruct"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Escribe el ID exacto del modelo.{" "}
                  <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Ver todos los modelos disponibles →
                  </a>
                </p>
              </>
            ) : (
              <>
                <select
                  value={form.llmModel}
                  onChange={(e) => set("llmModel", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
                >
                  {models.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                {form.llmModel === CUSTOM && (
                  <>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="Escribe el ID exacto del modelo"
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 font-mono"
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {MODEL_DOCS[form.llmProvider] && (
                        <a
                          href={MODEL_DOCS[form.llmProvider]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Ver modelos disponibles →
                        </a>
                      )}
                    </p>
                  </>
                )}
              </>
            )}
          </Field>

          <Field label={hasApiKey ? "API Key (dejar vacío para no cambiar)" : "API Key"}>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={form.llmApiKey}
                onChange={(e) => set("llmApiKey", e.target.value)}
                placeholder={hasApiKey ? "••••••••••••••••" : "sk-ant-…"}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {hasApiKey && (
              <p className="text-xs text-green-600 mt-1">✓ API key configurada</p>
            )}
          </Field>
        </div>

        {/* Notificaciones y leads */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Leads y notificaciones</h2>

          <Field label="Enlace al formulario de contacto">
            <input
              type="url"
              value={form.leadFormUrl}
              onChange={(e) => set("leadFormUrl", e.target.value)}
              placeholder="https://tuempresa.com/contacto"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Cuando un usuario quiera ser contactado, el chatbot compartirá este enlace. Usa tu propio formulario con RGPD incluido (Google Forms, Typeform, web propia…)
            </p>
          </Field>

          <Field label="Email de notificación">
            <input
              type="email"
              value={form.notificationEmail}
              onChange={(e) => set("notificationEmail", e.target.value)}
              placeholder="ventas@tuempresa.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Se enviará un email a esta dirección cuando se detecte un lead en el chat
            </p>
          </Field>
        </div>

        {/* Límites de uso */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Límites de uso</h2>

          <Field label="Máximo de mensajes por conversación">
            <input
              type="number"
              min="5"
              max="500"
              value={form.maxMessagesPerConv}
              onChange={(e) => set("maxMessagesPerConv", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Al superar este número, la sesión queda bloqueada temporalmente (mín. 5, máx. 500)
            </p>
          </Field>

          <Field label="Duración del bloqueo (horas)">
            <input
              type="number"
              min="1"
              max="72"
              value={form.blockDurationHours}
              onChange={(e) => set("blockDurationHours", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tiempo que estará bloqueada una sesión después de superar el límite (mín. 1h, máx. 72h)
            </p>
          </Field>
        </div>

        {/* WordPress */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">WordPress</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              El chatbot consultará páginas y posts en tiempo real para responder sobre servicios, horarios, ubicación, etc.
            </p>
          </div>

          <Field label="URL del sitio WordPress">
            <input
              type="url"
              value={form.wordpressUrl}
              onChange={(e) => set("wordpressUrl", e.target.value)}
              placeholder="https://tuempresa.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Solo la URL base. No necesita credenciales para contenido público.
            </p>
          </Field>
        </div>

        {/* WooCommerce */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">WooCommerce</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              El chatbot consultará productos, precios y stock en tiempo real. Genera las claves en WooCommerce → Ajustes → Avanzado → REST API.
            </p>
          </div>

          <Field label="URL de la tienda">
            <input
              type="url"
              value={form.woocommerceUrl}
              onChange={(e) => set("woocommerceUrl", e.target.value)}
              placeholder="https://tuempresa.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Normalmente la misma URL que WordPress.
            </p>
          </Field>

          <Field label="Consumer Key">
            <input
              type="text"
              value={form.woocommerceKey}
              onChange={(e) => set("woocommerceKey", e.target.value)}
              placeholder="ck_••••••••••••••••"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 font-mono"
            />
          </Field>

          <Field label="Consumer Secret">
            <div className="relative">
              <input
                type={showWcSecret ? "text" : "password"}
                value={form.woocommerceSecret}
                onChange={(e) => set("woocommerceSecret", e.target.value)}
                placeholder="cs_••••••••••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowWcSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showWcSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            Configuración guardada correctamente
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar configuración
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
