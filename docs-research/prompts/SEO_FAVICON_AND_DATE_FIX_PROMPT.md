# SEO Research Prompt: Fix Favicon Display and Remove Date from Search Results

## Context
DevLog (www.devlog.design) has two specific issues in Google search results:
1. **Missing favicon**: Shows generic globe icon instead of brand logo
2. **Date displaying**: Shows "Jul 17, 2025" while competitor SaaS sites show no dates

Screenshot evidence: DevLog appears with globe icon and date, while Dribbble shows proper favicon and no date.

## Current Implementation Details

### Favicon Setup:
- **HTML**: `<link rel="icon" type="image/svg+xml" href="/devlog-favicon.svg" />`
- **Format**: SVG only (no PNG fallbacks in HTML head)
- **Manifest.json**: Has multiple PNG sizes (72x72 to 512x512) but not linked in HTML
- **Missing**: No apple-touch-icon, no 16x16/32x32 favicon.ico

### Date Issue:
- **Sitemap**: All pages have `<lastmod>2025-07-21T00:00:00+00:00</lastmod>`
- **Schema**: No datePublished or dateModified in structured data
- **Page type**: Homepage and product pages (not blog posts)

## Research Questions

### 1. Favicon Display Fix
- **Why doesn't Google display SVG favicons in search results?**
- **What's the exact favicon setup for reliable SERP display in 2025?**
- **Which specific meta tags and formats does Google require?**
- **Should we use favicon.ico, PNG, or both? What sizes?**

### 2. Date Removal from SERPs
- **Why do dates appear for SaaS homepages when they shouldn't?**
- **How to prevent Google from showing lastmod dates from sitemaps?**
- **What signals tell Google "this is a product, not a blog post"?**
- **Should SaaS sites remove lastmod from sitemaps entirely?**

## Specific Technical Questions

1. **Favicon Requirements**:
   - Exact HTML tags needed (link rel="icon", apple-touch-icon, etc.)
   - Required image formats and sizes for 2025
   - Does Google prefer favicon.ico in root or PNG in meta tags?
   - Impact of having both SVG and PNG versions

2. **Date Display Control**:
   - How to use robots meta tags to control date display
   - Impact of removing lastmod from sitemaps
   - Using schema.org to indicate "evergreen" content
   - Difference between WebPage vs Product schema for date handling

## Competitor Analysis Needed
Research how these SaaS sites handle favicons and dates:
- Notion.so - Check favicon format and sitemap lastmod
- Linear.app - Analyze their meta tags and date handling
- Figma.com - Look at schema markup for products
- Vercel.com - Examine their approach to SERP display

## Expected Deliverables

### 1. Favicon Fix Checklist
```html
<!-- Provide exact HTML code needed -->
<!-- List all required image files and sizes -->
<!-- Specify naming conventions -->
```

### 2. Date Removal Strategy
- Step-by-step guide to remove dates from SERPs
- Sitemap best practices for SaaS products
- Alternative ways to indicate content freshness

### 3. Testing & Verification
- How to test favicon display before Google indexes
- Tools to preview SERP appearance
- Timeline for changes to appear in search results

## Additional Context
- Site is built with React + Vite
- Hosted on Vercel
- Has Google Search Console access
- Already verified and indexed by Google
- Using PWA with manifest.json

## Priority
These are the ONLY two issues to address. Don't expand scope to general SEO improvements. Focus solely on:
1. Making the favicon appear in Google search
2. Removing the date from search results

Please provide specific, actionable code changes and configuration updates based on 2025 best practices.