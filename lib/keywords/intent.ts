import type { Intent } from "./types";

const TRANSACTIONAL = /\b(buy|price|prices|pricing|cost|cheap|cheapest|discount|coupon|deal|deals|order|purchase|subscribe|hire|quote|near me|for sale|trial|free|download|sign ?up|book)\b/;
const COMMERCIAL = /\b(best|top|review|reviews|vs|versus|compare|comparison|alternative|alternatives|worth it|pros and cons|recommended|rated|ranking)\b/;
const INFORMATIONAL = /^(how|what|why|when|where|who|which|can|does|do|is|are|should|guide|tutorial|learn)\b|\b(how to|meaning|definition|examples?|ideas|tips|steps|checklist|template|explained|vs\.?)\b/;
const NAVIGATIONAL = /\b(login|log in|sign in|official|website|\.com|\.org|\.io|app|dashboard|portal|customer service|contact|support)\b/;

/**
 * Heuristic intent from query wording only. It is an estimate for sorting and filtering;
 * it does not look at the SERP, so the UI labels it "est." everywhere.
 */
export function classifyIntent(keyword: string): Intent {
  const k = keyword.toLowerCase();
  if (TRANSACTIONAL.test(k)) return "transactional";
  if (COMMERCIAL.test(k)) return "commercial";
  if (NAVIGATIONAL.test(k)) return "navigational";
  if (INFORMATIONAL.test(k)) return "informational";
  return "informational";
}
