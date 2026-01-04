// Extract all document links from blocks
export function extractDocumentLinks(blocks) {
  const links = new Set();
  
  blocks.forEach(block => {
    if (block.type === 'text' && block.content) {
      // Find all [[Document Name]] patterns
      const matches = block.content.matchAll(/\[\[([^\]]+)\]\]/g);
      for (const match of matches) {
        links.add(match[1]);
      }
    }
  });
  
  return Array.from(links);
}

// Get all backlinks for a document
export function getBacklinks(documentTitle, allEntries) {
  const backlinks = [];
  
  allEntries.forEach(entry => {
    const links = extractDocumentLinks(entry.blocks || []);
    if (links.some(link => link.toLowerCase() === documentTitle.toLowerCase())) {
      backlinks.push({
        id: entry.id,
        title: entry.title,
        preview: entry.preview
      });
    }
  });
  
  return backlinks;
}