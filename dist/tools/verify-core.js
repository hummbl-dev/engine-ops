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
const index_js_1 = require("../core/index.js");
async function main() {
    console.log('Starting Core Engine Verification...');
    const engine = new index_js_1.OptimizationEngine({
        verbose: true
    });
    await engine.init();
    const result = await engine.optimize({
        id: 'test-req-1',
        type: 'resource',
        data: {
            cpu: 80,
            memory: 1024
        }
    });
    console.log('Optimization Result:', JSON.stringify(result, null, 2));
    if (result.success && result.requestId === 'test-req-1') {
        console.log('Verification PASSED');
    }
    else {
        console.error('Verification FAILED');
        process.exit(1);
    }
    await engine.shutdown();
}
main().catch(err => {
    console.error('Verification Error:', err);
    process.exit(1);
});
