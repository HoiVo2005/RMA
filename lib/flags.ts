// Ánh xạ tên quốc tịch (tiếng Việt hoặc tiếng Anh, admin có thể nhập cả 2 kiểu)
// sang mã quốc gia ISO 3166-1 alpha-2 để hiển thị lá cờ (dùng flagcdn.com).
// "Anh" dùng mã gb-eng (cờ thánh George) — đúng thông lệ bóng đá thay vì cờ Anh Quốc chung.
const FLAG_CODES_RAW: Record<string, string> = {
  // Tiếng Việt
  'tây ban nha': 'es',
  'pháp': 'fr',
  'anh': 'gb-eng',
  'đức': 'de',
  'brazil': 'br',
  'bỉ': 'be',
  'croatia': 'hr',
  'uruguay': 'uy',
  'argentina': 'ar',
  'áo': 'at',
  'bồ đào nha': 'pt',
  'hà lan': 'nl',
  'ý': 'it',
  'ukraine': 'ua',
  'serbia': 'rs',
  'ma-rốc': 'ma',
  'maroc': 'ma',
  'thổ nhĩ kỳ': 'tr',
  'colombia': 'co',
  'cộng hòa dominica': 'do',
  'senegal': 'sn',
  'mexico': 'mx',
  'nhật bản': 'jp',
  'hàn quốc': 'kr',
  'thụy sĩ': 'ch',
  'thụy điển': 'se',
  'na uy': 'no',
  'đan mạch': 'dk',
  'ba lan': 'pl',
  'algeria': 'dz',
  'ai cập': 'eg',
  'ghana': 'gh',
  'nigeria': 'ng',
  'wales': 'gb-wls',
  'scotland': 'gb-sct',
  'bắc ireland': 'gb-nir',
  'cộng hòa ireland': 'ie',
  'ireland': 'ie',
  'úc': 'au',
  'canada': 'ca',
  'hoa kỳ': 'us',
  'mỹ': 'us',
  'venezuela': 've',
  'chile': 'cl',
  'peru': 'pe',
  'paraguay': 'py',
  'ecuador': 'ec',
  'cameroon': 'cm',
  'bờ biển ngà': 'ci',
  'mali': 'ml',
  'tunisia': 'tn',

  // Tiếng Anh (phòng khi admin nhập trực tiếp)
  'spain': 'es',
  'france': 'fr',
  'england': 'gb-eng',
  'germany': 'de',
  'belgium': 'be',
  'austria': 'at',
  'portugal': 'pt',
  'netherlands': 'nl',
  'the netherlands': 'nl',
  'italy': 'it',
  'morocco': 'ma',
  'turkey': 'tr',
  'dominican republic': 'do',
  'japan': 'jp',
  'south korea': 'kr',
  'switzerland': 'ch',
  'sweden': 'se',
  'norway': 'no',
  'denmark': 'dk',
  'poland': 'pl',
  'egypt': 'eg',
  'republic of ireland': 'ie',
  'australia': 'au',
  'united states': 'us',
  'usa': 'us',
  'ivory coast': 'ci',
  'cote d\'ivoire': 'ci',
  'czechia': 'cz',
  'czech republic': 'cz',
  'republic of korea': 'kr',
  'korea republic': 'kr',
  'bosnia and herzegovina': 'ba',
  'democratic republic of the congo': 'cd',
  'congo dr': 'cd',
  'costa rica': 'cr',
  'romania': 'ro',
  'albania': 'al',
  'slovenia': 'si',
  'greece': 'gr',
  'serbia and montenegro': 'cs',
};

function normalizeFlagKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const FLAG_CODES: Record<string, string> = Object.fromEntries(
  Object.entries(FLAG_CODES_RAW).flatMap(([key, value]) => [
    [key.trim().toLowerCase(), value],
    [normalizeFlagKey(key), value],
  ])
);

export function flagCode(nationality?: string | null): string | null {
  if (!nationality) return null;
  const key = normalizeFlagKey(nationality);
  return FLAG_CODES[key] || null;
}

export function flagUrl(nationality?: string | null, width: 20 | 24 | 40 | 80 = 24): string | null {
  const code = flagCode(nationality);
  return code ? `https://flagcdn.com/${width}x${Math.round((width * 3) / 4)}/${code}.png` : null;
}
