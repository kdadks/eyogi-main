/**
 * Supabase Storage Cleanup Script
 *
 * This script performs the following cleanup operations:
 * 1. Identifies orphaned files in storage buckets (files in storage but not in database)
 * 2. Deletes files for inactive certificates (only active certificates should have stored PDFs)
 * 3. Deletes orphaned media files (files in storage but not in media_files table)
 * 4. Deletes orphaned template files (files in storage but not referenced in templates)
 *
 * Usage:
 * - Use in a migration or admin context
 * - Run manually when needed for cleanup
 * - Can be scheduled for periodic maintenance
 */

import { supabaseAdmin } from './supabase'
import { deleteFromSupabaseStorage } from './supabase-storage'

interface CleanupReport {
  timestamp: string
  orphanedCertificates: {
    count: number
    files: string[]
    deleted: number
    failed: string[]
  }
  inactiveCertificates: {
    count: number
    files: string[]
    deleted: number
    failed: string[]
  }
  orphanedMedia: {
    count: number
    files: string[]
    deleted: number
    failed: string[]
  }
  orphanedTemplates: {
    count: number
    files: string[]
    deleted: number
    failed: string[]
  }
  summary: {
    totalOrphanedFiles: number
    totalDeletedFiles: number
    totalFailedDeletions: number
  }
}

/**
 * Get all files in a bucket with pagination support
 */
async function getAllFilesInBucket(
  bucket: 'media' | 'certificates' | 'certificate-templates',
  path: string = '',
): Promise<string[]> {
  try {
    const pageSize = 100

    // Recursive function to handle pagination
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
          // It's a file (has id)
          fileList.push(fullPath)
        } else if (!file.name.startsWith('.')) {
          // It's a directory (no id), recurse into it
          const subFiles = await fetchPage(fullPath, 0)
          fileList.push(...subFiles)
        }
      }

      // If we got a full page, there might be more
      if (fileList.length === pageSize) {
        const nextPage = await fetchPage(currentPath, currentOffset + pageSize)
        fileList.push(...nextPage)
      }

      return fileList
    }

    const files = await fetchPage(path, 0)
    return files
  } catch (error) {
    console.error(`Error getting all files from ${bucket}:`, error)
    return []
  }
}

/**
 * Get all certificate file URLs from the database
 */
async function getDatabaseCertificateFileUrls(): Promise<{
  active: string[]
  inactive: string[]
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('id, file_url, is_active, certificate_number')
      .not('file_url', 'is', null)

    if (error) {
      console.error('Error fetching certificates from database:', error)
      return { active: [], inactive: [] }
    }

    const active: string[] = []
    const inactive: string[] = []

    for (const cert of data || []) {
      if (cert.file_url) {
        if (cert.is_active) {
          active.push(cert.file_url)
        } else {
          inactive.push(cert.file_url)
        }
      }
    }

    return { active, inactive }
  } catch (error) {
    console.error('Error fetching certificate URLs:', error)
    return { active: [], inactive: [] }
  }
}

/**
 * Get all media file URLs from the database
 */
async function getDatabaseMediaFileUrls(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('media_files')
      .select('id, file_url')
      .not('file_url', 'is', null)

    if (error) {
      console.error('Error fetching media files from database:', error)
      return []
    }

    return (data || []).map((f) => f.file_url).filter((url) => url)
  } catch (error) {
    console.error('Error fetching media file URLs:', error)
    return []
  }
}

/**
 * Get all file URLs referenced in certificate templates
 */
async function getTemplateFileUrls(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificate_templates')
      .select('id, template_data')

    if (error) {
      console.error('Error fetching templates from database:', error)
      return []
    }

    const urls: string[] = []

    for (const template of data || []) {
      if (template.template_data) {
        const templateData = template.template_data as Record<string, unknown>

        // Extract from logos
        if (templateData.logos) {
          const logos = templateData.logos as Record<string, unknown>
          Object.values(logos).forEach((url) => {
            if (typeof url === 'string' && url?.startsWith('http')) {
              urls.push(url)
            }
          })
        }

        // Extract from signatures
        if (templateData.signatures) {
          const signatures = templateData.signatures as Record<string, unknown>
          Object.values(signatures).forEach((url) => {
            if (typeof url === 'string' && url?.startsWith('http')) {
              urls.push(url)
            }
          })
        }

        // Extract background images
        if (templateData.background_image && typeof templateData.background_image === 'string') {
          if (templateData.background_image.startsWith('http')) {
            urls.push(templateData.background_image)
          }
        }

        // Extract from dynamic fields
        if (templateData.dynamic_fields && Array.isArray(templateData.dynamic_fields)) {
          ;(templateData.dynamic_fields as Array<Record<string, unknown>>).forEach((field) => {
            if (field.image_url && typeof field.image_url === 'string') {
              if (field.image_url.startsWith('http')) {
                urls.push(field.image_url)
              }
            }
          })
        }
      }
    }

    return urls
  } catch (error) {
    console.error('Error fetching template file URLs:', error)
    return []
  }
}

