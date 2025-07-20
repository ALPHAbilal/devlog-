# Convert SVG to PWA icons in 2025: Best solutions for Vite projects

For converting your `/public/devlog-favicon.svg` to multiple PNG sizes for your PWA, here are the most current and practical solutions. The **@vite-pwa/assets-generator** is the most modern and seamless option for Vite projects in 2025, offering perfect integration and automatic manifest generation.

## Quick Solution: Use Progressier's Online Tool

For immediate results without any installation, **Progressier's PWA Icon Generator** provides the fastest path to success:

1. Visit https://progressier.com/pwa-icons-and-ios-splash-screen-generator
2. Drag and drop your `devlog-favicon.svg` file
3. Download the ZIP containing all icon sizes (72, 96, 128, 144, 152, 192, 384, 512px)
4. Extract PNGs to your `/public` directory
5. Copy the provided manifest entries

This free tool generates high-quality PNGs while preserving your SVG's colors and details. It's actively maintained and follows 2025 PWA standards.

## Best Automated Solution: @vite-pwa/assets-generator

For a fully integrated solution that works seamlessly with your Vite/React stack, **@vite-pwa/assets-generator** represents the current best practice. With 52,000+ weekly downloads and active maintenance, it's specifically designed for modern Vite projects.

### Installation and setup

```bash
npm install @vite-pwa/assets-generator vite-plugin-pwa -D
```

Create a configuration file `pwa-assets.config.js`:

```javascript
import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    transparent: {
      sizes: [72, 96, 128, 144, 152, 192, 384, 512],
      favicons: [[48, 'favicon.ico']]
    },
    maskable: {
      sizes: [512]
    },
    apple: {
      sizes: [180]
    }
  },
  images: ['public/devlog-favicon.svg']
})
```

Update your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: {
        config: true
      },
      manifest: {
        name: 'Your App Name',
        short_name: 'App',
        theme_color: '#ffffff',
        // Icons will be auto-generated
      }
    })
  ]
})
```

Add to your `package.json`:

```json
{
  "scripts": {
    "generate-pwa-assets": "pwa-assets-generator",
    "build": "npm run generate-pwa-assets && vite build"
  }
}
```

This solution automatically generates all required PNG sizes from your SVG, updates your manifest.json, and integrates perfectly with Vite's build process. The tool uses Sharp for high-quality image processing and follows the latest PWA standards.

## Command-Line Solutions for WSL

For developers preferring command-line tools on WSL, **Inkscape CLI** provides the highest quality SVG-to-PNG conversion:

### Install Inkscape on WSL

```bash
sudo apt update
sudo apt install inkscape
```

### Batch conversion script

Create a file `convert-icons.sh`:

```bash
#!/bin/bash
SIZES=(72 96 128 144 152 192 384 512)
INPUT_SVG="public/devlog-favicon.svg"

for size in "${SIZES[@]}"; do
    inkscape "$INPUT_SVG" \
        --export-type=png \
        --export-filename="public/icon-${size}x${size}.png" \
        --export-width="$size" \
        --export-height="$size"
    echo "Created icon-${size}x${size}.png"
done
```

Run with `bash convert-icons.sh`. This preserves SVG quality perfectly and works reliably on WSL.

### Lightweight alternative: rsvg-convert

For faster processing with good quality:

```bash
sudo apt install librsvg2-bin

# Convert all sizes
for size in 72 96 128 144 152 192 384 512; do
    rsvg-convert -w $size -h $size -o public/icon-${size}x${size}.png public/devlog-favicon.svg
done
```

## Modern Node.js approach with Sharp CLI

Sharp CLI offers excellent performance and quality for Node.js environments:

```bash
npm install -g sharp-cli

# Generate all sizes at once
for size in 72 96 128 144 152 192 384 512; do
    sharp -i public/devlog-favicon.svg -o public/icon-${size}x${size}.png resize $size $size
done
```

## Integration with your manifest.json

After generating icons, update your `manifest.json`:

```json
{
  "icons": [
    {
      "src": "/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Alternative online tools for quick conversion

**IconGen (Privacy-focused)**: https://cthedot.de/icongen/ processes everything locally in your browser without uploading files to servers. It generates all PWA sizes and creates a complete manifest.json.

**PWA Icon Generator on Vercel**: https://pwa-icon-generator.vercel.app/ offers a clean interface with manifest generation, perfect for quick conversions.

## Recommendations for your specific setup

Given your **Vite + React + Vercel** stack on **Windows WSL**, here's the optimal approach:

1. **For production**: Use **@vite-pwa/assets-generator** - it's built for Vite, actively maintained, and handles everything automatically including manifest updates.

2. **For quick one-time conversion**: Use **Progressier's online tool** - it's free, instant, and generates perfect quality icons.

3. **For automation without npm**: Create a bash script using **Inkscape CLI** on WSL for the highest quality results.

All these solutions preserve your SVG's colors and quality while generating the exact sizes you need. The @vite-pwa/assets-generator is particularly powerful because it integrates directly with your build process, ensuring icons are always up-to-date when you deploy to Vercel.