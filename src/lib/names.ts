// Picks out the names in an agent's knowledge (projects, places, brands, document names) so the
// prompt can list them for the model to copy exactly. Smaller Gemini models otherwise respell
// names in Telugu script as something else ("Green Valley" came out as "Green Wallet").

const NOT_NAMES = new Set(["AM", "PM", "OK", "I"]);

export function namesIn(knowledge: string): string[] {
  const found = new Set<string>();
  for (const line of knowledge.split(/\r?\n/)) {
    // Capitalised runs such as "ASRG Constructions", "Guntur", "NH-16", "PAN".
    for (const m of line.matchAll(/[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*(?:\s+[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*)*/g)) {
      const name = m[0];
      if (NOT_NAMES.has(name)) continue;
      const before = line.slice(0, m.index).trimEnd();
      const startsSentence = before === "" || /[.!?]$/.test(before);
      const acronym = /^[A-Z0-9-]{2,}$/.test(name);
      // A lone capitalised word that starts a sentence is usually just grammar ("Free pickup").
      if (startsSentence && !acronym && !name.includes(" ")) continue;
      found.add(name);
    }
  }
  return [...found];
}
