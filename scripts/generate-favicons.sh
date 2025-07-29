#!/bin/bash

# Script to generate favicon files from SVG
# Requires ImageMagick or rsvg-convert

echo "Favicon Generation Script for DevLog"
echo "===================================="
echo ""
echo "This script will help you generate the required favicon files."
echo "You need either ImageMagick or rsvg-convert installed."
echo ""

# Check if source SVG exists
if [ ! -f "public/devlog-favicon.svg" ]; then
    echo "Error: public/devlog-favicon.svg not found!"
    exit 1
fi

# Create favicon directory if it doesn't exist
mkdir -p public

echo "Generating favicon files..."

# Method 1: Using rsvg-convert (recommended for better SVG handling)
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert..."
    
    # Generate PNG files
    rsvg-convert -w 16 -h 16 public/devlog-favicon.svg -o public/favicon-16x16.png
    rsvg-convert -w 32 -h 32 public/devlog-favicon.svg -o public/favicon-32x32.png
    rsvg-convert -w 48 -h 48 public/devlog-favicon.svg -o public/favicon-48x48.png
    rsvg-convert -w 96 -h 96 public/devlog-favicon.svg -o public/favicon-96x96.png
    rsvg-convert -w 180 -h 180 public/devlog-favicon.svg -o public/apple-touch-icon.png
    
    # Generate ICO file (48x48 for Google)
    rsvg-convert -w 48 -h 48 public/devlog-favicon.svg -o public/favicon-48.png
    
    # Convert to ICO using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert public/favicon-48.png public/favicon.ico
        rm public/favicon-48.png
    else
        echo "Warning: ImageMagick not found. Cannot create favicon.ico"
        echo "You'll need to create it manually or use an online converter."
    fi
    
# Method 2: Using ImageMagick
elif command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    
    # Generate PNG files
    convert -background none public/devlog-favicon.svg -resize 16x16 public/favicon-16x16.png
    convert -background none public/devlog-favicon.svg -resize 32x32 public/favicon-32x32.png
    convert -background none public/devlog-favicon.svg -resize 48x48 public/favicon-48x48.png
    convert -background none public/devlog-favicon.svg -resize 96x96 public/favicon-96x96.png
    convert -background none public/devlog-favicon.svg -resize 180x180 public/apple-touch-icon.png
    
    # Generate ICO file (48x48 for Google)
    convert -background none public/devlog-favicon.svg -resize 48x48 public/favicon.ico
    
else
    echo "Error: Neither rsvg-convert nor ImageMagick found!"
    echo ""
    echo "Please install one of them:"
    echo "  Ubuntu/Debian: sudo apt-get install librsvg2-bin"
    echo "  macOS: brew install librsvg"
    echo "  Or: sudo apt-get install imagemagick"
    echo ""
    echo "Alternatively, use online tools:"
    echo "  - https://realfavicongenerator.net/"
    echo "  - https://favicon.io/favicon-converter/"
    echo ""
    echo "Required files:"
    echo "  - favicon.ico (48x48)"
    echo "  - favicon-16x16.png"
    echo "  - favicon-32x32.png"
    echo "  - favicon-48x48.png"
    echo "  - favicon-96x96.png"
    echo "  - apple-touch-icon.png (180x180)"
    exit 1
fi

echo ""
echo "Favicon generation complete!"
echo ""
echo "Generated files:"
ls -la public/favicon* public/apple-touch-icon.png 2>/dev/null || echo "No files generated"
echo ""
echo "Next steps:"
echo "1. Verify the generated files look correct"
echo "2. Commit and push to your repository"
echo "3. Clear browser cache and test"
echo "4. Submit to Google Search Console for re-indexing"