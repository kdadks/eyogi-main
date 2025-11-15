# Page CMS Management System - Setup Guide

## Overview

A comprehensive CMS system for managing page appearance and content without code changes. Admins can manage:

- **Hero Section**: Title, description, colors, background, CTA button
- **Features Section**: Title, subtitle, feature cards (title + description)
- **Call-to-Action Section**: Title, description, button text & links, background color
- **SEO Settings**: Meta title, description, keywords
- **Section Visibility**: Toggle sections on/off
- **Color Customization**: Custom theme colors for hero, features, CTA sections

## Database Setup

### 1. Execute Migration

Run the SQL migration to create the necessary tables:

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of: src/SSH/migrations/create_page_settings_table.sql
# 3. Run the query
```

**Tables Created:**
- `page_settings` - Main configuration table for pages
- `page_settings_audit` - Audit trail for all changes

### 2. Default Data

The migration automatically creates default settings for the `gurukuls` page. Update as needed through the admin panel.

## API Functions

### Location
`src/SSH/src/lib/api/pageSettings.ts`

### Key Functions

```typescript
// Get page settings by slug
getPageSettings(slug: string): Promise<PageSettings | null>

// Update page settings
updatePageSettings(slug: string, updates: Partial<PageSettings>, userId?: string): Promise<PageSettings>

// Create new page settings
createPageSettings(settings: {...}, userId?: string): Promise<PageSettings>

// Get page settings with audit history
getPageSettingsWithAudit(slug: string): Promise<{settings, audit}>

// Duplicate page settings from one slug to another
duplicatePageSettings(sourceSlug: string, targetSlug: string, userId?: string): Promise<PageSettings>

// Reset to defaults
resetPageSettings(slug: string, userId?: string): Promise<PageSettings>
```

## Admin Component

### Location
`src/SSH/src/components/admin/PageCMSEditor.tsx`

### Features
- **Tab-based Interface**: Separate tabs for each section (Hero, Stats, Features, CTA, SEO)
- **Live Preview**: Toggle between edit and preview modes
- **Rich Text Editor**: WYSIWYG editor for descriptions using React Quill
- **Color Picker**: Inline color picker for theme customization
- **Bulk Actions**: Save, Reset, Preview buttons
- **Error Handling**: Toast notifications for success/failure

### Usage

```tsx
import PageCMSEditor from '@/components/admin/PageCMSEditor'

export default function AdminPanel() {
  return (
    <PageCMSEditor 
      pageSlug="gurukuls" 
      onSave={() => console.log('Saved!')}
    />
  )
}
```

## Frontend Integration

### Updated Pages

1. **GurukulPage.tsx** (`src/SSH/src/pages/GurukulPage.tsx`)
   - Fetches CMS settings on mount
   - Uses CMS data for: Hero title, description, colors
   - Features section title, subtitle, and feature cards
   - CTA section title, description, buttons, background color
   - Falls back to hardcoded defaults if CMS data unavailable

### Adding CMS to Other Pages

For any page, add the same pattern:

```tsx
import { getPageSettings, PageSettings } from '../lib/api/pageSettings'

export default function YourPage() {
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)
  
  useEffect(() => {
    getPageSettings('your-page-slug').then(setPageSettings)
  }, [])
  
  return (
    <h1>{pageSettings?.hero_title || 'Default Title'}</h1>
    // ... use pageSettings throughout
  )
}
```

## Admin Dashboard Integration

### To Add CMS Editor to Admin Panel

1. Add import in Admin Dashboard/Layout:

```tsx
import PageCMSEditor from './PageCMSEditor'
```

2. Add route or menu item:

```tsx
{adminUser?.role === 'admin' && (
  <Button onClick={() => setActiveView('page-cms')}>
    Manage Pages
  </Button>
)}

{activeView === 'page-cms' && (
  <PageCMSEditor pageSlug="gurukuls" />
)}
```

## Supported Page Slugs

- `gurukuls` - Gurukuls listing page
- `courses` - Courses listing page  
- `home` - Home page (planned)
- `about` - About page (planned)
- `contact` - Contact page (planned)

## Security

### Row Level Security (RLS)

- ✅ Anyone can VIEW public page settings
- ✅ Only ADMINS can UPDATE/INSERT/DELETE
- ✅ Audit logs only visible to admins

### Access Control

All updates require:
1. Admin role verification
2. User ID tracking (created_by, updated_by)
3. Automatic timestamp tracking

## Audit Trail

Every change is tracked with:
- Changed by (user ID)
- Changed at (timestamp)
- Changed fields (what was modified)
- Old values (before)
- New values (after)

Access via: `getPageSettingsWithAudit(slug)`

## Cache Management

Settings are cached for **1 day** using the app's queryCache system. 

To invalidate cache:
```tsx
// Happens automatically on updatePageSettings()
queryCache.invalidatePattern(`page-settings:${slug}`)
```

To manually purge:
```tsx
queryCache.clear() // Clears all caches
```

## Best Practices

1. **Preview Before Publish**: Always check Preview mode before saving
2. **SEO Optimization**: Keep meta title under 60 chars, description under 160
3. **Color Testing**: Test chosen colors on multiple screens/themes
4. **Rich Text**: Use basic formatting only (bold, italic, lists) for best compatibility
5. **Regular Backups**: Check audit trail regularly to track changes

## Troubleshooting

### Settings not appearing on page
- Check page slug matches exactly (case-sensitive)
- Ensure settings exist in page_settings table
- Clear browser cache
- Check console for errors

### Changes not saving
- Verify admin role assigned to user
- Check RLS policies enabled
- Review database audit table for errors
- Check for network errors in browser dev tools

### Colors not applying
- Verify hex color format (#RRGGBB)
- Check CSS color property support
- Test on different browsers
- Ensure color picker selection saved

## Future Enhancements

- [ ] Drag-and-drop section reordering
- [ ] Section duplication
- [ ] Version history/rollback
- [ ] Media upload integration
- [ ] Template presets
- [ ] Multi-language support
- [ ] Scheduled publishing
- [ ] Change approval workflow

## Files Modified/Created

### New Files
- `src/SSH/migrations/create_page_settings_table.sql` - Database schema
- `src/SSH/src/lib/api/pageSettings.ts` - API functions
- `src/SSH/src/components/admin/PageCMSEditor.tsx` - Admin component

### Modified Files
- `src/SSH/src/pages/GurukulPage.tsx` - Integrated CMS data

## Support & Questions

For issues or questions about the CMS system, check:
1. Browser console for error messages
2. Database audit trail for change history
3. Network tab for API calls
4. RLS policies in Supabase dashboard
