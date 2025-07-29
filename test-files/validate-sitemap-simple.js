const fs = require('fs');
const https = require('https');

const sitemapFiles = [
  './public/sitemap-core.xml',
  './public/sitemap-features.xml',
  './public/sitemap-legal.xml'
];

function extractUrls(xmlContent) {
  const urls = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xmlContent)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'HEAD'
    };
    
    const req = https.request(options, (res) => {
      resolve({
        url,
        status: res.statusCode,
        valid: res.statusCode === 200
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        valid: false,
        error: err.message
      });
    });
    
    req.end();
  });
}

async function validateSitemap(filepath) {
  console.log(`\nValidating ${filepath}...`);
  
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const urls = extractUrls(content);
    
    console.log(`Found ${urls.length} URLs`);
    
    const results = [];
    for (const url of urls) {
      const result = await checkUrl(url);
      if (result.valid) {
        console.log(`✓ ${result.url} - ${result.status}`);
      } else {
        console.log(`✗ ${result.url} - ${result.status} ${result.error || ''}`);
      }
      results.push(result);
    }
    
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
    console.log('\nNote: These URLs may not be accessible in development environment.');
    console.log('They should be validated in production or staging environment.');
  }
}

main().catch(console.error);