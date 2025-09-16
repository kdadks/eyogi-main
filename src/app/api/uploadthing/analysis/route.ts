import { NextRequest, NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Starting UploadThing analysis...')
    
    // Get all files from UploadThing
    const uploadthingFiles = await utapi.listFiles()
    
    console.log(`📊 Found ${uploadthingFiles.length} files in UploadThing`)

    // Analyze each file
    const analysis = uploadthingFiles.map((file, index) => ({
      id: file.id,
      key: file.key,
      name: file.name,
      url: `https://9fj0u1y9ex.ufs.sh/f/${file.key}`,
      size: file.size,
      uploadedAt: file.uploadedAt,
      type: file.type || 'unknown',
      customId: file.customId || null,
      index: index + 1
    }))

    // Group by type
    const typeGroups = analysis.reduce((acc, file) => {
      const type = file.type || 'unknown'
      if (!acc[type]) acc[type] = []
      acc[type].push(file)
      return acc
    }, {} as Record<string, typeof analysis>)

    // Create summary statistics
    const summary = {
      totalFiles: uploadthingFiles.length,
      totalSize: uploadthingFiles.reduce((sum, file) => sum + file.size, 0),
      fileTypes: Object.keys(typeGroups).map(type => ({
        type,
        count: typeGroups[type].length,
        totalSize: typeGroups[type].reduce((sum, file) => sum + file.size, 0)
      })),
      urlPattern: 'https://9fj0u1y9ex.ufs.sh/f/{fileKey}',
      oldestFile: analysis.length > 0 ? analysis.reduce((oldest, file) => 
        new Date(file.uploadedAt) < new Date(oldest.uploadedAt) ? file : oldest
      ) : null,
      newestFile: analysis.length > 0 ? analysis.reduce((newest, file) => 
        new Date(file.uploadedAt) > new Date(newest.uploadedAt) ? file : newest
      ) : null
    }

    const response = {
      success: true,
      message: `UploadThing analysis complete: ${uploadthingFiles.length} files found`,
      summary,
      files: analysis,
      typeGroups,
      note: 'This shows all files currently stored in UploadThing CDN'
    }

    console.log('✅ UploadThing analysis completed')
    console.log('📊 Summary:', JSON.stringify(summary, null, 2))

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ UploadThing analysis error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'UploadThing analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { compareWithDatabase = false } = body

    console.log('🔍 Starting detailed UploadThing comparison...')
    
    // Get UploadThing files
    const uploadthingFiles = await utapi.listFiles()
    
    let comparison = null
    
    if (compareWithDatabase) {
      // Import PayloadCMS to compare with database
      const configPromise = (await import('@payload-config')).default
      const { getPayload } = await import('payload')
      
      const config = await configPromise
      const payload = await getPayload({ config })

      // Get all media from database
      const allMedia = await payload.find({
        collection: 'media',
        limit: 1000,
        depth: 0,
      })

      // Separate database vs UploadThing URLs
      const databaseImages = allMedia.docs.filter(media => 
        media.url && media.url.startsWith('/api/media/')
      )
      
      const uploadthingImages = allMedia.docs.filter(media => 
        media.url && media.url.includes('9fj0u1y9ex.ufs.sh')
      )

      comparison = {
        totalInDatabase: allMedia.docs.length,
        databaseStoredImages: databaseImages.length,
        uploadthingStoredImages: uploadthingImages.length,
        uploadthingFilesInCDN: uploadthingFiles.length,
        matchingFiles: 0, // TODO: match by filename or metadata
        discrepancies: {
          inDatabaseNotInCDN: 0,
          inCDNNotInDatabase: 0
        }
      }
    }

    const response = {
      success: true,
      uploadthingFiles: uploadthingFiles.map(file => ({
        id: file.id,
        key: file.key,
        name: file.name,
        url: `https://9fj0u1y9ex.ufs.sh/f/${file.key}`,
        size: file.size,
        uploadedAt: file.uploadedAt,
        type: file.type
      })),
      comparison,
      totalFiles: uploadthingFiles.length
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ UploadThing comparison error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'UploadThing comparison failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}