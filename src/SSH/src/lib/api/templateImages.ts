import { supabaseAdmin } from '../supabase'

// Import the type directly from the component
interface DynamicField {
  id: string
  name: string
  label: string
  type: 'text' | 'date' | 'number' | 'select' | 'image'
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontColor: string
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  isBold: boolean
  isItalic: boolean
  isRequired: boolean
  options?: string[]
}

/**
 * Upload template image to Supabase storage
 * Returns a public URL to access the image
 */
export async function uploadTemplateImage(templateId: string, file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${templateId}-${Date.now()}.${fileExt}`
    const filePath = `certificate-templates/${fileName}`

    console.log('Uploading template image:', { filePath, fileName, fileSize: file.size })

    const { data, error } = await supabaseAdmin.storage
      .from('certificate-templates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('File uploaded successfully:', { path: data.path })

    // Get public URL
    // Supabase storage buckets can have public read access enabled
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('certificate-templates')
      .getPublicUrl(data.path)

    console.log('Public URL generated successfully:', {
      urlLength: publicUrlData.publicUrl.length,
      url: publicUrlData.publicUrl,
    })

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading template image:', error)
    throw error
  }
}

/**
 * Delete template image from storage
 */
export async function deleteTemplateImage(imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(pathParts.indexOf('certificate-templates')).join('/')

    const { error } = await supabaseAdmin.storage.from('certificate-templates').remove([filePath])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting template image:', error)
    // Don't throw, as this is non-critical
  }
}

/**
 * Update certificate template with dynamic fields
 */
export async function updateTemplateWithFields(
  templateId: string,
  templateImage: string,
  dynamicFields: DynamicField[],
  customData?: Record<string, unknown>,
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificate_templates')
      .update({
        template_data: {
          template_image: templateImage,
          dynamic_fields: dynamicFields,
          ...customData,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      throw new Error(`Update failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error updating template:', error)
    throw error
  }
}

/**
 * Get template image URL and fields
 */
export async function getTemplateImageAndFields(templateId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificate_templates')
      .select('template_data')
      .eq('id', templateId)
      .single()

    if (error) {
      throw new Error(`Fetch failed: ${error.message}`)
    }

    const templateData = data?.template_data || {}

    return {
      imageUrl: templateData.template_image || null,
      fields: templateData.dynamic_fields || [],
      customData: {
        ...templateData,
        template_image: undefined,
        dynamic_fields: undefined,
      },
    }
  } catch (error) {
    console.error('Error fetching template image and fields:', error)
    throw error
  }
}
