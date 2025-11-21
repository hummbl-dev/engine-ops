/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Kubernetes Cost Analysis Example
 * 
 * This script demonstrates how to use Engine-Ops to analyze
 * Kubernetes cluster costs and get optimization recommendations.
 */

import { EngineOps } from '../../public/api.js';

async function analyzeCosts() {
    // Initialize client
    const client = new EngineOps({
        maxConcurrentTasks: 5,
        timeoutMs: 30000
    });

    console.log('🔍 Analyzing Kubernetes cluster costs...\n');

    // Example 1: Optimize pod resource allocation
    console.log('Example 1: Pod Resource Optimization');
    const podOptimization = await client.optimize({
        id: 'pod-resources-001',
        type: 'resource',
        data: {
            items: [
                { id: 'nginx-deployment', cpu: 1000, memory: 2048, currentCost: 50 },
                { id: 'redis-deployment', cpu: 500, memory: 1024, currentCost: 25 },
                { id: 'postgres-deployment', cpu: 2000, memory: 4096, currentCost: 100 }
            ],
            nodeCapacity: { cpu: 4000, memory: 8192 }
        }
    });

    console.log('Result:', JSON.stringify(podOptimization, null, 2));
    console.log('\n---\n');

    // Example 2: Schedule batch jobs cost-effectively
    console.log('Example 2: Cost-Aware Job Scheduling');
    const jobScheduling = await client.optimize({
        id: 'batch-jobs-001',
        type: 'scheduling',
        data: {
            tasks: [
                { id: 'etl-job-1', priority: 'low', duration: 3600, cost: 10 },
                { id: 'ml-training', priority: 'medium', duration: 7200, cost: 50 },
                { id: 'api-server', priority: 'high', duration: -1, cost: 100 }
            ],
            workers: [
                { id: 'spot-node-1', capacity: 2, costPerHour: 0.05 },
                { id: 'ondemand-node-1', capacity: 2, costPerHour: 0.15 }
            ]
        }
    });

    console.log('Result:', JSON.stringify(jobScheduling, null, 2));
    console.log('\n---\n');

    // Example 3: Genetic algorithm for complex optimization
    console.log('Example 3: Multi-Objective Optimization (Cost + Performance)');
    const multiObjective = await client.optimize({
        id: 'multi-objective-001',
        type: 'genetic',
        data: {
            objectives: ['minimize-cost', 'maximize-performance'],
            constraints: {
                maxCost: 500,
                minPerformance: 0.8
            },
            workloads: [
                { id: 'web-tier', cpu: 2000, memory: 4096, qps: 1000 },
                { id: 'app-tier', cpu: 4000, memory: 8192, qps: 500 },
                { id: 'data-tier', cpu: 8000, memory: 16384, qps: 100 }
            ]
        }
    });

    console.log('Result:', JSON.stringify(multiObjective, null, 2));
    console.log('\n---\n');

    // Print summary
    console.log('📊 Cost Analysis Summary:');
    console.log(`- Pod Optimization Score: ${podOptimization.metrics.score}`);
    console.log(`- Job Scheduling Score: ${jobScheduling.metrics.score}`);
    console.log(`- Multi-Objective Score: ${multiObjective.metrics.score}`);
    console.log(`\n✅ Analysis complete!`);
}

// Run the analysis
analyzeCosts().catch(console.error);
