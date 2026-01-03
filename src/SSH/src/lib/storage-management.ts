/**
 * Storage Cleanup Management Utility
 *
 * This module provides utilities for managing storage cleanup and generating reports
 * Can be used in server-side contexts, migrations, or admin endpoints
 */

import { supabaseAdmin } from './supabase'
import {
  getAllFilesInBucket,
  getDatabaseCertificateFileUrls,
  getDatabaseMediaFileUrls,
  getTemplateFileUrls,
} from './storage-cleanup'

interface StorageAudit {
  bucket: 'media' | 'certificates' | 'certificate-templates'
  filesInStorage: number
  filesInDatabase: number
  orphanedFiles: number
  activeOnly?: number
}

/**
 * Perform a dry-run audit of storage buckets
 * Returns statistics without deleting any files
 */
export async function auditStorageBuckets(): Promise<StorageAudit[]> {
  console.log('🔍 Auditing storage buckets...\n')

  const audits: StorageAudit[] = []

  try {
    // Audit Certificates Bucket
    console.log('Auditing certificates bucket...')
    const certFiles = await getAllFilesInBucket('certificates')
    const { active: activeCertUrls, inactive: inactiveCertUrls } =
      await getDatabaseCertificateFileUrls()

    const certAudit: StorageAudit = {
      bucket: 'certificates',
      filesInStorage: certFiles.length,
      filesInDatabase: activeCertUrls.length + inactiveCertUrls.length,
      orphanedFiles: certFiles.length - activeCertUrls.length,
      activeOnly: activeCertUrls.length,
    }
    audits.push(certAudit)
    console.log(
      `✓ Certificates: ${certAudit.filesInStorage} files in storage, ${certAudit.filesInDatabase} in database, ${certAudit.orphanedFiles} orphaned, ${certAudit.activeOnly} active`,
    )

    // Audit Media Bucket
    console.log('Auditing media bucket...')
    const mediaFiles = await getAllFilesInBucket('media')
    const mediaUrls = await getDatabaseMediaFileUrls()

    const mediaAudit: StorageAudit = {
      bucket: 'media',
      filesInStorage: mediaFiles.length,
      filesInDatabase: mediaUrls.length,
      orphanedFiles: mediaFiles.length - mediaUrls.length,
    }
    audits.push(mediaAudit)
    console.log(
      `✓ Media: ${mediaAudit.filesInStorage} files in storage, ${mediaAudit.filesInDatabase} in database, ${mediaAudit.orphanedFiles} orphaned`,
    )

    // Audit Template Bucket
    console.log('Auditing certificate-templates bucket...')
    const templateFiles = await getAllFilesInBucket('certificate-templates')
    const templateUrls = await getTemplateFileUrls()

    const templateAudit: StorageAudit = {
      bucket: 'certificate-templates',
      filesInStorage: templateFiles.length,
      filesInDatabase: templateUrls.length,
      orphanedFiles: templateFiles.length - templateUrls.length,
    }
    audits.push(templateAudit)
    console.log(
      `✓ Templates: ${templateAudit.filesInStorage} files in storage, ${templateAudit.filesInDatabase} in database, ${templateAudit.orphanedFiles} orphaned`,
    )

    console.log('\n✅ Audit complete')
    return audits
  } catch (error) {
    console.error('Error during audit:', error)
    throw error
  }
}

/**
 * Get detailed statistics about certificates
 */
export async function getCertificateStatistics(): Promise<{
  total: number
  active: number
  inactive: number
  withStoredFiles: number
  withoutStoredFiles: number
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('id, is_active, file_url')

    if (error) {
      console.error('Error fetching certificate statistics:', error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      active: 0,
      inactive: 0,
      withStoredFiles: 0,
      withoutStoredFiles: 0,
    }

    for (const cert of data || []) {
      if (cert.is_active) {
        stats.active++
      } else {
        stats.inactive++
      }

      if (cert.file_url) {
        stats.withStoredFiles++
      } else {
        stats.withoutStoredFiles++
      }
    }

    return stats
  } catch (error) {
    console.error('Error getting certificate statistics:', error)
    throw error
  }
}

/**
 * Get detailed statistics about media files
 */
