export function normalizeGender(input?: string | null): string | null {
  if (!input) return null;
  const v = String(input).toLowerCase();
  if (v.includes('laki') || v.includes('putra')) return 'Laki-laki';
  if (v.includes('putri') || v.includes('perempuan')) return 'Perempuan';
  // fallback: return capitalized original
  return String(input).charAt(0).toUpperCase() + String(input).slice(1);
}

export function displayGender(input?: string | null) {
  return normalizeGender(input) || '-';
}

export function isMale(input?: string | null) {
  return normalizeGender(input) === 'Laki-laki';
}

export function isFemale(input?: string | null) {
  return normalizeGender(input) === 'Perempuan';
}

export function genderInitial(input?: string | null) {
  const d = normalizeGender(input);
  return d ? d.charAt(0) : '-';
}
