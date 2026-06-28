import { Input } from '@/components/admin/forms/Input'
import { Textarea } from '@/components/admin/forms/Textarea'
import { MediaPicker } from './MediaPicker'
import { Search, Globe, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'

interface SEOEditorProps {
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImageId?: string
  canonicalUrl?: string
  onChange: (data: {
    seo_title?: string
    seo_description?: string
    seo_keywords?: string[]
    og_title?: string
    og_description?: string
    og_image_id?: string
    canonical_url?: string
  }) => void
}

export function SEOEditor({
  seoTitle,
  seoDescription,
  seoKeywords,
  ogTitle,
  ogDescription,
  ogImageId,
  canonicalUrl,
  onChange,
}: SEOEditorProps) {
  const handleKeywordsChange = (value: string) => {
    // Split by comma and trim
    const keywords = value.split(',').map((k) => k.trim()).filter(Boolean)
    onChange({ seo_keywords: keywords })
  }

  return (
    <div className="space-y-6">
      {/* Basic SEO */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-md font-semibold text-stone-900">
          <Search className="w-5 h-5" />
          Search Engine Optimization
        </h3>

        <Input
          label="SEO Title"
          value={seoTitle || ''}
          onChange={(e) => onChange({ seo_title: e.target.value })}
          placeholder="Optimized title for search engines (50-60 characters)"
          helperText={`${seoTitle?.length || 0}/60 characters`}
          maxLength={60}
        />

        <Textarea
          label="SEO Description"
          value={seoDescription || ''}
          onChange={(e) => onChange({ seo_description: e.target.value })}
          placeholder="Brief description for search results (150-160 characters)"
          rows={3}
          helperText={`${seoDescription?.length || 0}/160 characters`}
          maxLength={160}
        />

        <Input
          label="Keywords"
          value={seoKeywords?.join(', ') || ''}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          placeholder="keyword1, keyword2, keyword3"
          helperText="Comma-separated list of keywords"
        />

        <Input
          label="Canonical URL"
          value={canonicalUrl || ''}
          onChange={(e) => onChange({ canonical_url: e.target.value })}
          placeholder="https://example.com/page"
          helperText="Preferred URL for this content (helps prevent duplicate content issues)"
          leftIcon={<LinkIcon className="w-4 h-4" />}
        />
      </div>

      {/* Open Graph (Social Media) */}
      <div className="space-y-4 pt-6 border-t border-stone-200">
        <h3 className="flex items-center gap-2 text-md font-semibold text-stone-900">
          <Globe className="w-5 h-5" />
          Social Media (Open Graph)
        </h3>

        <Input
          label="OG Title"
          value={ogTitle || ''}
          onChange={(e) => onChange({ og_title: e.target.value })}
          placeholder="Title when shared on social media"
          helperText="Leave blank to use SEO title"
        />

        <Textarea
          label="OG Description"
          value={ogDescription || ''}
          onChange={(e) => onChange({ og_description: e.target.value })}
          placeholder="Description when shared on social media"
          rows={3}
          helperText="Leave blank to use SEO description"
        />

        <div>
          <label className="flex items-center gap-2 block text-sm font-medium text-stone-700 mb-2">
            <ImageIcon className="w-4 h-4" />
            OG Image
          </label>
          <MediaPicker
            value={ogImageId}
            onChange={(mediaId) => onChange({ og_image_id: mediaId })}
            fileTypes={['image/*']}
          />
          <p className="text-xs text-stone-500 mt-2">
            Image displayed when shared on social media (recommended: 1200x630px)
          </p>
        </div>
      </div>

      {/* SEO Preview */}
      <div className="space-y-4 pt-6 border-t border-stone-200">
        <h3 className="text-md font-semibold text-stone-900">Search Result Preview</h3>
        <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
          <div className="text-sm text-blue-700 mb-1">
            {seoTitle || 'Page Title - Add SEO Title'}
          </div>
          <div className="text-xs text-green-700 mb-2">
            {canonicalUrl || 'https://example.com/page'}
          </div>
          <div className="text-sm text-stone-600">
            {seoDescription || 'Add a meta description to improve your search engine rankings'}
          </div>
        </div>
      </div>
    </div>
  )
}
