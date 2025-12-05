/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

import { describe, it, expect } from '@jest/globals';
import { BinPackingOptimizer } from '../bin-packing';

interface ResourceItem {
  id: string;
  cpu: number;
  memory: number;
}

describe('BinPackingOptimizer', () => {
  let optimizer: BinPackingOptimizer;

  beforeEach(() => {
    optimizer = new BinPackingOptimizer();
  });

  describe('Basic Packing', () => {
    it('should pack items into minimum number of nodes', () => {
      const items = [
        { id: 'item-1', cpu: 50, memory: 500 },
        { id: 'item-2', cpu: 30, memory: 300 },
        { id: 'item-3', cpu: 20, memory: 200 },
      ];
      const nodeCapacity = { cpu: 100, memory: 1000 };

      const result = optimizer.optimize(items, nodeCapacity);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].items).toHaveLength(3);
      expect(result.unplacedItems).toHaveLength(0);
    });

    it('should use multiple nodes when items exceed capacity', () => {
      const items = [
        { id: 'item-1', cpu: 80, memory: 800 },
        { id: 'item-2', cpu: 70, memory: 700 },
      ];
      const nodeCapacity = { cpu: 100, memory: 1000 };

      const result = optimizer.optimize(items, nodeCapacity);

      expect(result.nodes.length).toBeGreaterThan(1);
      expect(result.unplacedItems).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const items: ResourceItem[] = [];
      const nodeCapacity = { cpu: 100, memory: 1000 };

      const result = optimizer.optimize(items, nodeCapacity);

      expect(result.nodes).toHaveLength(0);
      expect(result.unplacedItems).toHaveLength(0);
    });

    it('should handle items that exceed node capacity', () => {
      const items = [{ id: 'item-1', cpu: 150, memory: 1500 }];
      const nodeCapacity = { cpu: 100, memory: 1000 };

      const result = optimizer.optimize(items, nodeCapacity);

      expect(result.nodes).toHaveLength(0);
      expect(result.unplacedItems).toHaveLength(1);
      expect(result.unplacedItems[0].id).toBe('item-1');
    });

    it('should handle single item that fits', () => {
      const items = [{ id: 'item-1', cpu: 50, memory: 500 }];
      const nodeCapacity = { cpu: 100, memory: 1000 };

      const result = optimizer.optimize(items, nodeCapacity);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].items).toHaveLength(1);
    });
  });

  describe('Resource Tracking', () => {
    it('should correctly track available resources', () => {
      const items = [
        { id: 'item-1', cpu: 30, memory: 300 },
        { id: 'item-2', cpu: 40, memory: 400 },
      ];
      const nodeCapacity = { cpu: 100, memory: 1000 };

      const result = optimizer.optimize(items, nodeCapacity);

      expect(result.nodes[0].cpuAvailable).toBe(30);
      expect(result.nodes[0].memoryAvailable).toBe(300);
    });

    it('should sort items by size (First Fit Decreasing)', () => {
      const items = [
        { id: 'small', cpu: 10, memory: 100 },
        { id: 'large', cpu: 80, memory: 800 },
        { id: 'medium', cpu: 50, memory: 500 },
      ];
      const nodeCapacity = { cpu: 100, memory: 1000 };

      const result = optimizer.optimize(items, nodeCapacity);

      // Large item should be placed first
      expect(result.nodes[0].items[0].id).toBe('large');
    });
  });
});
