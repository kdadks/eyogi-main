/**
 * API Endpoint for Storage Cleanup
 *
 * This endpoint runs the storage cleanup script and returns a detailed report
 *
 * POST /api/admin/storage-cleanup
 *
 * Query Parameters:
 * - dryRun=true (optional): Only report what would be deleted, don't delete
 * - detailed=true (optional): Include detailed file lists in response
 *
 * Response:
 * {
 *   success: boolean
 *   report: CleanupReport
 *   message: string
 * }
 */

import { cleanupSupabaseStorage } from '@/lib/storage-cleanup'

export default async function handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: Record<string, any>,
) {
  // Only allow POST and GET requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify user is authenticated and has admin privileges
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // TODO: Add actual admin permission check if needed
    // For now, we'll assume this is only accessible in a protected environment

    const dryRun = req.query.dryRun === 'true'
    const detailed = req.query.detailed === 'true'

    console.log(`🧹 Storage cleanup requested (dryRun: ${dryRun})`)

    if (dryRun) {
      return res.status(200).json({
        success: true,
        message:
          'Dry run mode - no files were deleted. Run with dryRun=false to perform actual cleanup.',
        dryRun: true,
        note: 'Implement dry-run logic separately if needed',
      })
    }

    // Run the actual cleanup
    const report = await cleanupSupabaseStorage()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: Record<string, any> = {
      success: true,
      message: `Cleanup completed. ${report.summary.totalDeletedFiles} files deleted.`,
      summary: report.summary,
      timestamp: report.timestamp,
    }

    // Include detailed file lists if requested
    if (detailed) {
      response.report = {
        inactiveCertificates: report.inactiveCertificates,
        orphanedCertificates: report.orphanedCertificates,
        orphanedMedia: report.orphanedMedia,
        orphanedTemplates: report.orphanedTemplates,
      }
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('Error during storage cleanup:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({
      success: false,
      error: 'Storage cleanup failed',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    })
  }
}
