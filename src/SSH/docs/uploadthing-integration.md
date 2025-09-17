# UploadThing Integration for eYogi Gurukul

## Installation

```bash
npm install uploadthing @uploadthing/react
```

## Environment Variables (.env.local)

```env
# UploadThing Configuration
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site Configuration
VITE_SITE_URL=http://localhost:5173
```

## File Type Configuration

### Supported File Types:
- **Images**: JPEG, PNG, WebP, GIF (max 4MB)
- **Videos**: MP4, MOV, AVI (max 100MB)
- **Documents**: PDF, DOC, DOCX, PPT, PPTX (max 10MB)
- **Audio**: MP3, WAV, AAC (max 25MB)

### Use Cases:
1. **Profile Avatars**: Student and teacher profile pictures
2. **Course Media**: Course cover images, preview videos
3. **Content Assets**: Lesson materials, presentations, handouts
4. **Certificates**: Generated certificate PDFs
5. **Gurukul Branding**: Logo, hero images, banners
6. **Assignment Submissions**: Student work uploads