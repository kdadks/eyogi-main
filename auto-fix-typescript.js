#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const sshPath = 'd:\\ITWala Projects\\eyogi-main\\src\\SSH'

console.log('🔧 Auto-fixing TypeScript errors...\n')

// Common TypeScript error patterns and their fixes
const fixes = [
  // Fix unused variables by prefixing with underscore
  {
    pattern: /([^'"]*)\s+is defined but never used/g,
    fix: (file, line) => {
      // Add underscore prefix to unused variables
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      const updatedLine = lines[line - 1]?.replace(
        /\b(\w+)\b(?=.*is defined but never used)/g,
        '_$1',
      )
      if (updatedLine && updatedLine !== lines[line - 1]) {
        lines[line - 1] = updatedLine
        fs.writeFileSync(file, lines.join('\n'))
        return true
      }
      return false
    },
  },

  // Fix 'any' types with proper type assertions
  {
    pattern: /Unexpected any/g,
    fix: (file, line) => {
      const content = fs.readFileSync(file, 'utf8')
      let updated = content.replace(/as any/g, 'as unknown')
      if (updated !== content) {
        fs.writeFileSync(file, updated)
        return true
      }
      return false
    },
  },

  // Fix import issues
  {
    pattern: /is not exported by/g,
    fix: (file, line) => {
      console.log(`⚠️  Import issue in ${file}:${line} - manual fix required`)
      return false
    },
  },
]

// Function to run TypeScript check and get errors
function getTypeScriptErrors() {
  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      cwd: sshPath,
      stdio: 'pipe',
    })

    let output = ''
    tsc.stdout.on('data', (data) => (output += data.toString()))
    tsc.stderr.on('data', (data) => (output += data.toString()))

    tsc.on('close', () => {
      resolve(output)
    })
  })
}

// Function to parse TypeScript errors
function parseErrors(output) {
  const errors = []
  const lines = output.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/(.+\.tsx?)\((\d+),(\d+)\): (.+)/)
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        message: match[4],
      })
    }
  }

  return errors
}

// Main auto-fix function
async function autoFix() {
  console.log('📊 Checking for TypeScript errors...')

  const output = await getTypeScriptErrors()
  const errors = parseErrors(output)

  if (errors.length === 0) {
    console.log('✅ No TypeScript errors found!')
    return
  }

  console.log(`🔍 Found ${errors.length} TypeScript errors`)

  let fixedCount = 0

  for (const error of errors) {
    for (const fix of fixes) {
      if (fix.pattern.test(error.message)) {
        try {
          if (fix.fix(error.file, error.line)) {
            fixedCount++
            console.log(`✅ Fixed: ${error.file}:${error.line}`)
            break
          }
        } catch (e) {
          console.log(`❌ Failed to fix: ${error.file}:${error.line} - ${e.message}`)
        }
      }
    }
  }

  console.log(`\n🎉 Auto-fixed ${fixedCount} out of ${errors.length} errors`)

  if (fixedCount > 0) {
    console.log('🔄 Running build to verify fixes...')
    const buildResult = await runBuild()
    if (buildResult.success) {
      console.log('✅ Build successful! All auto-fixable errors resolved.')
    } else {
      console.log('⚠️  Some errors remain - manual intervention required.')
    }
  }
}

// Function to run build
function runBuild() {
  return new Promise((resolve) => {
    const build = spawn('npm', ['run', 'build'], {
      cwd: sshPath,
      stdio: 'pipe',
    })

    let output = ''
    build.stdout.on('data', (data) => (output += data.toString()))
    build.stderr.on('data', (data) => (output += data.toString()))

    build.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output,
      })
    })
  })
}

// Run the auto-fix
autoFix().catch(console.error)
