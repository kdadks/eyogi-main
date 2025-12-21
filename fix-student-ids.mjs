import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import CryptoJS from 'crypto-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from SSH folder
dotenv.config({ path: join(__dirname, 'src', 'SSH', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Encryption/Decryption functions (must match the ones in the app)
const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production'

function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText
  if (!encryptedText.startsWith('U2FsdGVkX1')) return encryptedText // Not encrypted

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted || encryptedText
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText
  }
}

// State/County code mappings
const STATE_CODES = {
  // Ireland
  IRL: {
    Carlow: 'CW',
    Cavan: 'CN',
    Clare: 'CE',
    Cork: 'CO',
    Donegal: 'DL',
    Dublin: 'DU',
    Galway: 'GA',
    Kerry: 'KY',
    Kildare: 'KE',
    Kilkenny: 'KK',
    Laois: 'LS',
    Leitrim: 'LM',
    Limerick: 'LK',
    Longford: 'LD',
    Louth: 'LH',
    Mayo: 'MO',
    Meath: 'MH',
    Monaghan: 'MN',
    Offaly: 'OY',
    Roscommon: 'RN',
    Sligo: 'SO',
    Tipperary: 'TA',
    Waterford: 'WD',
    Westmeath: 'WH',
    Wexford: 'WX',
    Wicklow: 'WW',
  },
  // India
  IND: {
    'Andhra Pradesh': 'AP',
    'Arunachal Pradesh': 'AR',
    Assam: 'AS',
    Bihar: 'BR',
    Chhattisgarh: 'CG',
    Goa: 'GA',
    Gujarat: 'GJ',
    Haryana: 'HR',
    'Himachal Pradesh': 'HP',
    Jharkhand: 'JH',
    Karnataka: 'KA',
    Kerala: 'KL',
    'Madhya Pradesh': 'MP',
    Maharashtra: 'MH',
    Manipur: 'MN',
    Meghalaya: 'ML',
    Mizoram: 'MZ',
    Nagaland: 'NL',
    Odisha: 'OD',
    Punjab: 'PB',
    Rajasthan: 'RJ',
    Sikkim: 'SK',
    'Tamil Nadu': 'TN',
    Telangana: 'TG',
    Tripura: 'TR',
    'Uttar Pradesh': 'UP',
    Uttarakhand: 'UK',
    'West Bengal': 'WB',
    'Andaman and Nicobar Islands': 'AN',
    Chandigarh: 'CH',
    'Dadra and Nagar Haveli': 'DN',
    'Daman and Diu': 'DD',
    Delhi: 'DL',
    'Jammu and Kashmir': 'JK',
    Ladakh: 'LA',
    Lakshadweep: 'LD',
    Puducherry: 'PY',
  },
  // UK
  GBR: {
    England: 'EN',
    Scotland: 'SC',
    Wales: 'WA',
    'Northern Ireland': 'NI',
  },
}

function getStateCode(state, country) {
  if (!state || !country) return null

  const countryStates = STATE_CODES[country]
  if (!countryStates) return null

  // Try exact match first (case-insensitive)
  const stateUpper = state.toUpperCase()

  // Check if it's already a 2-letter code
  const exactCodeMatch = Object.entries(countryStates).find(
    ([, code]) => code === state.toUpperCase(),
  )
  if (exactCodeMatch) return state.toUpperCase()

  // Try to match by full name
  const matchByName = Object.entries(countryStates).find(
    ([name]) => name.toUpperCase() === stateUpper,
  )
  if (matchByName) return matchByName[1]

  return null
}

function generateCityCode(cityName) {
  if (!cityName) return 'XX'

  const cleaned = cityName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')

  if (cleaned.length === 0) return 'XX'
  if (cleaned.length === 1) return cleaned + 'X'

  // Get first 2 unique characters
  const chars = []
  for (const char of cleaned) {
    if (!chars.includes(char)) {
      chars.push(char)
      if (chars.length === 2) break
    }
  }

  if (chars.length === 1) chars.push('X')
  return chars.join('')
}

async function getNextSequenceNumber(country, stateCode, year) {
  const prefix = `${country}${stateCode}${year}`

  const { data: existingStudents } = await supabase
    .from('profiles')
    .select('student_id')
    .not('student_id', 'is', null)
    .like('student_id', `${prefix}%`)

  let nextNumber = 1
  if (existingStudents && existingStudents.length > 0) {
    const numbers = existingStudents
      .map((student) => {
        const studentId = student.student_id
        if (!studentId || studentId.length < 5) return 0
        const sequencePart = studentId.slice(-5)
        const num = parseInt(sequencePart, 10)
        return isNaN(num) ? 0 : num
      })
      .filter((num) => num > 0)

    if (numbers.length > 0) {
      nextNumber = Math.max(...numbers) + 1
    }
  }

  return nextNumber.toString().padStart(5, '0')
}

async function fixStudentIds() {
  console.log('=== Fixing Student IDs with XX ===\n')

  // Query all profiles with XX in student_id
  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, student_id, country, state, city')
    .like('student_id', '%XX%')
    .not('student_id', 'is', null)

  if (error) {
    console.error('Error fetching students:', error)
    return
  }

  if (!students || students.length === 0) {
    console.log('No student IDs with XX found.')
    return
  }

  console.log(`Found ${students.length} student(s) with XX in their ID:\n`)

  const updates = []

  for (const student of students) {
    console.log(`\n--- Processing Student ---`)
    console.log(`Current ID: ${student.student_id}`)
    console.log(`Email: ${student.email}`)

    // Decrypt fields
    const decryptedCity = decrypt(student.city)
    const decryptedState = decrypt(student.state)

    console.log(`Country: ${student.country}`)
    console.log(`State: ${decryptedState}`)
    console.log(`City: ${decryptedCity}`)

    // Extract year from current student ID
    // Format: CCCCCYYYY##### (3 country + 2 state + 4 year + 5 sequence)
    const currentId = student.student_id
    const year = currentId.substring(5, 9) // Extract YYYY

    // Get the correct state/city code
    let stateCode = null

    // Try state first
    if (decryptedState && decryptedState.trim() !== '') {
      stateCode = getStateCode(decryptedState, student.country)
      if (stateCode) {
        console.log(`✓ Found state code: ${stateCode}`)
      }
    }

    // Fallback to city if state not found
    if (!stateCode && decryptedCity && decryptedCity.trim() !== '') {
      stateCode = generateCityCode(decryptedCity)
      console.log(`✓ Generated city code: ${stateCode}`)
    }

    if (!stateCode || stateCode === 'XX') {
      console.log(`✗ Could not determine valid state/city code, skipping...`)
      continue
    }

    // Generate next available sequence number for this location/year
    const sequence = await getNextSequenceNumber(student.country, stateCode, year)

    // Construct new student ID
    const newStudentId = `${student.country}${stateCode}${year}${sequence}`

    console.log(`New ID: ${newStudentId} (sequence: ${sequence})`)

    updates.push({
      id: student.id,
      oldId: currentId,
      newId: newStudentId,
      email: student.email,
    })
  }

  // Confirm before updating
  console.log(`\n\n=== Summary ===`)
  console.log(`Total students to update: ${updates.length}`)

  if (updates.length === 0) {
    console.log('No updates to perform.')
    return
  }

  console.log('\nUpdates to be made:')
  updates.forEach((u) => {
    console.log(`  ${u.email}`)
    console.log(`    ${u.oldId} → ${u.newId}`)
  })

  // Perform updates
  console.log('\n\nPerforming updates...')

  for (const update of updates) {
    const { error } = await supabase
      .from('profiles')
      .update({ student_id: update.newId })
      .eq('id', update.id)

    if (error) {
      console.error(`✗ Failed to update ${update.email}:`, error.message)
    } else {
      console.log(`✓ Updated ${update.email}`)
    }
  }

  console.log('\n=== Done! ===')
}

// Run the script
fixStudentIds().catch(console.error)
