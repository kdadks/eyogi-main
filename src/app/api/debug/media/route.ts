import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 MEDIA DEBUG - Starting analysis...')
    
    const config = await configPromise
    const payload = await getPayload({ config })

    // Get a sample of media records to analyze
    const mediaRecords = await payload.find({
      collection: 'media',
      limit: 10,
      depth: 0,
    })

    console.log('📊 Media Records Found:', mediaRecords.docs.length)

    const analysis = mediaRecords.docs.map((media) => {
      return {
        id: media.id,
        filename: media.filename,
        url: media.url,
        mimeType: media.mimeType,
        filesize: media.filesize,
        width: media.width,
        height: media.height,
        urlType: media.url ? (
          media.url.startsWith('/api/media/') ? 'PayloadCMS_Database' :
          media.url.startsWith('http') && media.url.includes('uploadthing') ? 'UploadThing_CDN' :
          media.url.startsWith('http') ? 'External_URL' : 'Unknown'
        ) : 'No_URL'
      }
    })

    const urlTypeCounts = {
      payloadCMS: analysis.filter(item => item.urlType === 'PayloadCMS_Database').length,
      uploadThing: analysis.filter(item => item.urlType === 'UploadThing_CDN').length,
      external: analysis.filter(item => item.urlType === 'External_URL').length,
      noUrl: analysis.filter(item => item.urlType === 'No_URL').length,
      unknown: analysis.filter(item => item.urlType === 'Unknown').length
    }

    const response = {
      success: true,
      totalMediaRecords: mediaRecords.docs.length,
      totalPages: mediaRecords.totalPages,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasUploadThingToken: !!process.env.UPLOADTHING_TOKEN,
        uploadThingTokenLength: process.env.UPLOADTHING_TOKEN?.length || 0
      },
      urlTypeBreakdown: urlTypeCounts,
      sampleRecords: analysis,
      analysis: {
        primaryStorage: urlTypeCounts.payloadCMS > urlTypeCounts.uploadThing ? 'Database' : 'UploadThing',
        recommendedAction: urlTypeCounts.payloadCMS > 0 ? 'Migrate old images to UploadThing' : 'Continue with UploadThing'
      }
    }

    console.log('📋 MEDIA ANALYSIS COMPLETE:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Media debug error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}