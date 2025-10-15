# Unsplash Scanner Utility

A comprehensive utility to scan your codebase for Unsplash image URLs and help migrate them to your local media management system.

## Features

- 🔍 **Recursive scanning** of directories for Unsplash URLs
- 📄 **Multiple output formats** (Markdown report, CSV, download script)
- 🎯 **Smart filtering** of file types and directories
- 📊 **Detailed reporting** with context and line numbers
- 🚀 **CLI interface** for easy usage
- ⬇️ **Download scripts** to fetch images locally

## Quick Start

### Scan SSH folder (default)
```bash
npm run scan-unsplash
```

### Scan custom directory
```bash
npm run scan-unsplash scan ./src
npm run scan-unsplash scan ./public
```

### Get help
```bash
npm run scan-unsplash help
```

## Example Usage

```typescript
import { UnsplashScanner, scanSSHFolder } from './lib/unsplash-scanner'

// Simple usage - scan SSH folder
const result = await scanSSHFolder()
console.log(`Found ${result.matches.length} Unsplash URLs`)

// Advanced usage - custom scanner
const scanner = new UnsplashScanner()
const customResult = await scanner.scanDirectory('./src/components')

// Generate reports
const report = scanner.generateReport(customResult)
const csv = scanner.generateCSV(customResult.matches)
const downloadScript = scanner.generateDownloadScript(customResult.matches)
```

## Output Files

### 1. Detailed Report (`unsplash-report.md`)
```markdown
# Unsplash Migration Report

**Scan Summary:**
- Total files found: 150
- Files scanned: 45
- Unsplash URLs found: 12
- Errors: 0

## Unsplash URLs Found

### src/components/Hero.tsx

**Line 15:**
```
<img src="https://images.unsplash.com/photo-1234567890" alt="Hero image" />
```
URL: `https://images.unsplash.com/photo-1234567890`

## Migration Recommendations

1. **Download Images**: Use the URLs above to download images
2. **Upload to Media Management**: Use eYogi media system
3. **Update References**: Replace Unsplash URLs with local references
4. **Add Metadata**: Use media management for proper SEO
5. **Enable Watermarking**: Apply eYogi Gurukul watermarks
```

### 2. CSV Export (`unsplash-urls.csv`)
```csv
File,Line,URL,Context
"src/components/Hero.tsx",15,"https://images.unsplash.com/photo-1234567890","<img src=""https://images.unsplash.com/photo-1234567890"" alt=""Hero image"" />"
```

### 3. Download Script (`download-unsplash.sh`)
```bash
#!/bin/bash

# Unsplash Image Download Script
mkdir -p unsplash_downloads
cd unsplash_downloads

echo "Downloading unsplash_1234567890.jpg..."
curl -L "https://images.unsplash.com/photo-1234567890" -o "unsplash_1234567890.jpg"
sleep 1

echo "Download complete!"
```

## API Reference

### UnsplashScanner Class

#### Methods

##### `scanDirectory(dirPath: string): Promise<ScanResult>`
Recursively scans a directory for Unsplash URLs.

##### `scanFile(filePath: string): Promise<UnsplashMatch[]>`
Scans a single file for Unsplash URLs.

##### `generateReport(scanResult: ScanResult): string`
Generates a detailed Markdown report.

##### `generateCSV(matches: UnsplashMatch[]): string`
Exports matches as CSV format.

##### `generateDownloadScript(matches: UnsplashMatch[]): string`
Creates a bash script to download all unique URLs.

### Types

```typescript
interface UnsplashMatch {
  file: string      // Full file path
  line: number      // Line number (1-based)
  url: string       // The Unsplash URL
  context: string   // The line content for context
}

interface ScanResult {
  totalFiles: number      // Total files found
  scannedFiles: number    // Files actually scanned
  matches: UnsplashMatch[] // All URL matches
  errors: string[]        // Any scan errors
}
```

## Migration Workflow

### 1. Scan for URLs
```bash
npm run scan-unsplash
```

### 2. Review the Report
Check `migration-reports/unsplash-report.md` for:
- Number of URLs found
- File locations and context
- Migration recommendations

### 3. Download Images
```bash
cd migration-reports
chmod +x download-unsplash.sh
./download-unsplash.sh
```

### 4. Upload to Media System
Use the eYogi media management system to:
- Upload the downloaded images
- Add proper titles, alt text, and descriptions
- Apply watermarks
- Organize into collections

### 5. Update References
Replace Unsplash URLs in your code with references to local media:

**Before:**
```tsx
<img src="https://images.unsplash.com/photo-1234567890" alt="Hero" />
```

**After:**
```tsx
<MediaImage 
  mediaId="hero-image-1" 
  alt="Hero image"
  watermark={true}
  size="large"
/>
```

### 6. Apply Watermarks
Use the watermarking system to brand your images:
```typescript
const watermarkedImage = await applyWatermark(image, {
  text: 'eYogi Gurukul',
  position: 'bottom-right',
  opacity: 0.8
})
```

## Configuration

### Supported File Types
- JavaScript/TypeScript: `.js`, `.jsx`, `.ts`, `.tsx`
- Markup: `.html`, `.md`, `.mdx`
- Styles: `.css`, `.scss`, `.sass`
- Config: `.json`

### Excluded Directories
- `node_modules`
- `.git`, `.next`, `.nuxt`
- `dist`, `build`
- `.cache`, `coverage`
- `logs`

### URL Pattern
The scanner looks for URLs matching:
```regex
/https?:\/\/images\.unsplash\.com\/[^\s"'`)]]+/gi
```

## Integration with Media Management

The scanner integrates seamlessly with the eYogi media management system:

### Media Collection Integration
```typescript
import { MediaCollection } from '../collections/Media'
import { UnsplashScanner } from './unsplash-scanner'

// Scan and prepare for migration
const scanner = new UnsplashScanner()
const result = await scanner.scanDirectory('./src')

// Create media entries for migration tracking
const migrationEntries = result.matches.map(match => ({
  originalUrl: match.url,
  status: 'pending-migration',
  sourceFile: match.file,
  sourceLine: match.line
}))
```

### Watermark Integration
```typescript
import { applyWatermark } from '../lib/watermark'

// Download and watermark in one step
async function downloadAndWatermark(url: string, filename: string) {
  const image = await downloadImage(url)
  const watermarked = await applyWatermark(image, {
    text: 'eYogi Gurukul',
    position: 'bottom-right'
  })
  return saveImage(watermarked, filename)
}
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure read permissions for scan directories
   - Run with appropriate user privileges

2. **Memory Issues with Large Codebases**
   - Scan smaller directories separately
   - Use file filtering options

3. **Download Script Fails**
   - Check internet connection
   - Verify curl is installed
   - Some URLs may have expired

### Debug Mode
Enable verbose logging:
```typescript
const scanner = new UnsplashScanner()
// Add debug logging by checking errors array
const result = await scanner.scanDirectory('./src')
if (result.errors.length > 0) {
  console.log('Scan errors:', result.errors)
}
```

## Contributing

To extend the scanner:

1. **Add new file types** by updating `supportedExtensions`
2. **Customize URL patterns** by modifying `unsplashPattern`
3. **Add new output formats** by creating new generator methods
4. **Integrate with other services** by extending the base scanner class

## License

Part of the eYogi Gurukul media management system.