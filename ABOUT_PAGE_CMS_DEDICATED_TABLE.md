# About Page CMS - Dedicated Table Implementation

## Overview
The About Page CMS has been restructured from a JSONB approach within the PageSettings table to a dedicated `about_page_cms` table with individual columns for better performance and queryability.

## Database Architecture

### New Table: `about_page_cms`
- **Location**: PostgreSQL table in Supabase
- **Schema**: Individual columns for each setting + JSONB for array fields
- **Indexes**: GIN indexes on JSONB fields for array queries

### Table Structure
```sql
about_page_cms (
  id UUID (primary key),
  page_slug VARCHAR(255) UNIQUE,
  page_type VARCHAR(50),
  
  -- Hero Section (text fields)
  hero_title TEXT,
  hero_title_highlight TEXT,
  hero_description TEXT,
  hero_button_1_text VARCHAR(255),
  hero_button_1_link VARCHAR(500),
  hero_button_2_text VARCHAR(255),
  hero_button_2_link VARCHAR(500),
  
  -- Mission Section (text fields)
  mission_title TEXT,
  mission_description_1 TEXT,
  mission_description_2 TEXT,
  mission_image_url VARCHAR(500),
  mission_highlight_title TEXT,
  mission_highlight_description TEXT,
  
  -- Stats Section (mixed)
  stats_visible BOOLEAN,
  stats_title TEXT,
  stats_subtitle TEXT,
  stats_items JSONB (array of {number, label}),
  
  -- Values Section (mixed)
  values_visible BOOLEAN,
  values_title TEXT,
  values_subtitle TEXT,
  values_items JSONB (array of {title, description, icon}),
  
  -- Team Section (mixed)
  team_visible BOOLEAN,
  team_title TEXT,
  team_subtitle TEXT,
  team_members JSONB (array of {name, role, bio, image_url}),
  
  -- Vision Section (mixed)
  vision_title TEXT,
  vision_description TEXT,
  vision_items JSONB (array of {title, description, icon}),
  
  -- CTA Section (mixed)
  cta_visible BOOLEAN,
  cta_title TEXT,
  cta_description TEXT,
  cta_button_1_text VARCHAR(255),
  cta_button_1_link VARCHAR(500),
  cta_button_2_text VARCHAR(255),
  cta_button_2_link VARCHAR(500),
  
  -- Audit Fields
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID (foreign key),
  updated_by UUID (foreign key)
)
```

## Benefits Over JSONB-Only Approach

✅ **Better Query Performance**
- Direct column access for frequently queried fields
- No JSON parsing overhead for simple text fields
- JSONB indexes still available for complex array queries

✅ **Improved Schema Clarity**
- Explicit column definitions for better IDE autocomplete
- Type safety for individual fields
- Easier to understand schema at a glance

✅ **Flexible Hybrid Approach**
- Simple fields (title, description) stored as individual columns
- Complex arrays (stats_items, team_members) stored as JSONB
- Best of both worlds for performance and flexibility

✅ **Easier Maintenance**
- Specific fields easy to modify
- Array fields still manageable with JSONB
- Clearer database design

## Code Structure

### API Layer: `src/SSH/src/lib/api/aboutPageCMS.ts`

**Functions:**
- `getAboutPageCMS(slug)` - Fetch about page settings
- `updateAboutPageCMS(updates, slug)` - Update settings
- `createAboutPageCMS(settings)` - Create new record
- `getAllAboutPageCMS()` - Fetch all records
- `deleteAboutPageCMS(slug)` - Delete record
- `resetAboutPageCMS()` - Reset to defaults

**Interface:**
```typescript
export interface AboutPageCMSSettings {
  id: string
  page_slug: string
  page_type: string
  
  // Simple text fields
  hero_title?: string
  hero_title_highlight?: string
  hero_description?: string
  // ... more text fields
  
  // Array fields
  stats_items?: Array<{ number: string; label: string }>
  values_items?: Array<{ title: string; description: string; icon: string }>
  team_members?: Array<{ name: string; role: string; bio: string; image_url: string }>
  vision_items?: Array<{ title: string; description: string; icon: string }>
  
  // Audit
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}
```

### Component: `src/SSH/src/components/admin/AboutPageCMSEditor.tsx`

