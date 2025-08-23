#!/usr/bin/env node

/**
 * Script to create LangGraph documentation folder structure in Devlog
 * Uses the Devlog MCP API to create folders
 */

const API_URL = 'https://devlog-mcp.bilal-kosika.workers.dev/api/execute';
const API_KEY = 'dvlg_sk_test_123';

// Folder structure with colors and icons
const folders = [
  {
    name: 'LangGraph Documentation',
    color: '#6366F1', // Indigo
    icon: '📚',
    parent_id: null
  },
  {
    name: 'Getting Started',
    color: '#10B981', // Green
    icon: '🚀',
    parent: 'LangGraph Documentation'
  },
  {
    name: 'Core Concepts',
    color: '#3B82F6', // Blue
    icon: '🧠',
    parent: 'LangGraph Documentation'
  },
  {
    name: 'Tutorials',
    color: '#8B5CF6', // Purple
    icon: '📖',
    parent: 'LangGraph Documentation'
  },
  {
    name: 'Advanced Topics',
    color: '#EF4444', // Red
    icon: '🔥',
    parent: 'LangGraph Documentation'
  },
  {
    name: 'Examples',
    color: '#F59E0B', // Amber
    icon: '💡',
    parent: 'LangGraph Documentation'
  },
  {
    name: 'API Reference',
    color: '#6B7280', // Gray
    icon: '📋',
    parent: 'LangGraph Documentation'
  }
];

// Map to store folder IDs
const folderIds = {};

async function createFolder(folder) {
  try {
    const body = {
      apiKey: API_KEY,
      toolName: 'create_folder',
      args: {
        name: folder.name,
        color: folder.color,
        icon: folder.icon
      }
    };

    // If this folder has a parent, add the parent_id
    if (folder.parent && folderIds[folder.parent]) {
      body.args.parent_id = folderIds[folder.parent];
    }

    console.log(`Creating folder: ${folder.name}...`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Created folder: ${folder.name} (ID: ${result.data.id})`);
      folderIds[folder.name] = result.data.id;
      return result.data;
    } else {
      console.error(`❌ Failed to create folder: ${folder.name}`, result.error || result);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error creating folder ${folder.name}:`, error.message);
    return null;
  }
}

async function listExistingFolders() {
  try {
    console.log('Checking existing folders...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: API_KEY,
        toolName: 'list_folders',
        args: {}
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`Found ${result.data.length} existing folders`);
      
      // Check if LangGraph Documentation already exists
      const existingLangGraph = result.data.find(f => f.name === 'LangGraph Documentation');
      if (existingLangGraph) {
        console.log('⚠️  LangGraph Documentation folder already exists!');
        folderIds['LangGraph Documentation'] = existingLangGraph.id;
        
        // Map existing subfolders
        result.data.forEach(folder => {
          if (folder.parent_id === existingLangGraph.id) {
            folderIds[folder.name] = folder.id;
            console.log(`  Found existing subfolder: ${folder.name}`);
          }
        });
        
        return true; // Folders exist
      }
      return false; // Need to create folders
    }
    return false;
  } catch (error) {
    console.error('Error listing folders:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating LangGraph Documentation Folder Structure');
  console.log('='.repeat(50));
  
  // Check if folders already exist
  const foldersExist = await listExistingFolders();
  
  if (foldersExist && folderIds['LangGraph Documentation']) {
    console.log('\n📁 Using existing LangGraph Documentation folder structure');
  } else {
    console.log('\n📁 Creating new folder structure...\n');
    
    // Create folders in order (parent first, then children)
    for (const folder of folders) {
      if (!folderIds[folder.name]) {
        await createFolder(folder);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.log('\n='.repeat(50));
  console.log('✨ Folder structure ready!');
  console.log('\nFolder IDs for reference:');
  Object.entries(folderIds).forEach(([name, id]) => {
    console.log(`  ${name}: ${id}`);
  });
  
  // Save folder IDs for later use
  const fs = require('fs').promises;
  await fs.writeFile(
    'langgraph-folder-ids.json',
    JSON.stringify(folderIds, null, 2)
  );
  console.log('\n💾 Folder IDs saved to langgraph-folder-ids.json');
}

// Run the script
main().catch(console.error);