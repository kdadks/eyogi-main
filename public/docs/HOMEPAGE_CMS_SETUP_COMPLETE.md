# HomePage CMS Implementation - Complete Setup Guide

## ✅ What's Been Created

### 1. Database Migration
**File:** `src/SSH/migrations/enhance_page_settings_for_home.sql`

Adds 50+ new columns to `page_settings` table:
- **Hero Section**: Badge, title, description, background (color/image), buttons, styling
- **Features Section**: Title, subtitle, background, feature items (JSON)
- **Gurukuls Section**: Title, subtitle, background, display type, selected IDs, layout settings
- **Testimonials Section**: Title, subtitle, background, testimonials (JSON)
- **CTA Section**: Title, description, background (color/image), buttons

**Key Features:**
- Background type selector (gradient vs image)
- Text color and font size customization
- Display type selector for Gurukuls (all/selected/count)
- JSON columns for dynamic items (features, testimonials)
- Default values initialized for home page

### 2. API Layer Enhancement
**File:** `src/SSH/src/lib/api/pageSettings.ts`

Added to `PageSettings` interface:
- 60+ new optional properties for HomePage customization
- Full type safety for all CMS fields

New utility functions:
- `getHomePageGurukuls(settings)` - Fetch gurukuls respecting display settings
- `toggleGurukulInHome(gurukulId, add)` - Add/remove gurukul from home display
- `updateHomeFeatures(features)` - Update feature cards
- `updateHomeTestimonials(testimonials)` - Update testimonials
- `updateHomeHeroStats(stats)` - Update hero stats
- `getFormattedHomePageSettings(slug)` - Get full settings with resolved dynamic data

### 3. Admin Editor Component
**File:** `src/SSH/src/components/admin/HomePageCMSEditor.tsx`

Complete HomePage CMS editor (1000+ lines) with:

**6 Tabs:**
1. **Hero Section** - Badge, title, styling, buttons, background
2. **Features** - Section settings, feature items (JSON editor)
3. **Academic Centers** - Display mode, selection, layout, buttons
4. **Testimonials** - Section settings, testimonials list (JSON editor)
5. **CTA Section** - Title, description, styling, buttons
6. **SEO** - Meta title, description, keywords

**Features:**
- Live form editing for each section
- Color pickers for background and text colors
- Toggle switches for visibility and feature flags
- JSON editor for complex arrays (features, testimonials)
- Preview mode toggle
- Auto-save with success/error messages
- Responsive grid layouts

### 4. Documentation
**File:** `public/docs/HOMEPAGE_CMS_DYNAMIC_SECTIONS.md`

Comprehensive guide covering:
- Display modes for dynamic sections (all/selected/count)
- API functions and usage examples
- JSON format for dynamic content
- Admin panel usage instructions
- Troubleshooting tips
- Icon names and customization options

## 🚀 Next Steps to Enable

### Step 1: Run Database Migration
```bash
# Connect to Supabase SQL editor and execute:
-- Copy contents from: src/SSH/migrations/enhance_page_settings_for_home.sql
```

**What it does:**
- Adds 50+ new columns to `page_settings` table
- Sets default values for home page
- Inserts home page settings if they don't exist
- Preserves existing gurukuls page settings

### Step 2: Update HomePage Component
**File:** `src/SSH/src/pages/HomePage.tsx`

Replace hardcoded values with CMS data. Example pattern:

```typescript
import { getFormattedHomePageSettings } from '@/lib/api/pageSettings'

const HomePage: React.FC = () => {
  const [settings, setSettings] = useState<PageSettings | null>(null)

  useEffect(() => {
    getFormattedHomePageSettings('home').then(setSettings)
  }, [])

  // Hero Section
  return (
    <div style={{ 
      backgroundColor: settings?.home_hero_background_color || '#fef3f2' 
    }}>
      <h1 style={{ 
        color: settings?.home_hero_title_color,
        fontSize: `${settings?.home_hero_title_font_size}px`
      }}>
        {settings?.home_hero_title || 'Default Title'}
      </h1>
      {/* ... more sections */}
    </div>
  )
}
```

**Current Status:** ⏳ NOT YET IMPLEMENTED - HomePage still uses hardcoded values

### Step 3: Add to Admin Dashboard
**File:** `src/SSH/src/components/admin/ContentManagement.tsx`