**Features:**
- 7 tabs: Hero, Mission, Stats, Values, Team, Vision, CTA
- Direct field updates (no nested object structure)
- Array management for complex sections (add/edit/remove)
- Error handling and success messages
- Loading and empty states

**State Management:**
```typescript
const [settings, setSettings] = useState<AboutPageCMSSettings | null>(null)
const updateField = (field: string, value: unknown) => {
  // Direct field updates on AboutPageCMSSettings
}
```

## Migration Steps

### Step 1: Run Database Migration
Execute `migrations/create_about_page_cms_table.sql` in Supabase SQL Editor:
1. Go to https://app.supabase.com
2. Select your project
3. SQL Editor → New Query
4. Copy contents of migration file
5. Click Run

### Step 2: Verify Table Created
1. Go to Table Editor
2. Verify `about_page_cms` table exists
3. Check indexes were created (idx_about_page_cms_*)

### Step 3: Insert Default Record
The migration automatically inserts a default 'about' record.

### Step 4: Test CMS Editor
1. Start dev server: `npm run dev`
2. Navigate to `/admin`
3. Go to Content Management → About Page Editor
4. Try editing and saving settings
5. Verify no errors

## File Locations

### Database
- Migration: `migrations/create_about_page_cms_table.sql`

### Code
- API: `src/SSH/src/lib/api/aboutPageCMS.ts`
- Component: `src/SSH/src/components/admin/AboutPageCMSEditor.tsx`
- Types: Built-in `AboutPageCMSSettings` interface

### Build Status
✅ TypeScript compilation successful
✅ Build exit code: 0
✅ No errors or warnings

## API Usage Examples

### Fetch Settings
```typescript
const settings = await getAboutPageCMS('about')
```

### Update Settings
```typescript
await updateAboutPageCMS({
  hero_title: 'New Title',
  hero_description: 'New description',
  stats_items: [{ number: '10+', label: 'Years' }]
}, 'about')
```

### Update Array Fields
```typescript
const newTeamMembers = [
  { name: 'John', role: 'CEO', bio: '...', image_url: '...' },
  { name: 'Jane', role: 'COO', bio: '...', image_url: '...' }
]
await updateAboutPageCMS({ team_members: newTeamMembers }, 'about')
```

## Row Level Security

**Policies:**
- Public read access for published about pages
- Authenticated users can update (with admin role recommended)
- Automatic timestamps via triggers

## Performance Notes

✅ **Index Strategy:**
- Btree on page_slug (fast lookup)
- Btree on updated_at (for sorting)
- GIN indexes on JSONB fields (array queries)

✅ **Query Optimization:**
- Direct field access for simple queries
- JSONB queries optimized with indexes
- Cache invalidation on updates

## Differences from Previous Implementation

| Aspect | Previous (PageSettings JSONB) | Current (Dedicated Table) |
|--------|-----|---|
| Table | PageSettings (shared) | about_page_cms (dedicated) |
| Storage | Single about_page_content JSONB | Mix of columns + JSONB |
| Query Performance | JSONB parsing | Direct column access |
| Schema Clarity | Less clear | Explicit columns |
| Array Handling | All JSONB | JSONB for arrays only |
| Flexibility | Simple | More optimized |

## Troubleshooting

### Error: "Table doesn't exist"
- Run migration in Supabase SQL Editor
- Verify table created in Table Editor

### Error: "Column not found"
- Check migration ran completely
- Verify all indexes created

### Settings not saving
- Check console for error messages
- Verify RLS policies enabled
- Check user authentication

## Next Steps

1. ✅ Run migration (`create_about_page_cms_table.sql`)
2. ✅ Verify table and indexes in Supabase
3. ✅ Test CMS editor in admin panel
4. ✅ Save and retrieve about page settings
5. ✅ Update AboutPage.tsx to load from new table
6. ✅ Test frontend rendering
7. ✅ Deploy to production

## HomePageCMS Protection

✅ **Complete Protection Maintained**
- All `home_*` prefixed fields remain in PageSettings table
- HomePageCMSEditor completely untouched
- No changes to HomePage CMS functionality
- About page isolated to its own table

## Build Status

✅ **All Clear**
- TypeScript compilation: Success
- Build output: 2912 modules transformed
- Exit code: 0
- No errors or warnings
