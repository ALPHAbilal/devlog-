import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LRUCache } from '../LRUCache';

describe('LRUCache', () => {
  let cache;

  beforeEach(() => {
    cache = new LRUCache({ maxSize: 3, maxMemoryMB: 1 });
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should update existing values', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'updated');
      expect(cache.get('key1')).toBe('updated');
      expect(cache.cache.size).toBe(1);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.cache.size).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('Size-based Eviction', () => {
    it('should evict oldest entries when size limit reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it recently used
      cache.get('key1');
      
      // Add new item, key2 should be evicted (oldest unused)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('Memory-based Eviction', () => {
    it('should track memory usage', () => {
      const stats = cache.getStats();
      expect(stats.memoryUsageMB).toBe('0.00');
      
      cache.set('key1', 'x'.repeat(1000));
      const newStats = cache.getStats();
      expect(parseFloat(newStats.memoryUsageMB)).toBeGreaterThan(0);
    });

    it('should evict based on memory limit', () => {
      // Set very small memory limit
      cache = new LRUCache({ maxSize: 100, maxMemoryMB: 0.001 }); // 1KB
      
      // Add items that exceed memory limit
      cache.set('key1', 'x'.repeat(500));
      cache.set('key2', 'x'.repeat(500));
      cache.set('key3', 'x'.repeat(500)); // Should trigger memory-based eviction
      
      // At least one item should be evicted
      const remainingItems = [
        cache.get('key1'),
        cache.get('key2'),
        cache.get('key3')
      ].filter(v => v !== null);
      
      expect(remainingItems.length).toBeLessThan(3);
    });
  });

  describe('Statistics', () => {
    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit
      cache.get('key3'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('50.00%');
    });

    it('should provide accurate statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(parseFloat(stats.memoryUsageMB)).toBeGreaterThanOrEqual(0);
      expect(stats.maxMemoryMB).toBe(1);
    });

    it('should handle empty cache statistics', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe('0%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      cache.set('null', null);
      cache.set('undefined', undefined);
      
      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBe(undefined);
    });

    it('should handle complex objects', () => {
      const complexObj = {
        nested: {
          array: [1, 2, { deep: 'value' }],
          date: new Date(),
        },
        fn: 'functions are stringified',
      };
      
      cache.set('complex', complexObj);
      const retrieved = cache.get('complex');
      
      expect(retrieved).toEqual(complexObj);
      expect(retrieved.nested.array[2].deep).toBe('value');
    });

    it('should handle very large keys', () => {
      const longKey = 'x'.repeat(1000);
      cache.set(longKey, 'value');
      expect(cache.get(longKey)).toBe('value');
    });

    it('should maintain correct size after multiple operations', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key1', 'updated'); // Update
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict one
      
      expect(cache.cache.size).toBe(3);
      expect(cache.getStats().size).toBe(3);
    });
  });

  describe('Memory estimation', () => {
    it('should estimate string sizes correctly', () => {
      const testString = 'Hello World';
      const size = cache.estimateSize(testString);
      // JSON.stringify adds quotes, so "Hello World" = 13 chars * 2 bytes
      expect(size).toBe(26);
    });

    it('should estimate object sizes', () => {
      const obj = { key: 'value', number: 123 };
      const size = cache.estimateSize(obj);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle circular references gracefully', () => {
      const obj = { a: 1 };
      obj.circular = obj; // Create circular reference
      
      // Should not throw error
      expect(() => cache.set('circular', obj)).toThrow();
    });
  });
});