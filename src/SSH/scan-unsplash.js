#!/usr/bin/env node

/**
 * Unsplash Scanner CLI
 *
 * Scans the codebase for Unsplash image URLs and generates migration reports.
 */

const {
  scanSSHFolder,
  scanForUnsplashUrls,
  UnsplashScanner,
} = require('./src/lib/unsplash-scanner')
const path = require('path')

const args = process.argv.slice(2)
const command = args[0] || 'scan'

async function main() {
  console.log('🔍 Unsplash Scanner v1.0')
  console.log('━'.repeat(50))

  if (command === 'help') {
    showHelp()
    return
  }

  if (command === 'scan') {
    const scanPath = args[1] || path.join(process.cwd(), 'src', 'SSH')
    const outputPath = path.join(process.cwd(), 'migration-reports')

    console.log(`📂 Scanning directory: ${scanPath}`)
    console.log(`📝 Output directory: ${outputPath}\n`)

    try {
      const result = await scanForUnsplashUrls(scanPath, outputPath)

      console.log('\n✅ Scan Complete!')
      console.log('━'.repeat(50))
      console.log(`📊 Results:`)
      console.log(`   Total files found: ${result.totalFiles}`)
      console.log(`   Files scanned: ${result.scannedFiles}`)
      console.log(`   Unsplash URLs found: ${result.matches.length}`)
      console.log(`   Errors: ${result.errors.length}`)

      if (result.errors.length > 0) {
        console.log(`\n⚠️  Errors:`)
        result.errors.forEach((err) => console.log(`   - ${err}`))
      }

      if (result.matches.length > 0) {
        console.log(`\n📄 Reports generated:`)
        console.log(`   - ${outputPath}/unsplash-report.md`)
        console.log(`   - ${outputPath}/unsplash-urls.csv`)
        console.log(`   - ${outputPath}/download-unsplash.sh`)

        console.log(`\n💡 Next steps:`)
        console.log(`   1. Review the report: ${outputPath}/unsplash-report.md`)
        console.log(
          `   2. Download images: cd ${outputPath} && chmod +x download-unsplash.sh && ./download-unsplash.sh`,
        )
        console.log(`   3. Upload to media system`)
        console.log(`   4. Update references in code`)
      } else {
        console.log(`\n✨ No Unsplash URLs found! Your codebase is clean.`)
      }
    } catch (error) {
      console.error('❌ Error:', error.message)
      process.exit(1)
    }
  } else {
    console.log(`❌ Unknown command: ${command}`)
    console.log(`Run 'npm run scan-unsplash help' for usage information.`)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
Usage: npm run scan-unsplash [command] [options]

Commands:
  scan [path]    Scan directory for Unsplash URLs (default: src/SSH)
  help           Show this help message

Examples:
  npm run scan-unsplash                    # Scan SSH folder
  npm run scan-unsplash scan ./src         # Scan custom directory
  npm run scan-unsplash scan ./public      # Scan public folder

Output:
  migration-reports/
    ├── unsplash-report.md      # Detailed report with context
    ├── unsplash-urls.csv       # CSV export of URLs
    └── download-unsplash.sh    # Script to download images
`)
}

main().catch(console.error)
