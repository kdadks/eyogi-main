# Adding Missing Database Columns

## Overview
The homepage dynamization requires several new columns in the `page_settings` table to store content managed through the CMS admin interface. A migration file has been created with all necessary ALTER TABLE statements.

## Migration File
- Location: `migrations/add_homepage_dynamic_fields.sql`
- This file adds all missing columns needed for the dynamic homepage

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended for quick testing)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire content of `migrations/add_homepage_dynamic_fields.sql`
6. Paste it into the SQL editor
7. Click **Run** button (or press `Ctrl+Enter`)
8. Wait for confirmation that all columns were added successfully

### Option 2: Using Supabase CLI (For production)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to your Supabase account
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

### Option 3: Manual SQL (If using different database tools)

1. Connect to your PostgreSQL database
2. Run the SQL file directly:
   ```bash
   psql -U your_user -d your_database -f migrations/add_homepage_dynamic_fields.sql
   ```

## Columns Being Added

### Hero Section
- `home_hero_badge_text` - Badge text (e.g., "🕉️ SSH University...")
- `home_hero_badge_icon` - Optional badge icon
- `home_hero_title` - Main hero title
- `home_hero_title_highlight` - Highlighted portion of title
- `home_hero_description` - Hero description text
- `home_hero_image_url` - Hero section image URL
- `home_hero_image_caption` - Caption for the hero image
- `home_hero_background_type` - 'gradient' or 'image'
- `home_hero_background_color` - Hex color for gradient
- `home_hero_background_image_url` - Background image URL

### Features Section
- `home_features_title` - Section title (e.g., "Why Choose SSH University...")
- `home_features_subtitle` - Section subtitle
- *Note: `home_features_box_1_4_*` columns already exist from previous migration*

### Testimonials Section
- `home_testimonials` - JSONB array of testimonial objects with name, role, content, rating

### CTA Section
- `home_cta_title` - CTA section title
- `home_cta_description` - CTA description text
- `home_cta_background_type` - 'gradient' or 'image'
- `home_cta_background_color` - Hex color for gradient
- `home_cta_background_image_url` - Background image URL
- `home_cta_button_1_text` - First button text
- `home_cta_button_1_link` - First button link
- `home_cta_button_1_variant` - Button style variant
- `home_cta_button_2_text` - Second button text
- `home_cta_button_2_link` - Second button link
- `home_cta_button_2_variant` - Button style variant

## Testing After Migration

1. Go to the admin dashboard: `/admin/cms`
2. Click on the **CMS** sidebar tab
3. Fill in the Hero section fields
4. Click **Save** button
5. Verify that data is saved without errors
6. Refresh the homepage at `/` to see dynamic content

## Rollback (If needed)

To remove these columns (not recommended unless there's an issue):

```sql
-- Remove columns if migration fails
ALTER TABLE page_settings DROP COLUMN IF EXISTS home_hero_badge_text;
ALTER TABLE page_settings DROP COLUMN IF EXISTS home_hero_badge_icon;
-- ... etc for all other columns
```

## Troubleshooting

### Error: "Column already exists"
- This is expected! The `IF NOT EXISTS` clause prevents errors if columns are already present.

### Error: "Column does not exist" when saving in CMS
- The migration hasn't been run yet. Run the SQL migration file first.

### Performance Issues
- All columns are added with efficient data types (VARCHAR for strings, TEXT for longer content, JSONB for complex data)
- Consider adding indexes if needed: `CREATE INDEX idx_page_settings_slug ON page_settings(page_slug);`

## Next Steps

1. ✅ Run the migration file
2. ✅ Verify columns exist in Supabase: SQL Editor → Run `SELECT column_name FROM information_schema.columns WHERE table_name = 'page_settings' ORDER BY column_name;`
3. ✅ Go to `/admin/cms` and add content
4. ✅ Refresh homepage at `/` to see dynamic content
