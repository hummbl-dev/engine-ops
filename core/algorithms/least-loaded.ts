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

interface NodeStatus {
  id: string;
  cpuLoad: number; // 0-100
  memoryLoad: number; // 0-100
}

interface Task {
  id: string;
  cpuRequired: number;
  memoryRequired: number;
}

interface SchedulingResult {
  nodeId: string;
  estimatedLoadAfter: {
    cpu: number;
    memory: number;
  };
}

/**
 * Implements Least Loaded Scheduling algorithm.
 * Selects the node with the lowest current load (considering both CPU and Memory).
 */
export class LeastLoadedScheduler {
  public schedule(task: Task, nodes: NodeStatus[]): SchedulingResult | null {
    if (nodes.length === 0) {
      return null;
    }

    // Sort nodes by combined load (ascending)
    const sortedNodes = [...nodes].sort((a, b) => {
      const loadA = a.cpuLoad + a.memoryLoad;
      const loadB = b.cpuLoad + b.memoryLoad;
      return loadA - loadB;
    });

    // Pick the least loaded node
    const bestNode = sortedNodes[0];

    // Calculate estimated load after assignment
    // Note: This is a simplified estimation. In a real system, we'd need node capacity.
    // Assuming load is percentage and task requirement is also percentage-like for this simple version.
    const estimatedCpu = Math.min(100, bestNode.cpuLoad + task.cpuRequired);
    const estimatedMemory = Math.min(100, bestNode.memoryLoad + task.memoryRequired);

    return {
      nodeId: bestNode.id,
      estimatedLoadAfter: {
        cpu: estimatedCpu,
        memory: estimatedMemory,
      },
    };
  }
}
