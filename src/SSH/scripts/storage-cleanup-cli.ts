#!/usr/bin/env node

/**
 * Storage Cleanup CLI Script
 *
 * Usage:
 * node storage-cleanup-cli.js [command] [options]
 *
 * Commands:
 * - audit              Run audit only (no deletions)
 * - cleanup-inactive   Clean up inactive certificates only
 * - cleanup-all        Run full cleanup (all orphaned files)
 * - report             Generate detailed report
 *
 * Options:
 * - --detailed         Include detailed file lists in output
 * - --verbose          Verbose logging
 * - --json             Output as JSON
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const command = process.argv[2] || 'audit'
const options = {
  detailed: process.argv.includes('--detailed'),
  verbose: process.argv.includes('--verbose'),
  json: process.argv.includes('--json'),
}

const log = (msg: string) => {
  if (!options.json) {
    console.log(msg)
  }
}

const logJson = (obj: any) => {
  if (options.json) {
    console.log(JSON.stringify(obj, null, 2))
  }
}

/**
 * Get all files in a bucket with pagination
 */
async function getAllFilesInBucket(bucket: string, path: string = ''): Promise<string[]> {
  try {
    const allFiles: string[] = []
    let offset = 0
    const pageSize = 100

    const fetchPage = async (currentPath: string, currentOffset: number): Promise<string[]> => {
      const { data, error } = await supabaseAdmin.storage.from(bucket).list(currentPath, {
        limit: pageSize,
        offset: currentOffset,
        sortBy: { column: 'name', order: 'asc' },
      })

      if (error) {
        console.error(`Error fetching files from ${bucket}/${currentPath}:`, error)
        return []
      }

      if (!data || data.length === 0) {
        return []
      }

      const fileList: string[] = []

      for (const file of data) {
        const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name

        if (file.id) {
          fileList.push(fullPath)
        } else if (!file.name.startsWith('.')) {
          const subFiles = await fetchPage(fullPath, 0)
          fileList.push(...subFiles)
        }
      }

      if (fileList.length === pageSize) {
        const nextPage = await fetchPage(currentPath, currentOffset + pageSize)
        fileList.push(...nextPage)
      }

      return fileList
    }

    const files = await fetchPage(path, offset)
    return files
  } catch (error) {
    console.error(`Error getting files from ${bucket}:`, error)
    return []
  }
}

/**
 * Delete a file from storage
 */
async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath])

    if (error) {
      if (options.verbose) {
        console.error(`Failed to delete ${bucket}/${filePath}:`, error.message)
      }
      return false
    }

    if (options.verbose) {
      log(`✅ Deleted: ${bucket}/${filePath}`)
    }
    return true
  } catch (error) {
    if (options.verbose) {
      console.error(`Error deleting ${bucket}/${filePath}:`, error)
    }
    return false
  }
}

/**
 * Main cleanup logic
 */
