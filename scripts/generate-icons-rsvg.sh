#!/bin/bash

# PWA Icon Generator using RSVG-Convert
# This properly handles gradients, transforms, and complex SVG features

echo "🎨 Starting PWA icon generation with RSVG-Convert..."
echo "   This will properly preserve gradients and transforms!"

# Define paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SVG_PATH="$SCRIPT_DIR/../public/devlog-favicon.svg"
PUBLIC_DIR="$SCRIPT_DIR/../public"

# Icon sizes required for PWA
SIZES=(72 96 128 144 152 192 384 512)

# Check if rsvg-convert is installed
if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ rsvg-convert is not installed. Please install it first:"
    echo "   sudo apt install librsvg2-bin"
    exit 1
fi

# Check if SVG file exists
if [ ! -f "$SVG_PATH" ]; then
    echo "❌ SVG file not found at: $SVG_PATH"
    exit 1
fi

echo "📁 Source SVG: $SVG_PATH"
echo "📁 Output directory: $PUBLIC_DIR"
echo ""

# Remove old incorrectly generated icons
echo "🗑️  Removing old icons..."
for size in "${SIZES[@]}"; do
    if [ -f "$PUBLIC_DIR/icon-${size}.png" ]; then
        rm -f "$PUBLIC_DIR/icon-${size}.png"
    fi
done

echo ""
echo "🔄 Generating new icons with proper gradient support..."

# Generate each icon size
for size in "${SIZES[@]}"; do
    output_file="$PUBLIC_DIR/icon-${size}.png"
    
    echo -n "Generating ${size}x${size} icon... "
    
    # Convert SVG to PNG with rsvg-convert
    # This properly handles gradients, transforms, and complex SVG features
    rsvg-convert \
        --width=$size \
        --height=$size \
        --format=png \
        --background-color="#0a1628" \
        "$SVG_PATH" \
        --output "$output_file" 2>/dev/null
    
    if [ $? -eq 0 ] && [ -f "$output_file" ]; then
        echo "✅ Done"
    else
        echo "❌ Failed"
        echo "   Error: Could not generate $output_file"
    fi
done

echo ""
echo "🎉 Icon generation complete!"
echo ""
echo "Generated files with proper gradients:"
for size in "${SIZES[@]}"; do
    if [ -f "$PUBLIC_DIR/icon-${size}.png" ]; then
        echo "  ✅ icon-${size}.png"
    else
        echo "  ❌ icon-${size}.png (missing)"
    fi
done

echo ""
echo "✨ Your PWA icons now properly display gradients and transforms!"
echo "   The logos should now match your SVG design exactly."