# PowerShell script to optimize SSH logo by removing white background
$sourcePath = "D:\ITWala Projects\eyogi-main\src\SSH\public\Images\SSH_Logo.png"
$outputDir = "D:\ITWala Projects\eyogi-main\src\SSH\public"

Write-Host "Optimizing SSH logo - removing white background while keeping exact design..."

# Check if ImageMagick is available
try {
    $magickCmd = Get-Command "magick" -ErrorAction Stop
    Write-Host "Using ImageMagick to remove white background from SSH logo..."
    
    # Remove white background from original logo and create favicon
    & magick convert "$sourcePath" -fuzz 10% -transparent white "$outputDir\SSH_Logo_NoWhite.png"
    
    # Create favicon sizes from the no-white-background version
    & magick convert "$outputDir\SSH_Logo_NoWhite.png" -resize 32x32 "$outputDir\favicon-32x32.png"
    & magick convert "$outputDir\SSH_Logo_NoWhite.png" -resize 16x16 "$outputDir\favicon-16x16.png"
    & magick convert "$outputDir\SSH_Logo_NoWhite.png" -resize 180x180 "$outputDir\apple-touch-icon.png"
    
    Write-Host "✓ SSH logo optimized - white background removed, exact design preserved"
    Write-Host "✓ Favicon files created in multiple sizes"
} catch {
    Write-Host "ImageMagick not found. Please install ImageMagick to automatically remove white background."
    Write-Host "Alternative: Use an image editor to:"
    Write-Host "1. Open SSH_Logo.png"
    Write-Host "2. Remove white background (make transparent)"
    Write-Host "3. Save as SSH_Logo_NoWhite.png"
    Write-Host "4. Create favicon sizes: 16x16, 32x32, 180x180"
}

Write-Host "Favicon optimization complete - same design, no white background"