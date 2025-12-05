'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.BinPackingOptimizer = void 0;
/**
 * Implements First Fit Decreasing (FFD) bin packing algorithm.
 * Sorts items by size (CPU + Memory) descending, then places each in the first node that fits.
 */
class BinPackingOptimizer {
  optimize(items, nodeCapacity) {
    // Sort items by total resource requirement (descending)
    const sortedItems = [...items].sort((a, b) => {
      const scoreA = a.cpu + a.memory;
      const scoreB = b.cpu + b.memory;
      return scoreB - scoreA;
    });
    const nodes = [];
    const unplacedItems = [];
    for (const item of sortedItems) {
      let placed = false;
      // Try to fit in existing nodes
      for (const node of nodes) {
        if (node.cpuAvailable >= item.cpu && node.memoryAvailable >= item.memory) {
          node.items.push(item);
          node.cpuAvailable -= item.cpu;
          node.memoryAvailable -= item.memory;
          placed = true;
          break;
        }
      }
      // If not placed, create a new node
      if (!placed) {
        if (item.cpu <= nodeCapacity.cpu && item.memory <= nodeCapacity.memory) {
          const newNode = {
            id: `node-${nodes.length + 1}`,
            cpuAvailable: nodeCapacity.cpu - item.cpu,
            memoryAvailable: nodeCapacity.memory - item.memory,
            items: [item],
          };
          nodes.push(newNode);
        } else {
          unplacedItems.push(item);
        }
      }
    }
    return { nodes, unplacedItems };
  }
}
exports.BinPackingOptimizer = BinPackingOptimizer;