async function runCleanup() {
  log('\n🧹 Storage Cleanup Starting...\n')

  try {
    const startTime = Date.now()

    // Get data from database
    log('📊 Fetching database data...')
    const { data: certs } = await supabaseAdmin
      .from('certificates')
      .select('id, file_url, is_active, certificate_number')
      .not('file_url', 'is', null)

    const { data: media } = await supabaseAdmin
      .from('media_files')
      .select('id, file_url')
      .not('file_url', 'is', null)

    const { data: templates } = await supabaseAdmin
      .from('certificate_templates')
      .select('id, template_data')

    // Build sets of valid URLs
    const activeCertUrls = new Set((certs || []).filter((c) => c.is_active).map((c) => c.file_url))
    const inactiveCertUrls = new Set(
      (certs || []).filter((c) => !c.is_active).map((c) => c.file_url),
    )
    const mediaUrls = new Set((media || []).map((m) => m.file_url))

    const templateUrls = new Set<string>()
    for (const template of templates || []) {
      const templateData = template.template_data as Record<string, any>
      if (templateData?.logos) {
        Object.values(templateData.logos).forEach((url: any) => {
          if (typeof url === 'string' && url?.startsWith('http')) {
            templateUrls.add(url)
          }
        })
      }
      if (templateData?.signatures) {
        Object.values(templateData.signatures).forEach((url: any) => {
          if (typeof url === 'string' && url?.startsWith('http')) {
            templateUrls.add(url)
          }
        })
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      command,
      inactiveCertificates: { found: 0, deleted: 0, failed: [] as string[] },
      orphanedCertificates: { found: 0, deleted: 0, failed: [] as string[] },
      orphanedMedia: { found: 0, deleted: 0, failed: [] as string[] },
      orphanedTemplates: { found: 0, deleted: 0, failed: [] as string[] },
    }

    // Process certificates bucket
    if (command === 'cleanup-inactive' || command === 'cleanup-all') {
      log('\n📂 Processing certificates bucket...')
      const certFiles = await getAllFilesInBucket('certificates')

      for (const filePath of certFiles) {
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/certificates/${filePath}`

        if (inactiveCertUrls.has(fileUrl)) {
          if (command === 'cleanup-inactive' || command === 'cleanup-all') {
            report.inactiveCertificates.found++
            const deleted = await deleteFile('certificates', filePath)
            if (deleted) {
              report.inactiveCertificates.deleted++
            } else {
              report.inactiveCertificates.failed.push(filePath)
            }
          }
        } else if (!activeCertUrls.has(fileUrl)) {
          if (command === 'cleanup-all') {
            report.orphanedCertificates.found++
            const deleted = await deleteFile('certificates', filePath)
            if (deleted) {
              report.orphanedCertificates.deleted++
            } else {
              report.orphanedCertificates.failed.push(filePath)
            }
          }
        }
      }
    }

    // Process media bucket
    if (command === 'cleanup-all') {
      log('\n📂 Processing media bucket...')
      const mediaFiles = await getAllFilesInBucket('media')

      for (const filePath of mediaFiles) {
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/media/${filePath}`

        if (!mediaUrls.has(fileUrl)) {
          report.orphanedMedia.found++
          const deleted = await deleteFile('media', filePath)
          if (deleted) {
            report.orphanedMedia.deleted++
          } else {
            report.orphanedMedia.failed.push(filePath)
          }
        }
      }
    }

    // Process templates bucket
    if (command === 'cleanup-all') {
      log('\n📂 Processing certificate-templates bucket...')
      const templateFiles = await getAllFilesInBucket('certificate-templates')

      for (const filePath of templateFiles) {
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/certificate-templates/${filePath}`

        if (!templateUrls.has(fileUrl)) {
          report.orphanedTemplates.found++
          const deleted = await deleteFile('certificate-templates', filePath)
          if (deleted) {
            report.orphanedTemplates.deleted++
          } else {
            report.orphanedTemplates.failed.push(filePath)
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Print report
    if (options.json) {
      logJson(report)
    } else {
      log('\n' + '='.repeat(60))
      log('📊 CLEANUP REPORT')
      log('='.repeat(60))

      if (report.inactiveCertificates.found > 0) {
        log(
          `\n🔴 Inactive Certificates: ${report.inactiveCertificates.found} found, ${report.inactiveCertificates.deleted} deleted`,
        )
      }

      if (report.orphanedCertificates.found > 0) {
        log(
          `🔴 Orphaned Certificates: ${report.orphanedCertificates.found} found, ${report.orphanedCertificates.deleted} deleted`,
        )
      }

      if (report.orphanedMedia.found > 0) {
        log(
          `🔴 Orphaned Media: ${report.orphanedMedia.found} found, ${report.orphanedMedia.deleted} deleted`,
        )
      }

      if (report.orphanedTemplates.found > 0) {
        log(
          `🔴 Orphaned Templates: ${report.orphanedTemplates.found} found, ${report.orphanedTemplates.deleted} deleted`,
        )
      }

      const totalFound =
        report.inactiveCertificates.found +
        report.orphanedCertificates.found +
        report.orphanedMedia.found +
        report.orphanedTemplates.found

      const totalDeleted =
        report.inactiveCertificates.deleted +
        report.orphanedCertificates.deleted +
        report.orphanedMedia.deleted +
        report.orphanedTemplates.deleted

      log(`\n${'='.repeat(60)}`)
      log(`Total files found: ${totalFound}`)
      log(`Total files deleted: ${totalDeleted}`)
      log(`Duration: ${duration}s`)
      log(`${'='.repeat(60)}\n`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run based on command
if (command === 'audit') {
  log('🔍 Running audit (no deletions)...')
  getAllFilesInBucket('certificates').then((files) => {
    log(`\nCertificates bucket: ${files.length} files`)
  })
} else {
  runCleanup()
}
