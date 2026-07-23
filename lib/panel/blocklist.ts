import { normalizeTerm } from "./text-normalize";

export type BlockReason =
  | "medico_sensivel"
  | "fauna_silvestre_risco_legal"
  | "fora_de_escopo_pecuaria";

interface BlockedTerm {
  term: string;
  reason: BlockReason;
}

/**
 * Curated exact-match blocklist (not a fuzzy heuristic, per 2026-07-23 decision --
 * avoids hiding borderline-adjacent terms like flea/tick meds or hamster).
 * Reviewed against real MLB1071 /trends output. Reason is stored per-term for
 * future audit/expansion; not surfaced in the panel UI yet.
 */
const BLOCKED_TERMS: BlockedTerm[] = (
  [
    { term: "veneno para matar gatos", reason: "medico_sensivel" },
    { term: "pentobarbital sodico 500mg", reason: "medico_sensivel" },
    { term: "prostaglandina", reason: "medico_sensivel" },
    { term: "filhotes de tartarugas para vender", reason: "fauna_silvestre_risco_legal" },
    { term: "macaco prego", reason: "fauna_silvestre_risco_legal" },
    { term: "papagaios legalizados", reason: "fauna_silvestre_risco_legal" },
    { term: "mini porcos mini pig", reason: "fauna_silvestre_risco_legal" },
    { term: "mini cabra cabrito", reason: "fora_de_escopo_pecuaria" },
    { term: "mini cabra", reason: "fora_de_escopo_pecuaria" },
    { term: "camaleao filhote", reason: "fauna_silvestre_risco_legal" },
    { term: "vendo cabra cabrito cabrita", reason: "fora_de_escopo_pecuaria" },
    { term: "aranha saltadora", reason: "fauna_silvestre_risco_legal" },
    { term: "mini tartarugas de estimacao", reason: "fauna_silvestre_risco_legal" },
    { term: "filhote de sugar gliders aves", reason: "fauna_silvestre_risco_legal" },
    { term: "filhotes de macaco legalizado aves", reason: "fauna_silvestre_risco_legal" },
    { term: "jabuti", reason: "fauna_silvestre_risco_legal" },
    { term: "venda de sapo vivo aves", reason: "fauna_silvestre_risco_legal" },
    { term: "tartaruga tigre d agua", reason: "fauna_silvestre_risco_legal" },
    { term: "carneiro dorper", reason: "fora_de_escopo_pecuaria" },
    { term: "galinheiro", reason: "fora_de_escopo_pecuaria" },
    { term: "moscas vivas", reason: "fora_de_escopo_pecuaria" },
    { term: "minhocas californianas", reason: "fora_de_escopo_pecuaria" },
    { term: "kit joaninha larvas", reason: "fora_de_escopo_pecuaria" },
  ] satisfies BlockedTerm[]
).map((entry) => ({ ...entry, term: normalizeTerm(entry.term) }));

/** Exact (normalized) match only -- deliberately not substring, to avoid false positives. */
export function getBlockReason(keyword: string): BlockReason | null {
  const normalizedKeyword = normalizeTerm(keyword);
  return BLOCKED_TERMS.find((entry) => entry.term === normalizedKeyword)?.reason ?? null;
}

export function isBlocked(keyword: string): boolean {
  return getBlockReason(keyword) !== null;
}
