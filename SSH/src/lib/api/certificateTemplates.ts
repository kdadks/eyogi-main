import { supabaseAdmin } from '../supabase'
import { CertificateTemplate } from '@/types'
import { deleteFromSupabaseStorage } from '../supabase-storage'
export async function getCertificateTemplates(): Promise<CertificateTemplate[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      // Return default templates if database doesn't exist yet
      return getDefaultTemplates()
    }
    return data || getDefaultTemplates()
  } catch {
    return getDefaultTemplates()
  }
}
export async function createCertificateTemplate(
  template: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'>,
): Promise<CertificateTemplate> {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .insert({
      ...template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) {
    throw new Error(`Failed to create template: ${error.message}`)
  }
  return data
}
export async function updateCertificateTemplate(
  id: string,
  updates: Partial<CertificateTemplate>,
): Promise<CertificateTemplate> {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    throw new Error(`Failed to update template: ${error.message}`)
  }
  return data
}
export async function deleteCertificateTemplate(id: string): Promise<void> {
  try {
    // First, get the template to retrieve all associated file URLs for cleanup
    const { data: template, error: fetchError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching template for deletion:', fetchError)
      throw new Error(`Failed to fetch template: ${fetchError.message}`)
    }

    if (!template) {
      throw new Error('Template not found')
    }

    // Collect all storage file URLs from the template
    const filesToDelete: string[] = []

    // Check template_data for image URLs
    if (template.template_data) {
      const templateData = template.template_data as Record<string, unknown>

      // Extract logo URLs
      if (templateData.logos) {
        const logos = templateData.logos as Record<string, unknown>
        Object.values(logos).forEach((url) => {
          if (typeof url === 'string' && url && url.startsWith('http')) {
            filesToDelete.push(url)
          }
        })
      }

      // Extract signature URLs
      if (templateData.signatures) {
        const signatures = templateData.signatures as Record<string, unknown>
        Object.values(signatures).forEach((url) => {
          if (typeof url === 'string' && url && url.startsWith('http')) {
            filesToDelete.push(url)
          }
        })
      }

      // Extract background images or other resource URLs
      if (templateData.background_image && typeof templateData.background_image === 'string') {
        if (templateData.background_image.startsWith('http')) {
          filesToDelete.push(templateData.background_image)
        }
      }

      // Extract dynamic field images
      if (templateData.dynamic_fields && Array.isArray(templateData.dynamic_fields)) {
        ;(templateData.dynamic_fields as Array<Record<string, unknown>>).forEach((field) => {
          if (field.image_url && typeof field.image_url === 'string') {
            if (field.image_url.startsWith('http')) {
              filesToDelete.push(field.image_url)
            }
          }
        })
      }
    }

    // Delete all associated files from certificate-templates bucket
    if (filesToDelete.length > 0) {
      console.log(`Deleting ${filesToDelete.length} files from certificate-templates bucket`)
      for (const fileUrl of filesToDelete) {
        const deleted = await deleteFromSupabaseStorage(fileUrl)
        if (!deleted) {
          console.warn('Failed to delete file from storage:', fileUrl)
        }
      }
    }

    // Finally, delete the template from database
    const { error } = await supabaseAdmin.from('certificate_templates').delete().eq('id', id)
    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`)
    }

    console.log('Successfully deleted certificate template and associated files')
  } catch (error) {
    console.error('Error deleting certificate template:', error)
    throw error
  }
}
export async function duplicateCertificateTemplate(id: string): Promise<CertificateTemplate> {
  // Get the original template
  const { data: original, error: fetchError } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError || !original) {
    throw new Error('Template not found')
  }
  // Create a duplicate with a new name
  const duplicate = {
    ...original,
    name: `${original.name} (Copy)`,
    created_by: original.created_by,
    id: undefined, // Let the database generate a new ID
    created_at: undefined,
    updated_at: undefined,
  }
  return await createCertificateTemplate(duplicate)
}
// Default templates to use when database is not available
function getDefaultTemplates(): CertificateTemplate[] {
  return [
    {
      id: 'default-student-template',
      name: 'Default Student Certificate',
      type: 'student',
      template_data: {
        design: {
          colors: {
            primary: '#FF6B35',
            secondary: '#2563EB',
            text: '#1F2937',
          },
          layout: {
            orientation: 'landscape',
            size: 'a4',
          },
        },
        logos: {
          eyogi_logo_url: '/eyogiLogo.png',
          ssh_logo_url: '/ssh-app/Images/Logo.png',
        },
        signatures: {
          vice_chancellor_signature_url: '',
          president_signature_url: '',
        },
        placeholders: {
          student_name: true,
          student_id: true,
          course_name: true,
          course_id: true,
          gurukul_name: true,
          completion_date: true,
          certificate_number: true,
          verification_code: true,
        },
        custom_text: {
          title: 'CERTIFICATE OF COMPLETION',
          subtitle: 'This is to certify that',
          header_text: 'eYogi Gurukul',
          footer_text: 'This certificate verifies successful completion of the course.',
        },
      },
      is_active: true,
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'modern-student-template',
      name: 'Modern Student Certificate',
      type: 'student',
      template_data: {
        design: {
          colors: {
            primary: '#10B981',
            secondary: '#3B82F6',
            text: '#111827',
          },
          layout: {
            orientation: 'landscape',
            size: 'a4',
          },
        },
        logos: {
          eyogi_logo_url: '/eyogiLogo.png',
          ssh_logo_url: '/eyogiTextLess.png',
        },
        signatures: {
          vice_chancellor_signature_url: '',
          president_signature_url: '',
        },
        placeholders: {
          student_name: true,
          student_id: true,
          course_name: true,
          course_id: true,
          gurukul_name: true,
          completion_date: true,
          certificate_number: true,
          verification_code: true,
        },
        custom_text: {
          title: 'CERTIFICATE OF ACHIEVEMENT',
          subtitle: 'We hereby certify that',
          header_text: 'eYogi Gurukul - Excellence in Learning',
          footer_text: 'Awarded in recognition of successful course completion.',
        },
      },
      is_active: true,
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}
export async function getActiveCertificateTemplates(
  type?: 'student' | 'teacher',
): Promise<CertificateTemplate[]> {
  const templates = await getCertificateTemplates()
  return templates.filter((template) => {
    const isActive = template.is_active
    const typeMatches = !type || template.type === type
    return isActive && typeMatches
  })
}
