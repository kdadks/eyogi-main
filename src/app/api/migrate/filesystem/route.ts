import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Starting file-system migration...')

    const config = await configPromise
    const payload = await getPayload({ config })

    // Get all database-stored images
    const databaseImages = await payload.find({
      collection: 'media',
      where: {
        url: {
          like: '/api/media/',
        },
      },
      limit: 3, // Test with just 3 first
      depth: 0,
    })

    console.log(`📊 Found ${databaseImages.docs.length} database images to migrate`)

    let successCount = 0
    let errorCount = 0
    const results: Array<{
      id: number
      filename: string | null | undefined
      status: string
      oldUrl?: string | null | undefined
      newUrl?: string
      error?: string
      method?: string
    }> = []

    for (const media of databaseImages.docs) {
      try {
        console.log(`🔄 Processing: ${media.filename}`)

        // Method 1: Try to use PayloadCMS built-in file access
        try {
          console.log('🔍 Attempting PayloadCMS file access...')

          // Get the file through PayloadCMS's internal file handling
          const fileData = await payload.findByID({
            collection: 'media',
            id: media.id,
            depth: 0,
          })

          console.log('📄 File data structure:', {
            hasUrl: !!fileData.url,
            hasFilename: !!fileData.filename,
            hasMimeType: !!fileData.mimeType,
            additionalFields: Object.keys(fileData),
          })

          // Try to create a direct file path
          if (fileData.filename) {
            // PayloadCMS might store files in uploads directory
            const possiblePaths = [
              `/uploads/${fileData.filename}`,
              `/media/${fileData.filename}`,
              `./uploads/${fileData.filename}`,
              `./media/${fileData.filename}`,
              `./public/uploads/${fileData.filename}`,
              `./public/media/${fileData.filename}`,
            ]

            console.log('🔍 Checking possible file paths:', possiblePaths)

            // Try to read file from filesystem
            const fs = await import('fs/promises')
            const path = await import('path')

            let fileBuffer = null
            let successPath = null

            for (const filePath of possiblePaths) {
              try {
                const fullPath = path.resolve(process.cwd(), filePath)
                console.log(`📁 Checking: ${fullPath}`)
                await fs.access(fullPath)
                fileBuffer = await fs.readFile(fullPath)
                successPath = fullPath
                console.log(`✅ Found file at: ${successPath}`)
                break
              } catch {
                // File not found at this path, try next
              }
            }

            if (fileBuffer) {
              console.log(`📤 Uploading ${fileData.filename} to UploadThing...`)

              const file = new File([fileBuffer], fileData.filename, {
                type: fileData.mimeType || 'application/octet-stream',
              })

              const uploadResult = await utapi.uploadFiles(file)

              if (uploadResult.data) {
                console.log(`✅ Uploaded to UploadThing: ${uploadResult.data.url}`)

                // Update the media record with new URL
                await payload.update({
                  collection: 'media',
                  id: media.id,
                  data: {
                    url: uploadResult.data.url,
                  },
                })

                successCount++
                results.push({
                  id: media.id,
                  filename: media.filename,
                  status: 'success',
                  oldUrl: media.url,
                  newUrl: uploadResult.data.url,
                  method: `filesystem-${successPath}`,
                })
              } else {
                throw new Error('UploadThing upload failed')
              }
            } else {
              throw new Error('File not found in any expected location')
            }
          } else {
            throw new Error('No filename available')
          }
        } catch (error) {
          console.error(`❌ File access failed for ${media.filename}:`, error)
          errorCount++
          results.push({
            id: media.id,
            filename: media.filename,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            method: 'filesystem',
          })
        }
      } catch (error) {
        console.error(`❌ Error migrating ${media.filename}:`, error)
        errorCount++
        results.push({
          id: media.id,
          filename: media.filename,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const response = {
      success: successCount > 0,
      message: `File-system migration: ${successCount} success, ${errorCount} errors`,
      successCount,
      errorCount,
      totalProcessed: databaseImages.docs.length,
      results,
      note: 'Attempted to find files in filesystem directories',
    }

    console.log('📊 Final result:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ File-system migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'File-system migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'File-system migration endpoint',
    usage: 'POST to this endpoint to attempt filesystem file access',
    note: 'This attempts to find files in uploads directories',
  })
}
