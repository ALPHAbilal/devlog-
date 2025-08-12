export function createSemanticSnapshot(documentData: any): any {
  const { document, blocks } = documentData;
  
  // Extract document structure
  const structure = {
    headings: blocks
      .filter((b: any) => b.type === 'heading')
      .map((h: any) => ({
        level: h.metadata?.level || 1,
        text: h.content,
        id: h.id,
      })),
    blockTypes: blocks.reduce((acc: any, b: any) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {}),
    totalBlocks: blocks.length,
    lastModified: document.updated_at,
  };
  
  // Extract key content with 90% reduction
  const keyContent = {
    codeBlocks: blocks
      .filter((b: any) => b.type === 'code')
      .slice(0, 5) // Top 5 most relevant
      .map((b: any) => ({
        language: b.metadata?.language || 'plaintext',
        filename: b.metadata?.filename,
        preview: b.content.substring(0, 200) + '...',
        lines: b.content.split('\n').length,
      })),
    
    aiConversations: blocks
      .filter((b: any) => b.type === 'ai')
      .map((b: any) => ({
        model: b.metadata?.model || 'unknown',
        messageCount: b.metadata?.messages?.length || 0,
        summary: generateConversationSummary(b.metadata?.messages),
      })),
    
    todos: blocks
      .filter((b: any) => b.type === 'todo')
      .map((b: any) => ({
        total: b.metadata?.items?.length || 0,
        completed: b.metadata?.items?.filter((i: any) => i.completed).length || 0,
        topItems: b.metadata?.items?.slice(0, 3).map((i: any) => i.text) || [],
      })),
    
    filetrees: blocks
      .filter((b: any) => b.type === 'filetree')
      .map((b: any) => ({
        rootPath: b.metadata?.structure?.name || 'unknown',
        fileCount: countFiles(b.metadata?.structure),
        selectedFile: b.metadata?.selectedFile,
        topLevelItems: getTopLevelItems(b.metadata?.structure),
      })),
    
    tables: blocks
      .filter((b: any) => b.type === 'table')
      .map((b: any) => ({
        headers: b.metadata?.headers || [],
        rowCount: b.metadata?.rows?.length || 0,
        preview: b.metadata?.rows?.slice(0, 2) || [],
      })),
    
    images: blocks
      .filter((b: any) => b.type === 'image' || b.type === 'inline-image')
      .map((b: any) => ({
        type: b.type,
        count: b.type === 'image' ? (b.metadata?.urls?.length || 1) : 1,
        hasCaption: !!b.metadata?.caption || !!b.metadata?.captions,
      })),
  };
  
  // Metadata aggregation
  const metadata = {
    tags: document.tags,
    linkedDocuments: document.links || [],
    primaryLanguages: detectPrimaryLanguages(blocks),
    complexityScore: calculateComplexity(blocks),
    estimatedReadTime: estimateReadTime(blocks),
  };
  
  // Generate version hash for change detection
  const version = generateVersionHash(blocks);
  
  return {
    document: {
      id: document.id,
      title: document.title,
      created: document.created_at,
      updated: document.updated_at,
    },
    structure,
    keyContent,
    metadata,
    summary: {
      totalBlocks: blocks.length,
      contentTypes: Object.keys(structure.blockTypes),
      hasCode: blocks.some((b: any) => b.type === 'code'),
      hasAI: blocks.some((b: any) => b.type === 'ai'),
      hasTodos: blocks.some((b: any) => b.type === 'todo'),
      complexity: metadata.complexityScore,
      readTime: metadata.estimatedReadTime,
    },
    version,
  };
}

function generateConversationSummary(messages: any[]): string {
  if (!messages || messages.length === 0) return 'No messages';
  
  const userMessages = messages.filter((m: any) => m.role === 'user').length;
  const assistantMessages = messages.filter((m: any) => m.role === 'assistant').length;
  
  return `${userMessages} user, ${assistantMessages} assistant messages`;
}

function countFiles(structure: any): number {
  if (!structure) return 0;
  let count = structure.type === 'file' ? 1 : 0;
  if (structure.children) {
    count += structure.children.reduce((sum: number, child: any) => 
      sum + countFiles(child), 0
    );
  }
  return count;
}

function getTopLevelItems(structure: any): string[] {
  if (!structure || !structure.children) return [];
  return structure.children
    .slice(0, 5)
    .map((child: any) => child.name);
}

function detectPrimaryLanguages(blocks: any[]): string[] {
  const languages = new Map<string, number>();
  
  blocks
    .filter((b: any) => b.type === 'code' && b.metadata?.language)
    .forEach((b: any) => {
      const lang = b.metadata.language;
      languages.set(lang, (languages.get(lang) || 0) + 1);
    });
  
  return Array.from(languages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);
}

function calculateComplexity(blocks: any[]): number {
  const weights = {
    text: 1,
    heading: 1,
    code: 3,
    ai: 4,
    filetree: 2,
    table: 2,
    todo: 2,
    image: 1,
    'inline-image': 1,
    'version-track': 3,
    'issue-tracker': 3,
  };
  
  const score = blocks.reduce((sum: number, block: any) => 
    sum + (weights[block.type as keyof typeof weights] || 1), 0
  );
  
  return Math.min(Math.round((score / blocks.length) * 2) / 2, 5); // 0.5 increments, max 5
}

function estimateReadTime(blocks: any[]): string {
  let wordCount = 0;
  
  blocks.forEach((block: any) => {
    if (block.type === 'text' || block.type === 'heading') {
      wordCount += block.content.split(/\s+/).length;
    } else if (block.type === 'code') {
      // Code takes longer to read
      wordCount += block.content.split('\n').length * 5;
    } else if (block.type === 'table') {
      // Tables are quick to scan
      wordCount += (block.metadata?.rows?.length || 0) * 3;
    }
  });
  
  const minutes = Math.ceil(wordCount / 200); // Average reading speed
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

function generateVersionHash(blocks: any[]): string {
  // Simple hash based on block updates
  const hashData = blocks
    .map((b: any) => `${b.id}:${b.updated_at}`)
    .join('|');
  
  // Simple hash function for demo
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}