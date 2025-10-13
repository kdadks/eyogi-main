/**
 * Run Unsplash Scanner
 *
 * This script scans the codebase for Unsplash image URLs
 */

import { scanForUnsplashUrls } from './src/lib/unsplash-scanner'
import path from 'path'
import { promises as fs } from 'fs'

async function main() {
  // Scan the current SSH directory
  const sshPath = process.cwd()
  const outputPath = path.join(sshPath, 'migration-reports')

  // Ensure output directory exists
  try {
    await fs.mkdir(outputPath, { recursive: true })
  } catch {
    // Directory might already exist
  }

  console.log('🔍 Unsplash Scanner')
  console.log('━'.repeat(50))
  console.log(`📂 Scanning: ${sshPath}`)
  console.log(`📝 Output: ${outputPath}\n`)

  try {
    const result = await scanForUnsplashUrls(sshPath, outputPath)

    console.log('✅ Scan Complete!')
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
      console.log(`\n📋 URLs Found:`)
      const fileGroups: Record<string, typeof result.matches> = {}
      result.matches.forEach((match) => {
        if (!fileGroups[match.file]) {
          fileGroups[match.file] = []
        }
        fileGroups[match.file].push(match)
      })

      Object.entries(fileGroups).forEach(([file, matches]) => {
        console.log(`\n   📄 ${file}`)
        matches.forEach((match) => {
          console.log(`      Line ${match.line}: ${match.url}`)
        })
      })

      console.log(`\n📄 Reports generated in: migration-reports/`)
      console.log(`   - unsplash-report.md      (Detailed report)`)
      console.log(`   - unsplash-urls.csv       (CSV export)`)
      console.log(`   - download-unsplash.sh    (Download script)`)

      console.log(`\n💡 Next steps:`)
      console.log(`   1. Review: migration-reports/unsplash-report.md`)
      console.log(
        `   2. Download: cd migration-reports && chmod +x download-unsplash.sh && ./download-unsplash.sh`,
      )
      console.log(`   3. Upload to eYogi media system`)
      console.log(`   4. Update code references`)
    } else {
      console.log(`\n✨ No Unsplash URLs found! Your codebase is clean.`)
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

main()
