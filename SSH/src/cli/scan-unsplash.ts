#!/usr/bin/env node

import { scanSSHFolder, scanForUnsplashUrls } from '../lib/unsplash-scanner.js'
import type { UnsplashMatch, ScanResult } from '../lib/unsplash-scanner.js'
import { promises as fs } from 'fs'
import path from 'path'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log('🔍 eYogi Unsplash Scanner')
  console.log('========================\n')

  switch (command) {
    case 'ssh':
      await scanSSH()
      break

    case 'scan': {
      const targetPath = args[1]
      if (!targetPath) {
        console.error('❌ Error: Please provide a path to scan')
        console.log('Usage: npm run scan-unsplash scan <path>')
        process.exit(1)
      }
      await scanPath(targetPath)
      break
    }

    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break

    default:
      console.log('🚀 Running default SSH folder scan...\n')
      await scanSSH()
  }
}

async function scanSSH() {
  console.log('📂 Scanning SSH folder for Unsplash URLs...')

  try {
    const result = await scanSSHFolder()
    displayResults(result)
  } catch (error) {
    console.error('❌ Error scanning SSH folder:', error)
    process.exit(1)
  }
}

async function scanPath(targetPath: string) {
  console.log(`📂 Scanning ${targetPath} for Unsplash URLs...`)

  try {
    // Check if path exists
    await fs.access(targetPath)

    const outputPath = path.join(process.cwd(), 'migration-reports')
    const result = await scanForUnsplashUrls(targetPath, outputPath)
    displayResults(result)
  } catch (error) {
    console.error(`❌ Error scanning ${targetPath}:`, error)
    process.exit(1)
  }
}

function displayResults(result: ScanResult) {
  const { totalFiles, scannedFiles, matches, errors } = result

  console.log('\n📊 Scan Results')
  console.log('================')
  console.log(`📁 Total files found: ${totalFiles}`)
  console.log(`🔍 Files scanned: ${scannedFiles}`)
  console.log(`🖼️  Unsplash URLs found: ${matches.length}`)
  console.log(`❗ Errors: ${errors.length}`)

  if (matches.length > 0) {
    console.log('\n🎯 Found URLs:')
    console.log('==============')

    // Show first few matches
    const preview = matches.slice(0, 5)
    preview.forEach((match: UnsplashMatch, index: number) => {
      const relativePath = path.relative(process.cwd(), match.file)
      console.log(`${index + 1}. ${relativePath}:${match.line}`)
      console.log(`   ${match.url}`)
    })

    if (matches.length > 5) {
      console.log(`   ... and ${matches.length - 5} more`)
    }

    console.log('\n📄 Reports generated in: migration-reports/')
    console.log('  - unsplash-report.md (detailed report)')
    console.log('  - unsplash-urls.csv (spreadsheet format)')
    console.log('  - download-unsplash.sh (download script)')

    console.log('\n🚀 Next Steps:')
    console.log('==============')
    console.log('1. Review the detailed report in migration-reports/unsplash-report.md')
    console.log('2. Run the download script to get images locally')
    console.log('3. Upload images to your media management system')
    console.log('4. Update code to reference local media instead of Unsplash URLs')
    console.log('5. Apply watermarks using the media management system')
  } else {
    console.log('\n✅ No Unsplash URLs found! Your project is already using local media.')
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:')
    errors.slice(0, 3).forEach((error: string) => {
      console.log(`  - ${error}`)
    })
    if (errors.length > 3) {
      console.log(`  ... and ${errors.length - 3} more (see detailed report)`)
    }
  }
}

function showHelp() {
  console.log('eYogi Unsplash Scanner - Find and migrate Unsplash image URLs')
  console.log('')
  console.log('Usage:')
  console.log('  npm run scan-unsplash              # Scan SSH folder (default)')
  console.log('  npm run scan-unsplash ssh          # Scan SSH folder explicitly')
  console.log('  npm run scan-unsplash scan <path>  # Scan custom path')
  console.log('  npm run scan-unsplash help         # Show this help')
  console.log('')
  console.log('Examples:')
  console.log('  npm run scan-unsplash')
  console.log('  npm run scan-unsplash scan ./src')
  console.log('  npm run scan-unsplash scan ./public')
  console.log('')
  console.log('Output:')
  console.log('  Reports are generated in migration-reports/ folder:')
  console.log('  - unsplash-report.md    Detailed analysis and recommendations')
  console.log('  - unsplash-urls.csv     Spreadsheet format for tracking')
  console.log('  - download-unsplash.sh  Bash script to download all images')
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the CLI
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
