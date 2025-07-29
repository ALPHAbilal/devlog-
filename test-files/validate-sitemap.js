import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

const sitemapFiles = [
  './public/sitemap-core.xml',
  './public/sitemap-features.xml',
  './public/sitemap-legal.xml'
];

async function validateUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      status: response.status,
      valid: response.status === 200
    };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      valid: false,
      error: error.message
    };
  }
}

async function validateSitemap(filepath) {
  console.log(`\nValidating ${filepath}...`);
  
  try {
    const content = readFileSync(filepath, 'utf-8');
    const dom = new JSDOM(content, { contentType: 'text/xml' });
    const urls = Array.from(dom.window.document.querySelectorAll('loc')).map(loc => loc.textContent);
    
    console.log(`Found ${urls.length} URLs`);
    
    const results = await Promise.all(urls.map(validateUrl));
    
    results.forEach(result => {
      if (result.valid) {
        console.log(`✓ ${result.url} - ${result.status}`);
      } else {
        console.log(`✗ ${result.url} - ${result.status} ${result.error || ''}`);
      }
    });
    
    const validCount = results.filter(r => r.valid).length;
    console.log(`Summary: ${validCount}/${results.length} URLs are valid`);
    
    return results;
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('Sitemap URL Validation');
  console.log('====================');
  
  let allResults = [];
  
  for (const file of sitemapFiles) {
    const results = await validateSitemap(file);
    allResults = allResults.concat(results);
  }
  
  console.log('\n=== OVERALL SUMMARY ===');
  const totalUrls = allResults.length;
  const validUrls = allResults.filter(r => r.valid).length;
  const invalidUrls = allResults.filter(r => !r.valid);
  
  console.log(`Total URLs: ${totalUrls}`);
  console.log(`Valid URLs: ${validUrls}`);
  console.log(`Invalid URLs: ${invalidUrls.length}`);
  
  if (invalidUrls.length > 0) {
    console.log('\nInvalid URLs:');
    invalidUrls.forEach(result => {
      console.log(`- ${result.url} (${result.status})`);
    });
  }
}

main().catch(console.error);