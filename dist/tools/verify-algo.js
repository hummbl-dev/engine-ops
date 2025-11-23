"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const api_js_1 = require("../public/api.js");
async function main() {
    console.log('Starting Algorithm Verification (Bin Packing)...');
    const engine = new api_js_1.EngineOps({
        verbose: true
    });
    await engine.init();
    const items = [
        { id: 'item-1', cpu: 30, memory: 300 },
        { id: 'item-2', cpu: 50, memory: 500 },
        { id: 'item-3', cpu: 30, memory: 300 }, // Should fit with item-1 or item-2 if space
        { id: 'item-4', cpu: 80, memory: 800 }, // Needs new node
        { id: 'item-5', cpu: 10, memory: 100 }
    ];
    const nodeCapacity = { cpu: 100, memory: 1000 };
    const result = await engine.optimize({
        id: 'algo-test-1',
        type: 'resource',
        data: {
            items,
            nodeCapacity
        }
    });
    console.log('Optimization Result:', JSON.stringify(result, null, 2));
    if (result.success && result.result && result.result.nodes) {
        const nodes = result.result.nodes;
        console.log(`Packed into ${nodes.length} nodes.`);
        // Simple validation: Total items placed should be 5
        const placedCount = nodes.reduce((acc, node) => acc + node.items.length, 0);
        if (placedCount === 5) {
            console.log('Verification PASSED: All items placed.');
        }
        else {
            console.error(`Verification FAILED: Expected 5 items placed, got ${placedCount}`);
            process.exit(1);
        }
    }
    else {
        console.error('Verification FAILED: Optimization unsuccessful');
        process.exit(1);
    }
    await engine.shutdown();
}
main().catch(err => {
    console.error('Verification Error:', err);
    process.exit(1);
});
