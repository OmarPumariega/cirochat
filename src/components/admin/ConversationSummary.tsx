"use client";

import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, Tag, Heart, Target, Lightbulb } from "lucide-react";

type SummaryData = {
  resumen: string;
  temas: string[];
  sentimiento: "positivo" | "neutro" | "negativo";
  intencion: string;
  es_lead: boolean;
  razon_lead: string;
  conclusion: string;
};

const sentimientoColor = {
  positivo: "text-green-700 bg-green-50 border-green-200",
  neutro: "text-gray-600 bg-gray-50 border-gray-200",
  negativo: "text-red-700 bg-red-50 border-red-200",
};

const sentimientoLabel = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

export default function ConversationSummary({
  conversationId,
  initialSummary,
}: {
  conversationId: string;
  initialSummary: string | null;
}) {
  const [summary, setSummary] = useState<SummaryData | null>(
    initialSummary ? JSON.parse(initialSummary) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/summary`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setSummary(data.summary);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Resumen IA</span>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {loading ? "Generando…" : "Generar resumen"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {!loading && (
          <p className="mt-2 text-xs text-gray-400">
            Genera un análisis automático de esta conversación con IA.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-medium text-gray-700">Resumen IA</span>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Regenerando…" : "Regenerar"}
        </button>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{summary.resumen}</p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${sentimientoColor[summary.sentimiento]}`}>
          <Heart className="h-3 w-3" />
          <span className="font-medium">Sentimiento:</span>
          <span>{sentimientoLabel[summary.sentimiento]}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
          <Target className="h-3 w-3" />
          <span className="font-medium">Intención:</span>
          <span className="capitalize">{summary.intencion}</span>
        </div>
      </div>

      {summary.temas.length > 0 && (
        <div className="flex items-start gap-2">
          <Tag className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1">
            {summary.temas.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-gray-600">
        <TrendingUp className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
        <span><span className="font-medium">Lead:</span> {summary.razon_lead}</span>
      </div>

      <div className="flex items-start gap-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-2.5 py-2">
        <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>{summary.conclusion}</span>
      </div>
    </div>
  );
}
