const LEAD_KEYWORDS = [
  "quiero comprar",
  "me interesa",
  "cuánto cuesta",
  "cuanto cuesta",
  "quiero reservar",
  "cómo puedo contratar",
  "como puedo contratar",
  "disponibilidad",
  "precio",
  "oferta",
  "contratar",
  "comprar",
  "reservar",
  "presupuesto",
  "cuánto vale",
  "cuanto vale",
  "información de precio",
  "quiero uno",
  "lo quiero",
];

export function isLeadMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return LEAD_KEYWORDS.some((kw) => lower.includes(kw));
}