Add HomePageCMSEditor import and tab:

```typescript
import HomePageCMSEditor from './HomePageCMSEditor'

// Inside ContentManagement component tabs:
<button onClick={() => setActiveEditor('home-cms')}>HomePage</button>
{activeEditor === 'home-cms' && <HomePageCMSEditor />}
```

**Current Status:** ⏳ NOT YET INTEGRATED - Component created but not wired to admin panel

## 📊 CMS Field Reference

### Hero Section Fields
| Field | Type | Purpose |
|-------|------|---------|
| `home_hero_badge_text` | string | Small badge above title |
| `home_hero_badge_icon` | string | Badge emoji/icon |
| `home_hero_title` | string | Main heading |
| `home_hero_title_highlight` | string | Word to highlight in title |
| `home_hero_description` | string | Paragraph under title |
| `home_hero_background_color` | color | Fallback/solid background |
| `home_hero_background_image_url` | URL | Background image (if type='image') |
| `home_hero_background_type` | enum | 'gradient' or 'image' |
| `home_hero_button_1_text` | string | Primary button text |
| `home_hero_button_1_link` | string | Primary button destination |
| `home_hero_button_2_text` | string | Secondary button text |
| `home_hero_button_2_link` | string | Secondary button destination |
| `home_hero_title_font_size` | number | Heading size in pixels |
| `home_hero_title_color` | color | Heading text color |
| `home_hero_description_font_size` | number | Description size in pixels |
| `home_hero_description_color` | color | Description text color |

### Features Section Fields
| Field | Type | Purpose |
|-------|------|---------|
| `home_features_visible` | boolean | Show/hide entire section |
| `home_features_title` | string | Section heading |
| `home_features_subtitle` | string | Section description |
| `home_features_background_color` | color | Section background |
| `home_features` | JSON | Array of feature objects |

Feature object format:
```json
{
  "icon": "AcademicCapIcon",
  "title": "Feature Title",
  "description": "Feature description text",
  "color": "#f97316"
}
```

### Academic Centers (Gurukuls) Section Fields
| Field | Type | Purpose |
|-------|------|---------|
| `home_gurukuls_visible` | boolean | Show/hide section |
| `home_gurukuls_title` | string | Section heading |
| `home_gurukuls_subtitle` | string | Section description |
| `home_gurukuls_background_color` | color | Section background |
| `home_gurukuls_display_type` | enum | 'all', 'selected', or 'count' |
| `home_gurukuls_selected_ids` | JSON array | IDs when type='selected' |
| `home_gurukuls_limit` | number | Max items to show (1-20) |
| `home_gurukuls_columns_desktop` | number | Grid columns on desktop (1-4) |
| `home_gurukuls_columns_tablet` | number | Grid columns on tablet (1-3) |
| `home_gurukuls_columns_mobile` | number | Grid columns on mobile (1-2) |
| `home_gurukuls_show_stats` | boolean | Show program & learner counts |
| `home_gurukuls_button_text` | string | "Explore" button text |
| `home_gurukuls_button_link` | string | Button destination |

### Testimonials Section Fields
| Field | Type | Purpose |
|-------|------|---------|
| `home_testimonials_visible` | boolean | Show/hide section |
| `home_testimonials_title` | string | Section heading |
| `home_testimonials_subtitle` | string | Section description |
| `home_testimonials_background_color` | color | Section background |
| `home_testimonials` | JSON | Array of testimonial objects |
| `home_testimonials_columns_desktop` | number | Grid columns on desktop (2-4) |
| `home_testimonials_columns_tablet` | number | Grid columns on tablet (1-3) |

Testimonial object format:
```json
{
  "name": "Learner Name",
  "role": "Title/Role",
  "content": "Quote text...",
  "rating": 5,
  "image": "https://example.com/photo.jpg"
}
```

