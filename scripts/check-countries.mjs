#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '../src/SSH/.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
)

const { data } = await supabase
  .from('profiles')
  .select('country, state, student_id, full_name')
  .eq('role', 'student')

console.log('\n📋 Countries and States in Database:\n')

const countryMap = {}
data.forEach((student) => {
  if (!countryMap[student.country]) {
    countryMap[student.country] = new Set()
  }
  countryMap[student.country].add(student.state)
})

Object.keys(countryMap)
  .sort()
  .forEach((country) => {
    console.log(`\n🌍 ${country}`)
    Array.from(countryMap[country])
      .sort()
      .forEach((state) => {
        console.log(`   └─ ${state}`)
      })
  })

console.log('\n\n📝 Sample Student Records:\n')
data.slice(0, 5).forEach((s) => {
  console.log(`${s.student_id} | ${s.full_name}`)
  console.log(`   Country: "${s.country}"`)
  console.log(`   State: "${s.state}"`)
  console.log()
})
