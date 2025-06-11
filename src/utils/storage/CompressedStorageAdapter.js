// Compressed Storage Adapter - Adds LZ-string compression to IndexedDB storage
import LZString from 'lz-string';
import storage from './IndexedDBAdapter';

class CompressedStorageAdapter {
  constructor() {
    this.compressionEnabled = true;
    this.compressionStats = {
      totalSaved: 0,
      totalOriginal: 0,
      documentStats: new Map()
    };
  }

  // Compress a document
  compressDocument(document) {
    if (!this.compressionEnabled) return document;

    try {
      // Only compress the blocks content, which is typically the largest part
      const blocksString = JSON.stringify(document.blocks || []);
      const compressedBlocks = LZString.compressToUTF16(blocksString);
      
      // Calculate compression ratio
      const originalSize = new Blob([blocksString]).size;
      const compressedSize = new Blob([compressedBlocks]).size;
      const saved = originalSize - compressedSize;
      
      // Update stats
      this.compressionStats.documentStats.set(document.id, {
        originalSize,
        compressedSize,
        compressionRatio: ((saved / originalSize) * 100).toFixed(1)
      });
      
      return {
        ...document,
        blocks: compressedBlocks,
        _compressed: true,
        _compressionRatio: ((saved / originalSize) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('Compression error:', error);
      return document;
    }
  }

  // Decompress a document
  decompressDocument(document) {
    if (!document._compressed) return document;

    try {
      const decompressedBlocks = LZString.decompressFromUTF16(document.blocks);
      const blocks = JSON.parse(decompressedBlocks || '[]');
      
      // Remove compression metadata
      const { _compressed, _compressionRatio, ...cleanDocument } = document;
      
      return {
        ...cleanDocument,
        blocks
      };
    } catch (error) {
      console.error('Decompression error:', error);
      // Return document without blocks if decompression fails
      const { _compressed, _compressionRatio, ...cleanDocument } = document;
      return {
        ...cleanDocument,
        blocks: []
      };
    }
  }

  // Get all documents with decompression
  async getAllDocuments() {
    const documents = await storage.getAllDocuments();
    return documents.map(doc => this.decompressDocument(doc));
  }

  // Save a single document with compression
  async saveDocument(document) {
    const compressedDoc = this.compressDocument(document);
    const result = await storage.saveDocument(compressedDoc);
    return this.decompressDocument(result);
  }

  // Save all documents with compression
  async saveAllDocuments(documents) {
    const compressedDocs = documents.map(doc => this.compressDocument(doc));
    const results = await storage.saveAllDocuments(compressedDocs);
    return results.map(doc => this.decompressDocument(doc));
  }

  // Delete a document
  async deleteDocument(id) {
    // Remove from stats
    this.compressionStats.documentStats.delete(id);
    return await storage.deleteDocument(id);
  }

  // Get compression statistics
  getCompressionStats() {
    let totalOriginal = 0;
    let totalCompressed = 0;
    
    for (const stats of this.compressionStats.documentStats.values()) {
      totalOriginal += stats.originalSize;
      totalCompressed += stats.compressedSize;
    }
    
    const totalSaved = totalOriginal - totalCompressed;
    const overallRatio = totalOriginal > 0 
      ? ((totalSaved / totalOriginal) * 100).toFixed(1) 
      : 0;
    
    return {
      documentsCompressed: this.compressionStats.documentStats.size,
      totalOriginalSize: totalOriginal,
      totalCompressedSize: totalCompressed,
      totalBytesSaved: totalSaved,
      overallCompressionRatio: overallRatio,
      documentStats: Array.from(this.compressionStats.documentStats.entries()).map(([id, stats]) => ({
        id,
        ...stats
      }))
    };
  }

  // Get estimated storage savings
  async getStorageSavings() {
    const storageInfo = await storage.getStorageEstimate();
    const stats = this.getCompressionStats();
    
    if (!storageInfo) return null;
    
    // Estimate how much more data can be stored with compression
    const currentUsageWithoutCompression = storageInfo.usage + stats.totalBytesSaved;
    const additionalCapacity = stats.totalBytesSaved;
    const effectiveCapacityIncrease = stats.overallCompressionRatio;
    
    return {
      ...storageInfo,
      savedBytes: stats.totalBytesSaved,
      effectiveCapacityIncrease: `${effectiveCapacityIncrease}%`,
      estimatedAdditionalDocuments: Math.floor(additionalCapacity / (stats.totalOriginalSize / stats.documentsCompressed))
    };
  }

  // Settings management (pass through to base storage)
  async getSettings(key) {
    return await storage.getSettings(key);
  }

  async saveSettings(key, value) {
    return await storage.saveSettings(key, value);
  }

  // Storage info and management
  async getStorageEstimate() {
    return await storage.getStorageEstimate();
  }

  async isPersisted() {
    return await storage.isPersisted();
  }

  async requestPersistence() {
    return await storage.requestPersistence();
  }

  async migrateFromLocalStorage() {
    return await storage.migrateFromLocalStorage();
  }

  async clearAllData() {
    this.compressionStats.documentStats.clear();
    return await storage.clearAllData();
  }

  // Initialize the adapter
  async init() {
    return await storage.init();
  }

  // Check if IndexedDB is available
  get isAvailable() {
    return storage.isAvailable;
  }
}

// Create and export singleton instance
const compressedStorage = new CompressedStorageAdapter();

// Auto-initialize
(async () => {
  await compressedStorage.init();
})();

export default compressedStorage;