/**
 * Convert file path to public URL for a bucket
 */
function pathToPublicUrl(bucket: string, filePath: string): string {
  // Extract the project URL from environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
}

/**
 * Main cleanup function
 */
export async function cleanupSupabaseStorage(): Promise<CleanupReport> {
  console.log('🧹 Starting Supabase Storage Cleanup...\n')

  const report: CleanupReport = {
    timestamp: new Date().toISOString(),
    orphanedCertificates: {
      count: 0,
      files: [],
      deleted: 0,
      failed: [],
    },
    inactiveCertificates: {
      count: 0,
      files: [],
      deleted: 0,
      failed: [],
    },
    orphanedMedia: {
      count: 0,
      files: [],
      deleted: 0,
      failed: [],
    },
    orphanedTemplates: {
      count: 0,
      files: [],
      deleted: 0,
      failed: [],
    },
    summary: {
      totalOrphanedFiles: 0,
      totalDeletedFiles: 0,
      totalFailedDeletions: 0,
    },
  }

  try {
    // 1. Handle Certificates Bucket
    console.log('📂 Checking certificates bucket...')
    const certificateFiles = await getAllFilesInBucket('certificates')
    const { active: activeCertUrls, inactive: inactiveCertUrls } =
      await getDatabaseCertificateFileUrls()

    // Find orphaned certificate files
    const inactiveCertPaths = new Set(
      inactiveCertUrls.map((url) => {
        const match = url.match(/certificates\/(.+?)(?:\?|$)/)
        return match ? match[1] : null
      }),
    )
    inactiveCertPaths.delete(null)

    const activeCertPaths = new Set(
      activeCertUrls.map((url) => {
        const match = url.match(/certificates\/(.+?)(?:\?|$)/)
        return match ? match[1] : null
      }),
    )
    activeCertPaths.delete(null)

    // Delete inactive certificates
    for (const filePath of certificateFiles) {
      if (inactiveCertPaths.has(filePath)) {
        report.inactiveCertificates.files.push(filePath)
        report.inactiveCertificates.count++

        const publicUrl = pathToPublicUrl('certificates', filePath)
        const deleted = await deleteFromSupabaseStorage(publicUrl)

        if (deleted) {
          report.inactiveCertificates.deleted++
          console.log(`✅ Deleted inactive certificate: ${filePath}`)
        } else {
          report.inactiveCertificates.failed.push(filePath)
          console.log(`❌ Failed to delete inactive certificate: ${filePath}`)
        }
      }

      // Find orphaned active certificate files
      if (!activeCertPaths.has(filePath) && !inactiveCertPaths.has(filePath)) {
        report.orphanedCertificates.files.push(filePath)
        report.orphanedCertificates.count++

        const publicUrl = pathToPublicUrl('certificates', filePath)
        const deleted = await deleteFromSupabaseStorage(publicUrl)

        if (deleted) {
          report.orphanedCertificates.deleted++
          console.log(`✅ Deleted orphaned certificate: ${filePath}`)
        } else {
          report.orphanedCertificates.failed.push(filePath)
          console.log(`❌ Failed to delete orphaned certificate: ${filePath}`)
        }
      }
    }

    // 2. Handle Media Bucket
    console.log('\n📂 Checking media bucket...')
    const mediaFiles = await getAllFilesInBucket('media')
    const mediaUrls = await getDatabaseMediaFileUrls()

    const mediaPathsInDb = new Set(
      mediaUrls.map((url) => {
        const match = url.match(/media\/(.+?)(?:\?|$)/)
        return match ? match[1] : null
      }),
    )
    mediaPathsInDb.delete(null)

    for (const filePath of mediaFiles) {
      if (!mediaPathsInDb.has(filePath)) {
        report.orphanedMedia.files.push(filePath)
        report.orphanedMedia.count++

        const publicUrl = pathToPublicUrl('media', filePath)
        const deleted = await deleteFromSupabaseStorage(publicUrl)

        if (deleted) {
          report.orphanedMedia.deleted++
          console.log(`✅ Deleted orphaned media file: ${filePath}`)
        } else {
          report.orphanedMedia.failed.push(filePath)
          console.log(`❌ Failed to delete orphaned media file: ${filePath}`)
        }
      }
    }

    // 3. Handle Certificate Templates Bucket
    console.log('\n📂 Checking certificate-templates bucket...')
    const templateFiles = await getAllFilesInBucket('certificate-templates')
    const templateUrls = await getTemplateFileUrls()

    const templatePathsInDb = new Set(
      templateUrls.map((url) => {
        const match = url.match(/certificate-templates\/(.+?)(?:\?|$)/)
        return match ? match[1] : null
      }),
    )
    templatePathsInDb.delete(null)

    for (const filePath of templateFiles) {
      if (!templatePathsInDb.has(filePath)) {
        report.orphanedTemplates.files.push(filePath)
        report.orphanedTemplates.count++

        const publicUrl = pathToPublicUrl('certificate-templates', filePath)
        const deleted = await deleteFromSupabaseStorage(publicUrl)

        if (deleted) {
          report.orphanedTemplates.deleted++
          console.log(`✅ Deleted orphaned template file: ${filePath}`)
        } else {
          report.orphanedTemplates.failed.push(filePath)
          console.log(`❌ Failed to delete orphaned template file: ${filePath}`)
        }
      }
    }

    // Calculate summary
    report.summary.totalOrphanedFiles =
      report.orphanedCertificates.count +
      report.inactiveCertificates.count +
      report.orphanedMedia.count +
      report.orphanedTemplates.count

    report.summary.totalDeletedFiles =
      report.orphanedCertificates.deleted +
      report.inactiveCertificates.deleted +
      report.orphanedMedia.deleted +
      report.orphanedTemplates.deleted

    report.summary.totalFailedDeletions =
      report.orphanedCertificates.failed.length +
      report.inactiveCertificates.failed.length +
      report.orphanedMedia.failed.length +
      report.orphanedTemplates.failed.length

    // Print summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 CLEANUP REPORT')
    console.log('='.repeat(50))
    console.log(`\n🔴 Inactive Certificates: ${report.inactiveCertificates.count}`)
    console.log(`   ✅ Deleted: ${report.inactiveCertificates.deleted}`)
    console.log(`   ❌ Failed: ${report.inactiveCertificates.failed.length}`)

    console.log(`\n🔴 Orphaned Certificates: ${report.orphanedCertificates.count}`)
    console.log(`   ✅ Deleted: ${report.orphanedCertificates.deleted}`)
    console.log(`   ❌ Failed: ${report.orphanedCertificates.failed.length}`)

    console.log(`\n🔴 Orphaned Media Files: ${report.orphanedMedia.count}`)
    console.log(`   ✅ Deleted: ${report.orphanedMedia.deleted}`)
    console.log(`   ❌ Failed: ${report.orphanedMedia.failed.length}`)

    console.log(`\n🔴 Orphaned Template Files: ${report.orphanedTemplates.count}`)
    console.log(`   ✅ Deleted: ${report.orphanedTemplates.deleted}`)
    console.log(`   ❌ Failed: ${report.orphanedTemplates.failed.length}`)

    console.log(`\n${'='.repeat(50)}`)
    console.log(`📈 SUMMARY`)
    console.log(`${'='.repeat(50)}`)
    console.log(`Total Orphaned Files Found: ${report.summary.totalOrphanedFiles}`)
    console.log(`Total Files Deleted: ${report.summary.totalDeletedFiles}`)
    console.log(`Total Failed Deletions: ${report.summary.totalFailedDeletions}`)
    console.log(`Timestamp: ${report.timestamp}`)
    console.log('='.repeat(50) + '\n')

    return report
  } catch (error) {
    console.error('Fatal error during cleanup:', error)
    throw error
  }
}

/**
 * Export functions for individual use
 */
export {
  getAllFilesInBucket,
  getDatabaseCertificateFileUrls,
  getDatabaseMediaFileUrls,
  getTemplateFileUrls,
}
