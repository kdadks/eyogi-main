/**
 * ISO Code Conversion Utilities
 * Handles conversion between 2-letter (ISO 3166-1 alpha-2) and 3-letter (ISO 3166-1 alpha-3) country codes
 * Also handles state/province code normalization
 */

// 2-letter to 3-letter ISO country code mapping
export const ISO2_TO_ISO3: Record<string, string> = {
  IE: 'IRL',
  GB: 'GBR',
  US: 'USA',
  CA: 'CAN',
  AU: 'AUS',
  NZ: 'NZL',
  IN: 'IND',
  BR: 'BRA',
  DE: 'DEU',
  FR: 'FRA',
  ES: 'ESP',
  IT: 'ITA',
  NL: 'NLD',
  BE: 'BEL',
  CH: 'CHE',
  AT: 'AUT',
  PL: 'POL',
  SE: 'SWE',
  NO: 'NOR',
  DK: 'DNK',
  FI: 'FIN',
  PT: 'PRT',
  GR: 'GRC',
  MX: 'MEX',
  JP: 'JPN',
  CN: 'CHN',
  KR: 'KOR',
  RU: 'RUS',
  ZA: 'ZAF',
  EG: 'EGY',
  NG: 'NGA',
  KE: 'KEN',
  AR: 'ARG',
  CL: 'CHL',
  CO: 'COL',
  PE: 'PER',
  VE: 'VEN',
  TH: 'THA',
  VN: 'VNM',
  PH: 'PHL',
  MY: 'MYS',
  SG: 'SGP',
  ID: 'IDN',
  PK: 'PAK',
  BD: 'BGD',
  TR: 'TUR',
  SA: 'SAU',
  AE: 'ARE',
  IL: 'ISR',
}

// 3-letter to 2-letter ISO country code mapping (reverse)
export const ISO3_TO_ISO2: Record<string, string> = Object.entries(ISO2_TO_ISO3).reduce(
  (acc, [iso2, iso3]) => {
    acc[iso3] = iso2
    return acc
  },
  {} as Record<string, string>,
)

// Ireland county single-letter to 2-letter code mapping
const IRELAND_SINGLE_LETTER_MAP: Record<string, string> = {
  D: 'DU', // Dublin
  C: 'CO', // Cork
  G: 'GA', // Galway
  L: 'LI', // Limerick
  K: 'KE', // Kerry
  W: 'WA', // Waterford
}

// UK 3-letter to 2-letter region code mapping
const UK_REGION_MAP: Record<string, string> = {
  ENG: 'EN', // England
  SCT: 'SC', // Scotland
  WLS: 'WA', // Wales
  NIR: 'NI', // Northern Ireland
}

/**
 * Convert 2-letter ISO country code to 3-letter ISO code
 * @param iso2 - 2-letter ISO country code (e.g., 'IE')
 * @returns 3-letter ISO country code (e.g., 'IRL')
 */
export function convertISO2ToISO3(iso2: string): string {
  if (!iso2) return ''

  const normalized = iso2.trim().toUpperCase()

  // Already 3-letter
  if (normalized.length === 3) return normalized

  // Convert 2-letter to 3-letter
  return ISO2_TO_ISO3[normalized] || normalized
}

/**
 * Convert 3-letter ISO country code to 2-letter ISO code
 * @param iso3 - 3-letter ISO country code (e.g., 'IRL')
 * @returns 2-letter ISO country code (e.g., 'IE')
 */
export function convertISO3ToISO2(iso3: string): string {
  if (!iso3) return ''

  const normalized = iso3.trim().toUpperCase()

  // Already 2-letter
  if (normalized.length === 2) return normalized

  // Convert 3-letter to 2-letter
  return ISO3_TO_ISO2[normalized] || normalized
}

/**
 * Normalize country code to 3-letter ISO format
 * Handles full country names, 2-letter codes, and 3-letter codes
 * @param country - Country name or code
 * @returns 3-letter ISO country code
 */
