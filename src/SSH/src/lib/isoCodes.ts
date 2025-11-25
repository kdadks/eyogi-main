/**
 * ISO 3166-1 alpha-3 Country Codes and County/State Codes
 * Format: Country Code (3 letters) + County/State Code (2 letters)
 */

export interface CountryCode {
  code: string // ISO 3166-1 alpha-3
  name: string
}

export interface CountyCode {
  code: string // 2-letter code
  name: string
  country: string // country code it belongs to
}

// Common country codes (ISO 3166-1 alpha-3)
export const COUNTRY_CODES: CountryCode[] = [
  { code: 'IRL', name: 'Ireland' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
  { code: 'CAN', name: 'Canada' },
  { code: 'AUS', name: 'Australia' },
  { code: 'NZL', name: 'New Zealand' },
  { code: 'IND', name: 'India' },
  { code: 'DEU', name: 'Germany' },
  { code: 'FRA', name: 'France' },
  { code: 'ESP', name: 'Spain' },
  { code: 'ITA', name: 'Italy' },
  { code: 'NLD', name: 'Netherlands' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'CHE', name: 'Switzerland' },
  { code: 'AUT', name: 'Austria' },
  { code: 'POL', name: 'Poland' },
  { code: 'SWE', name: 'Sweden' },
  { code: 'NOR', name: 'Norway' },
  { code: 'DNK', name: 'Denmark' },
  { code: 'FIN', name: 'Finland' },
]

// Ireland Counties (using 2-letter codes)
export const IRELAND_COUNTIES: CountyCode[] = [
  { code: 'DU', name: 'Dublin', country: 'IRL' },
  { code: 'CO', name: 'Cork', country: 'IRL' },
  { code: 'GA', name: 'Galway', country: 'IRL' },
  { code: 'LI', name: 'Limerick', country: 'IRL' },
  { code: 'KE', name: 'Kerry', country: 'IRL' },
  { code: 'WA', name: 'Waterford', country: 'IRL' },
  { code: 'KI', name: 'Kildare', country: 'IRL' },
  { code: 'ME', name: 'Meath', country: 'IRL' },
  { code: 'WI', name: 'Wicklow', country: 'IRL' },
  { code: 'WE', name: 'Wexford', country: 'IRL' },
  { code: 'CA', name: 'Carlow', country: 'IRL' },
  { code: 'KK', name: 'Kilkenny', country: 'IRL' },
  { code: 'LA', name: 'Laois', country: 'IRL' },
  { code: 'OF', name: 'Offaly', country: 'IRL' },
  { code: 'WH', name: 'Westmeath', country: 'IRL' },
  { code: 'LO', name: 'Longford', country: 'IRL' },
  { code: 'LD', name: 'Louth', country: 'IRL' },
  { code: 'MO', name: 'Monaghan', country: 'IRL' },
  { code: 'CN', name: 'Cavan', country: 'IRL' },
  { code: 'DO', name: 'Donegal', country: 'IRL' },
  { code: 'SL', name: 'Sligo', country: 'IRL' },
  { code: 'LE', name: 'Leitrim', country: 'IRL' },
  { code: 'RO', name: 'Roscommon', country: 'IRL' },
  { code: 'MA', name: 'Mayo', country: 'IRL' },
  { code: 'CL', name: 'Clare', country: 'IRL' },
  { code: 'TI', name: 'Tipperary', country: 'IRL' },
]

// UK Counties/Regions (sample)
export const UK_COUNTIES: CountyCode[] = [
  { code: 'LO', name: 'London', country: 'GBR' },
  { code: 'MA', name: 'Manchester', country: 'GBR' },
  { code: 'BI', name: 'Birmingham', country: 'GBR' },
  { code: 'ED', name: 'Edinburgh', country: 'GBR' },
  { code: 'GL', name: 'Glasgow', country: 'GBR' },
  { code: 'LI', name: 'Liverpool', country: 'GBR' },
  { code: 'BR', name: 'Bristol', country: 'GBR' },
  { code: 'LE', name: 'Leeds', country: 'GBR' },
]

// US States (using standard 2-letter codes)
export const US_STATES: CountyCode[] = [
  { code: 'NY', name: 'New York', country: 'USA' },
  { code: 'CA', name: 'California', country: 'USA' },
  { code: 'TX', name: 'Texas', country: 'USA' },
  { code: 'FL', name: 'Florida', country: 'USA' },
  { code: 'IL', name: 'Illinois', country: 'USA' },
  { code: 'PA', name: 'Pennsylvania', country: 'USA' },
  { code: 'OH', name: 'Ohio', country: 'USA' },
  { code: 'GA', name: 'Georgia', country: 'USA' },
  { code: 'NC', name: 'North Carolina', country: 'USA' },
  { code: 'MI', name: 'Michigan', country: 'USA' },
]

// Combine all county/state codes
export const ALL_COUNTY_CODES: CountyCode[] = [...IRELAND_COUNTIES, ...UK_COUNTIES, ...US_STATES]

/**
 * Get country code from country name (case-insensitive, fuzzy match)
 */
export function getCountryCode(countryName: string | null | undefined): string {
  if (!countryName) return 'XXX' // Default unknown

  const normalized = countryName.trim().toLowerCase()

  const country = COUNTRY_CODES.find(
    (c) =>
      c.name.toLowerCase() === normalized ||
      c.code.toLowerCase() === normalized ||
      c.name.toLowerCase().includes(normalized),
  )

  return country?.code || 'XXX'
}

/**
 * Get county/state code from county/state name and country
 */
export function getCountyCode(countyName: string | null | undefined, countryCode: string): string {
  if (!countyName) return 'XX' // Default unknown

  const normalized = countyName.trim().toLowerCase()

  const county = ALL_COUNTY_CODES.find(
    (c) =>
      c.country === countryCode &&
      (c.name.toLowerCase() === normalized ||
        c.code.toLowerCase() === normalized ||
        c.name.toLowerCase().includes(normalized)),
  )

  return county?.code || 'XX'
}

/**
 * Validate student ID format
 * Format: CCCCCYYYY##### (Country Code + County Code + Year + 5-digit sequence)
 * Example: IRLDU202500001
 */
export function validateStudentIdFormat(studentId: string): boolean {
  // Format: 3-letter country + 2-letter county + 4-digit year + 5-digit number
  const regex = /^[A-Z]{3}[A-Z]{2}\d{4}\d{5}$/
  return regex.test(studentId)
}

/**
 * Parse student ID to extract components
 */
export function parseStudentId(studentId: string): {
  countryCode: string
  countyCode: string
  year: string
  sequence: string
} | null {
  if (!validateStudentIdFormat(studentId)) {
    return null
  }

  return {
    countryCode: studentId.substring(0, 3),
    countyCode: studentId.substring(3, 5),
    year: studentId.substring(5, 9),
    sequence: studentId.substring(9, 14),
  }
}
