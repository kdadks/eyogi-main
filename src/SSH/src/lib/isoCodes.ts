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

// Ireland Counties (using 2-letter codes from address-utils.ts)
export const IRELAND_COUNTIES: CountyCode[] = [
  { code: 'CW', name: 'Carlow', country: 'IRL' },
  { code: 'CN', name: 'Cavan', country: 'IRL' },
  { code: 'CE', name: 'Clare', country: 'IRL' },
  { code: 'CO', name: 'Cork', country: 'IRL' },
  { code: 'DL', name: 'Donegal', country: 'IRL' },
  { code: 'DU', name: 'Dublin', country: 'IRL' },
  { code: 'GA', name: 'Galway', country: 'IRL' },
  { code: 'KY', name: 'Kerry', country: 'IRL' },
  { code: 'KE', name: 'Kildare', country: 'IRL' },
  { code: 'KK', name: 'Kilkenny', country: 'IRL' },
  { code: 'LS', name: 'Laois', country: 'IRL' },
  { code: 'LM', name: 'Leitrim', country: 'IRL' },
  { code: 'LK', name: 'Limerick', country: 'IRL' },
  { code: 'LD', name: 'Longford', country: 'IRL' },
  { code: 'LH', name: 'Louth', country: 'IRL' },
  { code: 'MO', name: 'Mayo', country: 'IRL' },
  { code: 'MH', name: 'Meath', country: 'IRL' },
  { code: 'MN', name: 'Monaghan', country: 'IRL' },
  { code: 'OY', name: 'Offaly', country: 'IRL' },
  { code: 'RN', name: 'Roscommon', country: 'IRL' },
  { code: 'SO', name: 'Sligo', country: 'IRL' },
  { code: 'TA', name: 'Tipperary', country: 'IRL' },
  { code: 'WD', name: 'Waterford', country: 'IRL' },
  { code: 'WH', name: 'Westmeath', country: 'IRL' },
  { code: 'WX', name: 'Wexford', country: 'IRL' },
  { code: 'WW', name: 'Wicklow', country: 'IRL' },
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

// Indian States (using standard 2-letter codes)
export const INDIA_STATES: CountyCode[] = [
  { code: 'AP', name: 'Andhra Pradesh', country: 'IND' },
  { code: 'AR', name: 'Arunachal Pradesh', country: 'IND' },
  { code: 'AS', name: 'Assam', country: 'IND' },
  { code: 'BR', name: 'Bihar', country: 'IND' },
  { code: 'CG', name: 'Chhattisgarh', country: 'IND' },
  { code: 'GA', name: 'Goa', country: 'IND' },
  { code: 'GJ', name: 'Gujarat', country: 'IND' },
  { code: 'HR', name: 'Haryana', country: 'IND' },
  { code: 'HP', name: 'Himachal Pradesh', country: 'IND' },
  { code: 'JH', name: 'Jharkhand', country: 'IND' },
  { code: 'KA', name: 'Karnataka', country: 'IND' },
  { code: 'KL', name: 'Kerala', country: 'IND' },
  { code: 'MP', name: 'Madhya Pradesh', country: 'IND' },
  { code: 'MH', name: 'Maharashtra', country: 'IND' },
  { code: 'MN', name: 'Manipur', country: 'IND' },
  { code: 'ML', name: 'Meghalaya', country: 'IND' },
  { code: 'MZ', name: 'Mizoram', country: 'IND' },
  { code: 'NL', name: 'Nagaland', country: 'IND' },
  { code: 'OD', name: 'Odisha', country: 'IND' },
  { code: 'PB', name: 'Punjab', country: 'IND' },
  { code: 'RJ', name: 'Rajasthan', country: 'IND' },
  { code: 'SK', name: 'Sikkim', country: 'IND' },
  { code: 'TN', name: 'Tamil Nadu', country: 'IND' },
  { code: 'TG', name: 'Telangana', country: 'IND' },
  { code: 'TR', name: 'Tripura', country: 'IND' },
  { code: 'UP', name: 'Uttar Pradesh', country: 'IND' },
  { code: 'UK', name: 'Uttarakhand', country: 'IND' },
  { code: 'WB', name: 'West Bengal', country: 'IND' },
  { code: 'AN', name: 'Andaman and Nicobar Islands', country: 'IND' },
  { code: 'CH', name: 'Chandigarh', country: 'IND' },
  { code: 'DN', name: 'Dadra and Nagar Haveli', country: 'IND' },
  { code: 'DD', name: 'Daman and Diu', country: 'IND' },
  { code: 'DL', name: 'Delhi', country: 'IND' },
  { code: 'JK', name: 'Jammu and Kashmir', country: 'IND' },
  { code: 'LA', name: 'Ladakh', country: 'IND' },
  { code: 'LD', name: 'Lakshadweep', country: 'IND' },
  { code: 'PY', name: 'Puducherry', country: 'IND' },
]

// Combine all county/state codes
export const ALL_COUNTY_CODES: CountyCode[] = [
  ...IRELAND_COUNTIES,
  ...UK_COUNTIES,
  ...US_STATES,
  ...INDIA_STATES,
]

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
 * Generate 2-letter code from city name by taking first 2 unique consonants/letters
 */
function generateCityCode(cityName: string): string {
  if (!cityName) return 'XX'

  // Remove spaces, special characters, and convert to uppercase
  const cleaned = cityName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')

  if (cleaned.length === 0) return 'XX'
  if (cleaned.length === 1) return cleaned + 'X'

  // Try to get 2 unique characters
  const chars: string[] = []
  for (const char of cleaned) {
    if (!chars.includes(char)) {
      chars.push(char)
      if (chars.length === 2) break
    }
  }

  if (chars.length === 1) chars.push('X')
  return chars.join('')
}

/**
 * Get county/state code from county/state name and country
 * If state not found and city is provided, generates code from city name
 */
export function getCountyCode(
  countyName: string | null | undefined,
  countryCode: string,
  cityName?: string | null,
): string {
  // If no state provided, try to use city
  if (!countyName || countyName.trim() === '') {
    if (cityName && cityName.trim() !== '') {
      const cityCode = generateCityCode(cityName)
      return cityCode
    }
    return 'XX' // Default unknown
  }

  const normalized = countyName.trim().toLowerCase()

  // First try exact code match (to avoid "hr" matching "Andhra Pradesh")
  let county = ALL_COUNTY_CODES.find(
    (c) => c.country === countryCode && c.code.toLowerCase() === normalized,
  )

  // If no code match, try name match
  if (!county) {
    county = ALL_COUNTY_CODES.find(
      (c) => c.country === countryCode && c.name.toLowerCase() === normalized,
    )
  }

  // If state not found in our list, try to generate from city
  if (!county) {
    if (cityName && cityName.trim() !== '') {
      const cityCode = generateCityCode(cityName)
      return cityCode
    }
    return 'XX'
  }

  return county.code
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
