import { normalizeTerm } from "./text-normalize";

export type NichePriority = "high" | "normal";

interface NicheSeedTerm {
  term: string;
  priority: NichePriority;
}

/**
 * Curated niche seed list (2026-07-23 decision: code constant, not a DB table --
 * seed-term management UI is deferred to M2). /trends only surfaces high-volume
 * generic search terms, so the list is deliberately broad category words
 * ("raçao", "coleira") rather than literal "premium"/"natural" phrasing, which
 * rarely appears in the raw data.
 *
 * priority "high" = alimentação natural (entry product); "normal" = acessórios/
 * brinquedos premium. Reflects the seed_terms priority split from the original
 * (dropped) /search design.
 */
const NICHE_SEED_TERMS: NicheSeedTerm[] = (
  [
    // Alimentação natural -- alta prioridade (produto de entrada)
    { term: "petisco", priority: "high" },
    { term: "petisco natural", priority: "high" },
    { term: "bifinho", priority: "high" },
    { term: "ossinho natural", priority: "high" },
    { term: "snack natural", priority: "high" },
    { term: "racao natural", priority: "high" },
    { term: "racao sem conservante", priority: "high" },
    { term: "racao", priority: "high" },
    { term: "desidratado", priority: "high" },
    // Acessórios/brinquedos premium -- prioridade normal
    { term: "coleira", priority: "normal" },
    { term: "comedouro", priority: "normal" },
    { term: "cama", priority: "normal" },
    { term: "casinha", priority: "normal" },
    { term: "brinquedo interativo", priority: "normal" },
    { term: "mordedor", priority: "normal" },
    { term: "arranhador", priority: "normal" },
    { term: "mochila pet", priority: "normal" },
  ] satisfies NicheSeedTerm[]
).map((seed) => ({ ...seed, term: normalizeTerm(seed.term) }));

/**
 * Matches a /trends keyword against the niche seed list. Bidirectional partial
 * match (keyword contains seed OR seed contains keyword) so single-word trend
 * keywords ("raçao") and multi-word seed terms ("raçao natural") both hit.
 * When a keyword matches seeds of both priorities, "high" wins.
 */
export function matchNichePriority(keyword: string): NichePriority | null {
  const normalizedKeyword = normalizeTerm(keyword);
  let matched: NichePriority | null = null;

  for (const seed of NICHE_SEED_TERMS) {
    if (normalizedKeyword.includes(seed.term) || seed.term.includes(normalizedKeyword)) {
      if (seed.priority === "high") return "high";
      matched = "normal";
    }
  }

  return matched;
}
