#!/usr/bin/env node

/**
 * Script to normalize country and state codes in profiles table
 * - Converts 2-letter country codes to 3-letter ISO codes
 * - Converts full state names to 2-letter codes
 * - Handles single-letter Ireland county codes
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '../src/SSH/.env') })

// 2-letter to 3-letter ISO country codes
const ISO2_TO_ISO3 = {
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
}

const COUNTRY_NAME_TO_ISO3 = {
  Ireland: 'IRL',
  'United Kingdom': 'GBR',
  'Great Britain': 'GBR',
  UK: 'GBR',
  'United States': 'USA',
  USA: 'USA',
  US: 'USA',
  America: 'USA',
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

const IRELAND_COUNTIES_TO_CODE = {
  Dublin: 'DU',
  Cork: 'CO',
  Galway: 'GA',
  Limerick: 'LI',
  Kerry: 'KE',
  Waterford: 'WA',
  Kildare: 'KI',
  Meath: 'ME',
  Wicklow: 'WI',
  Wexford: 'WE',
  Carlow: 'CA',
  Kilkenny: 'KK',
  Laois: 'LA',
  Offaly: 'OF',
  Westmeath: 'WH',
  Longford: 'LO',
  Louth: 'LD',
  Monaghan: 'MO',
  Cavan: 'CN',
  Donegal: 'DO',
  Sligo: 'SL',
  Leitrim: 'LE',
  Roscommon: 'RO',
  Mayo: 'MA',
  Clare: 'CL',
  Tipperary: 'TI',
  // Single letter mappings
  D: 'DU',
  C: 'CO',
  G: 'GA',
  L: 'LI',
  K: 'KE',
  W: 'WA',
}

const UK_REGIONS_TO_CODE = {
  England: 'EN',
  Scotland: 'SC',
  Wales: 'WA',
  'Northern Ireland': 'NI',
  London: 'LO',
  Manchester: 'MA',
  Birmingham: 'BI',
  Edinburgh: 'ED',
  Glasgow: 'GL',
  Liverpool: 'LV',
  Bristol: 'BR',
  Leeds: 'LE',
  // 3-letter to 2-letter
  ENG: 'EN',
  SCT: 'SC',
  WLS: 'WA',
  NIR: 'NI',
}

const INDIA_STATES_TO_CODE = {
  Karnataka: 'KA',
  Maharashtra: 'MH',
  Delhi: 'DL',
  'Tamil Nadu': 'TN',
  Kerala: 'KL',
  Gujarat: 'GJ',
  'West Bengal': 'WB',
  Rajasthan: 'RJ',
  'Uttar Pradesh': 'UP',
  'Madhya Pradesh': 'MP',
  Bihar: 'BR',
  Telangana: 'TS',
  'Andhra Pradesh': 'AP',
  Punjab: 'PB',
  Haryana: 'HR',
}

const BRAZIL_STATES_TO_CODE = {
  'Rio de Janeiro': 'RJ',
  'São Paulo': 'SP',
  'Minas Gerais': 'MG',
  Bahia: 'BA',
  Brasília: 'DF',
  'Rio Grande do Sul': 'RS',
  Paraná: 'PR',
  Pernambuco: 'PE',
  Ceará: 'CE',
}

const US_STATES_TO_CODE = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
)

function normalizeCountryCode(country) {
  if (!country) return null

  const trimmed = country.trim()

  // Already 3-letter ISO code
  if (trimmed.length === 3 && trimmed === trimmed.toUpperCase()) {
    return trimmed
  }

  // 2-letter to 3-letter conversion
  if (trimmed.length === 2 && trimmed === trimmed.toUpperCase()) {
    return ISO2_TO_ISO3[trimmed] || trimmed
  }

  // Country name to ISO3
  const code = COUNTRY_NAME_TO_ISO3[trimmed]
  if (code) return code

  // Case-insensitive search
  const entry = Object.entries(COUNTRY_NAME_TO_ISO3).find(
    ([key]) => key.toLowerCase() === trimmed.toLowerCase(),
  )

  return entry ? entry[1] : trimmed
}

function normalizeStateCode(state, countryCode) {
  if (!state || !countryCode) return state

  const trimmed = state.trim()

  // Already a 2-letter code
  if (trimmed.length === 2 && trimmed === trimmed.toUpperCase()) {
    return trimmed
  }

  // Select mapping based on country
  let mapping = {}

  if (countryCode === 'IRL') {
    mapping = IRELAND_COUNTIES_TO_CODE
  } else if (countryCode === 'GBR') {
    mapping = UK_REGIONS_TO_CODE
  } else if (countryCode === 'USA') {
    mapping = US_STATES_TO_CODE
  } else if (countryCode === 'IND') {
    mapping = INDIA_STATES_TO_CODE
  } else if (countryCode === 'BRA') {
    mapping = BRAZIL_STATES_TO_CODE
  }

  // Direct lookup
  const code = mapping[trimmed]
  if (code) return code

  // Case-insensitive search
  const entry = Object.entries(mapping).find(([key]) => key.toLowerCase() === trimmed.toLowerCase())

  return entry ? entry[1] : trimmed
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    }),
  )
}

async function analyzeProfiles() {
  console.log('\n🔍 Analyzing profiles table...\n')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, country, state, full_name, role')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching profiles:', error)
    process.exit(1)
  }

  console.log(`📊 Total Profiles: ${profiles.length}`)

  const updates = []
  const countryCounts = {}
  const stateCounts = {}

  profiles.forEach((profile) => {
    const newCountry = normalizeCountryCode(profile.country)
    const newState = normalizeStateCode(profile.state, newCountry)

    const needsUpdate = profile.country !== newCountry || profile.state !== newState

    if (needsUpdate) {
      updates.push({
        id: profile.id,
        name: profile.full_name || 'N/A',
        role: profile.role,
        oldCountry: profile.country,
        newCountry,
        oldState: profile.state,
        newState,
      })
    }

    // Count occurrences
    countryCounts[profile.country] = (countryCounts[profile.country] || 0) + 1
    stateCounts[profile.state] = (stateCounts[profile.state] || 0) + 1
  })

  console.log('\n' + '='.repeat(70))
  console.log('📋 CURRENT DATA DISTRIBUTION')
  console.log('='.repeat(70))

  console.log('\n🌍 Country Codes:')
  Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([country, count]) => {
      const normalized = normalizeCountryCode(country)
      const indicator = country !== normalized ? '🔄' : '✅'
      console.log(`   ${indicator} ${country} -> ${normalized} (${count})`)
    })

  console.log('\n🗺️  State/County Codes:')
  Object.entries(stateCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .forEach(([state, count]) => {
      console.log(`   • ${state} (${count})`)
    })

  console.log('\n' + '='.repeat(70))
  console.log(`📝 UPDATES NEEDED: ${updates.length} profiles`)
  console.log('='.repeat(70))

  if (updates.length > 0) {
    console.log('\n🔄 Sample Updates (first 15):')
    updates.slice(0, 15).forEach((update) => {
      console.log(`\n   ${update.role}: ${update.name}`)
      console.log(`      Country: ${update.oldCountry} -> ${update.newCountry}`)
      console.log(`      State: ${update.oldState} -> ${update.newState}`)
    })
  }

  console.log('\n' + '='.repeat(70) + '\n')

  return { profiles, updates }
}

async function normalizeData(updates, dryRun = false) {
  console.log(
    `\n${dryRun ? '📝 DRY RUN' : '🚀 APPLYING UPDATES'} - Normalizing ${updates.length} profiles...\n`,
  )

  let successCount = 0
  let errorCount = 0
  const errors = []

  for (const update of updates) {
    if (!dryRun) {
      const { error } = await supabase
        .from('profiles')
        .update({
          country: update.newCountry,
          state: update.newState,
        })
        .eq('id', update.id)

      if (error) {
        console.log(`   ❌ ${update.name} - ${error.message}`)
        errorCount++
        errors.push({ name: update.name, error: error.message })
      } else {
        console.log(
          `   ✅ ${update.name}: ${update.oldCountry}/${update.oldState} -> ${update.newCountry}/${update.newState}`,
        )
        successCount++
      }
    } else {
      console.log(
        `   🔍 ${update.name}: ${update.oldCountry}/${update.oldState} -> ${update.newCountry}/${update.newState}`,
      )
      successCount++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log(`${dryRun ? '✅ Dry run complete!' : '✅ Normalization complete!'}`)
  console.log(`   • Successful: ${successCount}`)
  if (errorCount > 0) {
    console.log(`   • Errors: ${errorCount}`)
  }
  console.log('='.repeat(70) + '\n')

  return { successCount, errorCount, errors }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Profile Data Normalization Script - ISO Standard Codes       ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')

  const { updates } = await analyzeProfiles()

  if (updates.length === 0) {
    console.log('✅ All profiles already have standardized codes!\n')
    process.exit(0)
  }

  const proceed = await askQuestion('🤔 Proceed with normalization? (yes/no): ')

  if (proceed !== 'yes') {
    console.log('\n❌ Cancelled by user.\n')
    process.exit(0)
  }

  // Dry run first
  await normalizeData(updates, true)

  const apply = await askQuestion('\n✅ Apply changes to database? (yes/no): ')

  if (apply !== 'yes') {
    console.log('\n❌ Cancelled by user.\n')
    process.exit(0)
  }

  // Apply changes
  await normalizeData(updates, false)

  console.log('✅ All done!\n')
}

main().catch(console.error)
