# PowerShell script to optimize favicon using .NET System.Drawing
Add-Type -AssemblyName System.Drawing

$sourcePath = "D:\ITWala Projects\eyogi-main\src\SSH\public\Images\SSH_Logo.png"
$outputDir = "D:\ITWala Projects\eyogi-main\src\SSH\public"

Write-Host "Creating optimized favicon using .NET System.Drawing..."

try {
    # Load the original SSH logo
    $originalImage = [System.Drawing.Image]::FromFile($sourcePath)
    Write-Host "Loaded SSH logo: $($originalImage.Width)x$($originalImage.Height)"
    
    # Function to resize image and save with transparency
    function Resize-ImageWithTransparency {
        param($image, $width, $height, $outputPath)
        
        $resized = New-Object System.Drawing.Bitmap($width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($resized)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image, 0, 0, $width, $height)
        $graphics.Dispose()
        
        $resized.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $resized.Dispose()
    }
    
    # Create favicon sizes - keeping exact design, just resizing
    Resize-ImageWithTransparency $originalImage 16 16 "$outputDir\favicon-16x16.png"
    Resize-ImageWithTransparency $originalImage 32 32 "$outputDir\favicon-32x32.png"
    Resize-ImageWithTransparency $originalImage 180 180 "$outputDir\apple-touch-icon.png"
    
    # Also create a copy for favicon use
    Copy-Item $sourcePath "$outputDir\SSH_Logo_Favicon.png"
    
    $originalImage.Dispose()
    
    Write-Host "Favicon files created successfully"
    Write-Host "  - favicon-16x16.png"
    Write-Host "  - favicon-32x32.png" 
    Write-Host "  - apple-touch-icon.png"
    Write-Host "Same SSH logo design, optimized for favicon use"
    
} catch {
    Write-Host "Error occurred: $_"
    Write-Host "Fallback: Using original SSH logo directly for favicon"
}

Write-Host "Favicon optimization complete"