export async function getMediaStatistics(): Promise<{
  total: number
  byCategory: Record<string, number>
  totalSize: number
  orphaned: number
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('media_files')
      .select('id, file_category, file_size')

    if (error) {
      console.error('Error fetching media statistics:', error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      byCategory: {} as Record<string, number>,
      totalSize: 0,
      orphaned: 0,
    }

    for (const media of data || []) {
      if (media.file_category) {
        stats.byCategory[media.file_category] = (stats.byCategory[media.file_category] || 0) + 1
      }
      stats.totalSize += media.file_size || 0
    }

    return stats
  } catch (error) {
    console.error('Error getting media statistics:', error)
    throw error
  }
}

/**
 * Identify and report on inactive certificates with stored files
 */
export async function getInactiveCertificatesWithFiles(): Promise<
  Array<{
    id: string
    certificate_number: string
    student_id: string
    course_id: string
    file_url: string | null
  }>
> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_number, student_id, course_id, file_url')
      .eq('is_active', false)
      .not('file_url', 'is', null)

    if (error) {
      console.error('Error fetching inactive certificates with files:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error getting inactive certificates:', error)
    throw error
  }
}

/**
 * Generate a comprehensive storage report
 */
export async function generateStorageReport(): Promise<{
  timestamp: string
  audit: StorageAudit[]
  certificateStats: {
    total: number
    active: number
    inactive: number
    withStoredFiles: number
    withoutStoredFiles: number
  }
  mediaStats: {
    total: number
    byCategory: Record<string, number>
    totalSize: number
  }
  inactiveCertsWithFiles: number
  recommendations: string[]
}> {
  console.log('📊 Generating comprehensive storage report...\n')

  try {
    const audit = await auditStorageBuckets()
    const certificateStats = await getCertificateStatistics()
    const mediaStats = await getMediaStatistics()
    const inactiveCerts = await getInactiveCertificatesWithFiles()

    const recommendations: string[] = []

    // Generate recommendations
    const totalOrphaned = audit.reduce((sum, a) => sum + a.orphanedFiles, 0)
    if (totalOrphaned > 0) {
      recommendations.push(`🚨 Found ${totalOrphaned} orphaned files - recommend running cleanup`)
    }

    if (certificateStats.inactive > 0) {
      recommendations.push(`⚠️ Found ${certificateStats.inactive} inactive certificates`)
      if (inactiveCerts.length > 0) {
        recommendations.push(
          `🔴 ${inactiveCerts.length} inactive certificates have stored files - these should be deleted`,
        )
      }
    }

    if (mediaStats.total > 0) {
      const totalSizeGB = (mediaStats.totalSize / (1024 * 1024 * 1024)).toFixed(2)
      recommendations.push(`📦 Total media storage: ${totalSizeGB} GB`)
    }

    const report = {
      timestamp: new Date().toISOString(),
      audit,
      certificateStats,
      mediaStats,
      inactiveCertsWithFiles: inactiveCerts.length,
      recommendations,
    }

    console.log('\n📋 STORAGE REPORT')
    console.log('='.repeat(60))
    console.log(`Timestamp: ${report.timestamp}\n`)

    console.log('🗂️  Bucket Audit:')
    for (const auditItem of audit) {
      console.log(`  ${auditItem.bucket}:`)
      console.log(`    - Files in storage: ${auditItem.filesInStorage}`)
      console.log(`    - Files in database: ${auditItem.filesInDatabase}`)
      console.log(`    - Orphaned files: ${auditItem.orphanedFiles}`)
      if (auditItem.activeOnly !== undefined) {
        console.log(`    - Active certificates: ${auditItem.activeOnly}`)
      }
    }

    console.log(`\n📜 Certificates:`)
    console.log(`  - Total: ${certificateStats.total}`)
    console.log(`  - Active: ${certificateStats.active}`)
    console.log(`  - Inactive: ${certificateStats.inactive}`)
    console.log(`  - With stored files: ${certificateStats.withStoredFiles}`)
    console.log(`  - Without stored files: ${certificateStats.withoutStoredFiles}`)

    console.log(`\n🎬 Media Files:`)
    console.log(`  - Total: ${mediaStats.total}`)
    Object.entries(mediaStats.byCategory).forEach(([category, count]) => {
      console.log(`    - ${category}: ${count}`)
    })
    const totalSizeGB = (mediaStats.totalSize / (1024 * 1024 * 1024)).toFixed(2)
    console.log(`  - Total size: ${totalSizeGB} GB`)

    if (recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`)
      recommendations.forEach((rec) => console.log(`  ${rec}`))
    }

    console.log('\n' + '='.repeat(60) + '\n')

    return report
  } catch (error) {
    console.error('Error generating storage report:', error)
    throw error
  }
}