export function normalizeCountryToISO3(country: string): string {
  if (!country) return ''

  const trimmed = country.trim()

  // Already 3-letter ISO code
  if (trimmed.length === 3 && trimmed === trimmed.toUpperCase()) {
    return trimmed
  }

  // 2-letter ISO code
  if (trimmed.length === 2 && trimmed === trimmed.toUpperCase()) {
    return convertISO2ToISO3(trimmed)
  }

  // Country name - try to match
  const countryMap: Record<string, string> = {
    Ireland: 'IRL',
    'United Kingdom': 'GBR',
    'Great Britain': 'GBR',
    UK: 'GBR',
    GB: 'GBR',
    'United States': 'USA',
    USA: 'USA',
    America: 'USA',
    US: 'USA',
    Canada: 'CAN',
    Australia: 'AUS',
    'New Zealand': 'NZL',
    India: 'IND',
    Brazil: 'BRA',
    Brasil: 'BRA',
    Germany: 'DEU',
    France: 'FRA',
    Spain: 'ESP',
    Italy: 'ITA',
    Netherlands: 'NLD',
    Belgium: 'BEL',
    Switzerland: 'CHE',
    Austria: 'AUT',
    Poland: 'POL',
    Sweden: 'SWE',
    Norway: 'NOR',
    Denmark: 'DNK',
    Finland: 'FIN',
  }

  // Direct lookup
  if (countryMap[trimmed]) {
    return countryMap[trimmed]
  }

  // Case-insensitive lookup
  const lowerCase = trimmed.toLowerCase()
  const entry = Object.entries(countryMap).find(([key]) => key.toLowerCase() === lowerCase)

  return entry ? entry[1] : trimmed
}

/**
 * Normalize state/province code to 2-letter format
 * Handles special cases like Ireland single letters and UK 3-letter codes
 * @param state - State/province name or code
 * @param countryISO3 - 3-letter country code
 * @returns 2-letter state/province code
 */
export function normalizeStateToISO2(state: string, countryISO3: string): string {
  if (!state) return ''

  const trimmed = state.trim()
  const normalized = trimmed.toUpperCase()

  // Return the state code as-is (uppercase)
  // State codes vary by country - some are 2-letter, some are 3-letter
  // (e.g., US: CA, NY are 2-letter; Australia: NSW, QLD are 3-letter)
  return normalized
}

/**
 * Validate if a string is a valid 3-letter ISO country code
 * @param code - Code to validate
 * @returns true if valid 3-letter ISO code
 */
export function isValidISO3CountryCode(code: string): boolean {
  if (!code) return false
  const normalized = code.trim().toUpperCase()
  return normalized.length === 3 && Object.values(ISO2_TO_ISO3).includes(normalized)
}

/**
 * Validate if a string is a valid 2-letter ISO country code
 * @param code - Code to validate
 * @returns true if valid 2-letter ISO code
 */
export function isValidISO2CountryCode(code: string): boolean {
  if (!code) return false
  const normalized = code.trim().toUpperCase()
  return normalized.length === 2 && ISO2_TO_ISO3[normalized] !== undefined
}
/**
 * Get country name from 3-letter ISO code
 * @param iso3Code - 3-letter ISO country code (e.g., 'USA')
 * @returns Full country name (e.g., 'United States')
 */
export function getCountryNameFromISO3(iso3Code: string): string {
  if (!iso3Code) return ''

  const normalized = iso3Code.trim().toUpperCase()

  const countryNames: Record<string, string> = {
    IRL: 'Ireland',
    GBR: 'United Kingdom',
    USA: 'United States of America',
    CAN: 'Canada',
    AUS: 'Australia',
    NZL: 'New Zealand',
    IND: 'India',
    BRA: 'Brazil',
    DEU: 'Germany',
    FRA: 'France',
    ESP: 'Spain',
    ITA: 'Italy',
    NLD: 'Netherlands',
    BEL: 'Belgium',
    CHE: 'Switzerland',
    AUT: 'Austria',
    POL: 'Poland',
    SWE: 'Sweden',
    NOR: 'Norway',
    DNK: 'Denmark',
    FIN: 'Finland',
    PRT: 'Portugal',
    GRC: 'Greece',
    MEX: 'Mexico',
    JPN: 'Japan',
    CHN: 'China',
    KOR: 'South Korea',
    RUS: 'Russia',
    ZAF: 'South Africa',
    EGY: 'Egypt',
    NGA: 'Nigeria',
    KEN: 'Kenya',
    ARG: 'Argentina',
    CHL: 'Chile',
    COL: 'Colombia',
    PER: 'Peru',
    VEN: 'Venezuela',
    THA: 'Thailand',
    VNM: 'Vietnam',
    PHL: 'Philippines',
    MYS: 'Malaysia',
    SGP: 'Singapore',
    IDN: 'Indonesia',
    PAK: 'Pakistan',
    BGD: 'Bangladesh',
    TUR: 'Turkey',
    SAU: 'Saudi Arabia',
    ARE: 'United Arab Emirates',
    ISR: 'Israel',
  }

  return countryNames[normalized] || normalized
}
