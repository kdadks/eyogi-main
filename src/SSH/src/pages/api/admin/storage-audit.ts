/**
 * Admin Endpoint for Storage Audit and Cleanup
 *
 * This comprehensive endpoint provides:
 * 1. Storage audit (dry run - no deletions)
 * 2. Cleanup inactive certificates
 * 3. Full storage cleanup (remove all orphaned files)
 * 4. Generate detailed reports
 *
 * POST /api/admin/storage-audit
 *
 * Query Parameters:
 * - action: 'audit' | 'cleanup-inactive' | 'cleanup-all' | 'report'
 * - detailed=true: Include detailed file lists
 *
 * Response includes full report with statistics
 */

import { generateStorageReport, auditStorageBuckets } from '@/lib/storage-management'
import { cleanupSupabaseStorage } from '@/lib/storage-cleanup'
import { cleanupInactiveCertificates } from '@/lib/api/certificates'

export default async function handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: Record<string, any>,
) {
  // Only allow POST and GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const action = req.query.action || 'audit'
    const detailed = req.query.detailed === 'true'

    // TODO: Add proper authentication/authorization checks
    // For now, assume this is in a protected environment

    switch (action) {
      case 'audit': {
        // Dry run - just audit without making changes
        console.log('🔍 Running storage audit (dry run)...')
        const audit = await auditStorageBuckets()

        return res.status(200).json({
          success: true,
          action: 'audit',
          timestamp: new Date().toISOString(),
          audit,
          message: 'Audit complete. Use action=cleanup-all to remove orphaned files.',
        })
      }

      case 'cleanup-inactive': {
        // Clean up only inactive certificates
        console.log('🧹 Cleaning up inactive certificates...')
        const result = await cleanupInactiveCertificates()

        return res.status(200).json({
          success: true,
          action: 'cleanup-inactive',
          timestamp: new Date().toISOString(),
          result: {
            inactiveCertificatesFound: result.count,
            filesDeleted: result.deleted,
            failedDeletions: result.failed.length,
            failedFiles: detailed ? result.failed : undefined,
          },
          message: `Cleaned up ${result.deleted} inactive certificate files`,
        })
      }

      case 'cleanup-all': {
        // Full cleanup of all orphaned files
        console.log('🧹 Running full storage cleanup...')
        const report = await cleanupSupabaseStorage()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: Record<string, any> = {
          success: true,
          action: 'cleanup-all',
          timestamp: report.timestamp,
          summary: report.summary,
          message: `Full cleanup completed. ${report.summary.totalDeletedFiles} files deleted.`,
        }

        if (detailed) {
          response.details = {
            inactiveCertificates: {
              count: report.inactiveCertificates.count,
              deleted: report.inactiveCertificates.deleted,
              files: report.inactiveCertificates.files,
            },
            orphanedCertificates: {
              count: report.orphanedCertificates.count,
              deleted: report.orphanedCertificates.deleted,
              files: report.orphanedCertificates.files,
            },
            orphanedMedia: {
              count: report.orphanedMedia.count,
              deleted: report.orphanedMedia.deleted,
              files: report.orphanedMedia.files,
            },
            orphanedTemplates: {
              count: report.orphanedTemplates.count,
              deleted: report.orphanedTemplates.deleted,
              files: report.orphanedTemplates.files,
            },
          }
        }

        return res.status(200).json(response)
      }

      case 'report': {
        // Generate comprehensive report
        console.log('📊 Generating storage report...')
        const report = await generateStorageReport()

        return res.status(200).json({
          success: true,
          action: 'report',
          timestamp: report.timestamp,
          summary: {
            audit: report.audit,
            certificates: report.certificateStats,
            media: report.mediaStats,
            issues: {
              inactiveCertsWithFiles: report.inactiveCertsWithFiles,
              orphanedFiles: report.audit.reduce((sum, a) => sum + a.orphanedFiles, 0),
            },
          },
          recommendations: report.recommendations,
          detailed: detailed ? report : undefined,
        })
      }

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['audit', 'cleanup-inactive', 'cleanup-all', 'report'],
        })
    }
  } catch (error) {
    console.error('Error in storage audit endpoint:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({
      success: false,
      error: 'Storage operation failed',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    })
  }
}
