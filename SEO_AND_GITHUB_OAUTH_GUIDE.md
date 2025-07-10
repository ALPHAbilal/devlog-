# Complete Guide: GitHub OAuth Setup & Google Search Engine Optimization

## Part 1: GitHub OAuth Setup

### Step 1: Create GitHub OAuth App
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Devlog
   - **Homepage URL**: https://devlog.design
   - **Authorization callback URL**: https://zqcjipwiznesnbgbocnu.supabase.co/auth/v1/callback
4. Click "Register Application"

### Step 2: Get GitHub Credentials
1. Copy your **Client ID**
2. Click "Generate a new client secret"
3. Copy and save your **Client Secret** immediately

### Step 3: Configure Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **GitHub** and toggle it ON
4. Enter:
   - Client ID: [your GitHub client ID]
   - Client Secret: [your GitHub client secret]
5. Click "Save"

### Step 4: Update Your Code
In your `src/components/Auth.jsx`, change:
```javascript
providers={['google']}
```
to:
```javascript
providers={['google', 'github']}
```

### Step 5: Update GitHub OAuth App Settings
Go back to your GitHub OAuth App and add these additional callback URLs:
- https://devlog.design/auth/callback
- http://localhost:5173/auth/callback

---

## Part 2: Google Search Engine Optimization (SEO)

### Step 1: Create robots.txt
Create `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://devlog.design/sitemap.xml
```

### Step 2: Create sitemap.xml
Create `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://devlog.design/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://devlog.design/privacy</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://devlog.design/terms</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

### Step 3: Update index.html with SEO Meta Tags
Add these to your `index.html` in the `<head>` section:
```html
<!-- SEO Meta Tags -->
<meta name="description" content="Devlog - A powerful developer knowledge management system to organize your coding journey">
<meta name="keywords" content="developer, devlog, knowledge management, coding, programming">
<meta name="author" content="Your Name">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://devlog.design/">

<!-- Open Graph Meta Tags (for social media) -->
<meta property="og:title" content="Devlog - Developer Knowledge Management">
<meta property="og:description" content="Organize your coding journey with Devlog">
<meta property="og:type" content="website">
<meta property="og:url" content="https://devlog.design/">
<meta property="og:image" content="https://devlog.design/og-image.png">

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Devlog - Developer Knowledge Management">
<meta name="twitter:description" content="Organize your coding journey with Devlog">
<meta name="twitter:image" content="https://devlog.design/twitter-image.png">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Devlog",
  "description": "A powerful developer knowledge management system",
  "url": "https://devlog.design",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web"
}
</script>
```

### Step 4: Submit to Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property: https://devlog.design
3. Verify ownership (use DNS verification with your domain provider)
4. Submit your sitemap: https://devlog.design/sitemap.xml
5. Request indexing for your homepage

### Step 5: Additional SEO Files

#### Create `public/manifest.json`:
```json
{
  "name": "Devlog",
  "short_name": "Devlog",
  "description": "Developer Knowledge Management System",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#0a1628",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Step 6: Performance Optimization for SEO
1. **Enable Compression** - Already handled by Vercel
2. **Optimize Images** - Use WebP format, lazy loading
3. **Minimize JavaScript** - Vite handles this in production
4. **Use HTTPS** - Already using with custom domain

### Step 7: Monitor Your SEO
1. **Google Search Console** - Monitor indexing status
2. **Google Analytics** - Track visitor behavior
3. **PageSpeed Insights** - Check performance scores

### Step 8: Link Building
1. Submit to developer directories
2. Create a blog about your project
3. Share on social media
4. Get listed on product hunt

### Step 9: Regular Updates
1. Keep content fresh
2. Update sitemap when adding new pages
3. Monitor search console for errors
4. Fix any crawl issues immediately

---

## Quick Checklist

### GitHub OAuth:
- [ ] Created GitHub OAuth App
- [ ] Added Client ID & Secret to Supabase
- [ ] Updated Auth component to include GitHub
- [ ] Tested GitHub login

### SEO Setup:
- [ ] Created robots.txt
- [ ] Created sitemap.xml
- [ ] Added SEO meta tags to index.html
- [ ] Submitted to Google Search Console
- [ ] Verified domain ownership
- [ ] Submitted sitemap
- [ ] Created manifest.json
- [ ] Added structured data

### Next Steps:
1. Wait 24-48 hours for DNS propagation
2. Test OAuth with both Google and GitHub
3. Monitor Google Search Console for indexing
4. Check PageSpeed Insights score
5. Submit to other search engines (Bing, DuckDuckGo)