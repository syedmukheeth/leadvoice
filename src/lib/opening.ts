// The first line of a browser test call is the AI employee's written opening, spoken at once
// (no AI round-trip). The customer's name isn't known in a test call, so "{name}" and the
// honorific after it are dropped: "నమస్కారం {name} గారు, నేను..." -> "నమస్కారం, నేను...".
export function openingLine(opening: string): string {
  return opening
    .replace(/\s*\{name\}\s*(గారు|जी|ji|garu)?/gi, "")
    .replace(/\s+([,.!?।])/g, "$1")
    .replace(/([,.!?।])\1+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
