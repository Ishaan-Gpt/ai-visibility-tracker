import type { GroupType, Intent, SuggestSource } from "./types";

/*
 * Heuristic intent from the wording of the query (plus where it was suggested). It is an estimate for sorting
 * and filtering; it does not look at the SERP, so the UI labels it "est." everywhere.
 * Word lists cover English plus the most common commercial terms in es/fr/de/it/pt/nl.
 */

const NAVIGATIONAL =
  /\b(login|log in|signin|sign in|sign-in|official site|official website|website|homepage|customer service|customer care|phone number|contact number|helpline|portal|dashboard|account)\b|\.(com|org|net|io|co|in|de|uk)\b|\b(anmelden|iniciar sesión|connexion|accedi)\b/;

const TRANSACTIONAL =
  /\b(buy|order|purchase|for sale|on sale|sale|shop|store|stores|coupon|coupons|promo code|discount|deal|deals|cheap|cheapest|price|prices|pricing|cost|costs|near me|nearby|delivery|subscribe|subscription|download|free trial|trial|book|booking|hire|rent|rental|quote|kaufen|preis|günstig|comprar|precio|barato|acheter|prix|pas cher|prezzo|comprare|pre[çc]o|kopen|prijs|goedkope?)\b/;

const COMMERCIAL =
  /\b(best|top|top \d+|review|reviews|reviewed|rating|ratings|rated|vs|versus|compare|comparison|compared|alternative|alternatives|worth it|pros and cons|recommended|ranking|brands|brand|affordable|premium|budget|testsieger|beste|besten|mejor|mejores|meilleur|meilleurs|migliori|melhores|opiniones|avis|recensioni|erfahrungen)\b/;

const INFORMATIONAL =
  /\b(how to|what is|what are|guide|tutorial|learn|meaning|definition|define|examples?|ideas|tips|steps|checklist|template|explained|history|benefits|causes|symptoms|facts|types of|vs\.? difference|difference between)\b/;

const QUESTION_START = /^(how|what|why|when|where|which|who|can|will|are|is|does|do|should|could|would|cómo|qué|comment|pourquoi|wie|was|warum|come|perché|como|hoe|wat|waarom)(?=\s|$)/;

export function classifyIntent(
  keyword: string,
  ctx?: { group?: GroupType; sources?: SuggestSource[] },
): Intent {
  const k = keyword.toLowerCase();
  if (NAVIGATIONAL.test(k)) return "navigational";
  const question = QUESTION_START.test(k) || ctx?.group === "question";
  if (question) {
    // "which running shoes are best" / "how much do running shoes cost": researching a purchase.
    if (COMMERCIAL.test(k) || /\b(how much|cost|price|worth)\b/.test(k)) return "commercial";
    return "informational";
  }
  if (TRANSACTIONAL.test(k)) return "transactional";
  if (COMMERCIAL.test(k) || ctx?.group === "comparison") return "commercial";
  if (INFORMATIONAL.test(k)) return "informational";
  // Only shopping sites suggested it: a product search.
  const src = ctx?.sources ?? [];
  const shopping = src.filter((s) => s === "amazon" || s === "ebay").length;
  if (src.length > 0 && shopping === src.length) return "transactional";
  // Also typed into shopping search boxes: people comparing products.
  if (shopping > 0) return "commercial";
  return "informational";
}
