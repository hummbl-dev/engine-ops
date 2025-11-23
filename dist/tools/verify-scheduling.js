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
    console.log('Starting Algorithm Verification (Scheduling)...');
    const engine = new api_js_1.EngineOps({
        verbose: true
    });
    await engine.init();
    const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
    const nodes = [
        { id: 'node-A', cpuLoad: 80, memoryLoad: 80 },
        { id: 'node-B', cpuLoad: 20, memoryLoad: 20 }, // Should be picked
        { id: 'node-C', cpuLoad: 50, memoryLoad: 50 }
    ];
    const result = await engine.optimize({
        id: 'sched-test-1',
        type: 'scheduling',
        data: {
            task,
            nodes
        }
    });
    console.log('Optimization Result:', JSON.stringify(result, null, 2));
    if (result.success && result.result && result.result.nodeId === 'node-B') {
        console.log('Verification PASSED: Correct node selected (node-B).');
    }
    else {
        console.error('Verification FAILED: Incorrect node selected or failure.');
        process.exit(1);
    }
    await engine.shutdown();
}
main().catch(err => {
    console.error('Verification Error:', err);
    process.exit(1);
});
