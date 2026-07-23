/** Lowercases and strips diacritics so "raçao"/"ração"/"RAÇÃO" all compare equal. */
export function normalizeTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