### CTA Section Fields
| Field | Type | Purpose |
|-------|------|---------|
| `home_cta_visible` | boolean | Show/hide section |
| `home_cta_title` | string | Main heading |
| `home_cta_description` | string | Description text |
| `home_cta_background_color` | color | Background color |
| `home_cta_background_image_url` | URL | Background image (if type='image') |
| `home_cta_background_type` | enum | 'gradient' or 'image' |
| `home_cta_button_1_text` | string | First button text |
| `home_cta_button_1_link` | string | First button link |
| `home_cta_button_1_variant` | enum | 'primary', 'secondary', 'outline' |
| `home_cta_button_2_text` | string | Second button text |
| `home_cta_button_2_link` | string | Second button link |
| `home_cta_button_2_variant` | enum | 'primary', 'secondary', 'outline' |

## 🔧 Usage Examples

### Example 1: Show Only Featured Gurukuls
```typescript
const settings = await updatePageSettings('home', {
  home_gurukuls_display_type: 'selected',
  home_gurukuls_selected_ids: ['yoga-center', 'vedic-studies', 'sanskrit'],
  home_gurukuls_limit: 6
}, userId)
```

### Example 2: Add Custom Feature
```typescript
const features = [
  {
    icon: 'AcademicCapIcon',
    title: 'Expert Faculty',
    description: 'Learn from experienced teachers...',
    color: '#f97316'
  }
]

await updateHomeFeatures(features, 'home', userId)
```

### Example 3: Update Hero Section
```typescript
const settings = await updatePageSettings('home', {
  home_hero_title: 'New Title',
  home_hero_title_font_size: 56,
  home_hero_title_color: '#003366',
  home_hero_background_type: 'image',
  home_hero_background_image_url: 'https://example.com/hero.jpg'
}, userId)
```

### Example 4: Manage Testimonials
```typescript
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'MBA Student',
    content: 'This program transformed my perspective on learning.',
    rating: 5,
    image: 'https://example.com/sarah.jpg'
  },
  {
    name: 'Raj Patel',
    role: 'Engineer',
    content: 'Loved the integration of ancient and modern knowledge.',
    rating: 5
  }
]

await updateHomeTestimonials(testimonials, 'home', userId)
```

## 📋 Implementation Checklist

- [ ] Run database migration to add HomePage columns
- [ ] Update HomePage.tsx to fetch and use CMS data
- [ ] Integrate HomePageCMSEditor into admin dashboard
- [ ] Test each section independently in admin panel
- [ ] Test Gurukuls display modes (all/selected/count)
- [ ] Verify background image display (hero & CTA)
- [ ] Test color picker changes apply correctly
- [ ] Verify dynamic Gurukuls load with proper layout
- [ ] Test testimonials display
- [ ] Test responsive grid layouts
- [ ] Verify cache invalidation on save
- [ ] Check audit trail tracking
- [ ] Push changes to production
- [ ] Create admin user guide documentation

## 🎯 Key Capabilities

✅ **Full Content Management** - Manage all HomePage sections without code changes

✅ **Dynamic Sections** - Select specific Gurukuls, Features, and Testimonials to display

✅ **Visual Customization** - Colors, fonts, background images, layouts all configurable

✅ **Background Flexibility** - Choose between solid colors and full image backgrounds

✅ **Responsive Design** - Customize grid columns per device (desktop/tablet/mobile)

✅ **Section Visibility** - Toggle any section on/off independently

✅ **Audit Trail** - All changes tracked with user ID and timestamp

✅ **Cache Optimization** - 24-hour cache with automatic invalidation

✅ **Admin Interface** - Intuitive 6-tab editor with preview mode

## 📝 Notes

- All changes are **reversible** via audit trail
- Cache auto-clears when saving - changes visible immediately
- Admin users only (RLS policies enforced)
- Dynamic content fetched fresh on each request
- JSON editors for complex fields (features, testimonials)
- All color inputs use native color picker

## 🆘 Troubleshooting

**Settings not loading?**
- Verify page_slug = 'home' in database
- Check RLS policies allow admin read access
- Clear browser cache

**Changes not visible?**
- Refresh page after save
- Check success message appeared
- Verify admin user permissions

**Gurukuls not showing?**
- Check `home_gurukuls_visible` = true
- For 'selected' mode, verify IDs exist
- Check gurukuls table has data

**Images not loading?**
- Verify image URL is HTTPS
- Test URL in browser directly
- Check file format (JPG, PNG, WebP)

---

**Created:** November 15, 2025
**Status:** ✅ Database Schema & API Complete | ⏳ Frontend Integration Pending
**Next:** Integrate HomePage.tsx with CMS data
