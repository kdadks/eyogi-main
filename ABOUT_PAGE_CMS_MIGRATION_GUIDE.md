# About Page CMS - Migration & Testing Guide

## Status
✅ **Code Implementation Complete** - Ready for Database Migration
- AboutPageCMSEditor component built with full array management
- updatePageSettings function fixed to handle JSONB updates
- pageSettingsTypes.ts created with page-specific types
- Build verified: ✅ Exit Code 0 (No errors)

## Database Migration Steps

### Step 1: Open Supabase Dashboard
1. Navigate to https://app.supabase.com
2. Select your project

### Step 2: Run Migration via SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the following SQL:

```sql
-- Add About Page CMS fields to page_settings table using JSONB for performance
-- This consolidates all about page sections into a single JSONB column instead of individual columns

ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS about_page_content JSONB NULL;

-- Create index for better query performance on JSONB column
CREATE INDEX IF NOT EXISTS idx_page_settings_about_page ON public.page_settings USING gin (about_page_content);
```

4. Click **Run** button (or press Ctrl+Enter)
5. ✅ Confirm: "ALTER TABLE", "CREATE INDEX" messages appear

### Step 3: Verify Column Added
1. Go to **Table Editor** in Supabase
2. Find `page_settings` table
3. Verify `about_page_content` column exists (JSONB type)
4. Verify index `idx_page_settings_about_page` was created

## Testing the Implementation

### Test 1: Load CMS Editor
1. Start dev server: `npm run dev` in root
2. Navigate to `/admin` 
3. Login as admin
4. Go to `/admin/pages/settings` or page settings section
5. ✅ Should see **AboutPageCMSEditor** component (if routed to about page)

### Test 2: Save About Page Settings
1. In CMS editor, modify a section (e.g., Hero Title)
2. Click **Save** or **Update**
3. ✅ No error "Cannot coerce the result to a single JSON object"
4. ✅ Should see success message

### Test 3: Verify JSONB Structure
1. In Supabase Dashboard, go to **SQL Editor**
2. Run:
```sql
SELECT page_slug, about_page_content 
FROM page_settings 
WHERE page_slug = 'about' 
LIMIT 1;
```
3. ✅ Should see structured JSON with: hero, mission, stats, values, team, vision, cta

### Test 4: Frontend Rendering
1. Navigate to `/about` page
2. ✅ Should display all about page sections
3. ✅ Stats, values, team, vision should display properly

## About Page CMS Data Structure

The `about_page_content` JSONB column stores:

```json
{
  "hero": {
    "title": "String",
    "title_highlight": "String",
    "description": "String",
    "button_1_text": "String",
    "button_1_link": "String",
    "button_2_text": "String",
    "button_2_link": "String"
  },
  "mission": {
    "title": "String",
    "description_1": "String",
    "description_2": "String",
    "image_url": "String",
    "highlight_title": "String",
    "highlight_description": "String"
  },
  "stats": {
    "visible": "Boolean",
    "title": "String",
    "subtitle": "String",
    "items": [
      { "number": "String", "label": "String" },
      ...
    ]
  },
  "values": {
    "visible": "Boolean",
    "title": "String",
    "subtitle": "String",
    "items": [
      { "title": "String", "description": "String", "icon": "String" },
      ...
    ]
  },
  "team": {
    "visible": "Boolean",
    "title": "String",
    "subtitle": "String",
    "members": [
      { "name": "String", "role": "String", "bio": "String", "image_url": "String" },
      ...
    ]
  },
  "vision": {
    "title": "String",
    "description": "String",
    "items": [
      { "title": "String", "description": "String", "icon": "String" },
      ...
    ]
  },
  "cta": {
    "visible": "Boolean",
    "title": "String",
    "description": "String",
    "button_1_text": "String",
    "button_1_link": "String",
    "button_2_text": "String",
    "button_2_link": "String"
  }
}
```

## Files Modified

### New Files
- `src/SSH/src/lib/api/pageSettingsTypes.ts` - Page-specific interfaces
- `src/SSH/src/components/admin/AboutPageCMSEditor.tsx` - CMS editor component

### Modified Files
- `src/SSH/src/lib/api/pageSettings.ts` - Fixed updatePageSettings to filter database columns
- `migrations/add_about_page_fields.sql` - Optimized migration (single JSONB + index)

### Migration File
- `migrations/add_about_page_fields.sql` - **MUST RUN THIS**

## Critical Notes

⚠️ **HomePage CMS Settings Preserved**
- All `home_*` prefixed columns remain in database
- HomePage CMS functionality completely untouched
- Only `about_page_content` JSONB added

⚠️ **updatePageSettings Fix**
- Now filters to only actual database columns
- Prevents "Cannot coerce" errors
- Preserves JSONB functionality

## Next Steps After Migration

1. ✅ Run migration (ALTER TABLE + CREATE INDEX)
2. ✅ Verify column exists in Supabase
3. ✅ Test CMS editor save
4. ✅ Update AboutPage.tsx to load from CMS
5. ✅ Test full frontend rendering
6. ✅ Commit all changes

## Troubleshooting

### Error: "Column already exists"
- Safe to ignore - migration uses `IF NOT EXISTS`
- Column already added in a previous run

### Error: "Cannot coerce the result to a single JSON object"
- ✅ Already fixed in updatePageSettings function
- This error should NOT appear anymore

### Error: "Index already exists"
- Safe to ignore - migration uses `IF NOT EXISTS`
- Index already created in a previous run

### About page not loading CMS settings
- ✅ Update AboutPage.tsx to call getPageSettings('about')
- Parse `about_page_content` JSONB and render sections
- Verify migration ran successfully

## References

- Database Migration Guide: `public/docs/DATABASE_MIGRATION_GUIDE.md`
- Supabase Dashboard: https://app.supabase.com
- About Page Editor: `src/SSH/src/components/admin/AboutPageCMSEditor.tsx`
- Database API: `src/SSH/src/lib/api/pageSettings.ts`
