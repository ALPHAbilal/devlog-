# Research Prompt: Removing Unwanted Dates from Google Search Results

## Current Issue
My website (www.devlog.design) shows an unwanted date "Jul 17, 2025" in Google search results. This date appears next to the meta description, making my SaaS homepage look like a dated blog post rather than an evergreen product page.

## Screenshot Evidence
The search result shows:
```
DevLog: Developer Knowledge Base - Capture Your Coding ...
Jul 17, 2025 — Build your personal developer documentation with code snippet management, AI conversation preservation, and offline-first architecture.
```

## Current Setup Analysis

### What I Found:
1. **Sitemap Configuration:**
   - Homepage entry in sitemap-core.xml has: `<lastmod>2025-07-21T00:00:00+00:00</lastmod>`
   - No other date-related entries in sitemap

2. **HTML Meta Tags:**
   - No datePublished or dateModified in structured data
   - No article:published_time meta tags
   - No explicit date meta tags in HTML

3. **Structured Data:**
   - Using SoftwareApplication schema (not Article schema)
   - No date properties in any schema markup

## Research Questions

### 1. Understanding Google's Date Detection (2024-2025)
- How does Google determine which dates to show in search results?
- What are all the sources Google checks for dates (beyond meta tags)?
- Why would Google show "Jul 17" when my sitemap shows "Jul 21"?
- Has Google's date detection algorithm changed in 2024-2025?

### 2. Best Practices for SaaS/Product Pages
- Should SaaS homepages have dates in search results?
- What's the impact of dates on CTR for evergreen content?
- How do successful SaaS companies handle dates in search results?
- Any 2025-specific guidelines for product vs. content pages?

### 3. Removal Methods (Ranked by Effectiveness)
Please evaluate these approaches:

**Option A: Sitemap Modification**
- Remove `<lastmod>` from homepage entry entirely
- Keep lastmod only for actual dated content
- Add priority and changefreq instead

**Option B: Meta Tag Control**
- Using `<meta name="robots" content="nosnippet-date">`
- Or using `<meta name="googlebot" content="nosnippet-date">`
- Any new 2025 meta tags for date control?

**Option C: Structured Data Approach**
- Switching from SoftwareApplication to WebPage schema
- Adding specific "nodate" properties
- Using Organization schema without dates

**Option D: HTML Modifications**
- Removing ALL visible dates from the page
- Using JavaScript to display dates (not crawlable)
- CSS techniques to hide dates from crawlers

### 4. Technical Implementation
- Which method is most reliable in 2025?
- Can multiple methods be combined safely?
- Any negative SEO impacts from removing dates?
- How to test if changes worked before Google processes them?

### 5. Special Considerations for 2025
- Any new Google Search Console tools for date management?
- Impact on Core Web Vitals or other ranking factors?
- Interaction with AI-powered search features (SGE, Bard, etc.)?
- Mobile vs. desktop date display differences?

### 6. Troubleshooting the Date Discrepancy
- Why "Jul 17" appears when sitemap shows "Jul 21"?
- Could this be from:
  - Server headers?
  - File modification dates?
  - CDN or hosting metadata?
  - Google's own algorithms?

### 7. Monitoring and Verification
- How long for date removal to take effect?
- Tools to preview SERP without dates?
- How to force Google to recrawl and update?
- Warning signs that date removal isn't working?

## Desired Outcome
I want search results to show:
```
DevLog: Developer Knowledge Base - Capture Your Coding ...
Build your personal developer documentation with code snippet management, AI conversation preservation, and offline-first architecture.
```
(No date, just title and description)

## Additional Context
- This is a SaaS product homepage, not a blog
- The content is evergreen and continuously updated
- Competitors don't show dates in their search results
- I want to look current and authoritative, not dated

Please provide:
1. **Root cause analysis** - Why is this date appearing?
2. **Best practice recommendation** - Which removal method for SaaS in 2025?
3. **Step-by-step implementation** - Exact code/changes needed
4. **Testing methodology** - How to verify it works
5. **Timeline expectations** - When will the date disappear?
6. **Risk assessment** - Any potential negative impacts?