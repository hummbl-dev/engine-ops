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
const app_js_1 = require("./app.js");
const api_js_1 = require("./api.js");
const PORT = process.env.PORT || 3000;
// Initialize engine
const engine = new api_js_1.EngineOps({ verbose: true });
async function startServer() {
    try {
        // Initialize engine
        await engine.init();
        console.log('✓ Engine initialized');
        // Create Express app
        const app = (0, app_js_1.createApp)();
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ API available at http://localhost:${PORT}/api/v1`);
            console.log(`✓ Health check: http://localhost:${PORT}/api/v1/health`);
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            server.close(async () => {
                await engine.shutdown();
                console.log('Server closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', async () => {
            console.log('SIGINT received, shutting down gracefully...');
            server.close(async () => {
                await engine.shutdown();
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
