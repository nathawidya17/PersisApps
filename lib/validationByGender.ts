/**
 * Filters and validates payment items based on student gender.
 * - Male (Laki-laki): only "Seragam Putra" is allowed
 * - Female (Perempuan): only "Seragam Putri" is allowed
 */

export function filterTagihanByGender(
  tagihan: any[],
  jenis_kelamin: string | null | undefined
): any[] {
  if (!jenis_kelamin) return tagihan;

  const isMale = jenis_kelamin.toLowerCase().includes('laki');
  
  return tagihan.filter((item) => {
    const namaLower = (item.nama || item.nama_pembayaran || "").toLowerCase();

    // Blok uniform yang tidak sesuai gender
    if (namaLower.includes("seragam")) {
      if (isMale && namaLower.includes("putri")) return false; // Block Seragam Putri untuk laki-laki
      if (!isMale && namaLower.includes("putra")) return false; // Block Seragam Putra untuk perempuan
    }

    return true;
  });
}

/**
 * Validates if a single payment item is appropriate for the given gender.
 */
export function isValidTagihanForGender(
  namaTagihan: string,
  jenis_kelamin: string | null | undefined
): boolean {
  if (!jenis_kelamin) return true;

  const isMale = jenis_kelamin.toLowerCase().includes('laki');
  const namaLower = namaTagihan.toLowerCase();

  if (namaLower.includes("seragam")) {
    if (isMale && namaLower.includes("putri")) return false;
    if (!isMale && namaLower.includes("putra")) return false;
  }

  return true;
}

/**
 * Get expected uniform name based on gender.
 */
export function getExpectedUniformName(jenis_kelamin: string | null | undefined): string {
  const isMale = jenis_kelamin?.toLowerCase().includes('laki');
  return isMale ? 'Seragam Putra' : 'Seragam Putri';
}
